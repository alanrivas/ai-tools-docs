---
sidebar_position: 5
title: Cursor
---

# Cursor

Cursor es un editor de código completo (fork de VS Code) con IA profundamente integrada. A diferencia de las otras herramientas de esta guía, Cursor **no es una CLI** — es un IDE. Su enfoque en reglas por repositorio lo hace ideal para equipos que quieren compartir configuración de IA en el control de versiones.

---

## ¿Qué es Cursor?

Cursor es un editor de código que integra IA de forma nativa en cada aspecto del flujo de trabajo: autocompletado, chat, edición inline, y modo agente. Usa diferentes modelos según la configuración del usuario (GPT-4o, Claude, Gemini), pero el **producto es Cursor** — sus configuraciones van en archivos `.cursor/` o `.cursorrules`, sin importar qué modelo uses.

:::info Diferencia clave con las otras herramientas
Las otras herramientas tienen configuración **por usuario** (en `~/`). Cursor tiene configuración **por repositorio** (en el propio proyecto). Esto significa que todo tu equipo comparte automáticamente las mismas reglas cuando clonan el repo.
:::

---

## Archivos de Configuración de Cursor

### `.cursorrules` (archivo raíz)

El archivo `.cursorrules` en la raíz del proyecto es la forma más simple de configurar el comportamiento de IA para todo el equipo:

```
# .cursorrules — Reglas para el proyecto Mi API

Eres un asistente de programación experto en TypeScript y Node.js.

## Contexto del proyecto
Este es un API REST para gestión de inventario. Stack: Node.js 20, TypeScript 5, 
Express 5, Prisma 5, PostgreSQL 15.

## Convenciones de código
- Usa siempre async/await, nunca callbacks
- Todos los errores deben ser manejados con el middleware centralizado en src/middleware/errorHandler.ts
- Los tipos compartidos van en src/types/index.ts
- Usa Zod para validación de todos los inputs de la API
- Los controladores son thin (solo manejan HTTP), la lógica va en services/

## Testing
- Framework: Jest + Supertest para integración
- Mocks con jest.mock() — nunca datos de producción en tests
- Cada servicio debe tener tests unitarios al 80%+ de cobertura

## Lo que NUNCA debes hacer
- No uses `any` en TypeScript
- No hardcodees strings de conexión o API keys
- No modifiques las migraciones existentes — crea nuevas con `prisma migrate dev`

## Al generar código nuevo
1. Revisa primero los tipos existentes en src/types/
2. Sigue el patrón de controladores existentes
3. Incluye manejo de errores desde el inicio
4. Genera el test junto con el código
```

### `.cursor/rules/` (reglas modulares)

Para proyectos más complejos, puedes tener **múltiples archivos de reglas** en `.cursor/rules/`. Cada archivo puede ser activado según el contexto:

```
.cursor/
└── rules/
    ├── typescript.mdc      # Reglas para archivos .ts
    ├── testing.mdc         # Reglas para archivos de test
    ├── api-design.mdc      # Reglas para diseño de APIs
    └── database.mdc        # Reglas para queries y migraciones
```

#### Ejemplo de regla modular

```markdown
---
description: Reglas para diseño y implementación de APIs REST
globs: ["src/controllers/**/*.ts", "src/routes/**/*.ts"]
alwaysApply: false
---

# Reglas de API REST

Cuando trabajes en controladores o rutas:

## Estructura de respuesta
Todas las respuestas deben seguir este formato:
```json
{
  "success": true,
  "data": <payload>,
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0"
  }
}
```

## Códigos HTTP
- 200: éxito con datos
- 201: recurso creado
- 204: éxito sin datos
- 400: error de validación del cliente
- 401: no autenticado
- 403: no autorizado
- 404: no encontrado
- 500: error interno (loguea pero no expongas detalles)

## Validación obligatoria
Todo input debe validarse con Zod antes de pasarse al service layer.
```

---

## Modo Agente en Cursor

Cursor tiene un **modo agente** (Agent Mode o Composer) donde la IA puede:
- Leer y escribir múltiples archivos
- Ejecutar comandos de terminal
- Hacer búsquedas en el código base
- Completar tareas complejas de múltiples pasos

### Cómo activar el modo agente

1. Abre el panel de Composer (`Cmd+I` / `Ctrl+I`)
2. Cambia de "Chat" a "Agent" en el selector
3. Describe la tarea completa que quieres completar

```
# Ejemplo de tarea para el agente
"Agrega autenticación JWT al proyecto. Necesito:
1. Middleware de autenticación en src/middleware/
2. Endpoints POST /auth/login y POST /auth/refresh
3. Proteger todos los endpoints de /api/v1/inventory
4. Tests para los endpoints de auth
Sigue las convenciones del proyecto que están en .cursorrules"
```

---

## Context en Cursor: `@` references

Cursor tiene un potente sistema de referencias de contexto:

```
@workspace       — Busca en todo el proyecto
@file            — Referencias un archivo específico
@folder          — Referencias una carpeta
@code            — Selección de código actual
@web             — Busca en internet
@docs            — Documentación de librerías (configurada por el usuario)
@git             — Historial y diff de git
```

### Ejemplo de uso

```
"@file:src/services/userService.ts Este servicio tiene un bug en el método 
createUser cuando el email ya existe. @file:src/types/index.ts Revisa los 
tipos para entender la estructura. Corrige el bug y agrega el test."
```

---

## Comparación: `.cursorrules` vs `.cursor/rules/`

| Característica | `.cursorrules` | `.cursor/rules/` |
|---|---|---|
| Formato | Texto plano | Markdown con frontmatter |
| Activación | Siempre activo | Por glob o manual |
| Modularidad | Un solo archivo | Múltiples archivos temáticos |
| Mejor para | Proyectos simples | Proyectos complejos |
| Compatibilidad | Amplia | Versiones recientes de Cursor |

:::tip Recomendación
Para proyectos nuevos, usa `.cursor/rules/` con archivos modulares. Para proyectos existentes o equipos que ya tienen `.cursorrules`, mantén el formato actual — ambos funcionan bien.
:::

---

## Configuración de modelos en Cursor

En Cursor puedes cambiar el modelo de IA a nivel de usuario (no por repo):

- **Cursor Settings** → **Models** → selecciona el modelo
- Modelos disponibles: `claude-sonnet-4-5`, `gpt-4o`, `gemini-2.5-pro`, y más

Recuerda: cambiar el modelo no cambia las reglas de `.cursorrules`. Las reglas del repositorio aplican independientemente del modelo que uses.
