---
sidebar_position: 3
title: Claude Code
---

# Claude Code

Claude Code es la CLI oficial de Anthropic para interactuar con Claude desde la terminal. Es el producto más poderoso para automatización gracias a su sistema de **hooks** — una característica única que ninguna otra herramienta tiene de forma nativa.

---

## ¿Qué es Claude Code?

Claude Code (`claude`) es una herramienta de línea de comandos que convierte a Claude en un agente autónomo capaz de leer y escribir archivos, ejecutar comandos, y completar tareas complejas de múltiples pasos.

:::info Importante: es un producto, no solo el modelo
Claude Code es el **producto de Anthropic**. Si usas GitHub Copilot CLI con Claude Sonnet como modelo, sigues usando GitHub Copilot CLI. Claude Code es cuando usas la CLI oficial `claude` de Anthropic directamente.
:::

---

## Scopes y Ubicación de Archivos

### Configuración Global (usuario)

```
~/.claude/
├── CLAUDE.md          # Instrucciones globales para todos los proyectos
├── settings.json      # Configuración general (modelo, permisos)
├── hooks/             # Hooks globales
└── agents/            # Agentes globales (si aplica)
```

### Configuración de Repositorio

```
mi-proyecto/
├── CLAUDE.md          # Instrucciones específicas del proyecto
└── .claude/
    └── settings.json  # Configuración por proyecto (sobreescribe global)
```

:::tip Referencia visual
Para ver la estructura completa de carpetas de Claude Code y cómo se compara con otras herramientas, consulta la [guía de estructura de carpetas](./estructura-carpetas.md#-claude-code).
:::

---

## CLAUDE.md — El archivo de instrucciones

`CLAUDE.md` es el equivalente de `.github/copilot-instructions.md` pero para Claude Code. Puede existir en dos lugares:

1. **`~/.claude/CLAUDE.md`** — instrucciones globales (todos los proyectos)
2. **`./CLAUDE.md`** en la raíz del repositorio — instrucciones del proyecto

Claude lee ambos y los combina. Las instrucciones del proyecto tienen prioridad.

### Ejemplo de CLAUDE.md para un proyecto

```markdown
# Claude Code — Instrucciones del Proyecto

## Contexto
API GraphQL construida con NestJS, TypeScript y MongoDB.
Usa Apollo Server, Mongoose, y Jest para testing.

## Comandos importantes
- `npm run dev` — servidor de desarrollo
- `npm run test` — ejecutar todos los tests
- `npm run lint` — linting con ESLint
- `npm run build` — build de producción

## Convenciones
- Los resolvers van en `src/resolvers/`
- Los schemas GraphQL van en `src/schemas/`
- Los DTOs van en `src/dto/` y usan `class-validator`
- Siempre usa inyección de dependencias de NestJS

## Lo que NUNCA debes hacer
- No modifiques `src/config/database.ts` sin confirmación
- No hagas deploy directo — siempre usa el pipeline de CI
- No uses `mongoose.connect()` directamente — usa el módulo de Mongoose de NestJS

## Flujo de trabajo para nuevas features
1. Crea el schema GraphQL primero
2. Genera el DTO con validaciones
3. Implementa el resolver
4. Escribe el test de integración
5. Actualiza la documentación en `docs/api/`
```

---

## Sistema de Hooks — La característica única de Claude Code

Los hooks son scripts que se ejecutan automáticamente en **eventos del ciclo de vida** de Claude Code. Son la característica más poderosa y diferenciadora.

### Tipos de hooks

| Hook | Cuándo se ejecuta | Caso de uso típico |
|---|---|---|
| `PreToolUse` | Antes de que Claude use una herramienta | Validar antes de escribir archivos |
| `PostToolUse` | Después de que Claude usa una herramienta | Ejecutar linters tras editar código |
| `Notification` | Cuando Claude genera una notificación | Enviar alertas por Slack/email |
| `Stop` | Cuando Claude termina una sesión | Limpiar recursos, guardar logs |

### Configuración de hooks

Los hooks se configuran en `~/.claude/settings.json` o `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/validate-write.py"
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
            "command": "npm run lint --silent"
          }
        ]
      }
    ]
  }
}
```

### Ejemplo: Hook que valida antes de escribir

```python
# ~/.claude/hooks/validate-write.py
import sys
import json

# Claude Code pasa el contexto como JSON por stdin
data = json.load(sys.stdin)
tool_name = data.get("tool_name", "")
tool_input = data.get("tool_input", {})

if tool_name == "Write":
    file_path = tool_input.get("file_path", "")
    
    # Bloquear escritura en archivos de configuración críticos
    protected_files = [".env", "secrets.json", "config/production.json"]
    for protected in protected_files:
        if protected in file_path:
            print(json.dumps({
                "decision": "block",
                "reason": f"Archivo protegido: {file_path}. Edita manualmente."
            }))
            sys.exit(0)

# Permitir la operación
print(json.dumps({"decision": "allow"}))
```

---

## Configuración de Modelos y Permisos

```json
// ~/.claude/settings.json
{
  "model": "claude-sonnet-4-5",
  "permissions": {
    "allow": [
      "Read(*)",
      "Write(src/**)",
      "Bash(npm run *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Write(.env)"
    ]
  }
}
```

:::warning Permisos de seguridad
Configura siempre los permisos `deny` para evitar que Claude accidentalmente borre archivos críticos o modifique configuración de producción.
:::

---

## Comandos básicos de Claude Code

```bash
# Iniciar sesión interactiva
claude

# Ejecutar una tarea específica
claude "Analiza src/auth y encuentra posibles vulnerabilidades de seguridad"

# Con un archivo de contexto
claude --context CLAUDE.md "Agrega validación al endpoint de registro"

# Ver configuración actual
claude config

# Listar herramientas disponibles
claude tools
```
