---
sidebar_position: 3
title: Ejemplos de Instructions
---

# Ejemplos Prácticos de Instructions

Ejemplos completos y listos para usar de archivos de instrucciones para diferentes tipos de proyectos.

---

## Ejemplo 1: `.github/copilot-instructions.md` para proyecto TypeScript

Ideal para proyectos Node.js/TypeScript con Express o NestJS.

```markdown
# Copilot Instructions — API TypeScript

## Proyecto
API REST para plataforma de e-learning. Gestiona cursos, usuarios,
inscripciones y progreso de aprendizaje.

## Stack
Node.js 20, TypeScript 5 (strict), Express 5, Prisma 5, PostgreSQL 15,
Redis (cache + sesiones), Jest + Supertest, Zod, Winston.

## Estructura
```
src/
├── controllers/   # HTTP handlers (solo reciben request, llaman service)
├── services/      # Lógica de negocio
├── repositories/  # Queries a base de datos via Prisma
├── middleware/    # auth, validation, error handling, rate limiting
├── routes/        # Express routers
├── types/         # Interfaces y types TypeScript
├── utils/         # Helpers sin efectos secundarios
└── jobs/          # Tareas en background (Bull)
```

## Código TypeScript

Usa SIEMPRE TypeScript estricto:
```typescript
// ✅ Correcto
async function getUser(id: string): Promise<User | null> {
  return userRepository.findById(id);
}

// ❌ Incorrecto — any prohibido
async function getUser(id: any): Promise<any> { ... }
```

Zod para validación de input:
```typescript
const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
});

type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
```

## Manejo de Errores

Usa las clases de error del proyecto:
```typescript
// src/types/errors.ts define estas clases:
throw new ValidationError('El precio debe ser mayor a 0');
throw new NotFoundError('Curso no encontrado');
throw new AuthorizationError('Solo el instructor puede editar este curso');
```

El middleware errorHandler.ts las captura automáticamente.

## Respuesta de la API

SIEMPRE este formato:
```typescript
// Éxito
res.status(200).json({
  success: true,
  data: resultado,
});

// Error (lo maneja el errorHandler, pero para referencia)
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Descripción del error',
  },
});
```

## Restricciones
- Nunca `console.log()` — usa `import logger from '@/utils/logger'`
- Nunca secrets hardcodeados — variables de entorno en `.env`
- Nunca `SELECT *` en Prisma — selecciona solo los campos necesarios
- Nunca modifiques migraciones existentes — crea nuevas con `prisma migrate dev`
- Todo endpoint privado requiere el middleware `authenticate()`
```

---

## Ejemplo 2: `CLAUDE.md` para proyecto Python

Ideal para APIs Python con FastAPI o Django.

```markdown
# CLAUDE.md — Backend Python

## Proyecto
Sistema de gestión de inventario para pequeñas empresas.
FastAPI, Python 3.12, SQLAlchemy 2 (async), PostgreSQL, Redis, Celery.

## Comandos del proyecto
```bash
# Desarrollo
make dev           # uvicorn con reload
make worker        # Celery worker

# Testing
make test          # pytest completo
make test-cov      # con reporte de cobertura
pytest tests/api/  # solo tests de API

# Base de datos
make migrate       # alembic upgrade head
make migration msg="descripcion"  # nueva migración

# Calidad de código
make lint          # ruff + mypy
make format        # ruff format
```

## Convenciones Python

### Type hints (obligatorio)
```python
# ✅ Con tipos
async def get_products(
    category_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> list[ProductResponse]:
    ...

# ❌ Sin tipos
async def get_products(category_id, skip=0, limit=20):
    ...
```

### Modelos Pydantic v2
```python
from pydantic import BaseModel, Field, validator

class CreateProductRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    price: Decimal = Field(gt=0, decimal_places=2)
    category_id: UUID
    
    model_config = ConfigDict(str_strip_whitespace=True)
```

### Manejo de errores
Usa las excepciones de `src/core/exceptions.py`:
```python
from src.core.exceptions import (
    NotFoundError,
    ValidationError, 
    AuthorizationError,
)

raise NotFoundError(f"Producto {product_id} no encontrado")
```

## Seguridad
- Nunca loguees passwords, tokens o datos personales
- Toda query usa parámetros — NUNCA f-strings en SQL
- Valida y sanitiza inputs con Pydantic antes de procesar
- Los archivos subidos van a S3, nunca al filesystem local

## Tests
- Usa `pytest` con `pytest-asyncio` para código async
- Fixtures en `tests/conftest.py`
- Base de datos de test separada (variable `TEST_DATABASE_URL`)
- Mocks para servicios externos (S3, email, SMS)
```

---

## Ejemplo 3: `.cursorrules` para proyecto React/TypeScript

```markdown
Eres un experto en React 18, TypeScript 5, y desarrollo frontend moderno.

## Stack del proyecto
React 18, TypeScript 5 strict, Vite 5, TanStack Router, TanStack Query v5,
Zustand, Tailwind CSS 3, shadcn/ui, React Hook Form + Zod, Vitest.

## Convenciones de componentes

Estructura de un componente:
```typescript
// 1. Imports externos
import { useState, useCallback } from 'react';
// 2. Imports de librerías UI
import { Button } from '@/components/ui/button';
// 3. Imports internos
import { useUserStore } from '@/store/userStore';
// 4. Tipos
import type { User } from '@/types/user';

// 5. Props interface (siempre interface, no type)
interface UserCardProps {
  user: User;
  onSelect: (userId: string) => void;
  className?: string;
}

// 6. Componente exportado con nombre
export function UserCard({ user, onSelect, className }: UserCardProps) {
  // hooks primero
  // handlers después
  // return al final
}
```

## Estado

- Estado local del componente: `useState` o `useReducer`
- Estado compartido entre componentes: Zustand store en `src/store/`
- Estado del servidor (datos de API): TanStack Query SIEMPRE
- NUNCA `useEffect` + `fetch` para obtener datos del servidor

## Fetching de datos

```typescript
// ✅ Correcto — TanStack Query
function useProducts(categoryId: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => api.products.list(categoryId),
  });
}

// ❌ Incorrecto
useEffect(() => {
  fetch('/api/products').then(r => r.json()).then(setProducts);
}, []);
```

## Tailwind CSS

- Mobile first: `sm:` para tablet, `md:` para desktop
- Usa `cn()` de `@/lib/utils` para combinar clases condicionales
- No uses estilos inline, todo con Tailwind
- Los componentes de shadcn/ui están en `src/components/ui/`
```

---

## Consejos para escribir buenas instrucciones

:::tip Lo más importante
Las instrucciones más útiles son las que evitan que la IA repita los errores más comunes **en tu proyecto específico**. Observa qué corriges más frecuentemente y agréga lo como restricción.
:::

:::warning Mantén las instrucciones actualizadas
Las instrucciones obsoletas son peores que ninguna instrucción. Si cambias de Prisma a Drizzle, actualiza el archivo. Asigna a alguien del equipo como responsable de mantenerlas.
:::

```bash
# Flujo recomendado para crear instrucciones
# 1. Empieza con lo básico
echo "# Instrucciones\n## Stack\n## Convenciones\n## Restricciones" > .github/copilot-instructions.md

# 2. Itera basándote en los errores de la IA
# Cada vez que corrijas algo que la IA hizo mal, agrega esa regla

# 3. Revisa con el equipo mensualmente
git log --oneline .github/copilot-instructions.md
```
