---
sidebar_position: 4
title: "Gemini CLI: Primeros Pasos"
---

# Gemini CLI: Primeros Pasos

Gemini CLI es la herramienta de línea de comandos de Google que integra los modelos Gemini directamente en tu terminal. Ofrece una capa gratuita generosa, lo que lo convierte en una opción accesible para empezar con agentes de IA.

## Prerequisitos

- **Cuenta de Google**: Cualquier cuenta de Google (Gmail) sirve.
- **API Key de Gemini**: Gratuita con límites generosos. Créala en [ai.google.dev](https://ai.google.dev) → "Get API key". El nivel gratuito incluye acceso a Gemini 2.0 Flash sin coste.
- **Node.js 18+**: Verifica con `node --version`.

## Paso 1: Instalar Gemini CLI

```bash
npm install -g @google/generative-ai-cli
```

Verifica la instalación:

```bash
gemini --version
```

:::tip Instalación alternativa con pip
También puedes usar la versión Python si prefieres ese ecosistema:
```bash
pip install google-generativeai
```
:::

## Paso 2: Configurar la API Key

### Opción A: Variable de entorno (recomendado)

```bash
# Linux/macOS
export GEMINI_API_KEY="AIza..."

# Windows PowerShell
$env:GEMINI_API_KEY = "AIza..."
```

Para hacerlo permanente:

```bash
# En ~/.bashrc o ~/.zshrc
echo 'export GEMINI_API_KEY="AIza..."' >> ~/.bashrc
source ~/.bashrc
```

### Opción B: Autenticación interactiva

```bash
gemini auth login
```

Sigue el flujo de OAuth para autenticarte con tu cuenta de Google.

## Paso 3: Primer comando

```bash
# Modo chat interactivo
gemini chat

# Pregunta directa
gemini ask "¿cuál es la diferencia entre async/await y Promises en JavaScript?"

# Analizar un archivo
gemini ask "explica este código" --file src/main.ts
```

## Concepto clave: GEMINI.md

Al igual que Claude Code usa `CLAUDE.md`, Gemini CLI usa `GEMINI.md` como archivo de contexto del proyecto. Se puede colocar en:

- **`~/.gemini/GEMINI.md`**: Instrucciones globales para todos los proyectos.
- **`GEMINI.md` en la raíz del repo**: Instrucciones específicas del proyecto.

Ejemplo de `GEMINI.md`:

```markdown
# Contexto del Proyecto

Este es un proyecto de API REST en Go usando Gin framework.

## Convenciones
- Errores siempre se retornan como segundo valor
- Logging con zerolog
- Tests en archivos `_test.go`
- Documentación en español

## No hacer
- No usar el paquete `log` estándar
- No ignorar errores con `_`
```

## Archivos de configuración

Gemini CLI guarda su configuración en:

- **`~/.gemini/`**: Directorio de configuración global.
- **`~/.gemini/config.json`**: Configuración general (modelo, temperatura, etc.).
- **`~/.gemini/GEMINI.md`**: Instrucciones globales de contexto.

## Seleccionar modelo

Puedes especificar el modelo a usar:

```bash
# Usar Gemini 2.0 Flash (más rápido, gratuito)
gemini chat --model gemini-2.0-flash

# Usar Gemini 1.5 Pro (más capaz, requiere nivel pago)
gemini chat --model gemini-1.5-pro
```

## Modo con archivos de contexto

Gemini CLI puede procesar múltiples archivos:

```bash
# Analizar todo el directorio src
gemini ask "¿hay algún problema de seguridad en este código?" --dir src/

# Combinar archivos específicos
gemini ask "¿cómo se relacionan estos módulos?" --file auth.ts --file users.ts
```

:::tip Ventana de contexto grande
Gemini 1.5 Pro tiene una ventana de contexto de 1 millón de tokens, lo que le permite procesar codebases enteros. Úsalo para análisis de proyectos grandes.
:::

:::warning API Key en repositorios
Nunca incluyas tu `GEMINI_API_KEY` directamente en archivos de código o en `GEMINI.md`. Usa siempre variables de entorno o un gestor de secretos.
:::

## Recursos adicionales

- [Google AI Studio](https://aistudio.google.com) — Interfaz web para experimentar con Gemini
- [Documentación de la API de Gemini](https://ai.google.dev/docs)
- [Ver Instrucciones para Gemini CLI](../instructions/por-herramienta.md)
