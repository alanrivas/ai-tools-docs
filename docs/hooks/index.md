---
sidebar_position: 1
title: ¿Qué son los Hooks?
slug: /hooks
---

# ¿Qué son los Hooks?

Los hooks son **scripts externos que se ejecutan automáticamente en eventos del ciclo de vida** de Claude Code. Son la forma de interceptar lo que Claude está a punto de hacer — antes, después, o al finalizar — sin que Claude lo controle.

:::info Disponibilidad
Los hooks son una característica **exclusiva de Claude Code**. GitHub Copilot, Cursor y Gemini CLI no tienen un sistema de hooks equivalente.
:::

---

## El problema que resuelven

Sin hooks, Claude opera como una caja negra desde el punto de vista del sistema:

```
Sin hooks:
  Claude → decide escribir un archivo → lo escribe → te avisa
  [Tú no puedes interceptar la acción antes de que ocurra]
  [No hay log automático de qué se modificó]
  [No hay integración con sistemas externos en tiempo real]

Con hooks:
  Claude → decide escribir un archivo
         → tu hook recibe el evento
         → valida / aprueba / bloquea
         → Claude actúa (o no)
         → tu hook post-acción loguea, notifica, ejecuta linter
```

La diferencia clave con otras formas de control: los hooks actúan **en tiempo real**, no después del hecho.

---

## Anatomía de un hook

Un hook tiene tres partes:

```
┌─────────────────────────────────────────────────┐
│                    HOOK                         │
│                                                 │
│  1. evento    ← cuándo se dispara               │
│  2. matcher   ← a qué tool/acción aplica        │
│  3. command   ← qué script ejecutar             │
└─────────────────────────────────────────────────┘
```

### 1. Evento — cuándo se dispara

Hay cuatro momentos en el ciclo de vida donde puedes interceptar:

| Evento | Cuándo ocurre | Puede bloquear |
|--------|--------------|----------------|
| `PreToolUse` | Antes de que Claude use una tool | ✅ Sí |
| `PostToolUse` | Después de que Claude usa una tool | ❌ No |
| `Notification` | Cuando Claude genera una notificación | ❌ No |
| `Stop` | Cuando Claude termina la sesión/tarea | ❌ No |

Solo `PreToolUse` puede bloquear la acción. Los demás son observadores.

### 2. Matcher — a qué aplica

Una expresión regular que se compara contra el nombre de la tool:

```json
"matcher": "Write"              // solo la tool Write
"matcher": "Write|Edit"         // Write o Edit
"matcher": "Bash"               // solo Bash
"matcher": ".*"                 // cualquier tool
"matcher": "^(Write|Edit|Bash)$" // exactamente esas tres
```

Gracias al matcher puedes tener hooks diferentes para cada tool. Un hook que valida antes de `Write` y otro que ejecuta el linter después de `Edit`.

### 3. Command — qué script ejecutar

La ruta al script que se ejecutará. Puede ser Python, Bash, Node, o cualquier ejecutable.

```json
"command": "python3 ~/.claude/hooks/validate-write.py"
"command": "bash ~/.claude/hooks/run-linter.sh"
"command": "node ~/.claude/hooks/notify-slack.js"
```

---

## Comunicación entre Claude y el hook

La comunicación es via **stdin/stdout en formato JSON**:

```
Claude Code → [JSON con contexto] → stdin del script
             ← stdout del script [JSON con decisión]
```

### Lo que recibe el hook (stdin)

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "src/config/database.ts",
    "content": "const dbUrl = process.env.DATABASE_URL",
    "description": "Update database config"
  },
  "session_id": "abc-123",
  "timestamp": "2026-03-12T10:30:00Z"
}
```

### Lo que devuelve el hook (stdout)

Para `PreToolUse` — la única respuesta que importa:

```json
// Permitir la acción
{ "decision": "allow" }

// Bloquear la acción
{ "decision": "block", "reason": "No se pueden escribir archivos en src/config/ sin revisión" }

// Permitir y dar contexto adicional a Claude
{ "decision": "allow", "additionalContext": "Este archivo es crítico, sé conservador" }
```

Para los demás eventos (`PostToolUse`, `Notification`, `Stop`): exit code 0 = éxito, cualquier otro = error.

---

## Los 4 tipos de hooks en detalle

### `PreToolUse` — Guardia de seguridad

Se ejecuta **antes** de cualquier tool call. Es el único tipo que puede bloquear la acción.

```
Claude va a ejecutar: Write("src/config/prod.env", contenido)
           ↓
Hook recibe el evento con tool_name y tool_input
           ↓
Hook decide: ¿es seguro? → allow / block
           ↓
Si allow → Claude escribe el archivo
Si block → Claude recibe el mensaje y no escribe
```

**Casos de uso típicos:**
- Bloquear escritura en archivos críticos (`.env`, `config/prod.*`)
- Validar que los comandos Bash no tienen `rm -rf` o similares
- Pedir confirmación antes de acciones irreversibles

---

### `PostToolUse` — Observador post-acción

Se ejecuta **después** de que la tool completó. No puede deshacer lo que hizo, pero puede reaccionar.

```
Claude escribe archivo → acción completada
           ↓
Hook recibe evento con tool_name, tool_input, y resultado
           ↓
Hook ejecuta acciones secundarias
```

**Casos de uso típicos:**
- Ejecutar linter/formatter automáticamente tras modificar código
- Guardar auditoría de qué archivos fueron tocados
- Sincronizar cambios con un sistema externo

---

### `Notification` — Canal de notificaciones

Se ejecuta cuando Claude genera una notificación para el usuario.

**Casos de uso típicos:**
- Enviar el mensaje a Slack o Teams en lugar de (o además de) la terminal
- Guardar logs estructurados de progreso
- Actualizar un dashboard de estado

---

### `Stop` — Cierre de sesión

Se ejecuta cuando Claude termina su tarea o sesión.

**Casos de uso típicos:**
- Ejecutar la suite de tests como verificación final
- Generar un reporte de todos los cambios realizados
- Notificar que la tarea automatizada completó

---

## Configuración en `settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/validate-file-write.py"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/run-linter.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/session-report.py"
          }
        ]
      }
    ]
  }
}
```

---

## Hooks vs otros mecanismos de control

| | Hooks | Instrucciones (CLAUDE.md) | Permisos (`settings.json`) |
|--|-------|--------------------------|---------------------------|
| **Cómo controla** | Intercepta en tiempo real | Guía el comportamiento de Claude | Lista blanca/negra de tools |
| **Puede bloquear** | Sí (PreToolUse) | No (es una sugerencia) | Sí (herramienta bloqueada siempre) |
| **Tiene contexto** | Sí (recibe los parámetros exactos) | No | No |
| **Puede tomar decisiones** | Sí (lógica en el script) | No | No (todo o nada) |
| **Ideal para** | Validación dinámica, auditoría, integración | Convenciones, comportamiento | Restricciones permanentes simples |

---

## Seguridad

:::warning Los hooks tienen tus permisos de usuario
Los scripts de hooks se ejecutan con los mismos permisos que tu usuario del sistema operativo. Un hook malicioso podría leer archivos sensibles, ejecutar comandos arbitrarios, o enviar datos a internet.

**Solo usa hooks de fuentes que controlas o que hayas escrito tú.**
:::

:::tip Buenas prácticas
- Guarda los hooks en `~/.claude/hooks/` con permisos `700` (solo tú)
- Cada hook hace una sola cosa (un hook de validación, uno de logging, etc.)
- Loguea todas las decisiones para auditoría
- Prueba el script manualmente antes de activarlo en settings.json
:::
