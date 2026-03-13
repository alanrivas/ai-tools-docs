---
sidebar_position: 1
title: Instructions y Prompts
slug: /instructions
---

# Instructions y Prompts del Sistema

Las instrucciones del sistema son **texto que la IA lee antes de cada conversación**. Definen el contexto permanente del proyecto: qué es, qué tecnologías usa, cómo se trabaja en él, y qué está prohibido.

No son prompts que escribes cada vez — son el contexto que ya está siempre ahí.

---

## El problema que resuelven

Sin instrucciones persistentes, cada conversación empieza desde cero:

```
Sin instrucciones:
  Conversación 1: "Somos TypeScript con Express, Prisma, no uses any,
                   async/await siempre, errores con middleware central...
                   ahora genera el endpoint de users"
  Conversación 2: [misma explicación de nuevo]
  Conversación 3: [misma explicación de nuevo]
  [30% de cada conversación es onboarding a la IA]

Con instrucciones:
  [Una vez en CLAUDE.md]:
  "TypeScript + Express + Prisma, no any, async/await, middleware de errores"

  Conversación 1: "genera el endpoint de users"
  Conversación 2: "revisa el módulo de auth"
  Conversación 3: "crea los tests para OrderService"
  [Vas directo al punto — la IA ya conoce el proyecto]
```

---

## Anatomía de las instrucciones

Un buen archivo de instrucciones tiene estas secciones. Cada una responde una pregunta distinta que la IA necesita saber para trabajar bien en tu proyecto:

```
┌─────────────────────────────────────────────────────┐
│             ARCHIVO DE INSTRUCCIONES                │
│                                                     │
│  1. Contexto del proyecto  ← ¿qué es esto?         │
│  2. Stack tecnológico      ← ¿con qué trabaja?     │
│  3. Estructura             ← ¿dónde va cada cosa?  │
│  4. Convenciones           ← ¿cómo se hace aquí?   │
│  5. Comandos importantes   ← ¿cómo se ejecuta?     │
│  6. Lo que NUNCA hacer     ← ¿qué está prohibido?  │
│  7. Flujo de trabajo       ← ¿cómo se contribuye?  │
└─────────────────────────────────────────────────────┘
```

### 1. Contexto del proyecto

Qué es el proyecto, para qué sirve, quiénes lo usan. Le da a la IA el "porqué" de las decisiones.

```markdown
# API de Pagos — Backend

Sistema de procesamiento de pagos para e-commerce. Maneja transacciones,
reembolsos y conciliaciones. Procesa ~50k transacciones diarias.
Cumplimiento PCI-DSS requerido en todo el código de pagos.
```

### 2. Stack tecnológico

Lista concreta de tecnologías y versiones. Sin esto, la IA puede generar código para la versión equivocada.

```markdown
## Stack
- Node.js 22 + TypeScript 5.6 strict
- Express 4 (sin decoradores — sin NestJS)
- Prisma 5 + PostgreSQL 15
- Jest 29 + Supertest para tests
- Zod para validación de inputs
```

### 3. Estructura del proyecto

Dónde va cada tipo de archivo. La IA usa esto para decidir dónde crear o buscar cosas.

```markdown
## Estructura
src/
  controllers/  → HTTP handlers (solo validación y respuesta)
  services/     → lógica de negocio
  repositories/ → acceso a base de datos (solo aquí se usa Prisma)
  middlewares/  → auth, errores, logging
  schemas/      → validaciones Zod
```

### 4. Convenciones de código

Las reglas que la IA debe seguir siempre. Incluye el **por qué** cuando no es obvio — así la IA las aplica también en casos que no anticipaste.

```markdown
## Convenciones
- Nunca `any` en TypeScript — si el tipo no se conoce, investiga o pregunta
- Errores: throw siempre ErrorTypes propios (ver src/errors/), nunca Error genérico
- No queries directas a Prisma fuera de repositories/ — el resto usa el repositorio
- Funciones de más de 20 líneas deben refactorizarse
- Nombres de variables en inglés, comentarios en español
```

### 5. Comandos importantes

Cómo se ejecuta, se testea, se construye. La IA los necesita para verificar que su código funciona.

```markdown
## Comandos
npm run dev          → servidor en modo watch
npm test             → tests unitarios
npm run test:e2e     → tests de integración
npm run build        → build de producción
npm run lint         → ESLint + Prettier
```

### 6. Lo que NUNCA hacer

Las reglas absolutas. Explica el motivo — así la IA aplica el espíritu, no solo la letra.

```markdown
## Prohibido
- NUNCA loguear datos de tarjetas de crédito (cumplimiento PCI-DSS)
- NUNCA usar console.log en producción — solo el logger de Winston
- NUNCA commits directos a main — siempre PR con al menos 1 review
- NUNCA hardcodear URLs o credenciales — siempre process.env.*
```

### 7. Flujo de trabajo

Cómo se hacen las cosas en el equipo. Útil para agentes que crean PRs o siguen el proceso del proyecto.

```markdown
## Flujo
1. Crear rama desde main: feat/*, fix/*, chore/*
2. Commits en formato Conventional Commits
3. PR con descripción y tests
4. CI debe pasar antes de merge
```

---

## Dónde van los archivos

Cada herramienta tiene su archivo. La regla es siempre la misma: **el archivo sigue al producto, no al modelo**.

| Producto | Archivo global | Archivo por repositorio |
|----------|---------------|------------------------|
| Claude Code | `~/.claude/CLAUDE.md` | `CLAUDE.md` (raíz del repo) |
| GitHub Copilot CLI/VS Code | (settings de VS Code) | `.github/copilot-instructions.md` |
| Gemini CLI | `~/.gemini/GEMINI.md` | `GEMINI.md` (raíz del repo) |
| Cursor | (Cursor Settings) | `.cursorrules` / `.cursor/rules/*.mdc` |

### Precedencia: repo > global

En todas las herramientas, el archivo del repositorio tiene mayor prioridad:

```
[Instrucciones globales del usuario]  ← se aplican siempre
        ↓ (el repo puede sobrescribir o añadir)
[Instrucciones del repositorio]       ← más específicas, mayor prioridad
        ↓
[Contexto que recibe la IA]
```

Esto permite tener instrucciones globales genéricas ("siempre TypeScript") y que cada repositorio las especialice ("en este repo, además, usa Zod para validaciones").

---

## Instructions vs Agentes vs Skills

| | Instructions | Skills | Agentes |
|--|--------------|--------|---------|
| **Propósito** | Contexto del proyecto | Cómo ejecutar una tarea | Quién ejecuta una tarea |
| **Cuándo está activo** | Toda sesión, siempre | Solo cuando se invoca | Solo cuando se lanza |
| **Contenido** | Stack, convenciones, restricciones | Pasos de un procedimiento | Rol y comportamiento |
| **Ejemplo** | "Usamos TypeScript strict" | "Para revisar PR: paso 1, 2, 3" | "Eres el revisor de código" |

:::tip La combinación ideal
Las instrucciones ponen el contexto del proyecto. Los agentes y skills usan ese contexto para hacer su trabajo. Un agente de revisión de PRs que lee `CLAUDE.md` ya sabe las convenciones del proyecto sin que se las repitas en sus propias instrucciones.
:::

---

## Valor para equipos

El mayor beneficio de los archivos de instrucciones en el repositorio es que viajan con el código:

```bash
git clone mi-proyecto
# Ya incluye:
# .github/copilot-instructions.md → Copilot ya conoce el proyecto
# CLAUDE.md                       → Claude Code ya conoce el proyecto
# .cursorrules                    → Cursor ya conoce el proyecto
```

Cuando alguien nuevo llega al equipo, su herramienta de IA ya tiene el contexto. No hay "configuración de IA" manual. El onboarding de la IA está en el repo, junto con el del proyecto.
