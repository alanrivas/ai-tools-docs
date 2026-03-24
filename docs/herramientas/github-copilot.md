---
sidebar_position: 2
title: GitHub Copilot
---

# GitHub Copilot (CLI y VS Code)

GitHub Copilot es el asistente de IA de GitHub. Existe en dos formas principales: la extensión de **VS Code** y la **CLI** (`gh copilot`). Ambas comparten el mismo concepto de instrucciones de repositorio, pero tienen configuraciones distintas.

---

## ¿Qué es GitHub Copilot?

GitHub Copilot es un producto de GitHub (Microsoft/OpenAI/Anthropic) que integra IA en tu flujo de trabajo de desarrollo. Puede usar diferentes modelos de fondo (Claude Sonnet, GPT-4o, Gemini) según la configuración, pero el **producto siempre es GitHub Copilot**.

:::warning Recuerda
Si GitHub Copilot CLI usa Claude Sonnet internamente, la configuración de agentes sigue yendo en `~/.copilot/agents/`. No en `~/.claude/`. El producto define la ubicación, no el modelo.
:::

---

## Scopes: Global vs. Repositorio

GitHub Copilot tiene dos niveles de configuración:

### Scope Global (usuario)
- **CLI:** `~/.copilot/agents/` — agentes personalizados
- **VS Code:** `%APPDATA%\Code\User\globalStorage\github.copilot-chat\` (Windows)

Las configuraciones globales aplican a todos los proyectos en los que trabajes.

### Scope de Repositorio
- `.github/copilot-instructions.md` — instrucciones específicas del repo (compartidas en el equipo)
- `AGENTS.md` — descripción de agentes disponibles en el repo

Las configuraciones de repositorio se comparten con todo el equipo via control de versiones.

:::tip Referencia visual
Para ver la estructura completa de carpetas de GitHub Copilot CLI y VS Code, y cómo se compara con otras herramientas, consulta la [guía de estructura de carpetas](./estructura-carpetas.md#-github-copilot-cli).
:::

---

## Sistema de Agentes en GitHub Copilot CLI

Los agentes son entidades de IA especializadas que puedes invocar con `@nombre-del-agente`. Cada agente tiene un propósito específico y puede tener acceso a herramientas concretas.

### Estructura de un agente YAML

Los agentes se definen como archivos `.yaml` o `.yml` en `~/.copilot/agents/`:

```yaml
# ~/.copilot/agents/code-reviewer.yaml
name: code-reviewer
description: Revisa código y sugiere mejoras de calidad, seguridad y rendimiento
version: "1.0"

instructions: |
  Eres un revisor de código experto. Cuando analices código:
  1. Identifica problemas de seguridad (inyección SQL, XSS, secrets expuestos)
  2. Sugiere mejoras de rendimiento con ejemplos concretos
  3. Verifica que se siguen los patrones del proyecto
  4. Proporciona feedback constructivo y educativo
  
  Formato de respuesta: usa listas con emoji para categorizar problemas.
  - 🔴 Crítico: debe corregirse antes del merge
  - 🟡 Advertencia: debería corregirse
  - 🟢 Sugerencia: mejora opcional

tools:
  - name: read_file
    description: Lee el contenido de archivos del repositorio
  - name: search_code
    description: Busca patrones en el código base
```

### Invocar un agente

```bash
# Desde la CLI
gh copilot chat --agent=code-reviewer "Revisa el archivo src/auth/login.ts"

# En modo interactivo
gh copilot chat
> @code-reviewer ¿Hay problemas de seguridad en este archivo?
```

---

## Instrucciones de Repositorio

### `.github/copilot-instructions.md`

Este archivo proporciona contexto permanente a GitHub Copilot sobre tu proyecto. Se aplica **automáticamente** en todas las conversaciones dentro del repositorio.

```markdown
# Instrucciones para GitHub Copilot

## Contexto del Proyecto
Este es un API REST de e-commerce construido con Node.js, TypeScript y PostgreSQL.
Framework: Express 5, ORM: Prisma, Testing: Jest + Supertest.

## Convenciones de Código
- Usa `async/await` en lugar de callbacks o promesas encadenadas
- Todos los handlers de Express deben estar envueltos en `asyncHandler()`
- Los tipos deben definirse en `src/types/` y exportarse desde `src/types/index.ts`
- Usa `zod` para validación de entrada en todos los endpoints

## Patrones Prohibidos
- ❌ No uses `any` en TypeScript — usa `unknown` y narrowing
- ❌ No uses `console.log` en producción — usa el logger (`import logger from '@/utils/logger'`)
- ❌ No hagas queries SQL directas — usa Prisma siempre

## Estructura de Respuesta API
Todos los endpoints deben devolver:
```json
{
  "success": true,
  "data": {},
  "meta": { "timestamp": "ISO-8601" }
}
```

## Seguridad
- Todos los endpoints privados requieren el middleware `authenticate()`
- Valida y sanitiza SIEMPRE el input del usuario antes de procesarlo
- Los secrets van en variables de entorno, nunca hardcodeados
```

:::tip Por qué esto es poderoso
Sin este archivo, necesitas re-explicar el contexto del proyecto en cada conversación. Con él, Copilot ya sabe que usas Prisma, que no debe usar `console.log`, y que los tipos van en `src/types/`.
:::

---

## GitHub Copilot en VS Code

En VS Code, además de las instrucciones de repo, puedes:

- Usar **Copilot Chat** en el panel lateral
- Invocar agentes con `@workspace`, `@vscode`, `@terminal`
- Usar `/commands` como `/explain`, `/fix`, `/tests`, `/doc`

### Instrucciones personalizadas en VS Code

Puedes definir instrucciones globales en la configuración de VS Code:

```json
// settings.json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "Siempre escribe código en TypeScript. Usa interfaces en lugar de type aliases para objetos."
    },
    {
      "file": ".github/copilot-instructions.md"
    }
  ]
}
```

---

## Flujo de trabajo recomendado

```bash
# 1. Crear instrucciones del repositorio
mkdir -p .github
echo "# Contexto del proyecto..." > .github/copilot-instructions.md
git add .github/copilot-instructions.md
git commit -m "feat: add Copilot instructions"

# 2. Crear agentes personalizados (global)
mkdir -p ~/.copilot/agents
cat > ~/.copilot/agents/test-generator.yaml << 'EOF'
name: test-generator
description: Genera tests unitarios completos con Jest
instructions: |
  Genera tests Jest completos con:
  - Casos felices y casos de error
  - Mocks para dependencias externas
  - Nombres descriptivos en español
  - Cobertura de edge cases
EOF

# 3. Usar el agente
gh copilot chat --agent=test-generator "Genera tests para src/services/userService.ts"
```
