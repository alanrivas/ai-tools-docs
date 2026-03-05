---
sidebar_position: 2
title: Ejemplos Prácticos de Hooks
---

# Ejemplos Prácticos de Hooks

Hooks reales y listos para usar en Claude Code. Todos incluyen manejo de errores y logging.

---

## Setup inicial

```bash
# Crear directorio de hooks
mkdir -p ~/.claude/hooks
chmod 700 ~/.claude/hooks

# Crear archivo de configuración si no existe
touch ~/.claude/settings.json
```

---

## Hook 1: Protección de Archivos Críticos

Este hook bloquea cualquier escritura a archivos que contienen configuración sensible o de producción.

```python
#!/usr/bin/env python3
# ~/.claude/hooks/protect-critical-files.py
"""
Hook PreToolUse: Bloquea escrituras a archivos críticos.
"""

import sys
import json
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(
    filename=Path.home() / '.claude' / 'hooks.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

# Archivos y patrones protegidos
PROTECTED_PATTERNS = [
    '.env',
    '.env.production',
    '.env.prod',
    'secrets.json',
    'credentials.json',
    'config/production.json',
    'config/prod.json',
    'prisma/migrations/',  # No modificar migraciones existentes
]

def is_protected(file_path: str) -> bool:
    """Verifica si un archivo está protegido."""
    for pattern in PROTECTED_PATTERNS:
        if pattern in file_path:
            return True
    return False

def main():
    try:
        # Leer el contexto del evento desde stdin
        data = json.load(sys.stdin)
        tool_name = data.get('tool_name', '')
        tool_input = data.get('tool_input', {})
        
        # Solo procesamos herramientas de escritura
        if tool_name not in ('Write', 'Edit', 'MultiEdit'):
            print(json.dumps({'decision': 'allow'}))
            return
        
        file_path = tool_input.get('file_path', '')
        
        if is_protected(file_path):
            logging.warning(f"BLOQUEADO: intento de escritura en {file_path}")
            
            result = {
                'decision': 'block',
                'reason': (
                    f'El archivo "{file_path}" está protegido. '
                    f'Si necesitas modificarlo, hazlo manualmente. '
                    f'Para archivos .env, usa variables de entorno del sistema.'
                )
            }
            print(json.dumps(result))
        else:
            logging.info(f"PERMITIDO: escritura en {file_path}")
            print(json.dumps({'decision': 'allow'}))
            
    except Exception as e:
        logging.error(f"Error en hook: {e}")
        # En caso de error, permitir la acción (fail open)
        # Cambia a 'block' si prefieres fail closed
        print(json.dumps({'decision': 'allow'}))

if __name__ == '__main__':
    main()
```

```bash
chmod +x ~/.claude/hooks/protect-critical-files.py
```

---

## Hook 2: Linter Automático Post-Escritura

Ejecuta el linter automáticamente después de cada edición de código.

```bash
#!/bin/bash
# ~/.claude/hooks/run-linter.sh
# Hook PostToolUse: Ejecuta linter después de modificar código

set -euo pipefail

LOG_FILE="$HOME/.claude/hooks.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Leer el input de stdin (JSON con contexto)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('file_path', ''))" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
    log "No se encontró file_path en el input"
    exit 0
fi

# Determinar el tipo de archivo y ejecutar el linter apropiado
case "$FILE_PATH" in
    *.ts|*.tsx)
        log "Ejecutando ESLint para: $FILE_PATH"
        if command -v npx &> /dev/null; then
            cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
            npx eslint "$FILE_PATH" --fix --quiet 2>> "$LOG_FILE" || {
                log "ADVERTENCIA: ESLint reportó problemas en $FILE_PATH"
            }
        fi
        ;;
    *.py)
        log "Ejecutando ruff para: $FILE_PATH"
        if command -v ruff &> /dev/null; then
            ruff check "$FILE_PATH" --fix --quiet 2>> "$LOG_FILE" || {
                log "ADVERTENCIA: ruff reportó problemas en $FILE_PATH"
            }
        fi
        ;;
    *.go)
        log "Ejecutando gofmt para: $FILE_PATH"
        if command -v gofmt &> /dev/null; then
            gofmt -w "$FILE_PATH" 2>> "$LOG_FILE"
        fi
        ;;
    *)
        log "Sin linter configurado para: $FILE_PATH"
        ;;
esac

exit 0
```

```bash
chmod +x ~/.claude/hooks/run-linter.sh
```

---

## Hook 3: Notificaciones a Slack

Envía una notificación a Slack cuando Claude completa una tarea significativa.

```python
#!/usr/bin/env python3
# ~/.claude/hooks/notify-slack.py
"""
Hook Stop: Envía resumen de la sesión a Slack.
Requiere: SLACK_WEBHOOK_URL en variables de entorno.
"""

import sys
import json
import os
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL', '')

def send_slack_message(message: str, color: str = '#36a64f') -> bool:
    """Envía un mensaje a Slack via webhook."""
    if not SLACK_WEBHOOK_URL:
        return False
    
    payload = {
        'attachments': [
            {
                'color': color,
                'text': message,
                'footer': 'Claude Code Hook',
                'ts': int(datetime.now().timestamp()),
            }
        ]
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            SLACK_WEBHOOK_URL,
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status == 200
    except urllib.error.URLError:
        return False

def main():
    try:
        data = json.load(sys.stdin)
        
        # Extraer información de la sesión
        session_id = data.get('session_id', 'desconocido')
        stop_reason = data.get('stop_reason', 'completado')
        
        # Construir mensaje
        timestamp = datetime.now().strftime('%H:%M:%S')
        message = (
            f"*🤖 Claude Code — Sesión Completada*\n"
            f"• Hora: {timestamp}\n"
            f"• Sesión: `{session_id[:8]}...`\n"
            f"• Estado: {stop_reason}"
        )
        
        send_slack_message(message)
        
    except Exception:
        pass  # Los hooks de notificación no deben interrumpir el flujo

if __name__ == '__main__':
    main()
```

---

## Hook 4: Validación de Comandos Bash

Bloquea comandos potencialmente peligrosos antes de que se ejecuten.

```python
#!/usr/bin/env python3
# ~/.claude/hooks/validate-bash.py
"""
Hook PreToolUse: Valida comandos Bash antes de ejecutarlos.
"""

import sys
import json
import re
import logging
from pathlib import Path

logging.basicConfig(
    filename=Path.home() / '.claude' / 'hooks.log',
    level=logging.INFO,
    format='%(asctime)s [BASH] %(message)s'
)

# Patrones de comandos SIEMPRE bloqueados
ALWAYS_BLOCK = [
    r'rm\s+-rf\s+/',          # rm -rf /
    r'rm\s+-rf\s+~',          # rm -rf ~
    r':\s*\(\s*\)\s*\{',      # fork bomb
    r'>\s*/dev/sd',            # sobrescribir disco
    r'mkfs\.',                 # formatear partición
    r'dd\s+.*of=/dev/sd',     # dd a disco
]

# Patrones que requieren atención especial (pero no bloquean)
WARN_PATTERNS = [
    r'rm\s+-rf',               # rm -rf (de archivos)
    r'git\s+push\s+.*--force', # force push
    r'DROP\s+TABLE',           # queries destructivas SQL
    r'DELETE\s+FROM\s+\w+\s*;', # DELETE sin WHERE
]

def check_command(command: str) -> tuple[bool, str]:
    """
    Retorna (should_block, reason).
    """
    # Verificar patrones siempre bloqueados
    for pattern in ALWAYS_BLOCK:
        if re.search(pattern, command, re.IGNORECASE):
            return True, f"Comando potencialmente destructivo detectado: `{pattern}`"
    
    return False, ""

def main():
    try:
        data = json.load(sys.stdin)
        tool_name = data.get('tool_name', '')
        
        if tool_name != 'Bash':
            print(json.dumps({'decision': 'allow'}))
            return
        
        command = data.get('tool_input', {}).get('command', '')
        
        should_block, reason = check_command(command)
        
        if should_block:
            logging.warning(f"BLOQUEADO: '{command}' — {reason}")
            print(json.dumps({
                'decision': 'block',
                'reason': f'Comando bloqueado por seguridad: {reason}'
            }))
        else:
            # Advertencia en log para comandos que merecen atención
            for pattern in WARN_PATTERNS:
                if re.search(pattern, command, re.IGNORECASE):
                    logging.warning(f"ADVERTENCIA: comando sensible detectado: '{command}'")
                    break
            
            logging.info(f"PERMITIDO: '{command}'")
            print(json.dumps({'decision': 'allow'}))
            
    except Exception as e:
        logging.error(f"Error: {e}")
        print(json.dumps({'decision': 'allow'}))

if __name__ == '__main__':
    main()
```

---

## Configuración completa de todos los hooks

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/protect-critical-files.py"
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
        "matcher": "Write|Edit|MultiEdit",
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
            "command": "python3 ~/.claude/hooks/notify-slack.py"
          }
        ]
      }
    ]
  }
}
```

:::tip Testing de hooks
Antes de activar un hook en producción, pruébalo manualmente:
```bash
echo '{"tool_name": "Write", "tool_input": {"file_path": ".env"}}' | python3 ~/.claude/hooks/protect-critical-files.py
# Debería devolver: {"decision": "block", "reason": "..."}
```
:::
