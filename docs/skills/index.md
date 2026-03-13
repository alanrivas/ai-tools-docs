---
sidebar_position: 1
title: ¿Qué son los Skills?
slug: /skills
---

# ¿Qué son los Skills?

Un **skill** es un conjunto de instrucciones reutilizables que le dicen al agente de IA _cómo hacer algo específico_. Si el agente es el trabajador, el skill es el procedimiento documentado que ese trabajador sigue para ejecutar una tarea.

---

## El problema que resuelven

Sin skills, cada agente duplica la misma lógica:

```
Sin skills:
  pr-reviewer    → tiene su propia lógica de cómo leer archivos
  test-generator → tiene su propia lógica de cómo leer archivos
  doc-writer     → tiene su propia lógica de cómo leer archivos
  ↑ tres versiones de lo mismo, que divergen cuando cambias algo

Con skills:
  read-project-files  → una sola definición de cómo leer/buscar
  pr-reviewer         → usa skill: read-project-files
  test-generator      → usa skill: read-project-files
  doc-writer          → usa skill: read-project-files
  ↑ cambias en un lugar, se actualiza en todos
```

---

## Anatomía de un skill

Un skill tiene cuatro partes. Las dos primeras son **metadatos** (le dicen al sistema qué es y cuándo usarlo). Las otras dos son **lógica** (le dicen qué hacer y con qué).

```
┌─────────────────────────────────────────────────────┐
│                    SKILL                            │
│                                                     │
│  1. name         ← identificador único              │
│  2. description  ← cuándo invocar este skill        │
│  ─────────────────────────────────────────────────  │
│  3. instructions ← qué pasos seguir                 │
│  4. tools        ← con qué herramientas hacerlo     │
└─────────────────────────────────────────────────────┘
```

### 1. `name` — el identificador

El nombre que se usa para referenciar el skill desde un agente o invocarlo directamente. Debe ser descriptivo y en kebab-case.

```yaml
name: analizar-dependencias
```

### 2. `description` — el criterio de activación

Esta es la parte **más importante** del skill. Le dice al agente _cuándo_ debe usar este skill. Una buena descripción responde: ¿en qué situaciones debo invocar este skill y en cuáles no?

```yaml
description: |
  Analiza las dependencias de un proyecto Node.js.
  Usa este skill cuando necesites entender las librerías que usa el proyecto,
  encontrar dependencias obsoletas o con vulnerabilidades.
  NO uses este skill para proyectos Python o Ruby — solo Node.js.
```

:::tip Por qué es la parte más importante
El agente lee la descripción para decidir si debe usar este skill o no. Si la descripción es vaga, el agente lo usará cuando no debe (o no lo usará cuando sí debe). Una descripción precisa es mejor que instrucciones largas.
:::

### 3. `instructions` — los pasos a seguir

El procedimiento detallado que el agente seguirá cuando active el skill. Aquí van los pasos, el formato de salida, los criterios de decisión, los casos especiales.

```yaml
instructions: |
  1. Lee el archivo package.json
  2. Clasifica las dependencias:
     - dependencies: producción
     - devDependencies: desarrollo/testing
  3. Para cada dependencia reporta versión y propósito
  4. Identifica versiones fijadas (sin ^) que pueden quedar obsoletas
```

### 4. `tools` — las herramientas disponibles

Las herramientas del sistema que el skill puede usar para ejecutar sus instrucciones. Aquí está la diferencia conceptual clave.

---

## Skills vs Tools: la diferencia fundamental

Esta distinción confunde a muchos porque los nombres se parecen:

| | Tools (Herramientas) | Skills |
|--|---|---|
| **¿Qué son?** | Capacidades primitivas del sistema | Lógica de alto nivel construida sobre tools |
| **¿Quién las define?** | El producto de IA (Claude, Copilot, etc.) | Tú, en archivos de configuración |
| **Granularidad** | Bajo nivel: leer un archivo, ejecutar un comando | Alto nivel: analizar dependencias, revisar seguridad |
| **Ejemplo** | `read_file`, `run_command`, `search_code` | `analizar-dependencias`, `revisar-pr`, `generar-tests` |
| **Reutilización** | Siempre disponibles, automáticas | Debes referenciarlas explícitamente |

:::tip La relación entre ambos
Los skills **usan** tools internamente. Un skill de "analizar dependencias" usa la tool `read_file` para leer `package.json` y la tool `run_command` para ejecutar `npm outdated`. Los skills son abstracciones construidas sobre las tools primitivas.
:::

---

## Las tools de Claude Code

Claude Code tiene un conjunto de tools nativas que cualquier skill o agente puede usar. A diferencia de Copilot CLI (que usa nombres como `read_file`), en Claude Code las tools tienen nombres con mayúscula y semántica más rica:

### Tools de sistema de archivos

| Tool | Qué hace | Cuándo usarla |
|------|----------|---------------|
| **Read** | Lee el contenido de un archivo | Inspeccionar código, configuración, datos |
| **Write** | Crea o sobreescribe un archivo completo | Crear nuevos archivos |
| **Edit** | Reemplaza texto específico dentro de un archivo | Modificar código existente (más preciso que Write) |
| **Glob** | Busca archivos por patrón (`**/*.ts`) | Encontrar archivos por extensión o nombre |
| **Grep** | Busca texto o regex dentro de archivos | Encontrar dónde se usa una función, variable o patrón |

### Tools de ejecución

| Tool | Qué hace | Cuándo usarla |
|------|----------|---------------|
| **Bash** | Ejecuta comandos de terminal | `npm install`, `git commit`, `curl`, cualquier CLI |

### Tools de razonamiento y coordinación

| Tool | Qué hace | Cuándo usarla |
|------|----------|---------------|
| **Agent** | Lanza un subagente especializado | Delegar trabajo pesado o paralelo |
| **TodoWrite** | Gestiona una lista de tareas | Planificar y trackear pasos en tareas largas |

### Tools de información externa

| Tool | Qué hace | Cuándo usarla |
|------|----------|---------------|
| **WebFetch** | Obtiene el contenido de una URL | Leer documentación, APIs, páginas web |
| **WebSearch** | Busca en internet | Investigar errores, librerías, conceptos |

### Relación entre tools en un skill real

El skill `deploy-gh-pages` de este proyecto usa las siguientes tools, cada una con un propósito específico:

```
deploy-gh-pages skill
├── Read     → lee docusaurus.config.ts para extraer org/repo/domain
├── Edit     → modifica docusaurus.config.ts con los valores correctos
├── Write    → crea static/CNAME y .github/workflows/deploy.yml
├── Bash     → ejecuta git init, git commit, git push, gh CLI
└── Agent    → lanza static-site-deployer para el trabajo pesado
```

---

## Estructura completa de un skill (ejemplo real)

Este es el skill `deploy-gh-pages` tal como existe en `~/.claude/skills/deploy-gh-pages/SKILL.md`:

```markdown
---
name: deploy-gh-pages
description: Setup completo de deploy de un sitio Docusaurus en GitHub Pages
             con dominio personalizado via Cloudflare.
argument-hint: "[org=TU-ORG repo=TU-REPO domain=TU-DOMINIO]"
---

Deploy this Docusaurus project to GitHub Pages with a custom domain.

First, extract these three values (from the user's message, from CLAUDE.md
context, or from git remote + docusaurus.config.ts):
- `org` — GitHub username or organization
- `repo` — repository name (exact, case-sensitive)
- `domain` — full custom subdomain

If any value is missing, ask the user for it before doing anything else.

Once you have all three values, use the `static-site-deployer` agent...
```

Observa el frontmatter (entre `---`):
- `name` — el identificador
- `description` — Claude lee esto para decidir cuándo invocar el skill
- `argument-hint` — texto de ayuda que aparece en el autocompletado

El cuerpo es Markdown puro: las instrucciones que Claude seguirá.

---

## Tipos de skills útiles

### Skills de análisis
Leen código o datos y producen un reporte o diagnóstico.

```yaml
# Ejemplos:
analizar-cobertura-tests    → lee informe de coverage, identifica huecos
analizar-deuda-tecnica      → detecta código duplicado, complejidad alta
analizar-dependencias       → revisa package.json, encuentra obsoletas
```

### Skills de generación
Producen artefactos nuevos (código, docs, configs).

```yaml
# Ejemplos:
generar-jsdoc               → documenta funciones con TSDoc
generar-changelog           → crea CHANGELOG desde commits de git
generar-openapi-spec        → genera spec OpenAPI desde controladores
```

### Skills de integración
Interactúan con sistemas externos.

```yaml
# Ejemplos:
crear-pr-github             → abre un PR con descripción estructurada
notificar-slack             → envía mensaje con resultados
buscar-en-jira              → consulta tickets relacionados
```

---

## Cómo se invoca un skill

Dependiendo de la herramienta, la invocación varía:

```bash
# GitHub Copilot CLI — referencia desde agente
gh copilot chat
> /skill:analizar-dependencias

# Claude Code — slash command
/deploy-gh-pages org=alanrivas repo=mi-repo domain=mi-repo.alanrivas.me

# Claude Code — lenguaje natural (Claude detecta el skill por la descripción)
"deploya el proyecto second/dotnet-react-interview-guide"
```
