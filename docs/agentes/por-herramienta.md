---
sidebar_position: 2
title: Agentes por Herramienta
---

# Agentes por Herramienta

Cada herramienta de IA tiene su propia forma de definir y usar agentes. Aquí encontrarás las instrucciones específicas para cada una.

---

## 🔵 GitHub Copilot CLI

### Cómo crear un agente

Los agentes de GitHub Copilot CLI se definen como archivos YAML en `~/.copilot/agents/`. Cada archivo es un agente.

#### Estructura del archivo YAML

```yaml
# ~/.copilot/agents/nombre-del-agente.yaml
name: nombre-del-agente          # Nombre para invocarlo con @nombre-del-agente
description: Descripción corta   # Aparece en el listado de agentes
version: "1.0"                   # Versión del agente

# Instrucciones que definen el comportamiento del agente
instructions: |
  Aquí van las instrucciones detalladas.
  Pueden ser múltiples líneas.
  Define el rol, el comportamiento y las restricciones.

# Herramientas a las que tiene acceso el agente
tools:
  - name: read_file
    description: Lee archivos del repositorio
  - name: search_code
    description: Busca patrones en el código base
  - name: write_file
    description: Crea o modifica archivos

# Contexto adicional (opcional)
context:
  - type: file
    path: .github/copilot-instructions.md  # Incluye las instrucciones del repo
```

#### Invocar el agente

```bash
# En sesión interactiva
gh copilot chat
> @nombre-del-agente Describe tu tarea aquí

# Directamente desde la línea de comandos
gh copilot chat --agent=nombre-del-agente "Describe tu tarea"

# Ver todos los agentes disponibles
gh copilot agents list
```

### Ejemplo completo: Agente de revisión de PRs

```yaml
# ~/.copilot/agents/pr-reviewer.yaml
name: pr-reviewer
description: Revisa Pull Requests y da feedback de calidad, seguridad y rendimiento
version: "1.0"

instructions: |
  Eres un senior developer con experiencia en revisión de código.
  
  Al revisar un PR, sigue SIEMPRE este orden:
  
  ## 1. Seguridad (🔴 Crítico)
  - Busca credenciales o secrets hardcodeados
  - Verifica sanitización de inputs de usuario
  - Detecta posibles inyecciones (SQL, XSS, SSRF)
  - Revisa permisos y autenticación
  
  ## 2. Corrección (🟡 Importante)
  - ¿La lógica cumple los requisitos del ticket?
  - ¿Hay manejo de errores adecuado?
  - ¿Los edge cases están cubiertos?
  - ¿Los tests existen y son suficientes?
  
  ## 3. Calidad (🟢 Sugerencia)
  - ¿El código es legible sin comentarios?
  - ¿Hay duplicación que debería extraerse?
  - ¿Los nombres de variables/funciones son claros?
  - ¿Sigue las convenciones del proyecto?
  
  ## Formato de respuesta
  Para cada archivo revisado, usa este formato:
  
  ### `nombre-del-archivo.ts`
  - 🔴 [CRÍTICO] Descripción del problema + línea + sugerencia de fix
  - 🟡 [IMPORTANTE] Descripción + sugerencia
  - 🟢 [SUGERENCIA] Descripción + alternativa
  
  Al final, da un **Resumen del PR** con:
  - ✅ Aprobado / ⚠️ Requiere cambios / 🚫 No aprobado
  - Cantidad de issues por categoría
  - Comentario general

tools:
  - name: read_file
    description: Lee archivos para revisión
  - name: search_code
    description: Busca patrones en el código base
  - name: list_directory
    description: Lista archivos modificados

context:
  - type: file
    path: .github/copilot-instructions.md
```

---

## 🟠 Claude Code

En Claude Code, el concepto de "agente" se maneja de forma diferente. En lugar de archivos YAML separados, Claude Code usa **perfiles de instrucciones** y **hooks** para especializar el comportamiento.

### Agente mediante CLAUDE.md especializado

Puedes crear un `CLAUDE.md` muy específico en una subcarpeta del proyecto:

```markdown
<!-- src/security/CLAUDE.md -->
# Modo: Auditor de Seguridad

Cuando trabajes en esta carpeta, actúa como un auditor de seguridad experto.

## Tus responsabilidades
- Analizar código en busca de vulnerabilidades OWASP Top 10
- Verificar el correcto uso de criptografía
- Validar que los inputs están sanitizados
- Documentar los hallazgos en formato CVE

## NO hagas
- Escribir código nuevo (solo auditar)
- Modificar archivos existentes
- Ignorar ningún warning, aunque parezca menor
```

### Usando subagentes en Claude Code

Claude Code permite lanzar subagentes en tareas paralelas:

```bash
# Lanzar múltiples análisis en paralelo
claude "Usando subagentes: 
1. Analiza la seguridad de src/auth/
2. Genera tests para src/services/
3. Documenta src/api/
Hazlo en paralelo y dame un reporte final"
```

---

## 🟣 Cursor — Modo Agente

Cursor implementa el modo agente en su **Composer** (panel de edición multi-archivo).

### Activar modo agente

1. `Ctrl+I` (Windows/Linux) o `Cmd+I` (Mac) para abrir Composer
2. En el selector de modo, elige **"Agent"** en lugar de "Normal"
3. Describe la tarea completa

### Ejemplo de prompt para el agente de Cursor

```
Tarea para el agente:

Implementa autenticación JWT completa siguiendo las reglas del proyecto en .cursorrules.

Necesito:
1. src/middleware/authenticate.ts — middleware que valida JWT
2. src/services/authService.ts — lógica de login, registro y refresh
3. src/routes/auth.ts — endpoints POST /auth/login, /auth/register, /auth/refresh
4. src/types/auth.ts — tipos TypeScript para auth
5. tests/auth.test.ts — tests de integración completos

Usa el patrón de los controladores existentes como referencia: @file:src/controllers/userController.ts
```

### Configuración de agente en .cursor/rules/

```markdown
---
description: Reglas para el modo agente - tareas de múltiples pasos
alwaysApply: false
---

# Modo Agente

Cuando ejecutes tareas de múltiples pasos:

1. **Planifica antes de actuar**: lista los archivos que vas a crear/modificar
2. **Verifica que no rompes nada**: revisa las importaciones existentes
3. **Mantén consistencia**: sigue los patrones del código existente
4. **Documenta los cambios**: actualiza README si el cambio es significativo
```

---

## 🔴 Gemini CLI

Gemini CLI usa una combinación de `GEMINI.md` y configuración en `~/.gemini/settings.json` para definir comportamientos especializados.

```json
// ~/.gemini/settings.json
{
  "systemPrompt": "Eres un asistente experto en Python y BigQuery. Siempre valida el input antes de ejecutar queries.",
  "tools": {
    "enabled": ["ReadFileTool", "WriteFileTool", "ShellTool"]
  }
}
```

:::info Evolución del soporte de agentes
El soporte de agentes varía entre versiones de cada herramienta. Consulta la documentación oficial de cada producto para conocer las capacidades más actualizadas, especialmente para Claude Code y Gemini CLI que están evolucionando rápidamente.
:::
