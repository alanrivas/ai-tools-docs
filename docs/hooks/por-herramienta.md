---
sidebar_position: 2
title: Hooks por Herramienta
---

# Hooks por Herramienta

Los **hooks** son mecanismos que permiten ejecutar código automáticamente en respuesta a eventos del ciclo de vida del agente de IA. Su disponibilidad varía significativamente entre herramientas.

---

## Claude Code — Sistema Completo de Hooks

Claude Code es la herramienta con el sistema de hooks más completo y maduro. Los hooks se configuran en `~/.claude/settings.json` bajo la clave `hooks:` y se ejecutan como scripts de shell o comandos del sistema.

### Tipos de Eventos

| Evento | Cuándo se ejecuta |
|---|---|
| `PreToolUse` | Antes de que Claude ejecute una herramienta (leer archivo, ejecutar comando, etc.) |
| `PostToolUse` | Después de que Claude ejecuta una herramienta |
| `Notification` | Cuando Claude envía una notificación al usuario |
| `Stop` | Cuando Claude termina su respuesta o tarea |

### Configuración Completa

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/validate-bash.sh"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/check-write-permissions.js"
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
            "command": "~/.claude/hooks/log-file-change.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/session-summary.js"
          }
        ]
      }
    ]
  }
}
```

### Ejemplo: Hook de Validación Pre-escritura

```bash
#!/bin/bash
# ~/.claude/hooks/validate-bash.sh
# Recibe el contenido del comando via stdin como JSON

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Bloquear comandos peligrosos
if echo "$COMMAND" | grep -qE "rm -rf|sudo rm|> /dev/"; then
  echo '{"decision": "block", "reason": "Comando potencialmente destructivo detectado"}' 
  exit 0
fi

echo '{"decision": "allow"}'
exit 0
```

:::warning
Los hooks de `PreToolUse` con `decision: block` pueden detener operaciones legítimas. Úsalos con cuidado y pruébalos exhaustivamente antes de activarlos en producción.
:::

### Ejemplo: Hook de Log Post-escritura

```bash
#!/bin/bash
# ~/.claude/hooks/log-file-change.sh
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "[$TIMESTAMP] Archivo modificado: $FILE" >> ~/.claude/activity.log
```

---

## GitHub Copilot — Sin Hooks Nativos

GitHub Copilot CLI no tiene un sistema de hooks nativo. Sin embargo, existen varios enfoques para simular comportamientos similares:

### Workaround 1: VS Code Tasks

En el editor VS Code, puedes usar **tareas** que se ejecutan antes o después de eventos:

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Pre-commit: Lint y Tests",
      "type": "shell",
      "command": "npm run lint && npm run test",
      "group": "build",
      "presentation": {
        "reveal": "always"
      }
    }
  ]
}
```

### Workaround 2: Git Hooks

Usa hooks de Git para ejecutar validaciones automáticas:

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "Ejecutando validaciones pre-commit..."
npm run lint
npm run test -- --watchAll=false
```

### Workaround 3: GitHub Actions

Para hooks en el ciclo de vida del repositorio, usa GitHub Actions:

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run automated checks
        run: npm run lint && npm run test
```

:::info
Aunque no son "hooks" en el sentido del agente, los GitHub Actions son una alternativa robusta para automatizar flujos relacionados con el desarrollo asistido por IA.
:::

---

## Gemini CLI — Sin Sistema de Hooks

Gemini CLI actualmente no dispone de un sistema de hooks nativo. Las alternativas incluyen:

- **Variables de entorno**: Configurar el comportamiento mediante variables antes de iniciar la sesión.
- **Scripts wrapper**: Crear un script que ejecute lógica antes/después de invocar `gemini`.
- **Extensiones**: Algunos comportamientos pueden implementarse como extensiones de Gemini.

```bash
#!/bin/bash
# gemini-wrapper.sh — Simula comportamiento pre/post
echo "[PRE] Iniciando sesión Gemini - $(date)" >> ~/gemini-sessions.log

gemini "$@"
EXIT_CODE=$?

echo "[POST] Sesión terminada con código $EXIT_CODE - $(date)" >> ~/gemini-sessions.log
exit $EXIT_CODE
```

---

## Cursor — Sin Hooks, Alternativas Disponibles

Cursor no implementa hooks de ciclo de vida. Los mecanismos alternativos son:

- **`.cursorrules`**: Puede incluir instrucciones de comportamiento, pero no son hooks ejecutables.
- **Background Agents**: Los agentes en background de Cursor pueden actuar de forma autónoma, pero no responden a eventos específicos del ciclo de vida.
- **Integración con el terminal**: Cursor tiene acceso al terminal integrado donde sí se pueden configurar git hooks normales.

```markdown
<!-- .cursor/rules/save-behavior.mdc -->
---
description: Comportamiento al guardar archivos
alwaysApply: true
---

Cuando generes o modifiques código:
1. Siempre incluye los imports necesarios
2. Asegúrate de que el archivo compilará sin errores TypeScript
3. Si modificas una función pública, actualiza su JSDoc
4. Sugiere el test correspondiente si no existe
```

:::tip
Aunque no son hooks técnicos, las reglas de Cursor con `alwaysApply: true` pueden simular comportamiento consistente en cada interacción.
:::

---

## Tabla Comparativa de Hooks

| Característica | Claude Code | GitHub Copilot | Gemini CLI | Cursor |
|---|---|---|---|---|
| Sistema de hooks nativo | ✅ Completo | ❌ No | ❌ No | ❌ No |
| PreToolUse | ✅ Sí | ❌ No | ❌ No | ❌ No |
| PostToolUse | ✅ Sí | ❌ No | ❌ No | ❌ No |
| Evento de parada | ✅ `Stop` | ❌ No | ❌ No | ❌ No |
| Notificaciones | ✅ `Notification` | ❌ No | ❌ No | ❌ No |
| Alternativa disponible | — | Git hooks, GH Actions | Scripts wrapper | `.cursorrules` |
| Bloqueo de operaciones | ✅ Sí (`block`) | ❌ No | ❌ No | ❌ No |

:::danger Importante
Solo Claude Code permite **bloquear** operaciones del agente mediante hooks. Esto es fundamental para implementar guardrails de seguridad en entornos de producción.
:::
