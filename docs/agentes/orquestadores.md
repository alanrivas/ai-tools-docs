---
sidebar_position: 4
title: Orquestadores y Delegación
---

# Orquestadores: Delegación para Evitar Alucinaciones por Contexto

## El Problema: Context Window Collapse

Cuando un agente acumula demasiado contexto (historial de pasos, decisiones, correcciones, re-intentos), llegando cerca del límite de su ventana de contexto, **empieza a alucinar**.

```
Contexto disponible: 200K tokens (Claude 3.5)
Contexto usado:
  - Instrucciones del agente: 5K
  - Historial de trabajo: 150K
  - Análisis parciales: 30K
  - Intentos fallidos: 10K
  - Razonamientos intermedios: 4K
  
Total: 199K tokens
Espacio libre: 1K ← El agente genera respuestas sin fundamento
```

A mayor presión sobre el context window, más incoherencias y hallucinations.

---

### Por qué ocurre: La atención se degrada bajo presión

Los LLMs no son simples buffers de texto. Cada token que generan atiende a todos los tokens anteriores mediante mecanismos de atención. A medida que el contexto crece, la atención se **diluye**:

```
Contexto corto (5K tokens):
Token actual ──→ [TODOS los tokens anteriores]
Atención promedio por token: ALTA

Contexto saturado (195K tokens):
Token actual ──→ [TODOS los tokens anteriores]
Atención promedio por token: MÍNIMA → instrucciones iniciales casi invisibles
```

Esto tiene consecuencias concretas conocidas como el **"Lost in the Middle" problem** (Shi et al., 2023): los LLMs recuerdan bien el inicio y el final del contexto, pero **olvidan el medio** — que es exactamente donde vive la mayor parte del trabajo acumulado.

```
Retención de información según posición en el contexto:

100% ──┐                                      ┌── 90%
       │ ↘                                ↗   │
  50%  │   ↘                          ↗       │
       │     ↘                    ↗           │
  10%  │       ↘________________↗             │
       └──────────────────────────────────────┘
       Inicio                              Final
          ↑                                  ↑
       Instrucciones                    Últimas salidas
       del agente                       del agente
       (retenidas)                      (retenidas)

       ↑___________ ZONA PERDIDA _____________↑
       Historial de pasos 20-180, donde está
       la mayor parte del razonamiento real
```

El resultado práctico: el agente empieza a **inventar** referencias a pasos que "recuerda" de forma difusa, repite trabajo ya hecho, o contradice decisiones anteriores sin saberlo.

---

### La presión se acelera con el razonamiento

El razonamiento extendido (chain-of-thought) amplifica el problema porque cada paso genera texto adicional que el modelo necesita atender:

```
Sin razonamiento:
  Paso: 50 tokens (input) → 100 tokens (output)
  Acumulado por paso: ~150 tokens

Con razonamiento:
  Paso: 50 tokens (input)
  + Razonamiento: 500 tokens ("Primero debo... luego...")
  + Output: 100 tokens
  Acumulado por paso: ~650 tokens

Con 50 pasos:
  Sin razonamiento: ~7.5K tokens → Sin problema
  Con razonamiento: ~32.5K tokens → Presión real
```

Esta es una razón clave por la que tareas largas y complejas se degradan aunque el modelo tenga una ventana de contexto grande.

---

## La Solución: Orquestación con Delegación

Un **orquestador** es un agente coordinador que:

1. **Descompone** la tarea en sub-tareas claras
2. **Delega** cada sub-tarea a un agente especializado
3. **Descarta** el agente después de obtener el resultado
4. **Retiene solo** el resultado, no los pasos internos

```
                    ORQUESTADOR
                       ↓
        ┌──────────────┬──────────────┬──────────────┐
        ↓              ↓              ↓              ↓
    Sub-agente 1  Sub-agente 2  Sub-agente 3  Sub-agente 4
    (especial.)   (especial.)   (especial.)   (especial.)
    ├─ procesa    ├─ procesa    ├─ procesa    ├─ procesa
    ├─ retorna    ├─ retorna    ├─ retorna    ├─ retorna
    └─ se        └─ se        └─ se        └─ se
      descarta     descarta     descarta     descarta

    [RESULTADO A] [RESULTADO B] [RESULTADO C] [RESULTADO D]
        ↓              ↓              ↓              ↓
        └──────────────┬──────────────┬──────────────┘
                       ↓
                ORQUESTADOR
        (solo retiene 4 resultados, no 200K tokens)
```

El orquestador acumula solo los **resultados relevantes**, no los pasos internos de cada sub-agente.

---

## Patrones de Orquestación

Dependiendo de la estructura de la tarea, existen cuatro patrones fundamentales. Reconocer cuál aplica es el primer paso para diseñar un orquestador efectivo.

---

### Patrón 1: Fan-out / Fan-in

**Cuándo usarlo:** Múltiples análisis independientes sobre el mismo input.

```
          ┌──→ Sub-agente A (análisis 1) ──┐
Input ────┼──→ Sub-agente B (análisis 2) ──┼──→ Orquestador (combina) ──→ Output
          └──→ Sub-agente C (análisis 3) ──┘
```

**Ejemplo real:** Auditar un archivo de código por seguridad, performance y calidad al mismo tiempo. Los tres sub-agentes reciben el mismo archivo, trabajan en paralelo, y el orquestador combina los tres reportes en uno.

**Ventaja clave:** Los agentes corren en paralelo → menor latencia total.

---

### Patrón 2: Pipeline (Cadena)

**Cuándo usarlo:** Cada paso transforma el output del anterior. Las etapas son secuenciales y la salida de una es la entrada de la siguiente.

```
Input → [Extractor] → datos brutos → [Transformador] → datos limpios → [Validador] → output
```

**Ejemplo real:** Procesar un repositorio de documentación:
1. Extractor: lee todos los archivos `.md` y devuelve lista de secciones
2. Clasificador: etiqueta cada sección (tutorial, referencia, conceptual)
3. Indexador: genera el índice de búsqueda con metadatos

Cada agente tiene un contexto limpio con solo su input específico. El orquestador pasa el output de uno al siguiente sin acumular todo el historial.

**Ventaja clave:** Cada agente trabaja con datos ya procesados, más compactos que los originales.

---

### Patrón 3: Router

**Cuándo usarlo:** El tipo de tarea no se sabe de antemano. El orquestador decide a qué especialista enviar según el input.

```
          ┌── [Especialista SQL] (si query = database)
Input ──→ Router ──┼── [Especialista API] (si query = endpoint)
          └── [Especialista DevOps] (si query = deployment)
```

**Ejemplo real:** Un agente de soporte técnico que recibe preguntas libres. El router analiza la pregunta y la desvía al especialista correcto, evitando que un único agente generalista cargue el conocimiento de todos los dominios.

**Ventaja clave:** Los especialistas tienen instrucciones muy cortas y enfocadas → menor uso de contexto desde el inicio.

---

### Patrón 4: Map-Reduce

**Cuándo usarlo:** La tarea escala horizontalmente sobre N elementos iguales. Similar a Fan-out pero con número variable de agentes.

```
Lista de N elementos:
  [Item 1] → Sub-agente 1 → resultado 1 ──┐
  [Item 2] → Sub-agente 2 → resultado 2 ──┤
  [Item 3] → Sub-agente 3 → resultado 3 ──┼──→ Orquestador (reduce) → output final
  ...                                      │
  [Item N] → Sub-agente N → resultado N ──┘
```

**Ejemplo real:** Traducir 100 artículos de documentación. Cada sub-agente traduce un artículo (contexto limpio = 1 artículo), el orquestador recibe 100 traducciones completas y genera el índice final.

**Ventaja clave:** Escala linealmente. Puedes procesar 10 o 10.000 elementos sin que el orquestador crezca en tokens.

---

## El Handoff: Comunicar Resultados entre Agentes

El punto más crítico de la orquestación no es la delegación sino el **handoff**: cómo el resultado de un sub-agente se convierte en el input del siguiente (o del orquestador) sin perder información crítica y sin inflar el contexto.

### Principio: Contrato de output explícito

Cada sub-agente debe tener un **formato de salida definido** en sus instrucciones. Un sub-agente que responde en prosa libre obliga al orquestador a leer e interpretar todo el texto. Un sub-agente que responde en JSON estructurado permite al orquestador extraer exactamente lo que necesita.

```
❌ Sub-agente sin contrato:
"He revisado el código y encontré varios problemas. El primero está
en la línea 45 donde hay una posible inyección SQL. También noté que
la función getUserById no valida el input, lo cual podría..."
→ El orquestador debe leer 200 palabras para encontrar 2 datos

✅ Sub-agente con contrato:
{
  "issues": [
    { "type": "sql-injection", "line": 45, "severity": "critical" },
    { "type": "missing-validation", "fn": "getUserById", "severity": "high" }
  ],
  "files_analyzed": 1,
  "clean": false
}
→ El orquestador extrae exactamente lo que necesita en 5 líneas
```

### Patrón: Handoff comprimido

Cuando el resultado de un agente es grande (ej: análisis de 50 archivos), no acumules todo en el contexto del orquestador. En cambio, pide al sub-agente que entregue un resumen ejecutivo más el detalle completo por separado:

```typescript
// El sub-agente devuelve dos niveles:
interface AgentResult {
  summary: string;         // 2-3 líneas → va al contexto del orquestador
  full_report: string;     // Todo el detalle → se guarda en disco/DB
  critical_items: string[]; // Solo los críticos → van al contexto
}

// El orquestador acumula solo los summaries y critical_items
// El full_report queda disponible si alguien lo necesita después
```

### Patrón: Contexto compartido mínimo (Shared Scratch Pad)

Para pipelines donde los agentes necesitan acceso a información común sin que cada uno cargue todo el historial, usa un "scratchpad" externo:

```typescript
// Un objeto de estado compartido, fuera del contexto de cualquier agente
const sharedState = {
  projectGoal: "Auditar seguridad del repositorio X",
  constraints: ["No modificar código", "Priorizar OWASP Top 10"],
  discoveries: [], // Cada sub-agente agrega sus hallazgos aquí
};

// Cada sub-agente recibe solo su parte:
const subAgentInput = {
  file: "auth.ts",
  goal: sharedState.projectGoal,      // Solo el objetivo, no el historial
  constraints: sharedState.constraints,
  // NO incluye el historial completo de sharedState.discoveries
};

// Después de cada agente, el orquestador actualiza el estado compartido:
sharedState.discoveries.push(agentOutput.summary);
```

---

## Orquestación Paralela vs Secuencial

La elección entre ejecutar sub-agentes en paralelo o en secuencia tiene implicaciones importantes en latencia, coste y corrección.

### Paralela: Máxima velocidad, requiere independencia

```typescript
// ✅ Correcto: los tres análisis son independientes
const [security, performance, quality] = await Promise.all([
  runAgent('security-auditor', { file }),
  runAgent('performance-profiler', { file }),
  runAgent('quality-checker', { file }),
]);
```

**Úsala cuando:** Los sub-agentes no necesitan el output de los demás para hacer su trabajo.

**Cuidado con:** Si un sub-agente usa el resultado de otro (dependencia), la paralelización rompe la lógica y produce resultados incoherentes.

### Secuencial: Menor velocidad, admite dependencias

```typescript
// ✅ Correcto: cada paso depende del anterior
const structure = await runAgent('code-analyzer', { file });
const issues    = await runAgent('security-auditor', { file, structure });
const fixes     = await runAgent('fix-suggester', { file, issues });
```

**Úsala cuando:** El output de un agente es el input del siguiente.

### Híbrida: Lo mejor de ambos mundos

En la práctica, muchas tareas tienen una combinación: algunas fases son independientes (paralelas) y otras dependen de resultados previos (secuenciales).

```
Fase 1 (paralela): análisis estructural + análisis de seguridad
      ↓
Fase 2 (secuencial): combinar resultados → generar plan de fixes
      ↓
Fase 3 (paralela): aplicar fix A + aplicar fix B + aplicar fix C
      ↓
Fase 4 (secuencial): validar que todos los fixes sean coherentes entre sí
```

```typescript
// Implementación del patrón híbrido
async function orchestrate(file: string) {
  // Fase 1: paralela
  const [structure, security] = await Promise.all([
    runAgent('code-analyzer', { file }),
    runAgent('security-auditor', { file }),
  ]);

  // Fase 2: secuencial (depende de fase 1)
  const fixPlan = await runAgent('fix-planner', { file, structure, security });

  // Fase 3: paralela (cada fix es independiente)
  const appliedFixes = await Promise.all(
    fixPlan.fixes.map(fix => runAgent('fix-applier', { file, fix }))
  );

  // Fase 4: secuencial (requiere ver todos los fixes)
  const validation = await runAgent('coherence-validator', { file, appliedFixes });

  return { structure, security, fixPlan, appliedFixes, validation };
}
```

---

## Manejo de Fallos en Sub-agentes

Un orquestador robusto necesita una estrategia clara para cuando un sub-agente falla, se atasca o produce output no válido.

### Estrategia 1: Retry con contexto reducido

Si un sub-agente falla, el primer intento de recuperación es reiniciarlo con un contexto más pequeño y específico:

```typescript
async function safeDelegate(agentName: string, input: object, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await runAgent(agentName, input);

      if (!isValidOutput(result)) {
        throw new Error(`Output inválido en intento ${attempt}`);
      }

      return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      console.warn(`Sub-agente ${agentName} falló (intento ${attempt}), reintentando...`);

      // En cada reintento, simplifica el input
      input = simplifyInput(input, attempt);
      await sleep(1000 * attempt); // backoff exponencial
    }
  }
}

function simplifyInput(input: object, attempt: number): object {
  // Intento 2: quita campos opcionales
  // Intento 3: deja solo el mínimo absoluto
  const stripped = { ...input };
  if (attempt >= 2) delete stripped['additionalContext'];
  if (attempt >= 3) delete stripped['examples'];
  return stripped;
}
```

### Estrategia 2: Fallback a agente genérico

Si el especialista falla repetidamente, el orquestador puede delegar a un agente más genérico como fallback:

```typescript
async function delegateWithFallback(task: Task) {
  try {
    return await runAgent(task.specialist, task.input);
  } catch {
    console.warn(`Especialista ${task.specialist} falló, usando agente genérico`);
    return await runAgent('general-purpose', {
      ...task.input,
      instruction: `Actúa como ${task.specialist}. ${task.description}`,
    });
  }
}
```

### Estrategia 3: Continuar sin el resultado fallido

Para pipelines Fan-out donde el resultado de un sub-agente es opcional (no bloquea a los demás), el orquestador puede marcar la tarea como parcialmente completada y continuar:

```typescript
async function fanOutWithPartialResults(file: string) {
  const tasks = [
    { name: 'security-auditor', required: true },
    { name: 'performance-profiler', required: false },
    { name: 'style-checker', required: false },
  ];

  const results = await Promise.allSettled(
    tasks.map(t => runAgent(t.name, { file }))
  );

  const report = {};
  let hasRequiredFailures = false;

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      report[tasks[i].name] = result.value;
    } else {
      console.warn(`${tasks[i].name} falló: ${result.reason}`);
      if (tasks[i].required) hasRequiredFailures = true;
      report[tasks[i].name] = { skipped: true, reason: result.reason.message };
    }
  });

  if (hasRequiredFailures) throw new Error('Sub-agente requerido falló, no se puede continuar');

  return report; // Reporte parcial con lo que sí funcionó
}
```

---

## Cómo Implementar

### Paso 1: Definir Sub-agentes Especializados

Cada sub-agente debe tener un propósito muy específico:

```yaml
# ~/.copilot/agents/code-analyzer.yaml
name: code-analyzer
description: Analiza un archivo de código y reporta estructura, complejidad y dependencias
instructions: |
  Tu única responsabilidad: analizar un archivo de código.
  - Lee la estructura de funciones/clases
  - Identifica dependencias externas
  - Reporta complejidad ciclomática
  - NO hagas sugerencias de mejora (eso es otro agente)
  - NO modifiques el código
  Responde con JSON:
  {
    "file": "...",
    "functions": [...],
    "complexity": ...,
    "dependencies": [...]
  }
```

```yaml
# ~/.copilot/agents/security-auditor.yaml
name: security-auditor
description: Audita código en busca de vulnerabilidades de seguridad
instructions: |
  Tu única responsabilidad: detectar problemas de seguridad.
  - SQL injection
  - XSS vulnerabilities
  - Secrets hardcodeadas
  - Deserialización insegura
  - NO reportes issues de calidad o performance
  Responde con JSON:
  {
    "vulnerabilities": [
      { "type": "sql-injection", "line": X, "severity": "high", "fix": "..." }
    ]
  }
```

### Paso 2: Crear el Orquestador

```yaml
# ~/.copilot/agents/code-review.yaml
name: code-review
description: Revisa código de forma completa delegando en especialistas
instructions: |
  Eres un coordinador de revisión de código. Tu trabajo es:
  
  1. Recibir archivos a revisar
  2. Delegar en especialistas:
     - @code-analyzer: análisis estructural
     - @security-auditor: auditoría de seguridad
     - @performance-reviewer: análisis de performance
     - @test-validator: validación de tests
  3. Recolectar resultados
  4. Compilar un reporte final
  
  Importante:
  - No hagas el análisis tú mismo, delega siempre
  - Espera a que cada sub-agente termine
  - Agrupa los resultados por archivo
  - Usa el mismo formato para todos
```

### Paso 3: Implementar la Lógica de Orquestación con el SDK de Claude

A continuación un ejemplo concreto usando el SDK de Anthropic para TypeScript. Cada sub-agente es una llamada separada a la API → contexto nuevo y limpio en cada llamada:

```typescript
// orchestrator.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ─── Sub-agentes: cada uno es una función con su propio contexto ───

async function runCodeAnalyzer(fileContent: string) {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `Eres un analizador de código. Tu única responsabilidad: analizar la estructura.
Responde SIEMPRE con JSON válido:
{
  "functions": [{ "name": "...", "lines": 0, "complexity": "low|medium|high" }],
  "dependencies": ["..."],
  "total_lines": 0
}
NO hagas sugerencias. NO analices seguridad. Solo estructura.`,
    messages: [{ role: "user", content: `Analiza este código:\n\n${fileContent}` }],
  });

  return JSON.parse(
    (response.content[0] as { type: string; text: string }).text
  );
}

async function runSecurityAuditor(fileContent: string) {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `Eres un auditor de seguridad. Tu única responsabilidad: detectar vulnerabilidades OWASP.
Responde SIEMPRE con JSON válido:
{
  "vulnerabilities": [{ "type": "...", "line": 0, "severity": "low|medium|high|critical", "fix": "..." }],
  "clean": true
}
NO reportes problemas de calidad o performance. Solo seguridad.`,
    messages: [{ role: "user", content: `Audita este código:\n\n${fileContent}` }],
  });

  return JSON.parse(
    (response.content[0] as { type: string; text: string }).text
  );
}

// ─── Orquestador: coordina, retiene solo resultados comprimidos ────

async function orchestrateCodeReview(files: { name: string; content: string }[]) {
  console.log(`Orquestando revisión de ${files.length} archivos...`);

  const summaries: string[] = [];

  for (const file of files) {
    console.log(`  → Analizando ${file.name}`);

    // Cada sub-agente tiene su propio contexto (llamadas independientes)
    // Cuando terminan, sus contextos se descartan. Solo retenemos el JSON comprimido.
    const [structure, security] = await Promise.all([
      runCodeAnalyzer(file.content),
      runSecurityAuditor(file.content),
    ]);

    const criticalIssues = security.vulnerabilities.filter(
      (v: { severity: string }) => v.severity === "critical"
    );

    // El orquestador solo retiene el summary comprimido, no los ~50K tokens de cada análisis
    summaries.push(
      `${file.name}: ${structure.total_lines} líneas, ` +
        `${structure.functions.length} funciones, ` +
        `${criticalIssues.length} vulnerabilidades críticas`
    );
  }

  // Paso final: el orquestador compila el reporte con solo los summaries (~tokens mínimos)
  const finalReport = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: "Eres un director técnico. Recibes summaries de revisiones de código y generas un reporte ejecutivo.",
    messages: [{
      role: "user",
      content: `Genera un reporte ejecutivo con estos resultados:\n\n${summaries.join("\n")}`,
    }],
  });

  return {
    summaries,
    report: (finalReport.content[0] as { type: string; text: string }).text,
    totalFiles: files.length,
  };
}
```

**Qué hace bien este patrón:**
- `runCodeAnalyzer` y `runSecurityAuditor` son llamadas de API independientes → contexto nuevo en cada una
- `Promise.all` los ejecuta en paralelo → latencia del par = max(A, B), no A + B
- El orquestador solo acumula los summaries en texto plano, no los JSON completos de cada análisis
- La llamada final del reporte recibe solo N líneas de texto, no N archivos de código completos

---

## Casos de Uso ✅ DONDE FUNCIONA BIEN

### ✅ Caso 1: Análisis de grandes repositorios

**Contexto**: Necesitas auditar 50 archivos de un proyecto.

**Antes (sin orquestador):**
```
Agente único acumula:
- Lectura de 50 archivos: 100K tokens
- Análisis de cada uno: + 50K tokens
- Razonamientos intermedios: + 40K tokens
- Total acumulado: 190K tokens → empieza a alucinar
```

**Después (con orquestador):**
```
Orquestador + sub-agentes:
- Sub-agente 1: analiza archivo 1 (50K tokens), se descarta
- Sub-agente 2: analiza archivo 2 (50K tokens), se descarta
- ... (repeats)
- Orquestador retiene: 50 resultados JSON (~5K tokens)
- Presión sobre contexto: BAJA
```

**Resultado**: Sin alucinaciones, análisis consistente.

---

### ✅ Caso 2: Pipeline de transformación de datos

**Contexto**: Necesitas extraer datos → transformarlos → validarlos → guardarlos.

**Arquitectura:**
```
Extractor Sub-agente → Resultado A ↓
Transformer Sub-agente → Resultado B → Orquestador → Output final
Validator Sub-agente → Resultado C ↓
```

Cada paso es independiente y se descarta el agente.

**Beneficio**: 
- Cada sub-agente usa solo 30K tokens en su dominio
- El orquestador coordina con solo 5K tokens retenidos
- Total: ~40K con alta calidad (vs 150K+ con alucinaciones)

---

### ✅ Caso 3: Revisión multi-criterio de código

**Contexto**: Revisar PR con múltiples aspectos: seguridad, performance, calidad, tests.

**Sub-agentes:**
- Security reviewer (detecta vulnerabilidades)
- Performance profiler (identifica bottlenecks)
- Quality checker (estilo, duplicación)
- Test validator (coverage, casos extremos)

**Ventaja**: Cada especialista se enfoca en su área, sin ruido de otros criterios.

---

### ✅ Caso 4: Generación de artefactos independientes

**Contexto**: Generar documentación, tests, tipos TypeScript para 10 funciones.

**Sub-agentes:**
- Doc generator (solo documentación)
- Test generator (solo tests)
- Type generator (solo tipos)

Se ejecutan en paralelo, cada uno maneja su responsabilidad.

---

## Orquestación Multi-nivel: Orquestadores de Orquestadores

Para tareas muy grandes, un único orquestador puede no ser suficiente. La solución es **anidar orquestadores**: un orquestador de alto nivel que coordina sub-orquestadores, cada uno responsable de un dominio.

```
                  MEGA-ORQUESTADOR
                  (coordina dominios)
                        ↓
          ┌─────────────┴─────────────┐
          ↓                           ↓
  SUB-ORQUESTADOR A           SUB-ORQUESTADOR B
  (dominio: seguridad)        (dominio: performance)
          ↓                           ↓
  ┌───────┴───────┐           ┌───────┴───────┐
 Auth   API    DB            CPU   Memory   I/O
auditor auditor auditor    profiler profiler profiler
```

**Ejemplo de caso de uso:** Auditar un sistema de microservicios con 200 servicios. Un solo orquestador no puede coordinar 200×3 sub-agentes eficientemente. La solución:

```
Mega-orquestador: divide los 200 servicios en 10 grupos de 20
  → Sub-orquestador 1: audita servicios 1-20 (con sus propios sub-agentes)
  → Sub-orquestador 2: audita servicios 21-40
  ...
  → Sub-orquestador 10: audita servicios 181-200

Mega-orquestador: consolida los 10 reportes en uno
```

El mega-orquestador nunca ve el detalle de ningún servicio individual. Solo ve los reportes consolidados de cada sub-orquestador.

**Regla práctica:** Si un orquestador necesita coordinar más de 20-30 sub-agentes, considera añadir un nivel intermedio.

---

## Observabilidad: Saber si el Orquestador está Funcionando

Un orquestador sin observabilidad es una caja negra. Cuando algo sale mal (alucinación en un sub-agente, contexto que crece, latencia inesperada), necesitas saber exactamente dónde ocurrió.

### Métricas clave a instrumentar

```typescript
interface AgentExecution {
  agentName: string;
  startTime: number;
  endTime: number;
  inputTokens: number;
  outputTokens: number;
  outputValid: boolean;
  attempt: number;
  error?: string;
}

class OrchestratorMonitor {
  private executions: AgentExecution[] = [];
  private totalContextBudget: number;

  constructor(tokenBudget = 200000) {
    this.totalContextBudget = tokenBudget;
  }

  log(execution: AgentExecution) {
    this.executions.push(execution);
    this.checkAlerts(execution);
  }

  private checkAlerts(exec: AgentExecution) {
    const latency = exec.endTime - exec.startTime;

    // Alerta: sub-agente tardó demasiado
    if (latency > 30000) {
      console.warn(`⚠️ ${exec.agentName} tardó ${latency}ms — posible loop o contexto muy grande`);
    }

    // Alerta: output no válido en primer intento
    if (!exec.outputValid && exec.attempt === 1) {
      console.warn(`⚠️ ${exec.agentName} produjo output inválido — posible alucinación`);
    }

    // Alerta: múltiples reintentos
    if (exec.attempt > 2) {
      console.error(`❌ ${exec.agentName} necesitó ${exec.attempt} intentos — revisar instrucciones`);
    }
  }

  report() {
    const totalInputTokens = this.executions.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutputTokens = this.executions.reduce((s, e) => s + e.outputTokens, 0);
    const successRate = this.executions.filter(e => e.outputValid).length / this.executions.length;
    const avgLatency = this.executions.reduce((s, e) => s + (e.endTime - e.startTime), 0) / this.executions.length;

    console.log("─── Reporte de Orquestación ───");
    console.log(`Sub-agentes ejecutados: ${this.executions.length}`);
    console.log(`Tokens consumidos: ${totalInputTokens + totalOutputTokens} / ${this.totalContextBudget}`);
    console.log(`Tasa de éxito: ${(successRate * 100).toFixed(1)}%`);
    console.log(`Latencia promedio: ${avgLatency.toFixed(0)}ms`);

    // Detectar el agente que más tokens consumió (candidato a optimizar)
    const worst = this.executions.reduce((a, b) => (a.inputTokens > b.inputTokens ? a : b));
    console.log(`Mayor consumidor: ${worst.agentName} (${worst.inputTokens} tokens de input)`);
  }
}
```

### Señales de alarma a monitorear

| Señal | Qué indica | Acción |
|-------|-----------|--------|
| Sub-agente con output inválido en el primer intento | Instrucciones ambiguas o contexto de input muy grande | Simplificar instrucciones, reducir input |
| Latencia 3× mayor que el promedio | El sub-agente está procesando demasiado | Reducir scope del sub-agente |
| Orquestador acumula tokens rápido | El orquestador retiene demasiado de cada resultado | Comprimir outputs de sub-agentes |
| Múltiples reintentos en el mismo agente | Instrucciones contradictorias o mal formadas | Revisar el contrato de output del agente |
| Tasa de éxito < 90% | El sistema no es estable para producción | Revisar toda la arquitectura de agentes |

---

## Casos de Uso ❌ DONDE NO FUNCIONA

### ❌ Caso 1: Tareas que requieren continuidad de razonamiento

**Contexto**: Diseñar una arquitectura de sistema compleja que requiere múltiples decisiones interdependientes.

```
Paso 1: Diseñar componentes → Resultado A
Paso 2: Diseñar APIs → Resultado B (DEPENDE de A)
Paso 3: Diseñar BD → Resultado C (DEPENDE de A y B)
```

**Problema**: Si cada paso delega a un sub-agente, ese sub-agente no conoce las decisiones previas. Cada componente será independiente, sin coherencia arquitectónica.

**Mejor alternativa**: Usar **un agente único** para esta fase de diseño, con instructions claras sobre cómo evolucionar el diseño iterativamente.

---

### ❌ Caso 2: Debugging interactivo

**Contexto**: Necesitas arreglar un bug que involucra múltiples capas (frontend → backend → BD).

**Problema**: 
```
Sub-agente 1: "El problema es en el componente React"
  → Propone fix A
  
Sub-agente 2: No conoce la propuesta de Sub-agente 1
  → Propone fix B (incompatible con A)
  
Orquestador intenta combinar: Conflicto
```

**Mejor alternativa**: Usar un agente único que pueda navegar todo el stack con continuidad.

---

### ❌ Caso 3: Tareas donde el feedback es crucial

**Contexto**: Escribir contenido creativo (blog post, propuesta, email de ventas).

**Problema**: 
```
Sub-agente 1: Escribe sección 1
Sub-agente 2: Escribe sección 2 (tono diferente, no conecta)
Sub-agente 3: Escribe sección 3 (ignora la voz del autor)

Orquestador intenta unificar: Reads artificial
```

**Mejor alternativa**: Un agente único con instrucciones claras sobre tono, audiencia, voz.

---

### ❌ Caso 4: Tareas con interdependencias ocultas

**Contexto**: Refactorizar código donde cambios en un módulo afectan otros.

**Problema**:
```
Sub-agente 1: Refactoriza módulo A (descarta contexto después)
Sub-agente 2: Refactoriza módulo B (no sabe que A cambió)

Resultado: APIs incompatibles, tests rotos
```

**Mejor alternativa**: Mantener un agente coordinador que tenga visibilidad de todas las interdependencias.

---

## Checklist: ¿Cuándo Usar Orquestador?

| Pregunta | Respuesta | Usar Orquestador |
|---|---|---|
| ¿La tarea es decomposable en sub-tareas independientes? | Sí | ✅ |
| ¿Puedo descartar el contexto interno de cada sub-tarea? | Sí | ✅ |
| ¿Cada sub-tarea tiene un propósito muy claro? | Sí | ✅ |
| ¿Las sub-tareas no tienen dependencias ocultas? | Sí | ✅ |
| ¿El acoplamiento entre partes es mínimo? | Sí | ✅ |
| - | - | - |
| ¿La tarea requiere razonamiento continuo? | Sí | ❌ |
| ¿Hay feedback iterativo entre pasos? | Sí | ❌ |
| ¿Las decisiones anteriores afectan las futuras? | Sí | ❌ |
| ¿Necesito coherencia/consistencia global? | Sí | ❌ |

---

## Trade-offs

| Aspecto | Con Orquestador | Sin Orquestador |
|---|---|---|
| **Presión de contexto** | Baja ✅ | Alta ❌ |
| **Calidad de resultados** | Consistente ✅ | Variable (mejor al inicio, degrada) ❌ |
| **Latencia** | Más lenta (N llamadas) ❌ | Más rápida ✅ |
| **Coordinación** | Simple ✅ | Compleja (todo en un agente) ❌ |
| **Debuggability** | Fácil (cada sub-agente es verificable) ✅ | Difícil (errores ocultos en contexto) ❌ |
| **Cost (tokens)** | Puede ser mayor (overhead de orquestación) | Puede ser menor (un solo agente) ✅ |

---

## Conclusión

**Usa orquestadores cuando:**
- La tarea es **decomposable** en partes independientes
- Necesitas **evitar alucinaciones** por acumulación de contexto
- Puedes tolerar **latencia adicional** de múltiples llamadas
- Los **resultados consistentes** son más importantes que la velocidad

**No uses orquestadores cuando:**
- La tarea tiene **dependencias complejas** entre pasos
- Necesitas **razonamiento continuo** y adaptativo
- La tarea es **pequeña** (no merece la overhead)
- Necesitas máxima **velocidad** y mínima latencia

---

# Otras Estrategias para Controlar el Contexto

Además de orquestadores, existen otras técnicas complementarias para evitar alucinaciones y presión de contexto:

---

## 1. Resumen Iterativo (Prompt Compression)

**Idea**: Cada N pasos, comprime el historial en un resumen corto.

```
Pasos 1-5 (detallados): 50K tokens
  ↓ COMPRIME
Resumen de pasos 1-5: 5K tokens

Pasos 6-10 (detallados): 50K tokens
  ↓ COMPRIME
Resumen de pasos 6-10: 5K tokens

Total acumulado: ~20K tokens (vs 500K sin compresión)
```

**Implementación**:
```typescript
const summaryPrompt = `
Resumen ejecutivo de lo hecho hasta ahora:
- Objetivo: ${goal}
- Logros clave: ${achievements}
- Decisiones importantes: ${decisions}
- Próximo paso: ${nextStep}

[NO incluyas intentos fallidos, razonamientos intermedios, o errores corregidos]
`;

// Reemplaza el historial largo con este resumen comprimido
conversation.history = [summaryPrompt];
```

**Ventajas**: ✅ Retiene información clave, ✅ Reduce tokens drásticamente
**Desventajas**: ❌ Pierde detalles, ❌ Requiere cuidado en qué se resume

---

## 2. Ventana Deslizante (Sliding Window)

**Idea**: Mantén solo los últimos N mensajes del historial.

```
Historial completo:
[Msg 1][Msg 2][Msg 3][Msg 4][Msg 5][Msg 6][Msg 7][Msg 8][Msg 9][Msg 10]

Ventana deslizante (últimos 3):
                                    [Msg 8][Msg 9][Msg 10]
```

**Implementación**:
```typescript
const MAX_HISTORY = 5; // últimos 5 mensajes

if (conversation.history.length > MAX_HISTORY) {
  conversation.history = conversation.history.slice(-MAX_HISTORY);
}
```

**Mejor para**: Conversaciones largas donde solo lo reciente importa
**Trade-off**: Pierdes contexto de decisiones anteriores

---

## 3. Recuperación Bajo Demanda (RAG - Retrieval Augmented Generation)

**Idea**: En lugar de mantener todo en contexto, recupera información relevante cuando la necesitas.

```
Pregunta: "¿Cuál era el error de seguridad que encontramos en auth.ts?"

En lugar de:
  - Buscar en 150K tokens de historial
  
Con RAG:
  - Query la base de datos de resultados anteriores
  - Recupera: "Error XSS en línea 45 de auth.ts"
  - Inserta solo eso en el contexto

Contexto usado: 5K tokens (vs 150K)
```

**Implementación**:
```typescript
// Guardar resultados en una base de datos/índice
await resultsDB.store({
  id: "auth-xss",
  content: "Error XSS en línea 45",
  tags: ["security", "auth", "xss"]
});

// Recuperar cuando lo necesites
const relevant = await resultsDB.search({
  query: "error de seguridad auth",
  limit: 5
});

// Agregalos al contexto actual
const context = `
Contexto relevante recuperado:
${relevant.map(r => r.content).join("\n")}

Nueva pregunta: ...
`;
```

**Ventajas**: ✅ Escalable a tareas muy grandes, ✅ Acceso rápido a datos antiguos
**Desventajas**: ❌ Requiere setup de base de datos, ❌ Puede perder contexto no indexado

---

## 4. Puntos de Control / Snapshots

**Idea**: Guarda estados intermedios limpios para poder retomar sin desde cero.

```
[Estado A]
  ↓ 100 pasos
[Estado B] ← CHECKPOINT (guardar aquí)
  ↓ 100 pasos
[Estado C] ← CHECKPOINT
  ↓ 100 pasos
[Estado D]

Si el agente falla: reinicia desde el checkpoint más reciente, no desde el inicio
```

**Implementación**:
```typescript
interface Checkpoint {
  step: number;
  state: object;
  timestamp: Date;
  contextTokensUsed: number;
}

const checkpoints: Checkpoint[] = [];

// Cada 50 pasos
if (stepCount % 50 === 0) {
  checkpoints.push({
    step: stepCount,
    state: getCurrentState(),
    timestamp: new Date(),
    contextTokensUsed: tokenCounter.current()
  });
}

// Si detectas que contexto es alto, puedes retomar desde el último checkpoint
if (tokenCounter.current() > 180000) {
  const lastCheckpoint = checkpoints[checkpoints.length - 1];
  restoreState(lastCheckpoint.state);
  conversation.reset(); // Limpia el historial
}
```

**Ventajas**: ✅ Recuperación rápida, ✅ No pierdes progreso
**Desventajas**: ❌ Requiere serialización de estado, ❌ Puede ocupar espacio en disco

---

## 5. Conteo de Tokens Preventivo

**Idea**: Monitorea los tokens ANTES de cada paso. Si vas a exceder el límite, actúa preventivamente.

```
Token budget: 200K
Current usage: 170K
Tokens para siguiente paso: 25K
Proyección: 195K ✅ (seguro)

---

Current usage: 180K
Tokens para siguiente paso: 25K
Proyección: 205K ❌ (OVERFLOW!)
  → Acción: Resume el historial
  → Acción: Descarta intentos fallidos
  → Acción: Pasa a un nuevo agente
```

**Implementación**:
```typescript
const TOKEN_LIMIT = 200000;
const SAFETY_THRESHOLD = 0.85; // Actuar al 85%

async function executeStep(step: Task) {
  const currentTokens = tokenCounter.estimate(conversation);
  const nextTokens = tokenCounter.estimate(step.description);
  
  if (currentTokens + nextTokens > TOKEN_LIMIT * SAFETY_THRESHOLD) {
    console.warn("⚠️ Contexto alto, trigger preventivo");
    
    if (currentTokens > TOKEN_LIMIT * 0.9) {
      // Modo crítico: resumen y limpieza
      await compressHistory();
      await cleanupFailedAttempts();
    } else {
      // Modo normal: delegar a sub-agente
      return await delegateToSubagent(step);
    }
  }
  
  return await executeDirectly(step);
}
```

**Ventajas**: ✅ Previene alucinaciones antes de que ocurran
**Desventajas**: ❌ Puede interrumpir flujo de trabajo

---

## 6. Restricciones Explícitas en las Instrucciones

**Idea**: Dale al agente límites claros en sus instrucciones.

```yaml
# Mal
instructions: |
  Analiza el código y sugiere mejoras.

# Bien
instructions: |
  Analiza el código.
  - Revisa solo funciones > 30 líneas
  - Reporta solo errores de seguridad crítica
  - NO sugiera refactoring cosmético
  - Responde siempre en JSON, nunca en prosa
  - Máximo 10 issues por archivo
```

El agente con instrucciones específicas genera menos distracciones y usa contexto de forma más eficiente.

**Ventajas**: ✅ Simple de implementar, ✅ Reduce output innecesario
**Desventajas**: ❌ Limita flexibilidad del agente

---

## 7. Validación de Output Inteligente

**Idea**: Valida que el output tiene sentido antes de acumularlo.

```typescript
async function validateOutput(output: any): Promise<boolean> {
  const checks = [
    () => output !== null && output !== undefined,
    () => !hasHallucinations(output), // Detecta inconsistencias
    () => isCoherent(output), // Verifica coherencia lógica
    () => meetsRequirements(output) // Cumple el objetivo
  ];
  
  const passed = checks.filter(check => check()).length / checks.length;
  
  if (passed < 0.8) {
    console.warn("⚠️ Output tiene baja calidad, posible alucinación");
    return false; // No acumules esto en el contexto
  }
  
  return true;
}

// Uso
if (!await validateOutput(agentOutput)) {
  // Reinicia el paso, no acumules el resultado dudoso
  return await retryStep(task);
}
```

**Ventajas**: ✅ Detecta alucinaciones temprano, ✅ Evita propagar errores
**Desventajas**: ❌ Requiere lógica de validación compleja

---

## 8. Memoria Jerárquica (Hierarchical Memory)

**Idea**: Mantén múltiples niveles de memoria con diferentes períodos de retención.

```
CORTO PLAZO (olvida después de 2 pasos):
- Últimas decisiones
- Variables locales
- Estado transitorio

MEDIO PLAZO (olvida después de 50 pasos):
- Decisiones importantes
- Resultados parciales
- Historial de bugs encontrados

LARGO PLAZO (nunca olvida):
- Objetivo global
- Constraints del proyecto
- Decisiones arquitectónicas
- Hallazgos críticos
```

**Implementación**:
```typescript
class HierarchicalMemory {
  shortTerm = new Map(); // Expires after 2 steps
  mediumTerm = new Map(); // Expires after 50 steps
  longTerm = new Map(); // Never expires
  
  remember(key: string, value: any, duration: 'short' | 'media' | 'long') {
    if (duration === 'short') this.shortTerm.set(key, value);
    if (duration === 'media') this.mediumTerm.set(key, value);
    if (duration === 'long') this.longTerm.set(key, value);
  }
  
  recall(key: string): any | null {
    return this.shortTerm.get(key) 
      || this.mediumTerm.get(key) 
      || this.longTerm.get(key);
  }
}
```

**Ventajas**: ✅ Mantiene info importante, ✅ Limpia automáticamente
**Desventajas**: ❌ Complejo de implementar bien

---

## Comparativa de Estrategias

| Estrategia | Complejidad | Efectividad | Implementación |
|---|---|---|---|
| **Orquestadores** | Media | ⭐⭐⭐⭐⭐ | Requiere redesign |
| **Resumen Iterativo** | Media | ⭐⭐⭐⭐ | Implementable rápido |
| **Ventana Deslizante** | Baja | ⭐⭐⭐ | Muy simple |
| **RAG** | Alta | ⭐⭐⭐⭐⭐ | Requiere infraestructura |
| **Puntos de Control** | Media | ⭐⭐⭐⭐ | Moderado |
| **Conteo de Tokens** | Baja | ⭐⭐⭐ | Muy simple |
| **Restricciones Explícitas** | Baja | ⭐⭐⭐ | Inmediato |
| **Validación de Output** | Media | ⭐⭐⭐ | Implementable |
| **Memoria Jerárquica** | Alta | ⭐⭐⭐⭐ | Complejo |

---

## Recomendación Práctica: Combinación

**Para máxima efectividad, combina múltiples estrategias:**

```
┌─ ORQUESTADOR (si descomposable)
│
├─ Conteo de tokens preventivo (simple, siempre)
│
├─ Restricciones explícitas (simple, inmediato)
│
├─ Validación de output (detecta errores temprano)
│
└─ Si contexto sigue alto:
   ├─ Resumen iterativo (cada 50 pasos)
   ├─ Puntos de control (cada 100 pasos)
   └─ RAG (si tienes datos acumulados críticos)
```

**Estrategia mínima viable:**
1. Restricciones explícitas
2. Conteo preventivo
3. Validación de output

**Estrategia robusta:**
1. Orquestadores (donde aplique)
2. + Conteo preventivo
3. + Resumen iterativo
4. + Puntos de control
5. + RAG (para datos críticos)

---

## Ejemplo Completo: Orquestador de Documentación con Claude API

Este ejemplo muestra un orquestador real que procesa un repositorio de documentación, generando un índice, detectando contenido desactualizado y sugiriendo secciones faltantes. Combina Fan-out, scratchpad compartido, handoff comprimido y manejo de fallos.

```typescript
// doc-orchestrator.ts
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const client = new Anthropic();

// ─── Tipos de contratos de output (cada agente los respeta) ──────────

interface DocSummary {
  file: string;
  title: string;
  topics: string[];
  last_updated: string;
  completeness: "complete" | "partial" | "stub";
}

interface GapAnalysis {
  missing_topics: string[];
  outdated_sections: string[];
  suggested_new_docs: string[];
}

// ─── Sub-agente 1: Resumidor de documento ───────────────────────────

async function summarizeDoc(filePath: string, content: string): Promise<DocSummary> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001", // Modelo rápido para tareas simples
    max_tokens: 512,
    system: `Resume documentación técnica. Responde SOLO con JSON válido, sin texto extra:
{
  "file": "nombre del archivo",
  "title": "título del documento",
  "topics": ["tema1", "tema2"],
  "last_updated": "YYYY-MM-DD o 'unknown'",
  "completeness": "complete | partial | stub"
}
Un documento es "stub" si tiene menos de 200 palabras o solo placeholders.
Un documento es "partial" si le faltan secciones o ejemplos claros.
Un documento es "complete" si está bien desarrollado.`,
    messages: [{
      role: "user",
      content: `Archivo: ${filePath}\n\nContenido:\n${content.slice(0, 3000)}`,
    }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  try {
    return JSON.parse(text);
  } catch {
    // Si el agente no devolvió JSON válido, retornamos un stub detectado
    console.warn(`⚠️ summarizeDoc produjo output inválido para ${filePath}`);
    return {
      file: filePath,
      title: path.basename(filePath, ".md"),
      topics: [],
      last_updated: "unknown",
      completeness: "stub",
    };
  }
}

// ─── Sub-agente 2: Analista de brechas ───────────────────────────────

async function analyzeGaps(summaries: DocSummary[]): Promise<GapAnalysis> {
  // El orquestador pasa SOLO los summaries comprimidos, no el contenido completo
  const summaryText = summaries
    .map(s => `- ${s.file}: [${s.completeness}] temas: ${s.topics.join(", ")}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `Eres un experto en documentación técnica. Analiza brechas en una base de conocimiento.
Responde SOLO con JSON válido:
{
  "missing_topics": ["tema que debería existir pero no está"],
  "outdated_sections": ["archivo.md: razón por la que parece desactualizado"],
  "suggested_new_docs": ["nombre-sugerido.md: qué debería cubrir"]
}`,
    messages: [{
      role: "user",
      content: `Analiza estas ${summaries.length} páginas de documentación:\n\n${summaryText}`,
    }],
  });

  return JSON.parse(
    (response.content[0] as { type: string; text: string }).text
  );
}

// ─── Orquestador principal ────────────────────────────────────────────

async function orchestrateDocReview(docsDir: string) {
  console.log(`🔍 Iniciando revisión de documentación en: ${docsDir}`);

  // Paso 1: Leer todos los archivos .md (el orquestador sabe qué hay)
  const mdFiles = fs
    .readdirSync(docsDir, { recursive: true })
    .filter((f): f is string => typeof f === "string" && f.endsWith(".md"))
    .map(f => path.join(docsDir, f));

  console.log(`📄 Encontrados ${mdFiles.length} documentos`);

  // Paso 2: Fan-out — cada documento se analiza en un sub-agente independiente
  // Los sub-agentes corren en paralelo; cada uno tiene contexto limpio (solo su doc)
  const summaryPromises = mdFiles.map(async (filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    return summarizeDoc(filePath, content);
    // Cuando termina, su contexto (~5K tokens) se descarta
    // El orquestador retiene solo el DocSummary (~100 tokens)
  });

  // Esperamos todos en paralelo (Fan-in)
  const summaries = await Promise.all(summaryPromises);

  // Paso 3: El orquestador tiene N summaries comprimidos, no N documentos completos
  const stubCount = summaries.filter(s => s.completeness === "stub").length;
  const partialCount = summaries.filter(s => s.completeness === "partial").length;

  console.log(`✅ Summaries obtenidos: ${summaries.length}`);
  console.log(`   - Completos: ${summaries.length - stubCount - partialCount}`);
  console.log(`   - Parciales: ${partialCount}`);
  console.log(`   - Stubs: ${stubCount}`);

  // Paso 4: Otro sub-agente analiza las brechas usando solo los summaries
  // Este agente NO recibe el contenido completo de los docs
  console.log(`\n🔍 Analizando brechas en la documentación...`);
  const gaps = await analyzeGaps(summaries);

  // Paso 5: El orquestador compila el reporte final
  // Su contexto: N summaries + 1 gap analysis = mínimo de tokens
  const report = {
    totalDocs: summaries.length,
    byCompleteness: {
      complete: summaries.filter(s => s.completeness === "complete").length,
      partial: partialCount,
      stub: stubCount,
    },
    topicsFound: [...new Set(summaries.flatMap(s => s.topics))],
    gaps,
    actionItems: [
      ...gaps.missing_topics.map(t => `📝 Crear documentación sobre: ${t}`),
      ...gaps.outdated_sections.map(s => `🔄 Actualizar: ${s}`),
      ...gaps.suggested_new_docs.map(d => `➕ Nuevo doc sugerido: ${d}`),
    ],
  };

  console.log("\n─── Reporte Final ───");
  console.log(JSON.stringify(report, null, 2));

  return report;
}

// Ejecutar
orchestrateDocReview("./docs").catch(console.error);
```

### Por qué este ejemplo controla el contexto

| Decisión | Impacto en tokens |
|----------|-------------------|
| `content.slice(0, 3000)` en el summarizador | El sub-agente nunca ve más de 3K chars del documento |
| `summaries` en lugar de contenido completo para gaps | El analizador recibe ~100 tokens por doc, no ~3K |
| `claude-haiku` para summaries, `claude-opus` para análisis | Modelo barato y rápido para tarea simple; modelo potente solo donde importa |
| Output JSON estricto con fallback | Si el agente alucina y no produce JSON, el orquestador no acumula basura |
| `Promise.all` para los summaries | Latencia = tiempo del doc más lento, no suma de todos |

### Escenario de tokens comparado

```
Sin orquestador (agente único que lee todo):
  - Lee 20 docs × 3K tokens = 60K tokens de input
  - Genera análisis: 20K tokens de output
  - Historial acumulado al final: ~80K tokens → presión real

Con este orquestador:
  - Cada summarizer: ~3.5K tokens (input) + ~200 tokens (output) → se descarta
  - Gap analyzer: ~2K tokens (summaries) + ~500 tokens (output)
  - Total retenido por el orquestador al final: ~12K tokens → sin presión
```
