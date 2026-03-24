---
sidebar_position: 4
title: Gemini CLI
---

# Gemini CLI

Gemini CLI es la herramienta de línea de comandos oficial de Google para interactuar con Gemini directamente desde la terminal. Su ventaja principal es la **ventana de contexto masiva** (hasta 1 millón de tokens) y las capacidades multimodales nativas.

---

## ¿Qué es Gemini CLI?

Gemini CLI (`gemini`) es el producto CLI de Google que permite usar los modelos Gemini (2.5 Pro, Flash, etc.) en la terminal. Al igual que Claude Code, es un agente autónomo capaz de leer archivos, ejecutar comandos y completar tareas complejas.

:::info Producto vs. Modelo
Gemini CLI usa modelos de la familia **Gemini** de Google. No confundir con usar Gemini como modelo en otro producto (por ejemplo, Cursor puede usar Gemini como modelo, pero sigue siendo Cursor). Si usas `gemini` en la terminal, estás usando **Gemini CLI**, y su configuración va en `~/.gemini/`.
:::

---

## Scopes y Ubicación de Archivos

### Configuración Global (usuario)

```
~/.gemini/
├── GEMINI.md          # Instrucciones globales
├── settings.json      # Configuración (modelo, API key, permisos)
└── extensions/        # Extensiones/herramientas personalizadas
```

### Configuración de Repositorio

```
mi-proyecto/
└── GEMINI.md          # Instrucciones específicas del proyecto
```

:::tip Referencia visual
Para ver la estructura completa de carpetas de Gemini CLI y cómo se compara con otras herramientas, consulta la [guía de estructura de carpetas](./estructura-carpetas.md#-gemini-cli).
:::

---

## GEMINI.md — Instrucciones para Gemini CLI

`GEMINI.md` funciona igual que `CLAUDE.md` para Claude Code o `.github/copilot-instructions.md` para GitHub Copilot. Se puede tener uno global y uno por proyecto.

### Ejemplo de GEMINI.md

```markdown
# Gemini CLI — Contexto del Proyecto

## Proyecto
Sistema de análisis de datos construido con Python 3.12, FastAPI y BigQuery.
Usa pandas, polars y matplotlib para procesamiento de datos.

## Estructura del proyecto
```
src/
├── api/          # Endpoints FastAPI
├── models/       # Modelos Pydantic
├── services/     # Lógica de negocio
├── data/         # Procesamiento de datos
└── tests/        # Tests con pytest
```

## Convenciones Python
- Usa type hints en TODAS las funciones
- Docstrings en formato Google (Args, Returns, Raises)
- Tests en pytest, no unittest
- Manejo de errores con excepciones personalizadas en `src/exceptions.py`

## Integración con BigQuery
- Las queries van en `src/data/queries/` como archivos `.sql`
- Usa el cliente BigQuery desde `src/data/bigquery_client.py`
- Siempre usa parámetros en queries, nunca f-strings (prevención de inyección)

## Contexto del equipo
- Somos un equipo de 4 personas
- Revisión de código requerida para merges a main
- Deploy automático via Cloud Build
```

---

## Ventana de Contexto Masiva

La ventaja más diferenciadora de Gemini CLI es su capacidad de contexto:

| Modelo | Tokens de contexto | Equivalencia aproximada |
|---|---|---|
| Gemini 2.5 Pro | 1,000,000 tokens | ~750,000 palabras / base de código grande completa |
| Gemini 2.5 Flash | 1,000,000 tokens | Mismo, más rápido y económico |
| Claude Sonnet 4 | 200,000 tokens | ~150,000 palabras |
| GPT-4o | 128,000 tokens | ~96,000 palabras |

:::tip Cuándo importa el contexto masivo
Si tu proyecto tiene 500+ archivos y quieres que la IA entienda toda la base de código sin truncar, Gemini CLI es la opción más adecuada. Puedes cargar archivos completos de logs, bases de datos de embeddings o documentación extensa.
:::

---

## Capacidades Multimodales

Gemini CLI puede procesar no solo texto sino también:

```bash
# Analizar una imagen junto con código
gemini "¿Qué hay en esta imagen y cómo debería representarlo en código?" --image=screenshot.png

# Analizar un PDF de documentación
gemini "Resume los puntos clave de esta especificación" --file=spec.pdf

# Procesar múltiples archivos
gemini "Analiza estos logs y encuentra patrones de error" --file=app.log --file=error.log
```

---

## Configuración básica

```json
// ~/.gemini/settings.json
{
  "model": "gemini-2.5-pro",
  "theme": "dark",
  "sandbox": false,
  "coreTools": [
    "ReadFileTool",
    "WriteFileTool",
    "ShellTool",
    "SearchFilesTool"
  ],
  "excludeTools": ["BrowserTool"]
}
```

---

## Soporte MCP en Gemini CLI

Gemini CLI tiene soporte nativo para MCP servers, lo que permite conectarlo con bases de datos, APIs externas y otras herramientas:

```json
// ~/.gemini/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/usuario/proyectos"]
    },
    "bigquery": {
      "command": "python",
      "args": ["-m", "mcp_bigquery_server"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "mi-proyecto-gcp"
      }
    }
  }
}
```

---

## Comandos básicos

```bash
# Instalar Gemini CLI
npm install -g @google/gemini-cli

# O con npx (sin instalar)
npx @google/gemini-cli

# Sesión interactiva
gemini

# Tarea específica
gemini "Optimiza las queries de BigQuery en src/data/queries/"

# Con modelo específico
gemini --model gemini-2.5-flash "Genera tests para todos los endpoints de la API"

# Ver configuración
gemini config list
```

---

## Cuándo usar Gemini CLI vs. otros

```
✅ Usa Gemini CLI cuando:
  - Tu base de código es muy grande (> 100k tokens)
  - Necesitas procesar imágenes, PDFs o archivos multimedia
  - Trabajas con Google Cloud (BigQuery, Cloud Storage, etc.)
  - Quieres el modelo más actualizado de Google

❌ No es la mejor opción cuando:
  - Necesitas hooks avanzados del ciclo de vida (usa Claude Code)
  - Tu equipo usa GitHub principalmente (usa GitHub Copilot)
  - Prefieres un IDE completo (usa Cursor)
```
