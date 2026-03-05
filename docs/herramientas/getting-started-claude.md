---
sidebar_position: 3
title: "Claude Code: Primeros Pasos"
---

# Claude Code: Primeros Pasos

Claude Code es el agente de codificación de Anthropic que se ejecuta directamente en tu terminal. A diferencia de otros CLI, Claude Code tiene acceso completo a tu sistema de archivos y puede leer, modificar y crear archivos de forma autónoma.

## Prerequisitos

Necesitas una de estas opciones de acceso:

- **Claude Pro** ($20/mes): Acceso directo sin necesidad de API key.
- **Claude Max** ($100/mes): Mayor límite de uso.
- **API key de Anthropic**: Para acceso por tokens. Crea una en [console.anthropic.com](https://console.anthropic.com). Los precios aproximados para Claude Sonnet 4.5 son ~$3/MTok de entrada y ~$15/MTok de salida.

## Paso 1: Instalar Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Verifica la instalación:

```bash
claude --version
```

:::warning Node.js requerido
Necesitas Node.js 18 o superior. Verifica con `node --version`. Si no lo tienes, descárgalo desde [nodejs.org](https://nodejs.org).
:::

## Paso 2: Autenticarse

### Opción A: Sesión interactiva (Claude Pro/Max)

Simplemente ejecuta `claude` y sigue las instrucciones para iniciar sesión con tu cuenta de Anthropic:

```bash
claude
```

### Opción B: API Key

Configura tu API key como variable de entorno:

```bash
# Linux/macOS
export ANTHROPIC_API_KEY="sk-ant-..."

# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

Para hacerlo permanente, agrégalo a tu `.bashrc`, `.zshrc`, o perfil de PowerShell.

## Paso 3: Primera sesión

Navega a un proyecto real y ejecuta:

```bash
cd mi-proyecto
claude
```

Claude Code leerá automáticamente los archivos del directorio actual y estará listo para ayudarte. Puedes pedirle que:

```
> explica qué hace este proyecto
> encuentra todos los bugs en src/utils.ts
> escribe tests para la función calculateTotal
> refactoriza el componente Login para usar hooks
```

## Concepto clave: CLAUDE.md

El archivo `CLAUDE.md` es el punto de configuración más importante de Claude Code. Se puede colocar en:

- **`~/.claude/CLAUDE.md`**: Instrucciones globales para todos los proyectos.
- **`CLAUDE.md` en la raíz del repo**: Instrucciones específicas del proyecto.
- **`src/CLAUDE.md`**: Instrucciones específicas de un subdirectorio.

Ejemplo de `CLAUDE.md`:

```markdown
# Convenciones del Proyecto

## Stack
- TypeScript strict mode
- React 18 con hooks
- Testing con Vitest

## Reglas
- Siempre escribe tests para funciones nuevas
- Usa nombres descriptivos en inglés
- No uses `any` en TypeScript
```

## Archivos de configuración

- **`~/.claude/`**: Directorio de configuración global.
- **`~/.claude/settings.json`**: Configuración de Claude Code (modelo, permisos, etc.).
- **`~/.claude/agents/`**: Agentes personalizados (archivos `.md`).
- **`~/.claude/commands/`**: Comandos slash personalizados (archivos `.md`).
- **`~/.claude/hooks/`**: Scripts de hooks por evento.

## Modo interactivo vs no interactivo

### Interactivo (por defecto)

```bash
claude
```

Chat continuo con memoria de contexto durante la sesión.

### No interactivo (para scripts)

```bash
claude -p "añade JSDoc a todas las funciones en src/utils.ts" --no-interactive
```

Ideal para integrarlo en pipelines de CI/CD o scripts de automatización.

:::tip Usa CLAUDE.md para ahorrar tokens
En lugar de explicar el contexto del proyecto en cada sesión, escríbelo una vez en `CLAUDE.md`. Claude lo leerá automáticamente y no necesitarás repetirte.
:::

:::warning Permisos de herramientas
Por defecto, Claude Code pedirá confirmación antes de ejecutar comandos o modificar archivos. Puedes configurar permisos automáticos en `settings.json`, pero hazlo con cuidado: Claude tiene acceso real a tu sistema.
:::

## Recursos adicionales

- [Documentación oficial de Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Ver Hooks para Claude Code](../hooks/por-herramienta.md)
- [Ver Agentes para Claude Code](../agentes/por-herramienta.md)
