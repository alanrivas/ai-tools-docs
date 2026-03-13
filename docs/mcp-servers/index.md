---
sidebar_position: 1
title: ¿Qué son los MCP Servers?
slug: /mcp-servers
---

# ¿Qué son los MCP Servers?

MCP (Model Context Protocol) es un **protocolo estándar abierto** que permite a la IA comunicarse con sistemas externos: bases de datos, APIs, servicios, el filesystem. Es el "USB" de la IA — un conector estándar que funciona igual sin importar qué herramienta de IA estés usando.

---

## El problema que resuelven

Un modelo de IA por sí solo es ciego a todo lo que no le pasas directamente:

```
Sin MCP:
  Tú   → [ejecutas query en DBeaver]
  Tú   → [copias los resultados]
  Tú   → [pegas en el chat de IA]
  IA   → [analiza lo que pegaste]
  [Lento, propenso a errores, sin contexto completo]

Con MCP:
  Tú   → "analiza los usuarios que se registraron esta semana"
  IA   → [conecta al MCP Server de PostgreSQL]
  IA   → [ejecuta la query directamente]
  IA   → [analiza los resultados en tiempo real]
  [La IA tiene acceso directo, sin intermediarios manuales]
```

---

## Anatomía de un MCP Server

Un MCP Server tiene tres componentes que expone a la IA:

```
┌─────────────────────────────────────────────────────┐
│                  MCP SERVER                         │
│                                                     │
│  1. Tools (herramientas)  ← acciones que puede     │
│                              ejecutar la IA         │
│  2. Resources (recursos)  ← datos que puede leer   │
│  3. Prompts (plantillas)  ← prompts predefinidos   │
└─────────────────────────────────────────────────────┘
```

### 1. Tools — acciones

Funciones que la IA puede **llamar** para realizar operaciones en el sistema externo:

```
MCP Server: PostgreSQL
  Tools:
    query("SELECT * FROM users WHERE created_at > ?")  → resultados
    list_tables()                                       → lista de tablas
    describe_table("orders")                            → esquema
```

### 2. Resources — datos de solo lectura

Información que la IA puede **leer** como contexto, sin ejecutar acciones:

```
MCP Server: Filesystem
  Resources:
    file:///home/user/proyecto/README.md   → contenido del README
    file:///home/user/proyecto/schema.sql  → esquema de la BD
```

### 3. Prompts — plantillas

Prompts predefinidos que el servidor expone para tareas comunes:

```
MCP Server: GitHub
  Prompts:
    summarize_pr(pr_number)   → resume los cambios del PR
    review_code(file_path)    → revisa el código con criterios estándar
```

---

## Arquitectura

La IA actúa como **MCP Client** y se conecta a uno o más MCP Servers:

```
┌─────────────────────────────────────────────────────────┐
│              Claude / Gemini / Copilot                  │
│                    (MCP Client)                         │
└──────────┬──────────────────────────────┬───────────────┘
           │ MCP Protocol                 │ MCP Protocol
           ▼                              ▼
┌──────────────────┐           ┌──────────────────────┐
│  MCP Server:     │           │  MCP Server:         │
│  Filesystem      │           │  PostgreSQL           │
│                  │           │                      │
│  Tools:          │           │  Tools:              │
│  - read_file     │           │  - query             │
│  - write_file    │           │  - list_tables       │
│  - list_dir      │           │  - describe_table    │
└──────────────────┘           └──────────────────────┘
```

Cada servidor es un proceso independiente. La IA habla con todos ellos usando el mismo protocolo estándar.

---

## MCP vs Tools nativas

Es importante distinguir MCP de las [tools nativas de Claude Code](/docs/tools):

| | Tools nativas (Read, Bash, etc.) | MCP Tools |
|--|----------------------------------|-----------|
| **Definidas por** | El producto (Claude Code) | Tú, o la comunidad |
| **Instalación** | Siempre disponibles | Requieren configurar el servidor |
| **Acceso a** | Sistema de archivos local, shell | Sistemas externos (BD, APIs, servicios) |
| **Ejemplos** | `Read`, `Bash`, `Grep` | `query_database`, `send_slack_message` |

Las tools nativas están siempre disponibles. Los MCP tools requieren que configures y levantes el servidor correspondiente.

---

## Soporte por herramienta

| Herramienta | Soporte MCP | Configuración |
|-------------|-------------|---------------|
| Claude Code | ✅ Nativo y completo | `~/.claude/settings.json` |
| Gemini CLI | ✅ Nativo | `~/.gemini/settings.json` |
| GitHub Copilot VS Code | ✅ Via extensiones | VS Code settings |
| Cursor | ✅ Nativo | Cursor settings |
| GitHub Copilot CLI | 🔄 En desarrollo | — |

---

## Servidores disponibles

### Oficiales

| Servidor | Qué expone |
|----------|-----------|
| `@modelcontextprotocol/server-filesystem` | Leer/escribir archivos y directorios |
| `@modelcontextprotocol/server-github` | Repos, PRs, issues, commits |
| `@modelcontextprotocol/server-postgres` | Queries a PostgreSQL |
| `@modelcontextprotocol/server-sqlite` | Base de datos SQLite local |
| `@modelcontextprotocol/server-brave-search` | Búsqueda web con Brave |
| `@modelcontextprotocol/server-slack` | Leer canales, enviar mensajes |
| `@modelcontextprotocol/server-google-drive` | Listar, leer y crear documentos |

### Comunidad
- AWS, Azure, GCP
- Jira, Linear, Notion
- MongoDB, Redis
- Y cientos más en [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

## Configuración en Claude Code

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/usuario/proyectos"   // ← limita el acceso a esta carpeta
      ]
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://usuario:password@localhost:5432/midb"
      ]
    }
  }
}
```

Cada entrada en `mcpServers` levanta un proceso independiente. La IA puede usar sus tools desde cualquier conversación.

---

## MCP vs Hooks

Otra confusión frecuente es entre MCP y Hooks. Son complementarios, no equivalentes:

| | MCP Servers | Hooks |
|--|-------------|-------|
| **Propósito** | Dar acceso a sistemas externos | Interceptar acciones de Claude |
| **Dirección** | Claude → Sistema externo | Evento → Script tuyo |
| **Iniciativa** | Claude decide cuándo usarlo | Se dispara automáticamente |
| **Ejemplo** | Claude consulta la BD de producción | Validar antes de que Claude escriba un archivo |

:::warning Limita siempre el acceso
Un MCP Server de filesystem configurado con `/` tiene acceso a todo tu sistema. Un servidor de PostgreSQL con un usuario admin puede ejecutar `DROP TABLE`. Siempre configura el acceso mínimo necesario:
- Filesystem: apunta solo a la carpeta del proyecto
- Base de datos: usa un usuario de solo lectura si es posible
- APIs: usa tokens con los permisos mínimos requeridos
:::
