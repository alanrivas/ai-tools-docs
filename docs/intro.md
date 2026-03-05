---
sidebar_position: 1
title: Introducción
---

# Agentes y Herramientas IA — Guía Práctica

Bienvenido a la guía más completa sobre cómo trabajar con herramientas de IA para programación: **GitHub Copilot CLI**, **Claude Code**, **Gemini CLI** y **Cursor**.

Esta documentación no solo te explica qué son los agentes, skills, hooks y MCP servers — te explica *por qué existen*, *qué problema resuelven*, y *cómo eran las cosas antes* de que existieran.

---

## ¿Por qué existe esta guía?

Hay una confusión muy común en el mundo de la IA para programación: **confundir el modelo con el producto**.

:::warning Concepto clave: Modelo ≠ Producto
GitHub Copilot CLI puede usar **Claude Sonnet** como modelo de IA por debajo, pero eso **no lo convierte en "Claude Code"**. Son productos distintos con ecosistemas distintos. Los agentes que creas para GitHub Copilot van en `~/.copilot/agents/`, no en `~/.claude/` — aunque el modelo sea Claude.

**La ubicación de archivos de configuración siempre sigue al PRODUCTO, no al modelo.**
:::

Esta distinción importa porque:
- Cada producto tiene su propio sistema de agentes, instrucciones y configuración.
- Mezclar conceptos lleva a configuraciones rotas o que no tienen efecto.
- Las mejores prácticas de un producto no se transfieren automáticamente al otro.

---

## ¿Qué cubre esta guía?

| Sección | Qué aprenderás |
|---|---|
| [Herramientas](/docs/herramientas) | Comparación detallada de los 4 productos, cuándo usar cada uno |
| [Agentes](/docs/agentes) | Qué son, cómo crearlos, ejemplos prácticos por herramienta |
| [Skills](/docs/skills) | Capacidades reutilizables, cómo definirlas e invocarlas |
| [Instructions](/docs/instructions) | Archivos de instrucciones por herramienta, ejemplos reales |
| [Hooks](/docs/hooks) | Automatización con eventos del ciclo de vida (Claude Code) |
| [MCP Servers](/docs/mcp-servers) | Protocolo estándar para conectar IA con herramientas externas |

---

## Las 4 herramientas en un vistazo

```
GitHub Copilot CLI  →  ~/.copilot/agents/            (instrucciones: .github/copilot-instructions.md)
Claude Code         →  ~/.claude/                     (instrucciones: CLAUDE.md)
Gemini CLI          →  ~/.gemini/                     (instrucciones: GEMINI.md)
Cursor              →  .cursor/rules/ (por repo)      (instrucciones: .cursorrules)
```

---

## Por dónde empezar

Si eres nuevo en estas herramientas, empieza por:

1. **[Comparación de Herramientas](/docs/herramientas)** — entiende qué hace cada producto
2. **[¿Qué son los Agentes?](/docs/agentes)** — el concepto más transformador
3. **[Instructions y Prompts](/docs/instructions)** — la forma más rápida de ganar productividad

:::tip Consejo
Si ya usas una herramienta específica, ve directamente a su página de herramienta y luego a los ejemplos prácticos de cada sección.
:::

---

## Filosofía de esta guía

Cada página sigue la misma estructura:

1. **¿Qué es?** — definición clara
2. **¿Qué problema resuelve?** — la motivación real
3. **¿Cómo se hacía antes?** — para valorar el avance
4. **Cómo funciona** — la mecánica técnica
5. **Ejemplos prácticos** — código real, comentado

No encontrarás texto de relleno ni ejemplos de "Hello World" sin contexto. Todo aquí está orientado a un flujo de trabajo real de desarrollo de software.
