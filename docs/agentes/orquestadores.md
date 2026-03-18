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

### Paso 3: Implementar la Lógica de Orquestación

Si usas **GitHub Copilot CLI** o **Cursor**:

```typescript
// orchestrator-client.ts
async function reviewCode(filePaths: string[]) {
  const orchestrator = new Agent('code-review');
  const results = [];
  
  for (const file of filePaths) {
    // Cada iteración: nuevo contexto, sub-agente descartado después
    const analysis = await orchestrator.delegate('code-analyzer', { file });
    const security = await orchestrator.delegate('security-auditor', { file });
    const perf = await orchestrator.delegate('performance-reviewer', { file });
    
    // Guardar solo los resultados, no el historial interno
    results.push({
      file,
      analysis: analysis.output,
      security: security.output,
      performance: perf.output
    });
  }
  
  return results;
}
```

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
