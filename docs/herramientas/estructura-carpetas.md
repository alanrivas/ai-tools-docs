---
sidebar_position: 6
title: Estructura de Carpetas por Herramienta
slug: /herramientas/estructura-carpetas
---

# Estructura de Carpetas por Herramienta

Cada herramienta de IA almacena sus configuraciones, agentes, skills y rules en ubicaciones específicas. Conocer esta estructura es fundamental para:

- **Entender dónde existen tus personalizaciones** — ¿por qué tu agente no se reconoce?
- **Compartir configuración en equipo** — qué va al repo vs. qué es personal
- **Migrar entre máquinas** — qué archivos backup necesitas
- **Resolver conflictos** — cuándo un archivo de usuario sobrescribe el del repo

---

## Tabla de Referencia Rápida

| Herramienta | Scope | Ubicación | Tipos de Archivos | Plataforma |
|---|---|---|---|---|
| **GitHub Copilot CLI** | Usuario | `~/.copilot/` | `*.yaml` (agentes), `settings.json` | Windows/Mac/Linux |
| **GitHub Copilot CLI** | Repo | `.github/` | `copilot-instructions.md`, `AGENTS.md` | Compartido |
| **GitHub Copilot VS Code** | Usuario | `%APPDATA%\Code\User\globalStorage\github.copilot-chat\` | Archivos del estado de chat | Windows |
| **GitHub Copilot VS Code** | Usuario | `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/` | Archivos del estado de chat | Mac |
| **Claude Code** | Usuario | `~/.claude/` | `CLAUDE.md`, `settings.json`, `hooks/`, `agents/` | Windows/Mac/Linux |
| **Claude Code** | Repo | `/` raíz | `CLAUDE.md` | Compartido |
| **Gemini CLI** | Usuario | `~/.gemini/` | `GEMINI.md`, `settings.json`, `extensions/` | Windows/Mac/Linux |
| **Gemini CLI** | Repo | `/` raíz | `GEMINI.md` | Compartido |
| **Cursor** | Repo | `.cursorrules`, `.cursor/` | `.cursorrules`, `rules/*.mdc` | Compartido |
| **Cursor** | Usuario | `%APPDATA%\Cursor\User\` (Windows) | Extensiones, settings | Específico |

---

## 🔵 GitHub Copilot CLI

### Scope Global (Usuario)

**Ubicación:** `~/.copilot/` (o `%USERPROFILE%\.copilot\` en Windows)

```
~/.copilot/
├── agents/
│   ├── code-reviewer.yaml
│   ├── documentation-writer.yaml
│   └── test-generator.yaml
├── settings.json              # Modelo, permisos, configuración general
├── state/                     # Estado de sesiones (autogenerado)
└── logs/                      # Histórico de chats (autogenerado)
```

**Archivos principales:**

- `agents/` — Directorio donde viven todos tus agentes **globales** (YAML)
  - Cada agente es un archivo `nombre-del-agente.yaml`
  - Puedes tener 1, 10, o 100 agentes personalizados
  - Se comparten en TODAS las sesiones de GitHub Copilot CLI

- `settings.json` — Configuración global
  ```json
  {
    "model": "claude-3-7-sonnet-20250219",
    "permissions": {
      "allowWebSearch": true,
      "allowCodeExecution": true
    }
  }
  ```

**Comandos relacionados:**
```bash
# Ver agentes disponibles
gh copilot agents list

# Ver ubicación real del directorio
echo ~/.copilot/agents

# Crear un nuevo agente
touch ~/.copilot/agents/mi-agente.yaml
```

---

### Scope de Repositorio

**Ubicación:** `.github/` en la raíz del repo

```
mi-proyecto/
└── .github/
    ├── copilot-instructions.md    # Instrucciones para el equipo (OBLIGATORIO)
    ├── AGENTS.md                  # Descripción de agentes locales (OPCIONAL)
    └── workflows/                 # Workflows de CI/CD (no relacionado a IA)
```

**Archivos principales:**

- `.github/copilot-instructions.md` — Contexto compartido en el equipo
  - Se aplica automáticamente en todas las conversaciones
  - Sobreescribe configuración global si hay conflicto
  - Va en control de versiones (git)
  
  ```markdown
  # GitHub Copilot — Instrucciones del Proyecto
  
  ## Contexto
  API GraphQL con Node.js, TypeScript, Apollo Server.
  
  ## Convenciones
  - Usa `async/await`
  - Valida inputs con `class-validator`
  - Tests en Jest
  
  ## Lo que NO hacer
  - No modifiques `src/config/secrets.ts` sin aprobación
  ```

- `AGENTS.md` — Documentación de agentes específicos del repo
  ```markdown
  # Agentes Disponibles en Este Repositorio
  
  ## @api-reviewer
  Revisa cambios en endpoints GraphQL. Lee el archivo `.github/copilot-instructions.md` primero.
  
  ## @schema-generator
  Genera schemas y resolvers a partir de tipos TypeScript.
  ```

:::info Diferencia: global vs. repo
- **Global (`~/.copilot/agents/`):** Solo visible para TI. Tus agentes personales. No se comparten.
- **Repo (`.github/AGENTS.md`):** Visible para TODO el equipo cuando clonen el repo. Configuración compartida.
:::

---

## 🟠 Claude Code

### Scope Global (Usuario)

**Ubicación:** `~/.claude/` (o `%USERPROFILE%\.claude\` en Windows)

```
~/.claude/
├── CLAUDE.md              # Instrucciones globales (archivo principal)
├── settings.json          # Configuración del modelo, API keys
├── hooks/
│   ├── pre-tool-use.js
│   ├── post-tool-use.js
│   └── notification.js
├── agents/                # Si defines agentes personalizados
│   └── code-linter.json
├── skills/               # Skills personalizados
│   └── refactor-helper.md
└── mcp-servers.json      # Configuración de MCP servers
```

**Archivos principales:**

- `CLAUDE.md` — **Archivo crítico**. Instrucciones globales para todos tus proyectos
  ```markdown
  # Configuración Global de Claude Code
  
  Soy desarrollador TypeScript. Mis preferencias:
  - Siempre usar `const`, nunca `let` a menos que sea necesario
  - Comentarios en inglés
  - Imports ordenados alfabéticamente
  
  ## Herramientas permitidas
  - Lectura de archivos: Sí
  - Ejecución de comandos: Solo análisis, no destructivos
  - Escritura de archivos: Solo en /tmp/ para tests
  ```

- `settings.json` — Configuración técnica
  ```json
  {
    "model": "claude-3-7-sonnet-20250219",
    "apiKey": "sk-ant-...",
    "permissions": {
      "allowCommandExecution": true,
      "allowFileWrite": true,
      "allowWebSearch": false
    }
  }
  ```

- `hooks/` — **Característica única de Claude Code**
  - Scripts que se ejecutan en eventos del ciclo de vida
  - Extensiones de Python, JavaScript o bash
  - Ejemplos: validar antes de escribir, ejecutar linters automáticamente, alertas
  
  ```javascript
  // ~/.claude/hooks/post-tool-use.js
  // Se ejecuta después de cada herramienta que usa Claude
  
  if (toolName === 'write_file' && filepath.endsWith('.ts')) {
    // Ejecutar ESLint automáticamente
    exec(`eslint ${filepath} --fix`);
  }
  ```

- `mcp-servers.json` — Configura MCP servers disponibles globalmente
  ```json
  {
    "servers": [
      {
        "name": "filesystem",
        "command": "mcp-server-filesystem"
      },
      {
        "name": "git",
        "command": "mcp-server-git"
      }
    ]
  }
  ```

**Comandos relacionados:**
```bash
# Ver ubicación real
echo ~/.claude

# Recargar configuración
claude config reload

# Ver hooks activos
claude hooks list
```

---

### Scope de Repositorio

**Ubicación:** Raíz del proyecto + `.claude/` (carpeta opcional)

```
mi-proyecto/
├── CLAUDE.md              # Instrucciones del proyecto (sobrescribe global)
└── .claude/
    ├── settings.json      # Settings por proyecto (opcional)
    ├── hooks/             # Hooks específicos del repo (opcional)
    │   └── pre-commit.js
    └── mcp-servers.json   # MCP servers por proyecto (opcional)
```

**Archivos principales:**

- `CLAUDE.md` en raíz — Contexto del proyecto específico
  ```markdown
  # Claude Code — Contexto del Proyecto API eCommerce
  
  ## Stack
  Node.js 20, TypeScript, NestJS, Prisma, PostgreSQL, Jest
  
  ## Estructura
  ```
  src/
  ├── modules/        # Módulos de NestJS
  ├── common/         # Código compartido
  ├── config/         # Configuración
  └── prisma/         # Schemas de Prisma
  ```
  
  ## Comandos
  - `npm run dev` — servidor desarrollo
  - `npm run test` — tests
  - `npm run db:seed` — cargar datos de prueba
  
  ## Importantes
  - Nunca modifiques migraciones existentes
  - Los tests son obligatorios para features nuevas
  - Usa el seed para datos de test, NO la base de datos real
  ```

- `.claude/settings.json` — Overrides locales (opcional)
  ```json
  {
    "model": "claude-opus-4-20250514",
    "permissions": {
      "allowCommandExecution": false
    }
  }
  ```

:::tip Precedencia de configuración
1. `.claude/CLAUDE.md` (repo) — máxima prioridad
2. `CLAUDE.md` (repo raíz) — sobrescribe global
3. `~/.claude/CLAUDE.md` (usuario global) — fallback
:::

---

## 🔴 Gemini CLI

### Scope Global (Usuario)

**Ubicación:** `~/.gemini/` (o `%USERPROFILE%\.gemini\` en Windows)

```
~/.gemini/
├── GEMINI.md              # Instrucciones globales
├── settings.json          # API key, modelo, configuración
├── extensions/            # Extensiones personalizadas
│   ├── pdf-analyzer.py
│   └── data-processor.py
└── cache/                 # Cache de respuestas (autogenerado)
```

**Archivos principales:**

- `GEMINI.md` — Instrucciones globales para Gemini CLI
  ```markdown
  # Mi Configuración Global de Gemini CLI
  
  Trabajar con **grandes volúmenes de datos** y **análisis complejos**.
  
  ## Modelos permitidos
  - `gemini-2.0-pro` para análisis profundo
  - `gemini-2.0-flash` para respuestas rápidas
  
  ## Límites de contexto
  Puedo usar hasta 500k tokens. Carga datos completos sin truncar.
  
  ## Extensiones disponibles
  - `pdf-analyzer` — extrae tablas de PDFs
  - `data-processor` — procesa CSVs grandes
  ```

- `settings.json` — Configuración técnica
  ```json
  {
    "apiKey": "AIzaSy...",
    "model": "gemini-2.0-pro",
    "maxTokens": 500000,
    "extensions": ["pdf-analyzer", "data-processor"]
  }
  ```

- `extensions/` — Scripts personalizados (Python, JavaScript)
  ```python
  # ~/.gemini/extensions/pdf-analyzer.py
  # Puedes importar módulos complejos aquí
  
  import PyPDF2
  import pandas as pd
  
  def extract_tables(pdf_path):
      # Lógica personalizada
      pass
  ```

**Comandos relacionados:**
```bash
# Ver configuración
gemini config show

# Cargar extensiones
gemini extensions load pdf-analyzer

# Ver contexto disponible
gemini utils token-count
```

---

### Scope de Repositorio

**Ubicación:** Raíz del proyecto

```
mi-proyecto/
└── GEMINI.md              # Instrucciones del proyecto
```

- `GEMINI.md` — Contexto específico del proyecto
  ```markdown
  # Análisis de Datos — Contexto para Gemini CLI
  
  ## Proyecto
  Sistema de análisis de bigdata con Python, pandas, BigQuery
  
  ## Archivos importantes
  - `data/raw/` — datos sin procesar
  - `data/processed/` — datos limpios
  - `notebooks/` — análisis exploratorio
  
  ## Restricciones
  - NO proceses archivos `data/private/` (datos sensibles)
  - USA BigQuery para queries, no la BD local
  ```

:::info Contexto masivo
Gemini CLI soporta hasta **1 millón de tokens**. Puedes cargar bases de código enteras, datasets grandes, o documentación extensa sin preocuparte por limitaciones de contexto.
:::

---

## 🔵 GitHub Copilot VS Code

### Scope Global (Usuario)

**Ubicación varies por sistema:**

- **Windows:** `%APPDATA%\Code\User\globalStorage\github.copilot-chat\`
- **macOS:** `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/`
- **Linux:** `~/.config/Code/User/globalStorage/github.copilot-chat/`

```
github.copilot-chat/
├── chat-sessions/         # Historial de chats
├── chat-index.json        # Índice de conversaciones
├── chat-settings.json     # Configuración personal
└── models.json            # Modelos configurados
```

:::info Contenido autogenerado
A diferencia de CLI donde configuras agentes manualmente, GitHub Copilot VS Code **gestiona automáticamente** este directorio. No es recomendable editar aquí directamente.
:::

**Qué almacena:**
- Historial de conversaciones (si no las eliminas)
- Contexto de archivos recientes
- Preferencias de modelo (GPT-4o, Claude, etc.)
- Caché de embeddings

---

### Scope de Repositorio

**Ubicación:** `.github/` en la raíz

```
mi-proyecto/
└── .github/
    └── copilot-instructions.md    # Igual que CLI
```

El archivo `.github/copilot-instructions.md` **aplica a ambas** (CLI y VS Code).

---

## 🟣 Cursor

### Scope de Repositorio (Principal)

**Ubicación:** Raíz del proyecto + `.cursor/`

```
mi-proyecto/
├── .cursorrules                   # Archivo principal (MÁS IMPORTANTE)
└── .cursor/
    ├── rules/
    │   ├── typescript.mdc
    │   ├── testing.mdc
    │   ├── database.mdc
    │   └── accessibility.mdc
    └── settings.json              # Configuración local
```

**Archivos principales:**

- `.cursorrules` — **Archivo de configuración principal**
  - Plain text o markdown
  - Aplica a TODO el equipo automáticamente
  - Sobrescribe settings globales
  
  ```
  # Reglas del Proyecto API REST
  
  Stack: Node.js 20, TypeScript 5, Express 5, Prisma 5, PostgreSQL
  
  ## Estructura
  src/
  ├── controllers/   # Thin controllers
  ├── services/      # Business logic
  ├── models/        # Prisma schemas
  ├── types/         # TypeScript interfaces
  └── middleware/    # Express middleware
  
  ## Convenciones
  - Usa async/await siempre
  - Validación con Zod (no Joi)
  - Tests en Jest + Supertest
  - Linting con ESLint, formatting con Prettier
  
  ## Lo que NUNCA hagas
  - No uses `any` en TypeScript
  - No hardcodees secrets
  - No modifiques migraciones existentes
  ```

- `.cursor/rules/` — **Reglas modulares** (avanzado)
  - Múltiples archivos `.mdc` con reglas específicas
  - YAML frontmatter para globs y condiciones
  - Se aplican según contexto
  
  ```markdown
  ---
  description: Reglas para TypeScript
  globs: ["src/**/*.ts", "tests/**/*.ts"]
  alwaysApply: true
  ---
  
  # Reglas TypeScript
  
  - Usa `interface` para contracts públicos, `type` para aliases
  - Siempre agrega `eslint-disable-next-line` justificado
  - Evita `any` a toda costa, usa `unknown` con type guards
  ```

- `.cursor/settings.json` — Configuración local (opcional)
  ```json
  {
    "model": "claude-opus-4-20250514",
    "hideCommandResults": false,
    "customInstructions": ""
  }
  ```

**Comandos en Cursor:**
```bash
# Ver reglas activas
cmd+k → "Cursor: Show Rules"

# Recargar reglas
cmd+k → "Cursor: Reload Rules"

# Ver configuración
cmd+k → "Cursor: Settings"
```

---

### Scope de Usuario (Secundario)

**Ubicación:** `%APPDATA%\Cursor\User\` (Windows) o `~/.config/Cursor/` (Linux/Mac)

```
Cursor/User/
├── extensions/            # Extensiones instaladas
├── settings.json          # Settings globales
└── globalStorage/         # Caché de contexto (autogenerado)
```

:::warning Configuración de usuario vs. repo
**Preferencia:** Siempre usa `.cursorrules` y `.cursor/` en el repo. La configuración **personal** en `~/` no se comparte con el equipo.

Cuando hay conflicto, el repo (`.cursorrules`) **siempre gana**.
:::

---

## Comparación: Niveles de Configuración

| Nivel | GitHub Copilot CLI | Claude Code | Gemini CLI | Cursor |
|---|---|---|---|---|
| **Global (Usuario)** | `~/.copilot/` | `~/.claude/` | `~/.gemini/` | `%APPDATA%\Cursor\User\` |
| **Repo** | `.github/` | Raíz `/` | Raíz `/` | `.cursorrules` + `.cursor/` |
| **Precedencia** | Repo > Global | Repo > Global | Repo > Global | Repo > Global |
| **Se Comparte (git)** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí (es el punto) |
| **Se Comparte automáticamente** | ❌ Manual git | ❌ Manual git | ❌ Manual git | ✅ Automático en Cursor |

---

## Archivo de Ejemplo: `.gitignore` para Configuraciones

Cuando trabajes con estas herramientas, **no commits** ciertos archivos:

```bash
# ~/.gitignore_global (o .gitignore del proyecto)

# Configuraciones locales (no compartir)
~/.copilot/
~/.claude/
~/.gemini/
.cursor/settings.json  # OK compartir .cursorrules, NO settings.json

# Historiales y caché
.claude/state/
.claude/logs/
~/.config/Cursor/globalStorage/

# Secrets (IMPORTANTE)
.env
.env.local
settings.json  # Si contiene API keys
```

---

## Ejemplos Reales: Configuraciones en Acción

### Ejemplo 1: Equipo usando GitHub Copilot CLI

Estructura del repos para un equipo de 5 personas usando GitHub Copilot:

```
proyecto-web/
├── .github/
│   ├── copilot-instructions.md    # ✅ Todos leen esto
│   ├── AGENTS.md                  # ✅ Documentación de agentes compartidos
│   └── workflows/                 # (CI/CD normal)
├── src/
│   ├── components/
│   ├── pages/
│   └── utils/
└── README.md

# En cada máquina del equipo (~PERSONAL, no en git):
~/.copilot/agents/
├── component-generator.yaml       # Mi agente personal
├── bug-finder.yaml                # Mi agente personal
└── test-writer.yaml               # Mi agente personal
```

**Resultado:** El equipo comparte instrucciones via `.github/copilot-instructions.md`, pero cada persona tiene sus propios agentes en `~/.copilot/agents/`.

---

### Ejemplo 2: Proyecto Docusaurus con Claude Code

Estructura para documentación que usa Claude Code heavily:

```
ai-tools-docs/
├── CLAUDE.md                      # ✅ Instrucciones del proyecto
├── .claude/
│   ├── hooks/
│   │   ├── post-tool-use.js      # Validar markdown después de editar docs
│   │   └── notification.js        # Alertas cuando termina una tarea
│   └── mcp-servers.json          # Git MCP para análisis de historial
├── docs/
│   └── ... (contenido markdown)
└── docusaurus.config.ts

# Global (en ~/.claude/ — NUNCA en git):
~/.claude/
├── CLAUDE.md                      # Preferencias globales
├── hooks/
│   ├── pre-tool-use.js           # Validar antes de cualquier herramienta
│   └── notification.js            # Alertas globales
└── mcp-servers.json              # Mi setup personal de MCP
```

**Flujo:** Cuando abro este proyecto, Claude Code carga:
1. Primero `~/.claude/CLAUDE.md` (global)
2. Luego `./CLAUDE.md` (proyecto) que sobrescribe las preferencias globales
3. Los hooks locales en `.claude/hooks/` se añaden a los globales

---

### Ejemplo 3: API REST con Cursor (equipo compartido)

En Cursor, TODA la configuración vive en el repo:

```
backend-api/
├── .cursorrules                   # ✅ Obligatorio, va en git
├── .cursor/
│   ├── rules/
│   │   ├── typescript.mdc         # Reglas para .ts
│   │   ├── testing.mdc            # Reglas para tests
│   │   ├── api-design.mdc         # Reglas para endpoints
│   │   └── database.mdc           # Reglas para queries
│   └── settings.json              # ✅ Configuración del repo (local, no git)
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── types/
└── tests/

# Cuando Juan clona el repo en su máquina, automáticamente:
- Ve el .cursorrules ✅
- Ve las reglas en .cursor/rules/ ✅
- La IA usa estas reglas sin que haga nada
```

**Ventaja:** Todo el equipo (Juan, María, Pedro) ven **exactamente las mismas reglas** sin necesidad de compartir nada manualmente.

---

### Ejemplo 4: Científico de datos con Gemini CLI

Para análisis de grandes bases de datos:

```
data-analysis-project/
├── GEMINI.md                      # ✅ Contexto del proyecto
├── data/
│   ├── raw/                       # Datos originales
│   ├── processed/                 # Después de limpiar
│   └── cache/                     # Cache de Gemini (autogenerado)
├── notebooks/                     # Jupyter
├── src/
│   └── analysis/
└── README.md

# Global (en ~/.gemini/ — NUNCA en git):
~/.gemini/
├── GEMINI.md                      # Preferencias personales
├── extensions/
│   ├── pdf-extractor.py          # Para analizar PDFs
│   └── data-processor.py          # Procesamiento personalizado
└── settings.json                  # API key (SECRETO)
```

**Ventaja:** Puedo cargar datasets completos de 1M+ tokens sin preocuparme por límites de contexto. La API key nunca va en git.

---

## Archivo de Ejemplo: `.gitignore` para Configuraciones

| Síntoma | Causa probable | Solución |
|---|---|---|
| El agente no aparece en `gh copilot agents list` | YAML inválido en `~/.copilot/agents/` | Validar sintaxis YAML |
| `.github/copilot-instructions.md` no se aplica | Archivo no está en `.github/` exactamente | Mover a `.github/copilot-instructions.md` |
| `CLAUDE.md` de repo no sobrescribe global | Sintaxis inválida en alguno | Comparar ambos archivos |
| Cursor no lee `.cursorrules` | No está en raíz del proyecto (git root) | Asegurarse que está al nivel raíz |
| `~/.claude/` no existe después de instalar | Claude Code requiere inicialización | Ejecutar `claude config init` |

---

## Checklist: Configurando una Herramienta Nueva

### Para un equipo (repo compartido)

- [ ] Crear `.github/copilot-instructions.md` (GitHub Copilot)
- [ ] Crear `CLAUDE.md` en raíz (Claude Code)
- [ ] Crear `GEMINI.md` en raíz (Gemini CLI)
- [ ] Crear `.cursorrules` en raíz (Cursor)
- [ ] Agregar a `.gitignore` archivos sensibles
- [ ] Documentar en `README.md` qué herramienta usa el equipo
- [ ] Hacer commit y push: `git add ... && git commit -m "chore: add AI tool configurations"`

### Para uso personal

- [ ] Crear `~/.copilot/agents/` con agentes personalizados
- [ ] Crear `~/.claude/CLAUDE.md` con preferencias globales
- [ ] Crear `~/.claude/hooks/` para automatización
- [ ] Crear `~/.gemini/GEMINI.md` con contexto de análisis
- [ ] **NO COMPROMETER:** API keys, tokens, datos sensibles

---

## Recursos Adicionales

### En este sitio
- [GitHub Copilot](./github-copilot.md) — Detalles sobre agentes YAML
- [Claude Code](./claude-code.md) — Sistema de hooks
- [Gemini CLI](./gemini-cli.md) — Contexto masivo y extensiones
- [Cursor](./cursor.md) — Reglas modulares `.mdc`
- [Instructions](../instructions/index.md) — Qué escribir en CLAUDE.md, etc.
- [Skills](../skills/index.md) — Agregar skills personalizados

### Enlaces externos
- [Claude Code CLI (Anthropic)](https://github.com/anthropics/claude-code)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Cursor Rules Documentation](https://docs.cursor.sh/context/rules-for-repos)
- [Gemini API Documentation](https://ai.google.dev/docs)
