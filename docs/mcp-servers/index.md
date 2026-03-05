---
sidebar_position: 1
title: ¿Qué son los MCP Servers?
slug: /mcp-servers
---

# ¿Qué son los MCP Servers?

MCP (Model Context Protocol) es un **protocolo estándar abierto** que permite a las herramientas de IA comunicarse con fuentes de datos y herramientas externas de manera uniforme. Es el "USB" de la IA: un conector estándar que funciona con cualquier herramienta y cualquier fuente de datos.

---

## Definición

Un **MCP Server** es un proceso independiente que:

1. Expone **herramientas** (tools) que la IA puede usar
2. Expone **recursos** (resources) que la IA puede leer
3. Usa el **protocolo MCP estándar** para comunicarse
4. Puede conectarse a cualquier sistema: bases de datos, APIs, filesystem, etc.

La IA actúa como **MCP Client** y se conecta a los servidores MCP para obtener capacidades adicionales.

---

## ¿Qué problema resuelven los MCP Servers?

### El problema: los modelos de IA son "ciegos" por defecto

Un modelo de IA por sí solo solo puede:
- Procesar el texto que le envías
- Usar las herramientas básicas que el producto le da (leer archivos, ejecutar comandos)

Un modelo de IA **no puede por defecto**:
- Consultar tu base de datos en tiempo real
- Leer emails de tu inbox
- Interactuar con APIs de terceros
- Acceder a sistemas internos de tu empresa
- Leer documentación que no está en su contexto

Con MCP Servers, la IA puede hacer todo esto.

---

## ¿Cómo se hacía antes de MCP?

Antes de MCP (y en herramientas que no lo soportan):

**Opción 1: Copy-paste manual**
```
Tú:  [Ejecutas query en DBeaver]
Tú:  [Copias los resultados]
Tú:  [Los pegas en el chat de IA]
IA:  [Analiza los datos pegados]
```
Lento, propenso a errores, sin contexto completo.

**Opción 2: Integraciones custom por vendor**
Cada herramienta de IA tenía sus propias integraciones propietarias:
- GitHub Copilot tenía acceso a GitHub pero no a otras fuentes
- ChatGPT tenía plugins pero con su propio formato
- Incompatibles entre sí

**Opción 3: Ningún acceso externo**
La IA simplemente no tenía acceso a datos externos. Trabajo manual total.

---

## Arquitectura de MCP

```
┌─────────────────────────────────────────────────────────┐
│                   Claude / Gemini / Copilot             │
│                      (MCP Client)                       │
└───────────┬─────────────────────────────┬───────────────┘
            │ MCP Protocol                │ MCP Protocol
            ▼                             ▼
┌───────────────────┐          ┌─────────────────────┐
│   MCP Server:     │          │   MCP Server:        │
│   Filesystem      │          │   PostgreSQL         │
│                   │          │                      │
│ Tools:            │          │ Tools:               │
│ - read_file       │          │ - query              │
│ - write_file      │          │ - list_tables        │
│ - list_directory  │          │ - describe_table     │
│                   │          │                      │
│ Resources:        │          │ Resources:           │
│ - file://...      │          │ - db://schema        │
└───────────────────┘          └─────────────────────┘
```

---

## Soporte MCP por herramienta

| Herramienta | Soporte MCP | Configuración |
|---|---|---|
| Claude Code | ✅ Nativo y completo | `~/.claude/settings.json` |
| Gemini CLI | ✅ Nativo | `~/.gemini/settings.json` |
| GitHub Copilot VS Code | ✅ Via extensiones | VS Code settings |
| Cursor | ✅ Nativo | Cursor settings |
| GitHub Copilot CLI | 🔄 En desarrollo | — |

---

## Tipos de MCP Servers disponibles

### Oficiales (Anthropic/comunidad)

| Servidor | Qué hace |
|---|---|
| `@modelcontextprotocol/server-filesystem` | Acceso a archivos y directorios |
| `@modelcontextprotocol/server-github` | API de GitHub (repos, PRs, issues) |
| `@modelcontextprotocol/server-postgres` | Queries a PostgreSQL |
| `@modelcontextprotocol/server-sqlite` | Base de datos SQLite local |
| `@modelcontextprotocol/server-brave-search` | Búsqueda web con Brave |
| `@modelcontextprotocol/server-slack` | Leer canales, enviar mensajes |
| `@modelcontextprotocol/server-google-drive` | Acceso a Google Drive |

### Comunidad
- Servidores para AWS, Azure, GCP
- Integraciones con Jira, Linear, Notion
- Acceso a bases de datos NoSQL (MongoDB, Redis)
- Y cientos más en [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

## Conceptos clave de MCP

### Tools (Herramientas)
Funciones que la IA puede **llamar** para realizar acciones:
- `read_file("/path/to/file")` → devuelve contenido del archivo
- `query_database("SELECT * FROM users LIMIT 10")` → devuelve resultados

### Resources (Recursos)
Datos que la IA puede **leer** como contexto:
- `file:///home/usuario/proyecto/README.md` → contenido del README
- `db://mydb/schema` → esquema de la base de datos

### Prompts (Plantillas)
Plantillas de prompts predefinidas que el servidor expone:
- `analyze_codebase` → prompt para analizar el código con el contexto del servidor

---

## Configuración básica en Claude Code

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/usuario/proyectos"
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

:::warning Seguridad en MCP
Los MCP Servers tienen acceso a los sistemas que configures. Un servidor de filesystem configurado con `/` tiene acceso a todo tu sistema. **Siempre limita el acceso al mínimo necesario**.
:::
