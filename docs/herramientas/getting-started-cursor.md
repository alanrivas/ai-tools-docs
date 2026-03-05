---
sidebar_position: 5
title: "Cursor: Primeros Pasos"
---

# Cursor: Primeros Pasos

Cursor es un editor de código basado en VS Code con IA integrada profundamente en el flujo de trabajo. A diferencia de los CLIs, Cursor funciona como un IDE completo donde la IA tiene contexto visual del proyecto.

## Prerequisitos

- Descarga Cursor IDE desde [cursor.com](https://cursor.com) (disponible para Windows, macOS y Linux).
- El plan gratuito incluye 2.000 completaciones de código y 50 peticiones premium al mes.

## Paso 1: Instalar Cursor

1. Descarga el instalador desde [cursor.com](https://cursor.com).
2. Ejecuta el instalador y sigue las instrucciones.
3. Al abrir por primera vez, selecciona tu tema y configura preferencias básicas.

## Paso 2: Importar configuración de VS Code (opcional)

Si ya usas VS Code, Cursor puede importar toda tu configuración:

1. Abre la paleta de comandos: `Ctrl+Shift+P` (Windows/Linux) o `Cmd+Shift+P` (macOS).
2. Busca "Cursor: Import VS Code Settings".
3. Selecciona "Import Extensions, Keybindings, and Settings".

Esto migrará tus extensiones, atajos de teclado y configuraciones.

## Paso 3: Primer uso con IA

### Inline Edit (Ctrl+K)

Selecciona código y presiona `Ctrl+K` para editarlo con instrucciones en lenguaje natural:

```
Selecciona una función → Ctrl+K → "convierte esto a async/await"
```

### Chat (Ctrl+L)

Abre el panel de chat para conversar con la IA sobre tu código:

```
Ctrl+L → "¿qué hace esta función?" o "explica el flujo de autenticación"
```

### Completaciones en línea

Mientras escribes, Cursor sugiere completaciones automáticamente. Acepta con `Tab`.

## Configurar .cursorrules

El archivo `.cursorrules` en la raíz del proyecto define reglas globales de comportamiento para la IA:

```bash
# Crear el archivo en la raíz del proyecto
touch .cursorrules
```

Ejemplo de `.cursorrules`:

```
Eres un asistente experto en TypeScript y React.

## Reglas de código
- Usa TypeScript strict mode siempre
- Prefiere componentes funcionales con hooks
- Escribe tests con Testing Library
- Usa Tailwind CSS para estilos
- Los comentarios deben estar en español

## No hacer
- No uses clases de CSS personalizadas si hay una clase de Tailwind equivalente
- No uses `var` ni `let` cuando `const` sea suficiente
- No dejes console.log en el código de producción
```

## Directorio .cursor/rules/

Para reglas más granulares por tipo de archivo, usa el directorio `.cursor/rules/`:

```
.cursor/
  rules/
    typescript.mdc    # Reglas para archivos .ts/.tsx
    testing.mdc       # Reglas para archivos de test
    api.mdc           # Reglas para endpoints de API
```

Ejemplo de `.cursor/rules/typescript.mdc`:

```markdown
---
globs: ["**/*.ts", "**/*.tsx"]
---

## TypeScript Rules
- Siempre define tipos explícitos para parámetros de funciones
- Usa `interface` para objetos, `type` para uniones y utilidades
- Evita el uso de `any`; usa `unknown` cuando el tipo no se conozca
```

## Modos de IA en Cursor

### Agent Mode (modo agente)

El modo agente permite que Cursor realice tareas multi-paso de forma autónoma: leer múltiples archivos, ejecutar comandos, crear y modificar código.

Para activarlo: en el panel de chat, haz clic en el selector de modo y elige "Agent".

```
Agent: "Implementa autenticación JWT: crea los middlewares, 
las rutas /login y /logout, y escribe los tests correspondientes"
```

### Chat Mode

Conversación sin modificaciones automáticas al código. Ideal para explorar ideas, entender código existente o planificar arquitectura.

### Inline Edit Mode (Ctrl+K)

Edición directa de código seleccionado. La más rápida para cambios pequeños y refactorizaciones puntuales.

:::tip Contexto con @
En el chat, usa `@` para añadir contexto específico:
- `@archivo.ts` — incluye un archivo específico
- `@carpeta/` — incluye un directorio
- `@docs` — incluye la documentación indexada del proyecto
- `@web` — busca en internet (requiere plan Pro)
:::

:::warning Agent Mode tiene acceso completo
En Agent Mode, Cursor puede crear, modificar y eliminar archivos, y ejecutar comandos de terminal. Revisa siempre los cambios propuestos antes de aceptarlos, especialmente en proyectos de producción.
:::

## Recursos adicionales

- [Documentación oficial de Cursor](https://docs.cursor.com)
- [Foro de la comunidad Cursor](https://forum.cursor.com)
- [Ver Instrucciones para Cursor](../instructions/por-herramienta.md)
