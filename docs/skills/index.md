---
sidebar_position: 1
title: ¿Qué son los Skills?
slug: /skills
---

# ¿Qué son los Skills?

Los skills son **capacidades reutilizables** que un agente puede invocar para realizar tareas específicas. Si los agentes son los "trabajadores", los skills son las "herramientas especializadas" que usan.

---

## Definición

Un **skill** es una capacidad encapsulada que:

1. Tiene un **nombre claro** y una **descripción** de cuándo usarlo
2. Define **cómo ejecutar** una operación específica
3. Puede ser **reutilizado** por múltiples agentes
4. Puede tener sus propias **instrucciones** y **acceso a herramientas**

La analogía es: si tienes un agente `dev-assistant` (el trabajador), los skills serían `buscar-en-documentacion`, `ejecutar-tests`, `analizar-cobertura` (las herramientas de ese trabajador).

---

## ¿Qué problema resuelven los skills?

### El problema: lógica repetida en múltiples agentes

Imagina que tienes tres agentes:
- `pr-reviewer` — que revisa PRs
- `test-generator` — que genera tests
- `doc-writer` — que escribe documentación

Los tres necesitan **leer archivos del proyecto**. Sin skills, cada agente duplica la lógica de cómo leer archivos y encontrar lo que necesita. Con skills, los tres comparten el mismo skill `read-project-files`.

```
Sin skills:
  pr-reviewer    → instrucciones propias de lectura + lógica de búsqueda
  test-generator → instrucciones propias de lectura + lógica de búsqueda
  doc-writer     → instrucciones propias de lectura + lógica de búsqueda
  [3x la misma lógica, desincronizada cuando cambias algo]

Con skills:
  read-project-files skill → una sola definición de cómo leer/buscar
  pr-reviewer    → usa skill: read-project-files
  test-generator → usa skill: read-project-files
  doc-writer     → usa skill: read-project-files
  [cambias en un lugar, se actualiza en todos]
```

---

## ¿Cómo se hacía antes de los skills?

Antes de tener un sistema de skills:

1. **Copy-paste de prompts**: guardabas prompts en un archivo de texto y los copiabes manualmente cuando los necesitabas
2. **Repetición en instrucciones**: cada agente tenía las mismas instrucciones duplicadas
3. **Sin reutilización**: no había forma de compartir lógica entre agentes
4. **Mantenimiento difícil**: si cambiabas la forma de hacer algo, tenías que actualizar múltiples lugares

---

## Skills en GitHub Copilot CLI

GitHub Copilot CLI es la herramienta con el sistema de skills más desarrollado. Los skills se definen como archivos YAML separados y pueden ser referenciados desde los agentes.

### Estructura de un skill

```yaml
# ~/.copilot/skills/analizar-dependencias.yaml
name: analizar-dependencias
description: |
  Analiza las dependencias de un proyecto Node.js.
  Usa este skill cuando necesites entender las librerías que usa el proyecto,
  encontrar dependencias obsoletas o con vulnerabilidades.

instructions: |
  Para analizar dependencias:
  
  1. Lee el archivo package.json
  2. Clasifica las dependencias:
     - dependencies: producción
     - devDependencies: desarrollo/testing
     - peerDependencies: requeridas del entorno
  
  3. Para cada dependencia, reporta:
     - Versión instalada
     - Propósito (qué hace en el proyecto)
     - Si hay versiones más nuevas disponibles (usa npm info)
  
  4. Identifica posibles problemas:
     - Versiones fijadas exactas (sin ^) que pueden quedar obsoletas
     - Paquetes duplicados con diferentes versiones
     - Dependencias no usadas (si puedes determinarlo)

tools:
  - name: read_file
    description: Lee package.json y package-lock.json
  - name: run_command
    description: Ejecuta comandos npm para obtener info de paquetes
```

### Usar un skill desde un agente

```yaml
# ~/.copilot/agents/dependency-auditor.yaml
name: dependency-auditor
description: Audita las dependencias del proyecto en busca de problemas
version: "1.0"

instructions: |
  Eres un auditor de dependencias. Tu trabajo es revisar todas las
  dependencias del proyecto y generar un reporte de acción.

skills:
  - analizar-dependencias      # Referencia al skill definido anteriormente
  - buscar-vulnerabilidades    # Otro skill para CVEs

tools:
  - name: write_file
    description: Escribe el reporte de auditoría
```

### Invocar un skill directamente

Los skills también pueden invocarse directamente sin un agente completo:

```bash
gh copilot chat
> /skill:analizar-dependencias ¿Qué dependencias están desactualizadas?
```

---

## Tipos de skills útiles

### Skills de análisis

```yaml
# skill: analizar-cobertura-tests
# skill: analizar-complejidad-ciclomatica
# skill: analizar-deuda-tecnica
```

### Skills de generación

```yaml
# skill: generar-openapi-spec
# skill: generar-changelog
# skill: generar-diagrama-arquitectura
```

### Skills de integración

```yaml
# skill: buscar-en-jira
# skill: crear-pr-github
# skill: notificar-slack
```

---

## Diferencia entre Skills y Herramientas (Tools)

Es importante no confundir skills con tools (herramientas):

| Aspecto | Tools | Skills |
|---|---|---|
| Definición | Capacidades del sistema (leer archivos, ejecutar comandos) | Lógica de dominio específica del usuario |
| Configuración | Definidas por el producto (Copilot, Claude, etc.) | Definidas por ti en archivos YAML/config |
| Granularidad | Bajo nivel (read, write, search) | Alto nivel (analizar-dependencias, revisar-seguridad) |
| Reutilización | Automática, siempre disponibles | Explícita, debes referenciarlas |

:::tip La sinergia
Los skills usan tools internamente. Un skill de "analizar dependencias" usa la tool `read_file` para leer package.json y la tool `run_command` para ejecutar `npm outdated`. Los skills son abstracciones de alto nivel construidas sobre las tools de bajo nivel.
:::
