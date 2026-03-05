---
sidebar_position: 2
title: Instructions por Herramienta
---

# Instructions por Herramienta

Cada herramienta de IA lee instrucciones de archivos específicos. Aquí encontrarás el formato y las particularidades de cada una.

---

## 🔵 GitHub Copilot — `.github/copilot-instructions.md`

### Ubicación y alcance
- **Archivo**: `.github/copilot-instructions.md` en la raíz del repositorio
- **Alcance**: todo el repositorio, compartido en git
- **Aplica a**: GitHub Copilot CLI y GitHub Copilot VS Code

### Formato y características
- Markdown estándar
- Soporta múltiples secciones
- Puede referenciar otros archivos (en VS Code)
- Límite recomendado: ~4000 tokens

### Ejemplo completo

```markdown
# Instrucciones para GitHub Copilot

## Contexto del Proyecto
API de gestión de suscripciones SaaS. Permite a empresas gestionar sus
suscripciones, usuarios, facturación y permisos.

Usuarios del sistema: administradores de empresas y sus empleados.

## Stack Tecnológico
- Runtime: Node.js 20 LTS
- Lenguaje: TypeScript 5.3 (modo estricto)
- Framework: Express 5
- ORM: Prisma 5 con PostgreSQL 15
- Testing: Jest 29 + Supertest
- Validación: Zod 3
- Auth: JWT + bcrypt
- Logging: Winston
- Colas: Bull + Redis

## Estructura del Proyecto
```
src/
├── config/          # Configuración de la app (env, database, etc.)
├── controllers/     # Handlers HTTP (thin layer, solo HTTP)
├── services/        # Lógica de negocio (toda la lógica aquí)
├── repositories/    # Acceso a datos con Prisma
├── middleware/      # Auth, error handling, validation
├── routes/          # Definición de rutas
├── types/           # Tipos TypeScript compartidos
├── utils/           # Utilidades puras (sin efectos secundarios)
└── jobs/            # Workers de Bull Queue
```

## Convenciones de Código

### TypeScript
- Modo estricto habilitado, NUNCA uses `any`
- Usa `unknown` + type guards cuando el tipo no se conoce en compilación
- Interfaces para objetos, types para uniones/intersecciones
- Todos los parámetros y retornos deben tener tipos explícitos

### Async/Await
- SIEMPRE usa async/await, nunca callbacks ni .then()/.catch() encadenados
- Todos los controllers van envueltos en `asyncHandler()` de `src/utils/asyncHandler.ts`

### Manejo de Errores
- Usa las clases de error de `src/types/errors.ts`:
  - `ValidationError` (400) — input inválido
  - `AuthenticationError` (401) — no autenticado
  - `AuthorizationError` (403) — sin permisos
  - `NotFoundError` (404) — recurso no encontrado
  - `ConflictError` (409) — conflicto (ej: email duplicado)
- El middleware `errorHandler.ts` los captura automáticamente
- NUNCA capturas errores y no los re-lanzas o logueas

### Naming
- Controllers: `[Entidad]Controller` (ej: `SubscriptionController`)
- Services: `[Entidad]Service`
- Repositories: `[Entidad]Repository`
- Rutas: kebab-case (`/api/v1/subscription-plans`)
- Variables/funciones: camelCase
- Constantes: UPPER_SNAKE_CASE

## Comandos del Proyecto
- `npm run dev` — desarrollo con hot reload
- `npm test` — todos los tests
- `npm run test:watch` — tests en modo watch
- `npm run test:coverage` — reporte de cobertura
- `npm run lint` — ESLint
- `npm run build` — build TypeScript
- `npx prisma migrate dev` — nueva migración
- `npx prisma studio` — UI de base de datos

## Restricciones Importantes
- ❌ NUNCA hardcodees secrets, API keys o passwords
- ❌ NUNCA uses console.log() — usa `logger` de `src/utils/logger.ts`
- ❌ NUNCA modifiques archivos en `prisma/migrations/` — solo crea nuevas
- ❌ NUNCA hagas queries SQL directas — usa Prisma siempre
- ❌ NUNCA expongas stack traces en respuestas de producción
- ✅ SIEMPRE valida input con Zod antes de pasarlo al service layer
- ✅ SIEMPRE maneja los errores de Prisma (PrismaClientKnownRequestError)
```

---

## 🟠 Claude Code — `CLAUDE.md`

### Ubicación y alcance
- **Global**: `~/.claude/CLAUDE.md` (aplica a todos los proyectos)
- **Por repo**: `CLAUDE.md` en la raíz del repositorio (tiene prioridad)
- **Por carpeta**: `CLAUDE.md` en subcarpetas (contexto local adicional)

### Formato y características
- Markdown estándar
- Soporta jerarquía de archivos (global → repo → subcarpeta)
- Puede incluir comandos de referencia que Claude puede ejecutar

### Ejemplo

```markdown
# Claude Code — Proyecto API Pagos

## Resumen
Microservicio de pagos integrado con Stripe y PayPal.
Stack: Python 3.12, FastAPI, SQLAlchemy 2, PostgreSQL.

## Comandos disponibles
Para ejecutar el proyecto: `make dev`
Para tests: `make test`
Para migraciones: `alembic upgrade head`

## Contexto importante
- La integración con Stripe está en `src/gateways/stripe.py`
- Los webhooks de Stripe se manejan en `src/webhooks/stripe_webhook.py`
- NUNCA loguees datos de tarjetas, ni parcialmente
- Los tests de pago usan el modo test de Stripe (no cobran dinero real)

## Convenciones
- Type hints obligatorios en todas las funciones
- Docstrings en formato Google
- Async para todos los endpoints FastAPI
- Pydantic v2 para modelos de datos
```

---

## 🔴 Gemini CLI — `GEMINI.md`

Funciona igual que `CLAUDE.md` pero para Gemini CLI. La sintaxis es Markdown estándar.

```markdown
# Gemini CLI — Sistema de Análisis de Datos

## Proyecto
Pipeline de datos para análisis de comportamiento de usuarios.
Python 3.12, Apache Airflow, BigQuery, Pandas, dbt.

## Convenciones de queries BigQuery
- Siempre usa parámetros en las queries (nunca f-strings)
- Los nombres de tablas siguen el patrón: `proyecto.dataset.tabla`
- El dataset de producción es `analytics_prod`, el de dev es `analytics_dev`
- Siempre agrega `LIMIT` en queries exploratorias

## Estructura del DAG de Airflow
Cada DAG tiene:
1. Tarea de extracción (operators de GCS)
2. Tarea de transformación (dbt run)
3. Tarea de carga (BigQueryInsertJobOperator)
4. Tarea de validación (GreatExpectations)
```

---

## 🟣 Cursor — `.cursorrules` y `.cursor/rules/`

### `.cursorrules` (formato simple)

Texto plano o Markdown en la raíz del repo. Aplica a todo el proyecto.

```markdown
Eres un asistente experto en React y TypeScript.

Este proyecto usa: React 18, TypeScript 5, Vite, TanStack Query, Zustand, Tailwind CSS.

Convenciones:
- Componentes en PascalCase, archivos en kebab-case
- Props siempre tipadas con interface, no type
- Hooks personalizados con prefijo "use"
- Estado global solo en Zustand, estado local con useState
- Datos del servidor solo con TanStack Query, nunca useEffect + fetch
```

### `.cursor/rules/` (formato avanzado con frontmatter)

```markdown
---
description: Reglas para componentes React
globs: ["src/components/**/*.tsx", "src/pages/**/*.tsx"]
alwaysApply: true
---

# Componentes React

## Estructura de un componente
```typescript
// Imports: externos → internos → tipos
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { UserProps } from '@/types/user';

// Props interface
interface ComponenteProps {
  prop: string;
  callback: (value: string) => void;
}

// Componente
export function Componente({ prop, callback }: ComponenteProps) {
  // Estado
  const [estado, setEstado] = useState('');
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return ( ... );
}
```
```

:::tip Precedencia en Cursor
Si tienes tanto `.cursorrules` como `.cursor/rules/`, ambos se aplican. Las reglas en `.cursor/rules/` con `globs` solo se activan cuando editas archivos que coinciden con el patrón.
:::
