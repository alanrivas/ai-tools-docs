---
sidebar_position: 1
title: Glosario
slug: /glosario
---

# Glosario

Referencia alfabética de todos los términos utilizados en esta documentación.

---

## A

### Agente (Agent)

Un **agente** es un programa de IA configurado para realizar tareas específicas de forma autónoma, utilizando un conjunto de herramientas (tools) y siguiendo instrucciones predefinidas. A diferencia de un chatbot simple, un agente puede ejecutar múltiples pasos, leer archivos, ejecutar comandos y tomar decisiones para completar objetivos complejos.

**Productos que lo usan**: GitHub Copilot CLI (`.yml` en `~/.copilot/agents/`), Claude Code (`.md` en `~/.claude/agents/`), Cursor (como "Background Agents").

### Agent Loop

El **agent loop** (bucle del agente) es el ciclo de razonamiento y acción que sigue un agente de IA: analiza la situación, decide qué herramienta usar, la ejecuta, observa el resultado, y repite hasta completar la tarea o alcanzar un límite. Este patrón es la base del funcionamiento de todos los agentes de IA modernos.

**Relacionado con**: ReAct, Tool call.

---

## C

### CLI (Command Line Interface)

Interfaz de línea de comandos. En el contexto de esta documentación, se refiere a las herramientas de IA que se usan desde la terminal: GitHub Copilot CLI (`gh copilot`), Claude Code (`claude`), Gemini CLI (`gemini`).

**Nota**: No confundir el CLI con el modelo de IA que usa internamente.

### Contexto (Context Window)

La **ventana de contexto** es la cantidad máxima de texto (tokens) que el modelo de IA puede procesar en una sola interacción. Incluye el historial de la conversación, instrucciones del sistema, contenido de archivos leídos y la consulta actual. Cuando se supera el límite, el modelo olvida la información más antigua.

**Relevancia**: Instrucciones muy largas o archivos de código extensos pueden consumir gran parte del contexto disponible.

### Custom Slash Command

Los **comandos slash personalizados** en Claude Code son scripts en formato Markdown almacenados en `~/.claude/commands/` que se pueden invocar con `/user:nombre-comando`. Funcionan como atajos reutilizables para tareas frecuentes.

**Producto**: Claude Code exclusivamente.

---

## H

### Hook

Un **hook** es un mecanismo que permite ejecutar código automáticamente cuando ocurre un evento específico en el ciclo de vida del agente. Por ejemplo, ejecutar un script de validación antes de que el agente escriba un archivo (`PreToolUse`) o registrar en un log después de cada cambio (`PostToolUse`).

**Producto con hooks nativos**: Solo Claude Code tiene un sistema de hooks completo. Ver [Hooks por Herramienta](../hooks/por-herramienta.md).

---

## I

### Instrucción (Instruction)

Texto de sistema que se inyecta automáticamente en cada conversación del agente, definiendo su comportamiento, restricciones y convenciones. Las instrucciones persisten entre sesiones y no necesitan repetirse en cada mensaje.

| Producto | Archivo de instrucciones |
|---|---|
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/*.mdc` |

---

## M

### MCP (Model Context Protocol)

Protocolo abierto desarrollado por Anthropic que estandariza cómo los agentes de IA se conectan a herramientas y fuentes de datos externas. Un servidor MCP expone capacidades (leer archivos, llamar APIs, consultar bases de datos) que el agente puede invocar durante su agent loop.

**Relacionado con**: MCP Client, MCP Server.

### MCP Client

El **cliente MCP** es la parte del agente que sabe cómo conectarse y comunicarse con servidores MCP. Es el componente dentro del producto de IA (Copilot CLI, Claude Code, etc.) que gestiona las conexiones con los servidores externos.

### MCP Server

Un **servidor MCP** es un proceso externo que expone herramientas al agente via el protocolo MCP. Ejemplos: `@modelcontextprotocol/server-github` (accede a la API de GitHub), `@modelcontextprotocol/server-filesystem` (accede al sistema de archivos), `@modelcontextprotocol/server-postgres` (consulta bases de datos PostgreSQL).

**Configuración**: Se define en archivos JSON de configuración específicos de cada producto.

### Modelo (Model)

El **modelo** es el motor de inteligencia artificial que procesa el texto y genera respuestas. Ejemplos: Claude Sonnet 4.5, GPT-4o, Gemini 1.5 Pro. El modelo es diferente del **producto** — GitHub Copilot CLI puede usar Claude Sonnet como modelo, pero sigue siendo GitHub Copilot CLI, no Claude Code. Ver también: [Producto](#producto).

---

## P

### PostToolUse

Evento de hook en Claude Code que se dispara **después** de que el agente ejecuta una herramienta. Útil para logging, notificaciones, o validaciones post-ejecución. No puede cancelar la operación (ya ocurrió).

**Producto**: Claude Code exclusivamente.

### PreToolUse

Evento de hook en Claude Code que se dispara **antes** de que el agente ejecute una herramienta. Puede retornar `{"decision": "block"}` para cancelar la operación o `{"decision": "allow"}` para permitirla. Es el mecanismo principal para implementar guardrails de seguridad.

**Producto**: Claude Code exclusivamente.

### Producto

El **producto** es la aplicación o herramienta que el usuario instala y utiliza directamente. GitHub Copilot CLI, Claude Code, Gemini CLI y Cursor son productos diferentes, aunque algunos compartan el mismo modelo de IA subyacente. El producto determina: rutas de archivos de configuración, comandos disponibles, características (hooks, MCP, agentes), y comportamientos específicos.

**No confundir con**: [Modelo](#modelo-model).

### Prompt

Texto enviado al modelo de IA para obtener una respuesta. En el contexto de agentes, el prompt incluye el system prompt (instrucciones), el historial de conversación, y la consulta del usuario. Los "prompts de sistema" son invisibles al usuario pero guían el comportamiento del agente.

---

## R

### ReAct (Reasoning + Acting)

Patrón de diseño para agentes de IA que combina **razonamiento** (el agente piensa sobre qué hacer) con **actuación** (el agente ejecuta herramientas). El agente alterna entre pasos de "Thought" (qué planeo hacer), "Action" (qué herramienta uso), y "Observation" (qué resultó). Es la base del agent loop en la mayoría de implementaciones modernas.

**Relacionado con**: Agent loop, Tool call.

---

## S

### Scope

El **scope** determina dónde aplica una configuración. Los scopes principales son:

- **Usuario** (`~/`): Aplica a todos los proyectos del usuario en la máquina
- **Repositorio** (`.github/`, `.claude/`): Aplica solo al proyecto actual
- **Workspace** (en algunos editores): Aplica al espacio de trabajo actual

Las configuraciones de scope más específico generalmente tienen prioridad sobre las más generales.

### Skill

Una **skill** o habilidad reutilizable es una capacidad especializada que puede ser invocada por un agente. La implementación varía por producto: agent YAML con `tools:` en Copilot, comandos slash en Claude Code, reglas `.mdc` en Cursor. Ver [Skills por Herramienta](../skills/por-herramienta.md).

### System Prompt

El **system prompt** es el texto de instrucciones que se envía al modelo antes de la conversación del usuario, invisible para el usuario final. Define la personalidad, capacidades y restricciones del agente. Los archivos de instrucciones (`CLAUDE.md`, `copilot-instructions.md`) se inyectan como parte del system prompt.

---

## T

### Tool Call

Una **llamada a herramienta** ocurre cuando el agente de IA decide usar una de sus herramientas disponibles (leer un archivo, ejecutar un comando, llamar una API) en lugar de responder solo con texto. Los tool calls son los "pasos de acción" dentro del agent loop.

**Relacionado con**: Agent loop, ReAct, PreToolUse, PostToolUse.

---

## Tabla Resumen de Términos por Producto

| Término | GitHub Copilot CLI | Claude Code | Gemini CLI | Cursor |
|---|---|---|---|---|
| Agente | Agent YAML `.yml` | Agent `.md` | — | Background Agent |
| Instrucciones | `copilot-instructions.md` | `CLAUDE.md` | `GEMINI.md` | `.cursorrules` |
| Skills | Agent `tools:` | Slash commands | Context files | `.cursor/rules/` |
| Hooks | ❌ No nativo | ✅ Completo | ❌ No nativo | ❌ No nativo |
| MCP | ✅ Soportado | ✅ Nativo | ✅ Soportado | ✅ Soportado |
| Comando base | `gh copilot` | `claude` | `gemini` | IDE |

---

## D

### Directive

Una **directiva** es una instrucción específica dentro de un archivo de configuración que modifica el comportamiento del agente para una situación concreta. Las directivas suelen tener un formato especial (como prefijos `@` o bloques YAML) y son procesadas antes que las instrucciones generales.

### Docker (contexto MCP)

En el contexto de MCP Servers, **Docker** se usa frecuentemente para aislar y ejecutar servidores MCP en contenedores. Esto mejora la seguridad (el servidor no tiene acceso directo al sistema host) y facilita la distribución. La configuración del cliente MCP apunta al contenedor en lugar de a un proceso local.

---

## E

### Extensión

Una **extensión** es un componente adicional que añade funcionalidades a una herramienta base. En GitHub CLI, las extensiones (como `github/gh-copilot`) se instalan con `gh extension install`. Son distintas a los plugins de editores como VS Code o Cursor.

### Event (hook event)

Un **evento de hook** es el momento específico en el ciclo de vida del agente que dispara la ejecución de un hook. Los eventos principales en Claude Code son: `PreToolUse`, `PostToolUse`, `Stop`, y `Notification`. Cada evento recibe un payload JSON diferente con contexto de la operación.

---

## F

### Función (tool function)

Una **función de herramienta** (tool function) es la implementación concreta de una capacidad que el agente puede invocar. Tiene un nombre, una descripción (que el modelo usa para decidir cuándo usarla), y un schema de parámetros. El agente nunca ejecuta código directamente; siempre llama a funciones predefinidas.

---

## G

### Global scope

El **scope global** se refiere a las configuraciones que aplican a todos los proyectos del usuario en una máquina. Los archivos en `~/` (directorio home) tienen scope global. Ejemplos: `~/.claude/CLAUDE.md`, `~/.copilot/agents/`, `~/.gemini/config.json`.

### Git hooks (vs AI hooks)

Los **git hooks** son scripts que Git ejecuta en eventos del ciclo de vida de un repositorio (pre-commit, post-merge, etc.). Son completamente diferentes a los **AI hooks** de Claude Code, que se ejecutan en el ciclo de vida del agente. Ambos pueden coexistir en el mismo proyecto sin interferencia.

---

## H

### Hook

Un **hook** en el contexto de agentes de IA es un script externo que se ejecuta automáticamente cuando el agente realiza ciertas acciones. Permite implementar validaciones, logging, notificaciones o guardrails de seguridad sin modificar el agente en sí. **Solo Claude Code** tiene un sistema de hooks nativo completo. Ver [Hooks](../hooks/index.md).

### Handler

Un **handler** es la función o script que maneja (procesa) un evento específico. En el contexto de hooks, el handler recibe el payload del evento, ejecuta la lógica necesaria, y retorna una respuesta al agente (por ejemplo, `allow` o `block`).

---

## I

### Instrucción de sistema (system instruction)

La **instrucción de sistema** es el texto que se envía al modelo como parte del "system prompt", antes de cualquier mensaje del usuario. Define el comportamiento base del agente. Los archivos `CLAUDE.md`, `copilot-instructions.md` y `GEMINI.md` se incluyen en la instrucción de sistema de sus respectivos productos.

### Input schema (MCP)

El **input schema** de un MCP tool define la estructura y tipos de los parámetros que acepta esa herramienta, siguiendo el formato JSON Schema. El modelo usa el schema para generar llamadas válidas a la herramienta. Un schema bien definido reduce errores y mejora la capacidad del modelo para usar la herramienta correctamente.

---

## M

### Modelo (AI model)

Ver [Modelo](#modelo-model) en la sección M original.

### MCP Client

Ver [MCP Client](#mcp-client) en la sección M original.

### MCP Server

Ver [MCP Server](#mcp-server) en la sección M original.

### Modo agente

El **modo agente** es el modo de operación en el que la IA puede ejecutar múltiples pasos de forma autónoma, usando herramientas para completar una tarea compleja. Se diferencia del modo chat simple en que el agente no solo responde, sino que actúa: lee archivos, ejecuta comandos, crea y modifica código. Requiere configuración adicional de permisos en la mayoría de herramientas.

---

## P

### PreToolUse

Ver [PreToolUse](#pretooluse) en la sección P original.

### PostToolUse

Ver [PostToolUse](#posttooluse) en la sección P original.

### Prompt

Ver [Prompt](#prompt) en la sección P original.

### Plugin

Un **plugin** es un componente que extiende la funcionalidad de una aplicación a través de una interfaz definida. En Docusaurus, los plugins añaden funcionalidades al sitio (búsqueda, i18n, etc.). En el contexto de IDEs como VS Code o Cursor, los plugins/extensiones añaden soporte para lenguajes, linters y herramientas de IA.

---

## R

### Rate limit

El **límite de tasa** (rate limit) es el número máximo de peticiones que se pueden hacer a una API en un período de tiempo determinado. Los rate limits se expresan típicamente como RPM (requests per minute) o TPM (tokens per minute). Superarlos devuelve un error HTTP 429. Los planes de pago suelen tener rate limits más altos.

### Repo scope

El **scope de repositorio** aplica la configuración solo al proyecto actual. Los archivos con repo scope se colocan en el directorio del proyecto (`.github/copilot-instructions.md`, `CLAUDE.md` en la raíz, `.cursor/rules/`). Tienen prioridad sobre el scope global cuando ambos están definidos.

### ReAct (Reasoning + Acting)

Ver [ReAct](#react-reasoning--acting) en la sección R original. El patrón ReAct es la base de cómo funcionan los agentes modernos: ciclos alternos de razonamiento interno ("qué debo hacer") y acción externa ("ejecuto esta herramienta"), observando los resultados para planificar el siguiente paso.

### Respuesta estructurada

Una **respuesta estructurada** es cuando se instruye al modelo para que devuelva su respuesta en un formato específico (JSON, XML, YAML) en lugar de texto libre. Los MCP servers frecuentemente usan respuestas estructuradas para que sus herramientas devuelvan datos que el agente puede procesar programáticamente.

---

## S

### Subagent

Un **subagente** es un agente que es invocado por otro agente (el agente principal o "orchestrator") para realizar una subtarea específica. El agente principal delega trabajo a subagentes especializados y combina sus resultados. Este patrón permite construir sistemas complejos con agentes simples y cohesivos.

### Sampling

El **sampling** en modelos de lenguaje se refiere al proceso de seleccionar el siguiente token durante la generación de texto. Los parámetros de sampling (temperatura, top-p, top-k) controlan la aleatoriedad de las respuestas. Una temperatura de 0 da respuestas deterministas; temperaturas más altas dan respuestas más creativas (y menos predecibles).

### Scope

Ver [Scope](#scope) en la sección S original.

### Skill

Ver [Skill](#skill) en la sección S original.

### Stop hook

Un **stop hook** es un tipo de hook que se ejecuta cuando el agente termina su tarea o sesión. Es útil para tareas de limpieza, generación de reportes de fin de sesión, o notificaciones de completitud. En Claude Code, el evento `Stop` dispara los stop hooks configurados.

### System prompt

Ver [System Prompt](#system-prompt) en la sección S original.

---

## T

### Token

Un **token** es la unidad básica de texto que procesa un modelo de lenguaje. Aproximadamente, 1 token ≈ 4 caracteres en inglés ≈ 3 caracteres en español. Una página de texto es aproximadamente 500-750 tokens. Los costos de las APIs de IA se facturan por tokens procesados (tanto de entrada como de salida).

### Tool approval

La **aprobación de herramientas** (tool approval) es el mecanismo por el cual el usuario debe confirmar explícitamente antes de que el agente ejecute ciertas herramientas consideradas de alto riesgo. Claude Code solicita aprobación por defecto para operaciones que modifican archivos o ejecutan comandos. Se puede configurar para aprobación automática de herramientas de confianza.

### Tool call

Ver [Tool Call](#tool-call) en la sección T original.

### Transport (MCP)

El **transport** en MCP define el mecanismo de comunicación entre el cliente MCP y el servidor MCP. Los transports estándar son: **stdio** (comunicación por entrada/salida estándar, para procesos locales) y **HTTP+SSE** (para servidores remotos). La mayoría de servidores MCP locales usan stdio por simplicidad.

---

## U

### User scope

El **scope de usuario** (user scope) aplica la configuración a todos los proyectos del usuario en esa máquina, pero no afecta a otros usuarios. Los archivos en el directorio home (`~/`) tienen user scope. Es el nivel intermedio entre el scope global del sistema y el scope específico de repositorio.

