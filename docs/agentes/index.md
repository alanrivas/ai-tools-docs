---
sidebar_position: 1
title: ¿Qué son los Agentes?
slug: /agentes
---

# ¿Qué son los Agentes de IA?

Los agentes son una de las evoluciones más importantes en la forma de trabajar con IA. Un agente no es simplemente una IA que responde preguntas — es una entidad autónoma que puede **tomar decisiones**, **usar herramientas**, y **completar tareas de múltiples pasos** sin supervisión constante.

---

## Definición

Un **agente de IA** es una entidad de IA especializada que:

1. Tiene un **propósito específico** (revisar código, generar tests, analizar seguridad)
2. Puede **usar herramientas** (leer archivos, ejecutar comandos, hacer búsquedas)
3. Tiene **instrucciones propias** que definen su comportamiento
4. Puede **tomar decisiones** sobre cómo completar una tarea

La diferencia fundamental con una conversación de chat normal:

```
Chat normal:
  Tú → "¿Cómo puedo escribir un test para esta función?"
  IA  → "Aquí tienes un ejemplo: ..."
  Tú  → [copias el ejemplo manualmente]
  Tú  → "Ahora necesito también mocks para las dependencias..."
  IA  → "Aquí están los mocks: ..."
  [Ciclo manual infinito]

Agente:
  Tú   → "@test-generator Genera tests completos para src/services/"
  IA   → [lee los archivos automáticamente]
        [analiza las dependencias]
        [crea los archivos de test]
        [ejecuta los tests para verificar]
        [reporta: "Creé 12 archivos de test, 87 tests pasando"]
```

---

## ¿Qué problema resuelven los agentes?

### El problema: tareas repetitivas de múltiples pasos

Muchas tareas de desarrollo son predecibles pero tediosas:

- Revisar PRs siguiendo siempre los mismos criterios
- Generar tests unitarios para nuevas funciones
- Documentar código con JSDoc/docstrings
- Analizar seguridad de nuevos endpoints
- Refactorizar código para seguir convenciones del proyecto

Sin agentes, esto requiere:
1. Recordar el prompt correcto cada vez
2. Copiar el contexto relevante
3. Ejecutar el resultado manualmente
4. Verificar que funcionó
5. Repetir para cada archivo/función

Con agentes, describes la tarea una vez y el agente la ejecuta completa.

---

## ¿Cómo se hacía antes?

Antes de los agentes, el flujo típico era:

```
1. Abrir chat de IA
2. Re-explicar el contexto del proyecto ("estamos usando TypeScript, Express, etc.")
3. Pegar el código del archivo
4. Pedir lo que necesitabas
5. Copiar la respuesta
6. Pegar manualmente en el editor
7. Ajustar porque faltaba contexto
8. Repetir para el siguiente archivo
```

Esto tenía varios problemas:
- **Pérdida de contexto**: la IA no "sabía" el proyecto
- **Trabajo manual**: copiar-pegar era inevitable
- **Sin verificación**: la IA no podía saber si su respuesta funcionaba
- **Sin acceso a herramientas**: la IA solo podía ver lo que tú le mostraras

---

## Cómo funcionan los agentes

### El ciclo de razonamiento (ReAct)

Los agentes modernos usan un ciclo de **Razonamiento → Acción → Observación**:

```
Tarea: "Analiza la seguridad del módulo de autenticación"

1. RAZONAMIENTO: "Necesito ver los archivos de autenticación"
2. ACCIÓN: leer src/auth/login.ts
3. OBSERVACIÓN: [contenido del archivo]
4. RAZONAMIENTO: "Veo que no hay rate limiting. Necesito ver si hay tests"
5. ACCIÓN: buscar "rate limit" en el proyecto
6. OBSERVACIÓN: "No se encontraron archivos relacionados"
7. RAZONAMIENTO: "Encontré vulnerabilidades. Voy a generar el reporte"
8. ACCIÓN: escribir security-report.md con los hallazgos
9. COMPLETADO: "Encontré 3 vulnerabilidades críticas. Ver security-report.md"
```

### Herramientas que pueden usar los agentes

| Herramienta | Qué puede hacer |
|---|---|
| `read_file` | Leer cualquier archivo del proyecto |
| `write_file` | Crear o modificar archivos |
| `search_code` | Buscar patrones en el código base |
| `run_command` | Ejecutar comandos de terminal |
| `web_search` | Buscar información en internet |
| `list_directory` | Explorar la estructura del proyecto |

---

## Agentes vs. Modos de IA

Es útil entender la diferencia entre los distintos modos de trabajo con IA:

| Modo | Autonomía | Acceso a herramientas | Mejor para |
|---|---|---|---|
| Chat simple | Ninguna | No | Preguntas puntuales |
| Autocomplete | Ninguna | No | Escritura de código |
| Chat con contexto | Baja | Limitado | Explicaciones, revisiones |
| **Agente** | **Alta** | **Completo** | **Tareas completas de múltiples pasos** |

---

## Agentes especializados vs. Agente general

Puedes tener:

**Agente general:** Hace cualquier tarea relacionada con el proyecto. Útil pero puede ser menos consistente.

**Agentes especializados:** Cada uno con un propósito claro:

```
@code-reviewer   → Solo revisa código, con criterios específicos
@test-generator  → Solo genera tests, siguiendo tus convenciones
@security-audit  → Solo analiza seguridad, con tu checklist
@doc-writer      → Solo documenta código, en el formato de tu proyecto
```

Los agentes especializados son más confiables porque tienen instrucciones más focalizadas y se pueden afinar para el caso de uso exacto.

:::tip Consejo práctico
Empieza con 1-2 agentes que resuelvan tu dolor más grande. Luego expande. Un agente de revisión de código bien configurado puede ahorrarte horas por semana.
:::
