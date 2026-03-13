---
sidebar_position: 1
title: ¿Qué son los Agentes?
slug: /agentes
---

# ¿Qué son los Agentes de IA?

Un **agente** es una instancia independiente de IA que recibe una tarea, la ejecuta de forma autónoma usando herramientas, y devuelve un resultado. No es una conversación — es un proceso de trabajo.

La diferencia fundamental con un chat o un skill: el agente **no necesita que estés presente** mientras trabaja.

---

## El problema que resuelven

Sin agentes, cada tarea de múltiples pasos requiere que tú coordines cada paso:

```
Sin agente:
  Tú → "¿Cómo escribo el test para esta función?"
  IA  → "Aquí un ejemplo..."
  Tú  → [copias manualmente]
  Tú  → "Ahora el mock de la dependencia..."
  IA  → "Aquí el mock..."
  Tú  → [copias, ajustas, ejecutas, corriges]
  [Ciclo manual indefinido]

Con agente:
  Tú → "@test-generator genera tests para src/services/"
  AG  → [lee todos los archivos]
        [analiza dependencias]
        [crea archivos de test]
        [ejecuta y verifica]
        → "12 archivos creados, 87 tests pasando"
```

---

## Anatomía de un agente

Un agente tiene cinco partes. Conocerlas te permite diseñar agentes que hacen exactamente lo que necesitas — ni más ni menos.

```
┌─────────────────────────────────────────────────┐
│                   AGENTE                        │
│                                                 │
│  1. name         ← identificador               │
│  2. description  ← cuándo invocarlo            │
│  3. tools        ← qué puede hacer             │
│  ─────────────────────────────────────────────  │
│  4. instructions ← cómo debe comportarse       │
│  5. context      ← información adicional       │
└─────────────────────────────────────────────────┘
```

### 1. `name` — el identificador

Cómo se llama el agente. Se usa para invocarlo.

```yaml
name: test-generator
```

### 2. `description` — el criterio de activación

Le dice al sistema cuándo este agente es el apropiado. Afecta directamente si el agente se activa en el momento correcto. Una descripción vaga produce un agente que se invoca mal o que no se invoca.

```yaml
description: |
  Genera tests unitarios y de integración para código TypeScript/JavaScript.
  Usa este agente cuando necesites crear tests para funciones, clases o módulos
  nuevos o existentes. Sigue las convenciones del proyecto (Jest, naming *spec.ts).
  NO usar para análisis de cobertura — hay un agente específico para eso.
```

### 3. `tools` — las capacidades disponibles

La lista de [tools nativas](/docs/tools) que el agente puede usar. Si no está listada, no la puede usar.

```yaml
tools: Read, Glob, Grep, Write, Bash
# Read/Glob/Grep → para leer código existente
# Write → para crear los archivos de test
# Bash → para ejecutar jest y verificar que pasan
```

:::tip Principio de menor privilegio
Declara solo las tools necesarias. Un agente de análisis no necesita `Write` ni `Bash`. Menos tools = menos superficie de error y más predecible.
:::

### 4. `instructions` — el comportamiento

El conjunto de reglas, pasos y criterios que el agente sigue. Es la "personalidad" del agente.

```markdown
Cuando generes tests:
1. Lee el archivo fuente completo antes de empezar
2. Identifica: funciones públicas, casos borde, errores posibles
3. Crea un archivo spec.ts junto al archivo original
4. Nombra los tests descriptivamente: describe("AuthService", () => ...)
5. Ejecuta jest --testPathPattern para verificar que pasan
6. Si fallan, corrige antes de reportar
```

### 5. `context` — información adicional (opcional)

Archivos o datos adicionales que el agente debe tener disponibles. Por ejemplo, las instrucciones del repositorio.

```yaml
context:
  - file: CLAUDE.md        # convenciones del proyecto
  - file: jest.config.ts   # configuración de tests
```

---

## Agentes vs Skills vs Commands

La confusión más habitual es no saber si algo debe ser un agente, un skill o un command. La diferencia está en **quién ejecuta el trabajo y con qué capacidad de interacción**:

| | Command | Skill | Agent |
|--|---------|-------|-------|
| **¿Quién ejecuta?** | Nadie — es un alias | Claude de tu conversación | Claude nuevo, aislado |
| **¿Ve la conversación?** | — | Sí, toda | No, contexto vacío |
| **¿Puede preguntar al usuario?** | — | Sí | No |
| **¿Puede ejecutar tools?** | No | Sí | Sí |
| **Volumen de tool calls** | — | Bajo (2-5) | Alto (10-50+) |
| **Ideal para** | Alias de invocación | Coordinar y decidir | Ejecutar trabajo autónomo |

**Cuándo algo debe ser un agente y no un skill:**
- Ejecuta más de ~5 tool calls seguidas
- No necesita preguntar al usuario durante la ejecución
- Puede beneficiarse de contexto aislado (no necesita ver la conversación)
- Su trabajo puede ejecutarse en paralelo con otras cosas

**Cuándo algo debe ser un skill y no un agente:**
- Necesita preguntar al usuario si faltan datos
- Necesita leer el historial de conversación para decidir qué hacer
- Coordina varios agentes (el skill decide cuál lanzar y cuándo)
- La lógica es corta y no contamina la conversación

---

## El ciclo de razonamiento (ReAct)

Los agentes no ejecutan instrucciones mecánicamente. Usan un ciclo de **Razonamiento → Acción → Observación** que les permite adaptarse a lo que encuentran:

```
Tarea: "Analiza la seguridad del módulo de autenticación"

1. RAZONAMIENTO: "Necesito ver los archivos de autenticación primero"
2. ACCIÓN: Read("src/auth/login.ts")
3. OBSERVACIÓN: [ve el contenido — no hay rate limiting]

4. RAZONAMIENTO: "No hay rate limiting. ¿Existen tests que lo cubran?"
5. ACCIÓN: Grep("rate.limit", "src/")
6. OBSERVACIÓN: "Sin resultados — no hay tests ni implementación"

7. RAZONAMIENTO: "Encontré vulnerabilidades. Genero el reporte"
8. ACCIÓN: Write("security-report.md", "# Vulnerabilidades encontradas...")
9. COMPLETADO: "3 vulnerabilidades críticas. Ver security-report.md"
```

Esto hace que el agente se comporte más como un profesional que razona que como un script que ejecuta pasos fijos.

---

## Agentes especializados vs agente general

**Agente general:** entiende cualquier tarea del proyecto. Útil, pero puede ser inconsistente porque sus instrucciones son genéricas.

**Agentes especializados:** cada uno con un propósito claro y criterios específicos.

```
@code-reviewer   → revisa código con tu checklist exacto de seguridad y calidad
@test-generator  → genera tests en el estilo de tu proyecto (Jest, naming, etc.)
@security-audit  → analiza solo seguridad, con tu lista de vulnerabilidades conocidas
@doc-writer      → documenta con JSDoc/TSDoc siguiendo el formato de tu equipo
```

Los especializados producen resultados más consistentes porque sus instrucciones están enfocadas. Cambias el comportamiento de un agente editando su archivo — sin afectar al resto.

:::tip Por dónde empezar
Empieza con el agente que resuelve tu mayor dolor actual. Un agente de revisión de PR bien configurado puede ahorrarte horas por semana. Luego expande.
:::

---

## Dónde se definen

Dependiendo de la herramienta y el alcance:

| Herramienta | Alcance usuario | Alcance repositorio |
|-------------|----------------|---------------------|
| **Claude Code** | `~/.claude/agents/nombre.md` | `.claude/agents/nombre.md` |
| **GitHub Copilot CLI** | `~/.copilot/agents/nombre.yaml` | `.github/copilot/agents/nombre.yaml` |
| **Cursor** | `~/.cursor/rules/` | `.cursor/rules/` |
| **Gemini CLI** | `~/.gemini/settings.json` | `GEMINI.md` |

Los agentes a nivel repositorio se comparten con todo el equipo. Los de nivel usuario solo los usas tú.
