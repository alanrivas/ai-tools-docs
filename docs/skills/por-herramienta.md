---
sidebar_position: 2
title: Skills por Herramienta
---

# Skills por Herramienta

Cada herramienta de IA tiene su propia forma de definir y reutilizar capacidades específicas — lo que genéricamente llamamos **skills** o habilidades reutilizables. A continuación se explica cómo funciona cada una.

---

## GitHub Copilot CLI

En GitHub Copilot CLI, los skills se definen dentro de los archivos YAML de agentes, bajo las claves `tools:` o como instrucciones especializadas que el agente puede invocar. Los agentes se almacenan en `~/.copilot/agents/` (nivel usuario) o en `.github/copilot/agents/` (nivel repositorio).

Un agente puede referenciar skills implícitamente al declarar qué herramientas tiene disponibles y cuáles son sus instrucciones de uso.

```yaml
# ~/.copilot/agents/code-reviewer.yml
name: code-reviewer
description: Revisa código en busca de problemas de seguridad, rendimiento y estilo
tools:
  - read_file
  - list_directory
  - run_terminal_command
instructions: |
  Eres un revisor de código experto. Cuando el usuario te pida revisar código:
  1. Lee los archivos relevantes con read_file
  2. Identifica problemas de seguridad (inyecciones, exposición de secretos)
  3. Identifica problemas de rendimiento (loops innecesarios, consultas N+1)
  4. Sugiere mejoras de legibilidad y mantenibilidad
  5. Presenta tus hallazgos en formato estructurado con severidad: ALTA, MEDIA, BAJA

  Convenciones del proyecto:
  - TypeScript estricto (noImplicitAny: true)
  - Tests con Jest
  - Estilo: ESLint + Prettier
```

:::tip
Puedes crear múltiples agentes especializados y combinarlos en un flujo de trabajo. Por ejemplo, un agente `code-reviewer` y otro `test-generator` que trabajen sobre el mismo código.
:::

---

## Claude Code

Claude Code no tiene un sistema formal de "skills". En su lugar, utiliza dos mecanismos complementarios:

1. **`CLAUDE.md`**: Archivo de instrucciones persistentes que actúa como contexto global del proyecto.
2. **Comandos slash personalizados** (`/user:mi-comando`): Scripts que se almacenan en `~/.claude/commands/` y pueden invocarse como shortcuts reutilizables.

```bash
# Estructura de comandos personalizados
~/.claude/commands/
├── revisar-pr.md
├── generar-tests.md
└── documentar-funcion.md
```

Ejemplo de un comando personalizado en `~/.claude/commands/revisar-pr.md`:

```markdown
# Revisar Pull Request

Analiza el código del PR actual siguiendo estas pautas:

1. **Seguridad**: Busca vulnerabilidades comunes (XSS, SQL injection, secretos expuestos)
2. **Rendimiento**: Identifica operaciones costosas o algoritmos ineficientes
3. **Cobertura de tests**: Verifica que los cambios tienen tests adecuados
4. **Convenciones**: Confirma que sigue el estilo del proyecto definido en CLAUDE.md

Formato de respuesta:
- Resumen ejecutivo (2-3 oraciones)
- Lista de hallazgos por severidad
- Sugerencias de mejora concretas con ejemplos de código
```

:::info
Los comandos slash se invocan con `/user:revisar-pr` dentro de una sesión de Claude Code.
:::

---

## Gemini CLI

Gemini CLI utiliza **archivos de contexto** (`GEMINI.md`) y **extensiones** para definir comportamientos reutilizables. El archivo `GEMINI.md` en la raíz del proyecto actúa como instrucción persistente que se inyecta en cada sesión.

```markdown
<!-- GEMINI.md en la raíz del proyecto -->
# Contexto del Proyecto: API de Pagos

## Stack Tecnológico
- Backend: Node.js 20 + Express
- Base de datos: PostgreSQL 15 con Prisma ORM
- Tests: Jest + Supertest
- CI/CD: GitHub Actions

## Convenciones de Código
- Todas las funciones deben tener tipos TypeScript explícitos
- Los errores se manejan con el patrón Result<T, E>
- Los nombres de variables en inglés, comentarios en español

## Skills Implícitos
Cuando generes código:
- Siempre incluye manejo de errores
- Agrega JSDoc a funciones públicas
- Escribe el test unitario correspondiente en el mismo bloque de respuesta

## Restricciones
- No uses `any` en TypeScript
- No hagas consultas directas a la BD, siempre usa el repositorio
```

---

## Cursor

En Cursor, los **Rules** (reglas en `.cursor/rules/`) funcionan como skills reutilizables que se aplican automáticamente según el contexto. Son archivos `.mdc` (Markdown con metadatos) que definen instrucciones específicas para diferentes tipos de archivos o tareas.

```markdown
<!-- .cursor/rules/typescript.mdc -->
---
description: Reglas para archivos TypeScript
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

# Reglas TypeScript

## Tipos
- Usa tipos explícitos siempre, nunca `any`
- Prefiere `interface` sobre `type` para objetos
- Usa `readonly` donde los datos no deban mutar

## Funciones
- Máximo 20 líneas por función
- Nombres descriptivos en inglés (verbos para funciones: `getUserById`, `createOrder`)
- Documenta con JSDoc las funciones exportadas

## Manejo de Errores
- Usa `Result<T, E>` en lugar de `throw`
- Los errores deben ser tipos explícitos, nunca `Error` genérico

## Ejemplo Correcto
\`\`\`typescript
interface UserRepository {
  readonly findById: (id: string) => Promise<Result<User, NotFoundError>>;
}
\`\`\`
```

:::warning
Los archivos `.mdc` con `alwaysApply: true` se inyectan en CADA conversación del contexto correspondiente. Evita hacerlos demasiado largos o ralentizarás las respuestas.
:::

---

## Tabla Comparativa

| Característica | GitHub Copilot CLI | Claude Code | Gemini CLI | Cursor |
|---|---|---|---|---|
| Mecanismo | Agent YAML (`tools:`) | CLAUDE.md + slash commands | GEMINI.md + extensions | `.cursor/rules/*.mdc` |
| Alcance usuario | `~/.copilot/agents/` | `~/.claude/commands/` | `~/.gemini/` | `~/.cursor/rules/` |
| Alcance repo | `.github/copilot/agents/` | `CLAUDE.md` | `GEMINI.md` | `.cursor/rules/` |
| Invocación | `@nombre-agente` | `/user:nombre` | Automático | Automático por glob |
| Reutilizable entre proyectos | ✅ (nivel usuario) | ✅ (comandos globales) | ⚠️ Parcial | ⚠️ Solo si en `~` |
| Composición de skills | ✅ Múltiples agentes | ⚠️ Manual | ❌ No formal | ⚠️ Múltiples archivos |

:::tip Recomendación
Para proyectos en equipo, define los skills a nivel de repositorio (`.github/copilot/agents/` o `.cursor/rules/`) para que todos los miembros se beneficien automáticamente.
:::
