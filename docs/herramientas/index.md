---
sidebar_position: 1
title: Comparación de Herramientas
slug: /herramientas
---

# Comparación de Herramientas IA para Programación

Existen cuatro herramientas principales de IA para programación que esta guía cubre. Antes de entrar en agentes, skills o hooks, es fundamental entender qué hace cada una y, sobre todo, entender **la diferencia entre modelo y producto**.

---

## El concepto más importante: Modelo ≠ Producto

:::danger Confusión frecuente
"Estoy usando Claude Sonnet en GitHub Copilot CLI, entonces estoy usando Claude Code."

**Esto es incorrecto.** Son productos completamente distintos.
:::

Un **modelo de IA** (como Claude Sonnet 4, GPT-4o, Gemini 2.5 Pro) es el motor que procesa texto y genera respuestas. Un **producto** (como GitHub Copilot CLI, Claude Code, Cursor) es la aplicación que:

- Define cómo interactúas con el modelo
- Establece dónde se guardan los agentes y configuraciones
- Implementa sus propias funcionalidades (hooks, skills, MCP)
- Tiene su propia CLI, extensiones y ecosistema

### Analogía: Motor vs. Automóvil

Piénsalo así: un motor Toyota puede estar en un Lexus y en un Toyota Corolla. Ambos usan el mismo motor, pero el automóvil en que vas — las palancas, el GPS, las ruedas — es diferente. Si pierdes la llave del Lexus, no la buscas en el cajón del Corolla.

Lo mismo aplica aquí:

```
GitHub Copilot CLI usa Claude Sonnet
    → La config va en ~/.copilot/agents/
    → NO en ~/.claude/

Claude Code también usa Claude Sonnet
    → La config va en ~/.claude/
    → NO en ~/.copilot/
```

### Consecuencias prácticas

| Lo que haces | ¿Afecta a GitHub Copilot? | ¿Afecta a Claude Code? |
|---|---|---|
| Crear `~/.claude/CLAUDE.md` | ❌ No | ✅ Sí |
| Crear `~/.copilot/agents/mi-agente.yaml` | ✅ Sí | ❌ No |
| Crear `.github/copilot-instructions.md` | ✅ Sí | ❌ No |
| Crear `CLAUDE.md` en el repo | ❌ No | ✅ Sí |
| Crear `.cursorrules` | ❌ No | ❌ No | 

*(La última fila solo afecta a Cursor)*

---

## Tabla completa de herramientas

| Producto | Scope | Ubicación agentes/config | Instrucciones repo |
|---|---|---|---|
| 🔵 GitHub Copilot CLI | Usuario | `~/.copilot/agents/` | `.github/copilot-instructions.md`, `AGENTS.md` |
| 🔵 GitHub Copilot VS Code | Usuario | `%APPDATA%\Code\User\globalStorage\github.copilot-chat\` | `.github/copilot-instructions.md` |
| 🟠 Claude Code | Usuario | `~/.claude/` | `CLAUDE.md` |
| 🔴 Gemini CLI | Usuario | `~/.gemini/` | `GEMINI.md` |
| 🟣 Cursor | Repo | `.cursorrules` | `.cursor/rules/` |

---

## Descripción de cada herramienta

### 🔵 GitHub Copilot CLI

**Qué es:** Herramienta de línea de comandos de GitHub que integra IA directamente en tu terminal. Permite hacer preguntas, ejecutar comandos sugeridos, y usar agentes y skills personalizados.

**Modelo por defecto:** Claude Sonnet (configurable)

**Casos de uso ideales:**
- Flujos de trabajo centrados en la terminal
- Repositorios con múltiples colaboradores que comparten instrucciones via `.github/copilot-instructions.md`
- Equipos que ya usan GitHub y quieren integración nativa con PRs, issues, etc.

**Configuración típica:**
```bash
# Ver agentes disponibles
gh copilot agents list

# Usar un agente específico
gh copilot chat --agent=code-reviewer "Revisa este PR"
```

---

### 🟠 Claude Code

**Qué es:** CLI oficial de Anthropic para interactuar con Claude directamente desde la terminal. Incluye un potente sistema de hooks y soporte nativo para MCP servers.

**Modelo:** Claude (Sonnet, Opus, Haiku — configurable)

**Diferenciador clave:** Sistema de **hooks** — scripts que se ejecutan en eventos del ciclo de vida (antes/después de usar herramientas, al completar tareas, etc.).

**Casos de uso ideales:**
- Proyectos que necesitan automatización compleja con hooks
- Equipos que quieren control máximo sobre qué acciones puede tomar la IA
- Integración con herramientas externas via MCP

---

### 🔴 Gemini CLI

**Qué es:** CLI oficial de Google para interactuar con Gemini desde la terminal. Soporte nativo para MCP servers y contexto largo.

**Modelo:** Gemini 2.5 Pro/Flash (configurable)

**Diferenciador clave:** Ventana de contexto extremadamente grande (1M tokens) y capacidades multimodales.

**Casos de uso ideales:**
- Proyectos con bases de código muy grandes
- Necesidad de analizar imágenes o documentos junto con código
- Integración con el ecosistema de Google Cloud

---

### 🟣 Cursor

**Qué es:** Editor de código (fork de VS Code) con IA profundamente integrada. A diferencia de los otros que son CLIs, Cursor es un IDE completo.

**Modelo:** Múltiples (GPT-4o, Claude, Gemini — configurable por usuario)

**Diferenciador clave:** Las reglas (`.cursorrules`, `.cursor/rules/`) son **por repositorio**, no por usuario. Todo el equipo comparte las mismas reglas automáticamente.

**Casos de uso ideales:**
- Proyectos donde toda la configuración debe vivir en el repo
- Equipos que prefieren un IDE completo sobre una CLI
- Workflows visuales de programación con IA

---

## ¿Cuándo usar cada herramienta?

```
¿Necesitas hooks y automatización avanzada?          → Claude Code
¿Trabajas mayormente en terminal con GitHub?         → GitHub Copilot CLI
¿Tienes bases de código enormes o archivos grandes?  → Gemini CLI
¿Prefieres un IDE completo con reglas compartidas?   → Cursor
¿Usas VS Code y quieres integración suave?           → GitHub Copilot VS Code
```

:::info Pueden coexistir
Nada impide usar **múltiples herramientas** según el contexto. Por ejemplo: Cursor para edición diaria + Claude Code para automatización con hooks + GitHub Copilot CLI para revisiones de PR.
:::
