---
sidebar_position: 1
title: Flujos de Trabajo
slug: /flujos
---

# Flujos de Trabajo con IA

Los flujos de trabajo combinan múltiples características — agentes, instrucciones, hooks, skills y MCP servers — en pipelines coordinados para automatizar tareas complejas del desarrollo de software.

## ¿Qué es un Flujo de Trabajo de IA?

Un flujo de trabajo de IA es una secuencia orquestada de pasos donde el agente utiliza diferentes herramientas y capacidades para completar una tarea que normalmente requeriría múltiples interacciones manuales.

```
Usuario                Agente                  Herramientas
   │                     │                         │
   │──── Instrucción ────►│                         │
   │                     │──── Lee archivos ───────►│
   │                     │◄─── Contenido ───────────│
   │                     │──── Analiza código        │
   │                     │──── Ejecuta tests ───────►│
   │                     │◄─── Resultados ───────────│
   │                     │──── Genera reporte        │
   │◄─── Respuesta final─│                         │
```

## Flujos Disponibles en Esta Sección

| Flujo | Descripción | Herramientas Necesarias |
|---|---|---|
| [Revisión de PRs](./revision-pr.md) | Análisis automático de pull requests con foco en seguridad y calidad | Agente + Instructions + MCP GitHub |
| [Generación de Tests](./generar-tests.md) | Creación automática de tests unitarios y de integración | Agente + Skill + Hook PreToolUse |
| [Documentación de Código](./documentar-codigo.md) | Generación de JSDoc, docstrings y README automáticos | Agente + Instructions |

## Principios de Diseño de Flujos

### 1. Especialización de Agentes

Crea agentes especializados para tareas específicas en lugar de un agente genérico que intente hacer todo:

```yaml
# Preferible: agentes especializados
code-reviewer.yml    → Solo revisión de código
test-generator.yml   → Solo generación de tests
doc-writer.yml       → Solo documentación
```

### 2. Instrucciones como Contrato

Las instrucciones definen el contrato entre el desarrollador y el agente. Deben ser:
- **Específicas**: Qué hacer y qué no hacer
- **Verificables**: El agente puede comprobar que las cumple
- **Actualizables**: El equipo puede modificarlas con el tiempo

### 3. Hooks para Guardrails

Usa hooks (cuando estén disponibles) para implementar validaciones automáticas que protegen la base de código:

```json
{
  "PreToolUse": [{
    "matcher": "Write",
    "hooks": [{
      "type": "command",
      "command": "~/.claude/hooks/validate-file-path.sh"
    }]
  }]
}
```

### 4. MCP Servers para Integración

Los MCP servers extienden las capacidades del agente hacia sistemas externos: GitHub API, bases de datos, sistemas de tickets, etc.

## Prerequisitos Comunes

Antes de implementar los flujos de esta sección, asegúrate de tener:

:::info
- Una herramienta de IA instalada y configurada (Copilot CLI, Claude Code, Gemini CLI o Cursor)
- Acceso al repositorio donde aplicarás los flujos
- Permisos para crear archivos de configuración en las rutas necesarias
:::

## Combinando Flujos

Los flujos pueden combinarse. Por ejemplo, un flujo completo de PR podría ser:

1. **Generación de tests** → antes de hacer el PR, el agente genera tests para el nuevo código
2. **Revisión de PR** → cuando se abre el PR, el agente lo revisa automáticamente
3. **Documentación** → si el PR es aprobado, el agente actualiza la documentación

Cada flujo siguiente en esta sección incluye ejemplos completos y listos para usar.
