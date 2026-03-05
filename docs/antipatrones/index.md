---
sidebar_position: 1
title: Anti-patrones
slug: /antipatrones
---

# Anti-patrones

Una guía de errores comunes al usar agentes de IA y cómo evitarlos. Cada anti-patrón incluye el problema típico y la práctica recomendada.

---

## Anti-patrones de Agentes

### 1. Agente demasiado genérico

❌ **Anti-patrón**: Crear un agente con instrucciones como "haz todo lo que te pida el usuario" o "ayuda con cualquier tarea de programación". Cuando el agente no tiene un propósito claro, su comportamiento es impredecible y los resultados inconsistentes.

✅ **Mejor práctica**: Define un propósito específico. En lugar de "ayuda con código", usa "eres un experto en revisión de código TypeScript. Tu única responsabilidad es revisar el código del usuario en busca de errores de tipos, bugs y violaciones de las convenciones del proyecto".

---

### 2. Instructions contradictorias

❌ **Anti-patrón**: Tener un system prompt que dice "responde siempre en inglés" y luego un archivo `CLAUDE.md` que dice "todos los comentarios deben estar en español". El modelo intentará satisfacer ambas instrucciones y fallará en ambas.

✅ **Mejor práctica**: Mantén una única fuente de verdad para cada tipo de instrucción. Si tienes instrucciones en múltiples archivos (`CLAUDE.md`, agente `.yml`, etc.), asegúrate de que no se contradigan. Realiza auditorías periódicas de tus archivos de configuración.

---

### 3. Dar al agente todas las herramientas disponibles

❌ **Anti-patrón**: Configurar el agente con acceso a todas las herramientas del sistema (leer archivos, ejecutar comandos, acceder a APIs, modificar la base de datos) aunque solo necesite algunas. Más herramientas = más superficie de ataque = más posibilidad de errores costosos.

✅ **Mejor práctica**: Aplica el principio de mínimo privilegio. Un agente de revisión de código solo necesita leer archivos. Un agente de documentación solo necesita leer y escribir markdown. Define explícitamente qué herramientas necesita cada agente en su configuración.

---

### 4. No incluir ejemplos en las instrucciones

❌ **Anti-patrón**: Escribir instrucciones abstractas como "usa un estilo de código limpio y profesional" sin ejemplos concretos. Los modelos de lenguaje responden mucho mejor a ejemplos que a descripciones abstractas.

✅ **Mejor práctica**: Incluye al menos un ejemplo de lo que quieres. "Para funciones de validación, sigue este patrón: `[ejemplo de código]`". Los ejemplos en las instrucciones son de los tokens más valiosos que puedes invertir.

---

### 5. Usar el mismo agente para todo

❌ **Anti-patrón**: Tener un único agente "super-agente" que hace revisión de código, generación de tests, documentación, deploys, y análisis de seguridad. Los agentes especializados producen mejores resultados.

✅ **Mejor práctica**: Crea agentes especializados para cada dominio: un agente de revisión de código, otro de generación de tests, otro de documentación. Cada uno con instrucciones y herramientas optimizadas para su tarea específica. Los agentes también pueden delegar tareas entre sí.

---

## Anti-patrones de Instructions

### 1. Instructions demasiado largas

❌ **Anti-patrón**: Escribir un `CLAUDE.md` o `copilot-instructions.md` de 5.000 palabras que cubre absolutamente todo. Instrucciones muy largas consumen gran parte de la ventana de contexto y el modelo pierde foco en las partes importantes.

✅ **Mejor práctica**: Sé conciso y prioriza. Las instrucciones críticas deben estar al principio. Usa jerarquía clara (encabezados, listas). Apunta a menos de 500 palabras para instrucciones globales; guarda los detalles para archivos de instrucciones específicos de subdirectorio.

---

### 2. Instrucciones que repiten lo que la IA ya sabe

❌ **Anti-patrón**: Incluir instrucciones como "sé útil", "responde de forma clara", "no generes contenido dañino", o "eres un experto en programación". El modelo ya tiene este comportamiento incorporado; repetirlo solo desperdicia tokens.

✅ **Mejor práctica**: Usa las instrucciones para comunicar información que el modelo NO puede saber por sí mismo: las convenciones específicas de tu proyecto, el stack tecnológico que usas, las restricciones de negocio, el estilo de código de tu equipo.

---

### 3. Instrucciones en idioma mezclado

❌ **Anti-patrón**: Tener instrucciones que mezclan español e inglés aleatoriamente, o cambiar de idioma según el archivo. Esto genera inconsistencias en las respuestas del modelo.

✅ **Mejor práctica**: Elige un idioma para tus instrucciones y mantenlo consistente en todos los archivos de configuración. Si el proyecto es en inglés pero el equipo es hispanohablante, documenta esta decisión explícitamente.

---

### 4. No probar las instrucciones

❌ **Anti-patrón**: Escribir instrucciones, asumir que funcionan, y nunca verificarlo. Las instrucciones pueden tener conflictos, ser ambiguas, o producir resultados inesperados.

✅ **Mejor práctica**: Prueba tus instrucciones con casos de uso reales inmediatamente después de escribirlas. Haz preguntas que deberían activar diferentes partes de las instrucciones. Pide al agente que explique sus instrucciones para verificar que las interpretó correctamente.

---

## Anti-patrones de Hooks

### 1. Hooks que bloquean todo

❌ **Anti-patrón**: Implementar un hook `PreToolUse` que rechaza cualquier operación que no esté en una lista blanca muy restrictiva. Esto paraliza al agente y lo hace inútil en situaciones no previstas.

✅ **Mejor práctica**: Los hooks deben bloquear acciones claramente peligrosas (escribir en `/etc/`, ejecutar `rm -rf`, acceder a credenciales), no todo lo que no esté explícitamente permitido. Diseña para lo que quieres prevenir, no para lo que quieres permitir.

---

### 2. Hooks sin manejo de errores

❌ **Anti-patrón**: Escribir hooks que pueden lanzar excepciones sin capturarlas. Si el hook falla con un error no manejado, puede romper toda la sesión del agente.

✅ **Mejor práctica**: Siempre envuelve la lógica del hook en try/catch. Si el hook falla, decide explícitamente si debe bloquear la operación (comportamiento conservador) o permitirla (comportamiento permisivo) y devuelve la decisión apropiada en lugar de lanzar una excepción.

---

### 3. Hooks que modifican el output silenciosamente

❌ **Anti-patrón**: Un hook `PostToolUse` que modifica el resultado de una herramienta sin dejar rastro. Por ejemplo, un hook que "limpia" las respuestas de la IA eliminando cierto contenido. El usuario no sabe que el output fue modificado.

✅ **Mejor práctica**: Si un hook modifica datos, debe ser explícito al respecto. Añade un log que indique qué se modificó y por qué. La transparencia es fundamental para mantener la confianza en el sistema.

---

## Anti-patrones de MCP

### 1. MCP server con demasiados tools

❌ **Anti-patrón**: Crear un MCP server que expone 50 tools diferentes. El agente se confunde cuando tiene demasiadas opciones similares y puede elegir la herramienta equivocada o tener dificultades para decidir cuál usar.

✅ **Mejor práctica**: Cada MCP server debe ser cohesivo y tener un dominio claro (GitHub, base de datos, sistema de archivos). Idealmente menos de 15-20 tools por servidor. Si tienes muchas herramientas, divídelas en múltiples servidores especializados.

---

### 2. No autenticar el MCP server

❌ **Anti-patrón**: Exponer un MCP server en la red local o en internet sin ningún tipo de autenticación. Cualquier cliente MCP podría conectarse y ejecutar las herramientas del servidor.

✅ **Mejor práctica**: Los MCP servers que acceden a datos sensibles deben requerir autenticación. Usa tokens de API, mutual TLS, o limita el acceso a `localhost` si el servidor solo necesita ser local. Trata un MCP server sin autenticación como una API pública sin contraseña.

---

### 3. MCP server que guarda secrets en texto plano

❌ **Anti-patrón**: Hardcodear API keys, tokens, o contraseñas directamente en el código del MCP server o en los archivos de configuración JSON del cliente MCP.

✅ **Mejor práctica**: Los secrets deben cargarse desde variables de entorno o un gestor de secretos (1Password, AWS Secrets Manager, HashiCorp Vault). Los archivos de configuración MCP solo deben contener referencias a variables de entorno, nunca los valores reales.

---

## Anti-patrones de Modelo ≠ Producto

### 1. Copiar configuración entre productos

❌ **Anti-patrón**: Tomar un agente configurado para Claude Code (archivo `.md` en `~/.claude/agents/`) y copiarlo directamente a la carpeta de GitHub Copilot CLI (`~/.copilot/agents/`) esperando que funcione igual. Los formatos son diferentes, las rutas son diferentes, las capacidades son diferentes.

✅ **Mejor práctica**: Cada producto tiene su propio formato de configuración. Cuando adaptes configuración entre productos, lee la documentación específica del producto destino y reescribe la configuración desde cero adaptando los conceptos, no copiando archivos.

---

### 2. Buscar archivos de config en la ruta del modelo

❌ **Anti-patrón**: Pensar que porque GitHub Copilot CLI está usando Claude Sonnet como modelo, los archivos de configuración deben estar en `~/.claude/` o en rutas relacionadas con Claude. O buscar configuración de Gemini CLI en rutas de OpenAI porque usa GPT-4 internamente.

✅ **Mejor práctica**: Los archivos de configuración **siempre siguen al producto, no al modelo**. Si usas GitHub Copilot CLI, la configuración está en `~/.copilot/` y `.github/`, independientemente de qué modelo use internamente. El modelo puede cambiar con una actualización; las rutas del producto son estables.
