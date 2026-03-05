---
sidebar_position: 1
title: ¿Qué son los Hooks?
slug: /hooks
---

# ¿Qué son los Hooks?

Los hooks son **scripts que se ejecutan automáticamente en eventos del ciclo de vida** de la herramienta de IA. Son la forma más poderosa de automatizar comportamiento, añadir capas de seguridad, y conectar la IA con sistemas externos.

:::info Disponibilidad
Los hooks son una característica **exclusiva de Claude Code** en este momento. Otras herramientas como GitHub Copilot y Cursor no tienen un sistema de hooks equivalente. Gemini CLI tiene soporte limitado via extensiones.
:::

---

## Definición

Un **hook** es un script externo que:

1. Se ejecuta en un **evento específico** del ciclo de trabajo de la IA
2. Recibe **contexto** del evento (qué herramienta se va a usar, con qué parámetros)
3. Puede **permitir, modificar o bloquear** la acción
4. Puede **ejecutar acciones secundarias** (notificaciones, logging, etc.)

---

## ¿Qué problema resuelven los hooks?

### El problema: la IA opera como una caja negra

Sin hooks:
- La IA puede escribir archivos sin que nadie lo sepa
- No hay forma de interceptar acciones potencialmente peligrosas
- No puedes integrar automáticamente con sistemas externos (Slack, Jira, logs)
- Las auditorías de qué hizo la IA requieren revisar el historial manualmente

Con hooks:
- Cada acción puede ser validada antes de ejecutarse
- Las acciones peligrosas se pueden bloquear automáticamente
- Puedes notificar a Slack cuando la IA completa una tarea importante
- Tienes un log completo y automático de todas las acciones

---

## ¿Cómo se hacía antes de los hooks?

Antes de hooks:

1. **Revisión manual**: mirar el historial de conversación y verificar qué cambios hizo la IA
2. **Scripts post-proceso**: ejecutar manualmente scripts de validación después de usar la IA
3. **CI/CD**: confiar en que el pipeline detectaría problemas (pero solo después del commit)
4. **Ningún control**: simplemente confiar en que la IA no hará nada peligroso

Ninguna de estas opciones es una intercepción en tiempo real.

---

## Los 4 tipos de hooks en Claude Code

### 1. `PreToolUse` — Antes de usar una herramienta

Se ejecuta **antes** de que Claude use cualquier herramienta. Puede:
- Permitir la acción (`decision: "allow"`)
- Bloquear la acción con mensaje (`decision: "block"`)

**Casos de uso:**
- Validar antes de escribir archivos críticos
- Pedir confirmación para acciones destructivas
- Verificar permisos antes de ejecutar comandos

---

### 2. `PostToolUse` — Después de usar una herramienta

Se ejecuta **después** de que Claude usa una herramienta.

**Casos de uso:**
- Ejecutar linter automáticamente tras modificar código
- Guardar auditoría de qué archivos fueron modificados
- Sincronizar cambios con sistemas externos

---

### 3. `Notification` — Cuando Claude genera una notificación

Se ejecuta cuando Claude quiere notificar algo al usuario.

**Casos de uso:**
- Enviar notificaciones a Slack/Teams
- Guardar logs de progreso
- Actualizar dashboards de estado

---

### 4. `Stop` — Cuando Claude termina

Se ejecuta cuando Claude termina su sesión o tarea.

**Casos de uso:**
- Ejecutar tests de verificación
- Generar reporte de cambios
- Notificar que la tarea está completa

---

## Cómo funcionan técnicamente

Claude Code ejecuta los hooks como **procesos externos**. La comunicación es via stdin/stdout en formato JSON:

```
Claude Code → [JSON con contexto del evento] → stdin del script
              ← stdout del script [JSON con decisión]
```

### Input que recibe el hook (stdin)

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "src/config/database.ts",
    "content": "const dbUrl = 'postgres://...'",
    "description": "Update database configuration"
  },
  "session_id": "abc-123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Output que debe devolver el hook (stdout)

Para `PreToolUse`:
```json
// Permitir
{ "decision": "allow" }

// Bloquear
{ "decision": "block", "reason": "Motivo del bloqueo" }

// Permitir con contexto adicional
{ "decision": "allow", "additionalContext": "Información extra para Claude" }
```

Para `PostToolUse` y otros: simplemente exit code 0 (éxito) o no-0 (error).

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

### El campo `matcher`

El `matcher` es una expresión regular que se compara con el nombre de la herramienta:

```json
"matcher": "Write"         // Solo la herramienta Write
"matcher": "Write|Edit"    // Write o Edit
"matcher": "Bash"          // Solo Bash
"matcher": ".*"            // Cualquier herramienta
"matcher": "^(Write|Edit|Bash)$"  // Solo esas tres exactamente
```

---

## Seguridad de los hooks

:::warning Los hooks tienen permisos de tu usuario
Los scripts de hooks se ejecutan con los mismos permisos que tu usuario del sistema operativo. Un hook malicioso podría:
- Leer archivos sensibles
- Ejecutar comandos arbitrarios
- Enviar datos a internet

Solo usa hooks de fuentes confiables o que hayas escrito tú mismo.
:::

:::tip Buenas prácticas
- Guarda los hooks en `~/.claude/hooks/` y asegúrate de que solo tú tienes permisos de escritura (`chmod 700`)
- Loguea todas las decisiones del hook para auditoría
- Prueba los hooks manualmente antes de activarlos
- Mantén los hooks simples — un hook hace una cosa
:::
