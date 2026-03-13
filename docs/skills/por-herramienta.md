---
sidebar_position: 2
title: Skills por Herramienta
---

# Skills por Herramienta

Cada herramienta de IA tiene su propia forma de definir y reutilizar capacidades específicas — lo que genéricamente llamamos **skills** o habilidades reutilizables. A continuación se explica cómo funciona cada una.

---

## GitHub Copilot CLI

En GitHub Copilot CLI, los skills se definen dentro de los archivos YAML de agentes, bajo las claves `tools:` o como instrucciones especializadas que el agente puede invocar. Los agentes se almacenan en `~/.copilot/agents/` (nivel usuario) o en `.github/copilot/agents/` (nivel repositorio).

Un agente puede referenciar skills implícitamente al declarar qué herramientas tiene disponibles y cuáles son sus instrucciones de uso.

```yaml
# ~/.copilot/agents/code-reviewer.yml
name: code-reviewer
description: Revisa código en busca de problemas de seguridad, rendimiento y estilo
tools:
  - read_file
  - list_directory
  - run_terminal_command
instructions: |
  Eres un revisor de código experto. Cuando el usuario te pida revisar código:
  1. Lee los archivos relevantes con read_file
  2. Identifica problemas de seguridad (inyecciones, exposición de secretos)
  3. Identifica problemas de rendimiento (loops innecesarios, consultas N+1)
  4. Sugiere mejoras de legibilidad y mantenibilidad
  5. Presenta tus hallazgos en formato estructurado con severidad: ALTA, MEDIA, BAJA

  Convenciones del proyecto:
  - TypeScript estricto (noImplicitAny: true)
  - Tests con Jest
  - Estilo: ESLint + Prettier
```

:::tip
Puedes crear múltiples agentes especializados y combinarlos en un flujo de trabajo. Por ejemplo, un agente `code-reviewer` y otro `test-generator` que trabajen sobre el mismo código.
:::

---

## Claude Code

Claude Code tiene un sistema de skills propio con tres piezas que trabajan juntas. Es importante distinguirlas porque cumplen roles distintos:

```
~/.claude/
├── commands/   ← slash commands (el alias que escribe el usuario)
├── skills/     ← la lógica del skill (instrucciones que sigue Claude)
└── agents/     ← subprocesos especializados que lanza el skill
```

### Las tres piezas y cómo se relacionan

#### 1. Command (`~/.claude/commands/nombre.md`)

Es solo un **alias**. Cuando escribes `/deploy-gh-pages`, Claude carga el texto del archivo y lo trata como instrucciones. No tiene lógica propia — su único trabajo es ser un nombre corto que activa un skill.

```markdown
<!-- ~/.claude/commands/deploy-gh-pages.md -->
---
name: deploy-gh-pages
description: Setup completo de deploy de un sitio Docusaurus en GitHub Pages.
argument-hint: "[org=TU-ORG repo=TU-REPO domain=TU-DOMINIO]"
---

Deploy this Docusaurus project to GitHub Pages with a custom domain.
First, extract org, repo, and domain...
```

#### 2. Skill (`~/.claude/skills/nombre/SKILL.md`)

Es la **lógica real**. Claude (el de tu conversación) lee estas instrucciones y las sigue. Puede preguntarte cosas si le falta información, puede leer el contexto de la conversación, y puede decidir lanzar un agente cuando tenga todos los datos.

```markdown
<!-- ~/.claude/skills/deploy-gh-pages/SKILL.md -->
---
name: deploy-gh-pages
description: |
  Setup completo de deploy de un sitio Docusaurus en GitHub Pages
  con dominio personalizado via Cloudflare. Configura docusaurus.config.ts,
  crea CNAME, crea el workflow de GitHub Actions, y verifica DNS y HTTPS.
argument-hint: "[org=TU-ORG repo=TU-REPO domain=TU-DOMINIO]"
---

Deploy this Docusaurus project to GitHub Pages with a custom domain.

First, extract these three values (from the user's message, from CLAUDE.md
context, or from git remote + docusaurus.config.ts):
- `org` — GitHub username or organization
- `repo` — repository name (exact, case-sensitive)
- `domain` — full custom subdomain (e.g., `my-project.alanrivas.me`)

If any value is missing, **ask the user** for it before doing anything else.

Once you have all three values, use the `static-site-deployer` agent to
execute the full deployment pipeline:
1. Update `docusaurus.config.ts`
2. Create `static/CNAME`
3. Create `.github/workflows/deploy.yml`
4. Commit and push
5. Configure GitHub Pages via gh CLI
6. Verify DNS and HTTPS
```

#### 3. Agent (`~/.claude/agents/nombre.md`)

Es un **subproceso separado** que el skill lanza para el trabajo pesado. Tiene su propio contexto aislado y ejecuta decenas de tool calls (bash, edición de archivos, llamadas a APIs) sin aparecer en la conversación principal.

```markdown
<!-- ~/.claude/agents/static-site-deployer.md -->
---
name: static-site-deployer
description: Deploys Docusaurus/static sites to GitHub Pages with optional
             custom domain via Cloudflare DNS.
tools: Bash, Read, Edit, Write, Glob, Grep
---

You are a deployment specialist for static sites on GitHub Pages.

## Deployment checklist
1. Update docusaurus.config.ts — set url, organizationName, projectName, trailingSlash
2. Create static/CNAME — bare domain, no protocol
3. Create .github/workflows/deploy.yml — use exact workflow below
...
```

Observa el campo `tools` en el frontmatter del agent: lista explícitamente qué tools de Claude Code puede usar. En este caso: `Bash, Read, Edit, Write, Glob, Grep`.

### Anatomía del frontmatter de un skill de Claude Code

```markdown
---
name: nombre-del-skill          ← identificador (kebab-case)
description: |                  ← cuándo Claude debe activar este skill
  Una o dos frases explicando
  el propósito y cuándo usarlo.
argument-hint: "[arg=valor]"    ← texto de ayuda en el autocompletado (opcional)
---

Instrucciones en Markdown puro que Claude seguirá...
```

El campo más crítico es `description`: Claude lo lee para decidir si este skill aplica al pedido del usuario. Si la descripción es imprecisa, el skill se activará cuando no debe o no se activará cuando sí debe.

### Flujo completo en Claude Code

```
Usuario escribe: /deploy-gh-pages
        │
        ▼
Command (~/.claude/commands/deploy-gh-pages.md)
  └── solo carga el texto del skill
        │
        ▼
Skill (~/.claude/skills/deploy-gh-pages/SKILL.md)
  └── Claude de la conversación lee las instrucciones
  └── extrae org/repo/domain del contexto o pregunta al usuario
  └── lanza el agente cuando tiene todo
        │
        ▼
Agent (~/.claude/agents/static-site-deployer.md)
  └── Claude separado, contexto aislado
  └── usa tools: Read, Edit, Write, Bash, Glob, Grep
  └── ejecuta ~30 tool calls autónomamente
  └── devuelve tabla ✅/⚠️/❌
```

### Tools disponibles en Claude Code

Las tools que se pueden declarar en el frontmatter de un agent son las capacidades nativas de Claude Code. Ver la sección [¿Qué son los Skills? → Las tools de Claude Code](/skills#las-tools-de-claude-code) para la referencia completa.

:::info Command vs Skill en Claude Code
La distinción puede parecer redundante, pero tiene un propósito:
- El **command** es para el usuario: aparece en el autocompletado de `/`
- El **skill** es para Claude: contiene la lógica real que Claude ejecuta

Puedes tener un skill sin command (Claude lo detecta por descripción en lenguaje natural) o un command sin skill dedicado (el command mismo contiene las instrucciones). Separar ambos permite mantener las instrucciones detalladas en el skill sin contaminar el autocompletado.
:::

---

## Gemini CLI

Gemini CLI utiliza **archivos de contexto** (`GEMINI.md`) y **extensiones** para definir comportamientos reutilizables. El archivo `GEMINI.md` en la raíz del proyecto actúa como instrucción persistente que se inyecta en cada sesión.

```markdown
<!-- GEMINI.md en la raíz del proyecto -->
# Contexto del Proyecto: API de Pagos

## Stack Tecnológico
- Backend: Node.js 20 + Express
- Base de datos: PostgreSQL 15 con Prisma ORM
- Tests: Jest + Supertest
- CI/CD: GitHub Actions

## Convenciones de Código
- Todas las funciones deben tener tipos TypeScript explícitos
- Los errores se manejan con el patrón Result<T, E>
- Los nombres de variables en inglés, comentarios en español

## Skills Implícitos
Cuando generes código:
- Siempre incluye manejo de errores
- Agrega JSDoc a funciones públicas
- Escribe el test unitario correspondiente en el mismo bloque de respuesta

## Restricciones
- No uses `any` en TypeScript
- No hagas consultas directas a la BD, siempre usa el repositorio
```

---

## Cursor

En Cursor, los **Rules** (reglas en `.cursor/rules/`) funcionan como skills reutilizables que se aplican automáticamente según el contexto. Son archivos `.mdc` (Markdown con metadatos) que definen instrucciones específicas para diferentes tipos de archivos o tareas.

```markdown
<!-- .cursor/rules/typescript.mdc -->
---
description: Reglas para archivos TypeScript
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

# Reglas TypeScript

## Tipos
- Usa tipos explícitos siempre, nunca `any`
- Prefiere `interface` sobre `type` para objetos
- Usa `readonly` donde los datos no deban mutar

## Funciones
- Máximo 20 líneas por función
- Nombres descriptivos en inglés (verbos para funciones: `getUserById`, `createOrder`)
- Documenta con JSDoc las funciones exportadas

## Manejo de Errores
- Usa `Result<T, E>` en lugar de `throw`
- Los errores deben ser tipos explícitos, nunca `Error` genérico

## Ejemplo Correcto
\`\`\`typescript
interface UserRepository {
  readonly findById: (id: string) => Promise<Result<User, NotFoundError>>;
}
\`\`\`
```

:::warning
Los archivos `.mdc` con `alwaysApply: true` se inyectan en CADA conversación del contexto correspondiente. Evita hacerlos demasiado largos o ralentizarás las respuestas.
:::

---

## Tabla Comparativa

| Característica | GitHub Copilot CLI | Claude Code | Gemini CLI | Cursor |
|---|---|---|---|---|
| Mecanismo | Agent YAML (`tools:`) | CLAUDE.md + slash commands | GEMINI.md + extensions | `.cursor/rules/*.mdc` |
| Alcance usuario | `~/.copilot/agents/` | `~/.claude/commands/` | `~/.gemini/` | `~/.cursor/rules/` |
| Alcance repo | `.github/copilot/agents/` | `CLAUDE.md` | `GEMINI.md` | `.cursor/rules/` |
| Invocación | `@nombre-agente` | `/user:nombre` | Automático | Automático por glob |
| Reutilizable entre proyectos | ✅ (nivel usuario) | ✅ (comandos globales) | ⚠️ Parcial | ⚠️ Solo si en `~` |
| Composición de skills | ✅ Múltiples agentes | ⚠️ Manual | ❌ No formal | ⚠️ Múltiples archivos |

:::tip Recomendación
Para proyectos en equipo, define los skills a nivel de repositorio (`.github/copilot/agents/` o `.cursor/rules/`) para que todos los miembros se beneficien automáticamente.
:::
