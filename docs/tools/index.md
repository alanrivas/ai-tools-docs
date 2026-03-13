---
sidebar_position: 1
title: Tools (Herramientas Nativas)
slug: /tools
---

# Tools — Las Herramientas Nativas de Claude Code

Las **tools** son las capacidades primitivas que Claude Code tiene disponibles de forma nativa. Son las acciones concretas que Claude puede ejecutar: leer un archivo, editar código, correr un comando, buscar en el proyecto.

Son el nivel más bajo de la jerarquía: los skills y agentes están construidos _sobre_ ellas.

```
Tools       ← capacidades primitivas del sistema
  ↑
Skills      ← lógica de dominio construida sobre tools
  ↑
Agents      ← subprocesos que usan tools y skills
```

---

## Por qué importa conocerlas

Cuando escribes un agente o skill, declaras explícitamente qué tools puede usar. Si no la declaras, no la puede usar. Conocer las tools disponibles te permite:

- Diseñar agentes con acceso mínimo necesario (principio de menor privilegio)
- Entender por qué un agente puede o no puede hacer algo
- Elegir la tool correcta para cada tarea (no todas hacen lo mismo aunque parezcan similares)

---

## Sistema de archivos

### `Read` — Leer archivos

Lee el contenido completo de un archivo. Devuelve el texto tal como está en disco.

```
Read("src/services/auth.ts")
→ devuelve el contenido del archivo
```

**Cuándo usarla:** para inspeccionar código existente, leer configuraciones, revisar datos.

**No confundir con `Bash`:** podrías usar `cat archivo.ts` en Bash, pero `Read` es más limpia — no requiere shell, no tiene riesgos de interpolación, y el resultado está formateado para Claude.

---

### `Write` — Crear o sobreescribir archivos

Escribe contenido completo en un archivo. Si el archivo ya existe, **lo sobreescribe por completo**.

```
Write("static/CNAME", "mi-proyecto.alanrivas.me")
→ crea el archivo con ese contenido
```

**Cuándo usarla:** para crear archivos nuevos o cuando necesitas reemplazar todo el contenido.

**No confundir con `Edit`:** si solo necesitas cambiar una parte del archivo, usa `Edit`. `Write` descarta todo lo que había antes.

---

### `Edit` — Modificar texto específico dentro de un archivo

Reemplaza una cadena de texto exacta dentro de un archivo por otra. Más seguro y preciso que `Write` cuando el archivo ya existe.

```
Edit(
  file: "docusaurus.config.ts",
  old_string: "url: 'https://your-docusaurus-site.example.com'",
  new_string: "url: 'https://mi-proyecto.alanrivas.me'"
)
→ solo cambia esa línea, el resto queda intacto
```

**Cuándo usarla:** para modificar código existente. Preserva todo lo que no cambias.

**La diferencia con `Write`:**

| | `Edit` | `Write` |
|--|--------|---------|
| Archivo existente | Modifica solo la parte indicada | Sobreescribe todo |
| Archivo nuevo | No funciona | Lo crea |
| Riesgo | Bajo — solo cambia lo especificado | Alto — borra todo |
| Uso típico | Actualizar una config, corregir un bug | Crear nuevo archivo |

---

### `Glob` — Buscar archivos por patrón

Encuentra archivos en el proyecto usando patrones glob (`*`, `**`, `?`).

```
Glob("**/*.ts")          → todos los archivos TypeScript
Glob("src/components/**/*.tsx")  → componentes React
Glob("*.config.*")       → archivos de configuración
```

**Cuándo usarla:** cuando necesitas encontrar archivos por nombre o extensión.

**No confundir con `Grep`:** `Glob` busca _nombres de archivos_, `Grep` busca _contenido dentro de archivos_.

---

### `Grep` — Buscar contenido dentro de archivos

Busca texto o expresiones regulares dentro del contenido de los archivos del proyecto.

```
Grep("useState", "**/*.tsx")    → archivos que usan useState
Grep("TODO|FIXME", "src/")      → todos los pendientes
Grep("class AuthService")       → dónde está definido AuthService
```

**Cuándo usarla:** para encontrar dónde se usa una función, variable, patrón o cualquier texto.

**La diferencia con `Glob`:**

| | `Glob` | `Grep` |
|--|--------|--------|
| Busca en | nombres de archivos | contenido de archivos |
| Pregunta que responde | "¿dónde están los archivos .ts?" | "¿dónde se usa esta función?" |
| Resultado | lista de rutas | líneas que coinciden |

---

## Ejecución

### `Bash` — Ejecutar comandos de terminal

Ejecuta cualquier comando de shell. Es la tool más potente y la más peligrosa.

```
Bash("npm ci")
Bash("git init && git add . && git commit -m 'feat: initial'")
Bash("gh repo create alanrivas/mi-repo --public")
Bash("nslookup mi-proyecto.alanrivas.me")
```

**Cuándo usarla:** para todo lo que no puede hacerse con las otras tools — git, npm, gh CLI, curl, comandos del sistema.

**Por qué no usarla para todo:** las otras tools (Read, Edit, Glob, Grep) son más seguras, más predecibles, y no requieren shell. Úsalas primero; recurre a Bash cuando no hay alternativa.

:::warning Bash tiene acceso completo al sistema
Un agente con acceso a `Bash` puede ejecutar cualquier comando con tus permisos de usuario. Al declarar tools en un agente, otórgale `Bash` solo si realmente lo necesita.
:::

---

## Coordinación y razonamiento

### `Agent` — Lanzar un subagente

Lanza una instancia nueva y aislada de Claude con su propio contexto y herramientas. El subagente trabaja de forma autónoma y devuelve un único resultado.

```
Agent(
  type: "static-site-deployer",
  prompt: "Deploy this project: org=alanrivas, repo=mi-repo, domain=mi-repo.alanrivas.me"
)
→ el agente ejecuta 30+ tool calls de forma autónoma
→ devuelve tabla de estado ✅/⚠️/❌
```

**Cuándo usarla:** cuando una subtarea requiere muchas acciones concretas que contaminarían la conversación principal, o cuando puede ejecutarse en paralelo con otras cosas.

**La diferencia con ejecutar todo en el skill:** si el skill hace 30 tool calls directamente, el usuario ve 30 tool calls en la conversación. Si delega a un Agent, ve solo el resultado final.

---

### `TodoWrite` — Gestionar lista de tareas

Escribe y actualiza una lista de tareas estructurada para la sesión actual. Permite planificar pasos y marcarlos como completados.

```
TodoWrite([
  { task: "Actualizar docusaurus.config.ts", status: "pending" },
  { task: "Crear static/CNAME", status: "pending" },
  { task: "Crear workflow de GitHub Actions", status: "pending" },
])
```

**Cuándo usarla:** en tareas largas con múltiples pasos donde es útil trackear el progreso y no perder el hilo. Especialmente en agents que ejecutan procesos complejos.

---

## Información externa

### `WebFetch` — Obtener una página web

Descarga el contenido de una URL específica.

```
WebFetch("https://docusaurus.io/docs/deployment")
→ devuelve el contenido de la página
```

**Cuándo usarla:** para leer documentación oficial, APIs REST, o cualquier página cuya URL se conoce.

---

### `WebSearch` — Buscar en internet

Realiza una búsqueda en internet y devuelve resultados relevantes.

```
WebSearch("docusaurus github pages deployment custom domain 2024")
→ devuelve lista de resultados con título, URL y snippet
```

**Cuándo usarla:** cuando no se conoce la URL exacta o se necesita investigar un error, librería, o concepto.

**La diferencia con `WebFetch`:**

| | `WebSearch` | `WebFetch` |
|--|-------------|------------|
| Cuándo usarla | No sabes la URL | Sabes la URL exacta |
| Resultado | Lista de resultados | Contenido completo de la página |
| Ejemplo | "busca cómo configurar CNAME en Cloudflare" | "lee https://docs.cloudflare.com/..." |

---

## Tabla resumen

| Tool | Categoría | Qué hace | Cuándo NO usarla |
|------|-----------|----------|------------------|
| **Read** | Archivos | Lee contenido de un archivo | Si necesitas ejecutar el archivo |
| **Write** | Archivos | Crea o sobreescribe archivo completo | Si el archivo ya existe y solo cambias una parte → usa Edit |
| **Edit** | Archivos | Reemplaza texto específico en un archivo | Si el archivo no existe aún → usa Write |
| **Glob** | Archivos | Encuentra archivos por nombre/patrón | Si necesitas buscar dentro del contenido → usa Grep |
| **Grep** | Archivos | Busca texto/regex dentro de archivos | Si necesitas encontrar el archivo por nombre → usa Glob |
| **Bash** | Ejecución | Ejecuta cualquier comando shell | Si hay una tool dedicada para esa tarea (Read, Edit, etc.) |
| **Agent** | Coordinación | Lanza subproceso Claude autónomo | Si la tarea es simple y no genera muchas tool calls |
| **TodoWrite** | Coordinación | Gestiona lista de tareas de la sesión | En tareas cortas de 1-2 pasos |
| **WebFetch** | Externa | Descarga una URL específica | Si no sabes la URL → usa WebSearch |
| **WebSearch** | Externa | Busca en internet | Si ya sabes la URL → usa WebFetch |

---

## Cómo se declaran en un agente

En un archivo de agente de Claude Code, las tools disponibles se listan en el frontmatter:

```markdown
---
name: static-site-deployer
description: Deploys Docusaurus sites to GitHub Pages
tools: Bash, Read, Edit, Write, Glob, Grep
---

Instrucciones del agente...
```

Si no se declara `tools`, el agente hereda las tools por defecto de Claude Code. Si se declara, solo puede usar las listadas — cualquier otra quedará bloqueada.

:::tip Principio de menor privilegio
Declara solo las tools que el agente realmente necesita. Un agente de solo lectura (auditoría, análisis) no necesita `Write`, `Edit` ni `Bash`. Un agente de documentación no necesita `Bash`. Menos herramientas = menos superficie de riesgo.
:::
