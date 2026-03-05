---
sidebar_position: 1
title: Solución de Problemas
slug: /troubleshooting
---

# Solución de Problemas

Esta sección cubre los problemas más comunes al trabajar con agentes de IA, organizados por categoría. Si algo no funciona como esperas, es muy probable que encuentres la respuesta aquí.

---

## Agente aparece en la lista pero no responde o no se puede invocar

Este es uno de los problemas más frecuentes y frustrantes. El agente aparece en el autocompletado o en la lista de agentes disponibles, pero al invocarlo no pasa nada, responde de forma genérica, o da un error.

### Causas Comunes

**1. Archivo en la ubicación incorrecta**

Cada producto tiene rutas específicas para sus agentes. Si el archivo está en la carpeta equivocada, el agente puede "verse" pero no ejecutarse correctamente.

| Producto | Ruta correcta (usuario) | Ruta correcta (repo) |
|---|---|---|
| GitHub Copilot CLI | `~/.copilot/agents/` | `.github/copilot/agents/` |
| Claude Code | `~/.claude/agents/` | `.claude/agents/` |
| Cursor | `~/.cursor/rules/` | `.cursor/rules/` |

**2. Campos requeridos faltantes en el YAML**

Un agente de GitHub Copilot CLI necesita al menos `name`, `description` y `instructions`:

```yaml
# INCORRECTO — falta description
name: mi-agente
instructions: |
  Haz algo...
```

```yaml
# CORRECTO
name: mi-agente
description: Descripción clara de lo que hace este agente
instructions: |
  Haz algo...
```

**3. Mismatch de scope (usuario vs repositorio)**

Si defines el agente a nivel de repositorio (`.github/copilot/agents/`) pero trabajas en un directorio diferente, el agente no estará disponible. Verifica que estás en el directorio correcto o mueve el agente al scope de usuario.

:::warning El problema más común: Confundir el producto con el modelo
Ver la sección "Confundo el modelo con el producto" más abajo. Este error causa exactamente este síntoma: el agente existe pero no funciona.
:::

### Diagnóstico Paso a Paso

```bash
# 1. ¿Qué CLI estás ejecutando realmente?
which gh      # GitHub Copilot CLI
which claude  # Claude Code
which gemini  # Gemini CLI

# 2. Verifica la ubicación del archivo del agente
ls ~/.copilot/agents/          # Para Copilot CLI
ls ~/.claude/agents/           # Para Claude Code

# 3. Valida la sintaxis del YAML (para Copilot)
cat ~/.copilot/agents/mi-agente.yml

# 4. Comprueba permisos
ls -la ~/.copilot/agents/mi-agente.yml
```

### Checklist de Solución

- [ ] El archivo está en la ruta correcta para el producto que uso
- [ ] El YAML tiene los campos `name`, `description` e `instructions`
- [ ] El nombre del archivo coincide con el `name` en el YAML
- [ ] Estoy usando el CLI correcto (no confundo Claude CLI con Copilot CLI)
- [ ] El agente fue creado para este producto específico, no para otro

---

## MCP Server no conecta

Los servidores MCP (Model Context Protocol) son procesos externos que el agente debe poder alcanzar. Si no conectan, el agente no tendrá acceso a las herramientas que proveen.

### Causas y Soluciones

**Archivo de configuración en ubicación incorrecta**

```bash
# Claude Code busca en:
~/.claude/claude_desktop_config.json   # Configuración global
.claude/mcp.json                       # Configuración del proyecto

# GitHub Copilot busca en:
~/.copilot/mcp.json                    # Configuración global
.github/copilot/mcp.json              # Configuración del repositorio
```

**Conflicto de puertos**

```bash
# Verificar si el puerto ya está en uso
netstat -tlnp | grep 3000   # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Cambiar el puerto en la configuración MCP
```

**Variables de entorno faltantes**

```json
// mcp.json — INCORRECTO (falta API key)
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

```json
// mcp.json — CORRECTO
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Cómo probar la conexión MCP**

```bash
# Prueba manual del servidor MCP
npx -y @modelcontextprotocol/server-github --help

# Verificar que el servidor responde
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  npx -y @modelcontextprotocol/server-github
```

:::tip
Habilita el modo verbose o de debug en tu cliente MCP para ver exactamente qué error ocurre al intentar conectar.
:::

---

## Instructions no se aplican

Las instrucciones existen pero el agente no las sigue o actúa como si no existieran.

### Causas Comunes

**Nombre o ruta de archivo incorrectos**

Este es el error más común. El nombre exacto importa:

```bash
# Para GitHub Copilot — el archivo DEBE estar aquí:
.github/copilot-instructions.md    # ✅ CORRECTO
copilot-instructions.md             # ❌ INCORRECTO — no se leerá
.copilot-instructions.md            # ❌ INCORRECTO
.github/instructions.md             # ❌ INCORRECTO
```

**Scope override: instrucciones de repo sobreescribiendo globales**

Si tienes instrucciones tanto globales como de repositorio, las del repositorio pueden tener prioridad. Verifica el orden de precedencia de cada herramienta.

**Instrucciones demasiado largas o contradictorias**

Los modelos de IA tienen límites de contexto. Si el archivo de instrucciones es muy largo o contiene reglas contradictorias, algunas serán ignoradas.

```markdown
<!-- Mala práctica: instrucciones contradictorias -->
Siempre usa tabs para la indentación.
...más adelante en el archivo...
Usa 2 espacios para la indentación.
```

:::warning
Mantén tus archivos de instrucciones concisos y sin contradicciones. Idealmente menos de 500 palabras para instrucciones globales.
:::

---

## Hook no se ejecuta

Aplica principalmente a Claude Code, que es la herramienta con hooks nativos.

### Causas y Soluciones

**Error de sintaxis en `settings.json`**

```bash
# Valida el JSON antes de guardarlo
cat ~/.claude/settings.json | python3 -m json.tool
# O con Node.js:
node -e "JSON.parse(require('fs').readFileSync(process.env.HOME+'/.claude/settings.json','utf8'))"
```

**Script no ejecutable (Unix/Mac)**

```bash
# El script del hook debe tener permisos de ejecución
chmod +x ~/.claude/hooks/mi-hook.sh

# Verificar permisos
ls -la ~/.claude/hooks/
```

**Nombre del evento incorrecto (sensible a mayúsculas)**

```json
// INCORRECTO — nombre del evento con mayúsculas incorrectas
"pretooluse": [...]
"pre_tool_use": [...]

// CORRECTO — formato exacto requerido
"PreToolUse": [...]
"PostToolUse": [...]
"Notification": [...]
"Stop": [...]
```

:::danger
Los nombres de eventos en Claude Code son **case-sensitive**. `PreToolUse` ≠ `pretooluse`. Este error silencioso hace que el hook simplemente no se registre.
:::

---

## Confundo el modelo con el producto

Esta confusión es muy común y es la causa raíz de muchos problemas inexplicables.

### La Diferencia Clave

**GitHub Copilot CLI** usa **Claude Sonnet** (u otros modelos) como su motor de IA. Pero eso no lo convierte en Claude Code. Son **productos diferentes** de **empresas diferentes** con **rutas de archivos diferentes**.

```
GitHub Copilot CLI  →  Producto de GitHub (Microsoft)
                    →  Comando: gh copilot
                    →  Agentes en: ~/.copilot/agents/
                    →  Usa el modelo: Claude Sonnet / GPT-4o (según config)

Claude Code         →  Producto de Anthropic
                    →  Comando: claude
                    →  Agentes en: ~/.claude/agents/
                    →  Usa el modelo: Claude Sonnet / Opus
```

Aunque ambos usen el mismo modelo de IA por debajo, los archivos de configuración, las rutas, los comandos y los comportamientos son completamente distintos.

### Test Rápido: ¿Qué producto estoy usando?

Hazte esta pregunta: **¿Qué comando usas para iniciarlo?**

- `gh copilot suggest` o `gh copilot explain` → Estás usando **GitHub Copilot CLI**
- `claude` → Estás usando **Claude Code**
- `gemini` → Estás usando **Gemini CLI**
- Abres un IDE y hablas con un panel de chat → Probablemente **Cursor** o **Copilot en VS Code**

:::tip Regla de Oro
El nombre del **producto** determina:
- Dónde van los archivos de configuración
- Qué comandos usar
- Dónde crear los agentes
- Si los hooks están disponibles

El nombre del **modelo** (Claude, GPT-4, Gemini) solo describe el motor de IA interno. No cambia ninguna de las cosas anteriores.
:::

### Ejemplo del Error

Defines un agente en `~/.claude/agents/revisor.yml` pero lo intentas invocar desde GitHub Copilot CLI con `@revisor`. No funciona porque Copilot CLI busca agentes en `~/.copilot/agents/`, no en `~/.claude/agents/`.

**Solución**: Crea el archivo correcto en la ruta correcta para el producto que estás usando.
