---
sidebar_position: 2
title: Revisión de PRs con IA
---

# Revisión de PRs con IA

Este flujo automatiza la revisión de pull requests usando un agente especializado, instrucciones del proyecto y opcionalmente un MCP server para interactuar con la API de GitHub.

## Visión General del Flujo

```
1. Desarrollador abre PR
        │
        ▼
2. Agente code-reviewer lee los cambios
        │
        ▼
3. Analiza según instrucciones del proyecto
        │
        ▼
4. (Opcional) Hook registra la revisión
        │
        ▼
5. (Opcional) MCP GitHub publica comentarios en el PR
        │
        ▼
6. Reporte final al desarrollador
```

---

## Paso 1: Crear el Agente `code-reviewer`

### Para GitHub Copilot CLI

Crea el archivo `~/.copilot/agents/code-reviewer.yml` (nivel usuario) o `.github/copilot/agents/code-reviewer.yml` (nivel repositorio):

```yaml
name: code-reviewer
description: >
  Revisa pull requests en busca de problemas de seguridad, rendimiento,
  cobertura de tests y adherencia a las convenciones del proyecto.
tools:
  - read_file
  - list_directory
  - run_terminal_command
instructions: |
  Eres un revisor de código senior con experiencia en seguridad y arquitectura de software.

  ## Tu Proceso de Revisión

  1. **Lee los archivos modificados** usando read_file
  2. **Comprende el contexto** leyendo README.md y CLAUDE.md si existen
  3. **Analiza cada cambio** siguiendo los criterios de abajo
  4. **Genera un reporte** con el formato especificado

  ## Criterios de Revisión

  ### Seguridad (PRIORIDAD ALTA)
  - Inputs sin sanitizar que llegan a consultas SQL, comandos shell o HTML
  - Secretos o credenciales hardcodeadas
  - Exposición de información sensible en logs
  - Problemas de autenticación/autorización

  ### Rendimiento (PRIORIDAD MEDIA)
  - Consultas N+1 a base de datos
  - Operaciones síncronas que deberían ser asíncronas
  - Loops innecesarios o algoritmos O(n²) donde se puede hacer O(n)
  - Recursos que no se liberan (conexiones, file handles)

  ### Calidad del Código (PRIORIDAD NORMAL)
  - Funciones mayores de 30 líneas (sugerir refactoring)
  - Duplicación de código (DRY)
  - Nombres poco descriptivos
  - Falta de manejo de errores

  ### Tests (PRIORIDAD NORMAL)
  - Cambios en lógica de negocio sin tests correspondientes
  - Tests que no verifican casos límite
  - Mocks excesivos que ocultan lógica real

  ## Formato del Reporte

  ```
  ## Resumen de Revisión

  **Veredicto**: APROBADO / APROBADO CON SUGERENCIAS / REQUIERE CAMBIOS

  ### 🔴 Problemas Críticos (bloquean el merge)
  - [archivo:línea] Descripción del problema
    Sugerencia: cómo arreglarlo

  ### 🟡 Sugerencias de Mejora
  - [archivo:línea] Descripción

  ### 🟢 Aspectos Positivos
  - Qué está bien en este PR

  ### 📋 Checklist
  - [ ] Seguridad verificada
  - [ ] Tests presentes
  - [ ] Documentación actualizada
  ```
```

---

## Paso 2: Configurar Instrucciones del Proyecto

Crea o actualiza `.github/copilot-instructions.md` con las convenciones específicas de tu proyecto:

```markdown
# Instrucciones del Proyecto: API de E-commerce

## Stack
- Node.js 20 + TypeScript 5
- PostgreSQL con Prisma ORM
- Jest para tests (cobertura mínima: 80%)
- ESLint + Prettier

## Convenciones de Código
- Funciones asíncronas siempre con async/await, nunca callbacks
- Errores manejados con Result<T, E>, nunca throw en lógica de negocio
- Variables en camelCase, constantes en UPPER_SNAKE_CASE
- Máximo 20 líneas por función, 200 líneas por archivo

## Seguridad
- Todos los inputs externos validados con Zod antes de procesarse
- Queries de Prisma siempre con parámetros, nunca interpolación de strings
- JWT tokens verificados en el middleware, no en los controllers

## Lo que NUNCA debe mergearse
- console.log en código de producción
- .env en el repositorio
- TODO: sin ticket asociado
- Código comentado sin explicación
```

---

## Paso 3: Hook de Logging (Claude Code)

Si usas Claude Code, agrega un hook para registrar cada revisión:

```bash
#!/bin/bash
# ~/.claude/hooks/log-review.sh
INPUT=$(cat)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')

if [[ "$TOOL" == "Write" ]]; then
  FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // "unknown"')
  echo "[$TIMESTAMP] Revisión completada → $FILE" >> ~/.claude/reviews.log
fi

echo '{"decision": "allow"}'
```

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/log-review.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Paso 4: Invocar el Agente

### En GitHub Copilot CLI (chat mode)

```
@code-reviewer revisa los cambios en este PR para problemas de seguridad

@code-reviewer necesito revisión completa de src/payment/checkout.ts
```

### En Claude Code

```bash
claude "Actúa como code-reviewer y revisa los archivos modificados en el último commit. 
Usa git diff HEAD~1 para ver los cambios."
```

### Con contexto específico de archivos

```bash
# Primero obtén los archivos modificados
git diff --name-only HEAD~1

# Luego pídele al agente que los revise
@code-reviewer revisa estos archivos: src/auth/login.ts src/api/users.ts
```

---

## Paso 5: Integración con GitHub API via MCP (Opcional)

Para publicar comentarios directamente en el PR:

```json
// .github/copilot/mcp.json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Una vez configurado el MCP, el agente puede:

```
@code-reviewer revisa este PR y publica los comentarios directamente 
usando el MCP de GitHub. El PR es #142 en el repo mi-org/mi-repo.
```

:::tip Automatización con GitHub Actions
Puedes combinar este flujo con GitHub Actions para que la revisión se ejecute automáticamente cuando se abre un PR, sin necesidad de invocación manual.
:::

:::warning
Asegúrate de que el `GITHUB_TOKEN` tiene permisos de escritura en el repositorio antes de intentar publicar comentarios automáticamente.
:::
