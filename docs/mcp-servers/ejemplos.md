---
sidebar_position: 2
title: Ejemplos Prácticos de MCP Servers
---

# Ejemplos Prácticos de MCP Servers

Configuraciones reales de MCP para los casos de uso más comunes.

---

## Configuración base en Claude Code

Toda la configuración de MCP en Claude Code va en `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "nombre-del-servidor": {
      "command": "comando-a-ejecutar",
      "args": ["argumento1", "argumento2"],
      "env": {
        "VARIABLE": "valor"
      }
    }
  }
}
```

---

## Ejemplo 1: MCP Server de Filesystem

El MCP de filesystem permite a Claude leer y escribir archivos en directorios específicos — con control granular de qué directorios puede acceder.

### Instalación y configuración

```bash
# No requiere instalación global — npx lo descarga automáticamente
```

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/usuario/proyectos",
        "/home/usuario/documentos"
      ]
    }
  }
}
```

:::tip Control de acceso
Puedes pasar **múltiples directorios** al servidor de filesystem. Claude solo tendrá acceso a esos directorios específicos, no a todo el sistema de archivos.
:::

### Herramientas que expone

Tras configurarlo, Claude tendrá acceso a:

- `read_file` — leer el contenido de un archivo
- `write_file` — crear o sobreescribir un archivo
- `edit_file` — editar partes específicas de un archivo
- `list_directory` — listar el contenido de un directorio
- `create_directory` — crear directorios
- `move_file` — mover o renombrar archivos
- `search_files` — buscar archivos por nombre o contenido

### Uso en conversación

```
Claude: Voy a analizar tu proyecto...
[Lee múltiples archivos automáticamente via MCP]

Tú: "Refactoriza todos los servicios para usar el nuevo patrón de repositorio"

Claude: Voy a proceder:
[Lee src/services/ via MCP filesystem]
[Analiza los patrones actuales]
[Escribe los archivos refactorizados via MCP filesystem]
[Ejecuta los tests para verificar]
```

---

## Ejemplo 2: MCP Server de PostgreSQL

Permite a Claude consultar y analizar tu base de datos directamente.

### Configuración

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "postgres-dev": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://dev_user:dev_password@localhost:5432/myapp_dev"
      ]
    }
  }
}
```

:::warning Usa solo bases de datos de desarrollo
**Nunca apuntes el MCP a tu base de datos de producción.** Usa una réplica de lectura o la base de datos de desarrollo. Un error podría resultar en pérdida de datos.
:::

### Con múltiples bases de datos

```json
{
  "mcpServers": {
    "postgres-dev": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://...dev"],
    },
    "postgres-staging": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://...staging"],
    }
  }
}
```

### Herramientas disponibles

- `query` — ejecutar queries SQL (SELECT, INSERT, UPDATE, DELETE)
- `list_tables` — listar todas las tablas del schema
- `describe_table` — ver la estructura de una tabla
- `list_schemas` — listar schemas disponibles

### Caso de uso: análisis de datos

```
Tú: "¿Cuáles son los 10 usuarios con más pedidos en los últimos 30 días?"

Claude: Voy a consultar la base de datos...
[Ejecuta via MCP postgres]:
SELECT u.email, COUNT(o.id) as total_orders
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email
ORDER BY total_orders DESC
LIMIT 10;

[Devuelve resultados y análisis]
```

---

## Ejemplo 3: MCP Server de GitHub

Permite a Claude interactuar con tu repositorio de GitHub: crear issues, revisar PRs, buscar código.

### Configuración

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_tu_token_aqui"
      }
    }
  }
}
```

:::tip Token con permisos mínimos
Crea un Personal Access Token con solo los permisos que necesites:
- `repo` para repos privados
- `public_repo` para solo repos públicos
- `issues` si solo necesitas gestionar issues
:::

### Herramientas disponibles

- `get_file_contents` — leer archivos del repo
- `search_repositories` — buscar repos
- `search_code` — buscar en el código
- `create_issue` — crear issues
- `create_pull_request` — crear PRs
- `list_pull_requests` — listar PRs
- `get_pull_request` — detalles de un PR
- `add_issue_comment` — comentar en issues/PRs

### Caso de uso: crear issues desde bugs

```
Tú: "Encontré un bug: el endpoint /api/users no valida el campo email"

Claude: Voy a crear un issue en GitHub...
[Crea issue via MCP GitHub con título, descripción, labels]

✅ Issue #247 creado: "Bug: /api/users no valida campo email"
   URL: https://github.com/miorg/mirepo/issues/247
```

---

## Ejemplo 4: Configuración completa en Gemini CLI

```json
// ~/.gemini/settings.json
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
        "postgresql://user:pass@localhost/dev_db"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}
```

---

## Ejemplo 5: MCP Server personalizado

Puedes crear tu propio MCP Server para exponer datos de tu empresa.

```typescript
// mcp-server-jira/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'jira-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Definir herramientas disponibles
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'get_ticket',
      description: 'Obtiene los detalles de un ticket de Jira',
      inputSchema: {
        type: 'object',
        properties: {
          ticket_id: { type: 'string', description: 'ID del ticket (ej: PROJ-123)' }
        },
        required: ['ticket_id']
      }
    },
    {
      name: 'create_ticket',
      description: 'Crea un nuevo ticket en Jira',
      inputSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          description: { type: 'string' },
          issue_type: { type: 'string', enum: ['Bug', 'Story', 'Task'] }
        },
        required: ['summary', 'issue_type']
      }
    }
  ]
}));

// Implementar las herramientas
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'get_ticket') {
    // Llamar a la API de Jira
    const ticket = await fetchJiraTicket(args.ticket_id);
    return { content: [{ type: 'text', text: JSON.stringify(ticket) }] };
  }
  
  if (name === 'create_ticket') {
    const result = await createJiraTicket(args);
    return { content: [{ type: 'text', text: `Ticket creado: ${result.key}` }] };
  }
  
  throw new Error(`Herramienta desconocida: ${name}`);
});

// Iniciar el servidor
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Configurar el servidor personalizado

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/path/to/mcp-server-jira/index.js"],
      "env": {
        "JIRA_URL": "https://miempresa.atlassian.net",
        "JIRA_EMAIL": "usuario@empresa.com",
        "JIRA_API_TOKEN": "tu-api-token"
      }
    }
  }
}
```

---

## Verificar que los MCP Servers están activos

```bash
# En Claude Code, verificar servidores activos
claude mcp list

# Ver logs de un servidor específico
claude mcp logs filesystem

# Reiniciar un servidor
claude mcp restart postgres
```

:::tip Depuración
Si un MCP Server no responde, verifica:
1. Que el comando está instalado: `npx @modelcontextprotocol/server-filesystem --version`
2. Los permisos de red (firewalls para servidores de base de datos)
3. Las variables de entorno están definidas
4. Los logs del servidor: `~/.claude/mcp-logs/`
:::
