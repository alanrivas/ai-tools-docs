---
sidebar_position: 1
title: Cheatsheet
slug: /cheatsheet
---

# Cheatsheet — Referencia Rápida

Sin teoría, solo código y rutas. Copia y pega.

---

## Ubicaciones de Archivos por Producto

| Archivo | GitHub Copilot CLI | Claude Code | Gemini CLI | Cursor |
|---|---|---|---|---|
| Instrucciones globales | `~/.copilot/instructions.md` | `~/.claude/CLAUDE.md` | `~/.gemini/GEMINI.md` | `~/.cursor/rules/` |
| Instrucciones del repo | `.github/copilot-instructions.md` | `CLAUDE.md` | `GEMINI.md` | `.cursor/rules/` |
| Agentes (usuario) | `~/.copilot/agents/` | `~/.claude/agents/` | — | — |
| Agentes (repo) | `.github/copilot/agents/` | `.claude/agents/` | — | `.cursor/rules/` |
| Config MCP (usuario) | `~/.copilot/mcp.json` | `~/.claude/claude_desktop_config.json` | `~/.gemini/settings.json` | Configuración IDE |
| Config MCP (repo) | `.github/copilot/mcp.json` | `.claude/mcp.json` | — | — |
| Hooks | ❌ | `~/.claude/settings.json` | ❌ | ❌ |
| Comandos slash | ❌ | `~/.claude/commands/` | ❌ | ❌ |

---

## Estructura de Agent YAML — GitHub Copilot CLI

```yaml
# ~/.copilot/agents/nombre-agente.yml
name: nombre-agente                    # ← sin espacios, en minúsculas
description: Qué hace este agente     # ← aparece en el autocompletado
tools:                                  # ← herramientas disponibles
  - read_file
  - write_file
  - list_directory
  - run_terminal_command
  - web_search                          # ← si necesita buscar en internet
instructions: |                        # ← el system prompt del agente
  Eres un experto en...

  ## Tu proceso:
  1. Primero haz X
  2. Luego haz Y
  3. Finalmente reporta Z

  ## Restricciones:
  - Nunca hagas A
  - Siempre incluye B
```

**Campos requeridos**: `name`, `description`, `instructions`  
**Campos opcionales**: `tools` (si se omite, el agente solo responde con texto)

---

## Estructura de CLAUDE.md

```markdown
# Contexto del Proyecto: [Nombre]

## Stack Tecnológico
- Runtime: Node.js 20
- Lenguaje: TypeScript 5
- Framework: Express / NestJS / Next.js
- Base de datos: PostgreSQL + Prisma
- Tests: Jest

## Convenciones de Código
- [Regla 1]
- [Regla 2]

## Estructura del Proyecto
\`\`\`
src/
  modules/     ← Módulos de negocio
  shared/      ← Código compartido
  config/      ← Configuración
\`\`\`

## Lo que NUNCA debes hacer
- console.log en producción
- any en TypeScript
- Lógica en controllers (va en services)

## Comandos Útiles
- \`npm run dev\` — servidor de desarrollo
- \`npm run test\` — ejecutar tests
- \`npm run build\` — compilar para producción
```

---

## Hooks — settings.json Completo (Claude Code)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/ruta/a/tu/hook-pre-bash.sh"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "/ruta/a/tu/hook-pre-write.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "/ruta/a/tu/hook-post-write.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/ruta/a/tu/hook-stop.sh"
          }
        ]
      }
    ]
  }
}
```

**Eventos válidos**: `PreToolUse`, `PostToolUse`, `Notification`, `Stop`  
**Matchers comunes**: `Bash`, `Write`, `Read`, `Edit`, `*` (todos)

### Hook Script Mínimo

```bash
#!/bin/bash
# El input viene por stdin como JSON
INPUT=$(cat)

# Para PreToolUse: retorna allow o block
echo '{"decision": "allow"}'

# Para bloquear:
# echo '{"decision": "block", "reason": "Motivo del bloqueo"}'
```

---

## MCP Config — Estructura Completa

```json
{
  "servers": {
    "nombre-servidor": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-nombre"],
      "env": {
        "API_KEY": "${MI_API_KEY}",
        "BASE_URL": "https://api.ejemplo.com"
      }
    },
    "servidor-local": {
      "command": "node",
      "args": ["/ruta/a/mi-servidor-mcp/index.js"],
      "env": {}
    }
  }
}
```

**Servidores MCP comunes**:
- `@modelcontextprotocol/server-github` — GitHub API
- `@modelcontextprotocol/server-filesystem` — Sistema de archivos
- `@modelcontextprotocol/server-postgres` — PostgreSQL
- `@modelcontextprotocol/server-brave-search` — Búsqueda web

---

## Comandos Comunes

| Acción | GitHub Copilot CLI | Claude Code | Gemini CLI |
|---|---|---|---|
| Iniciar | `gh copilot suggest "..."` | `claude` | `gemini` |
| Modo chat | `gh copilot suggest` (interactivo) | `claude` | `gemini` |
| Invocar agente | `@nombre-agente` (en chat) | `@nombre-agente` (en chat) | — |
| Comando slash | — | `/user:nombre-comando` | — |
| Ver ayuda | `gh copilot --help` | `claude --help` | `gemini --help` |
| Versión | `gh copilot --version` | `claude --version` | `gemini --version` |

---

## Cursor Rules — Estructura `.mdc`

```markdown
---
description: Descripción breve de cuándo aplicar esta regla
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# Título de la Regla

## Instrucción 1
Detalle de la instrucción...

## Instrucción 2
Detalle...

## Ejemplo Correcto
\`\`\`typescript
// código de ejemplo
\`\`\`
```

**Campos frontmatter**:
- `description`: cuándo usar esta regla (el modelo lo lee para decidir si aplica)
- `globs`: patrones de archivos donde aplica automáticamente
- `alwaysApply`: si `true`, se inyecta en todas las conversaciones del contexto

---

## Diagnóstico Rápido

```bash
# ¿Qué CLI tengo instalado?
which gh claude gemini

# ¿Dónde están mis agentes de Copilot?
ls ~/.copilot/agents/

# ¿Dónde están mis agentes de Claude?
ls ~/.claude/agents/

# ¿Es válido mi JSON de settings?
cat ~/.claude/settings.json | python3 -m json.tool

# ¿Tiene permisos mi hook?
ls -la ~/.claude/hooks/

# ¿Está corriendo mi MCP server?
npx -y @modelcontextprotocol/server-github --version
```

---

## Recordatorio: Modelo ≠ Producto

| Si usas el comando... | Eres usuario de... | Agentes en... |
|---|---|---|
| `gh copilot` | GitHub Copilot CLI | `~/.copilot/agents/` |
| `claude` | Claude Code | `~/.claude/agents/` |
| `gemini` | Gemini CLI | No aplica |
| IDE con chat | Cursor / Copilot en VS Code | `.cursor/rules/` o `.github/copilot/agents/` |

:::warning
GitHub Copilot CLI puede usar Claude Sonnet como modelo, pero sus archivos de configuración van en `~/.copilot/`, NO en `~/.claude/`. El producto manda, no el modelo.
:::
