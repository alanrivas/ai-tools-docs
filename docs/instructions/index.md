---
sidebar_position: 1
title: Instructions y Prompts
slug: /instructions
---

# Instructions y Prompts del Sistema

Las instrucciones (o "system prompts") son texto que le das a la IA antes de que empiece a responder. Definen el **contexto permanente** de todas tus conversaciones con ella: quién es, qué sabe de tu proyecto, qué puede y no puede hacer.

---

## Definición

Las **instrucciones del sistema** son:

1. **Contexto persistente**: información que la IA tiene disponible en TODA la conversación, sin que tengas que repetirla
2. **Restricciones de comportamiento**: qué puede y qué no puede hacer
3. **Convenciones del proyecto**: estilo de código, patrones, nomenclatura
4. **Información del dominio**: qué hace el proyecto, qué tecnologías usa

La diferencia entre instrucciones y un prompt normal:

```
Prompt normal (en cada mensaje):
  "Eres un experto en TypeScript. Usamos Express. No uses any. 
   Siempre usa async/await. Ahora, genera un endpoint para..."

Con instrucciones del sistema:
  [Una vez, en el archivo de instrucciones]:
  "Eres un experto en TypeScript. Usamos Express. No uses any..."
  
  [En cada conversación]:
  "Genera un endpoint para..."
```

---

## ¿Qué problema resuelven?

### El problema: re-explicar el contexto infinitamente

Sin instrucciones persistentes:

- Cada conversación nueva comienza desde cero
- La IA no sabe que usas TypeScript (y genera JavaScript)
- La IA no sabe que tienes un middleware de errores (y duplica lógica)
- La IA no sabe tu estilo de naming (y rompe consistencia)
- Pasas el 30% de cada conversación "onboarding" a la IA

Con instrucciones:

- La IA ya sabe todo el contexto desde el primer mensaje
- Puedes ir directo al punto ("genera endpoint de /users/`{id}`")
- El resultado ya sigue tus convenciones sin pedírselo
- El equipo completo tiene el mismo contexto

---

## ¿Cómo se hacía antes?

Antes de los archivos de instrucciones:

**Opción 1: Repetir en cada conversación**
```
"Contexto: proyecto TypeScript, Express, Prisma, PostgreSQL. 
Convenciones: async/await, tipos explícitos, no any, errors con 
middleware central. Ahora..."
```
Tedioso, inconsistente entre miembros del equipo.

**Opción 2: Archivo de prompts personal**
Guardar prompts en un README o Notion y copiar-pegar. Nadie lo mantiene actualizado.

**Opción 3: Nada**
Resultado: la IA genera código que no sigue ninguna convención del proyecto.

---

## Archivos de instrucciones por herramienta

Cada herramienta tiene su propio archivo de instrucciones. Recuerda: **el archivo sigue al producto, no al modelo**.

| Producto | Archivo global | Archivo por repo |
|---|---|---|
| GitHub Copilot CLI/VS Code | (en settings de VS Code) | `.github/copilot-instructions.md` |
| GitHub Copilot CLI | (en settings del agente) | `AGENTS.md` |
| Claude Code | `~/.claude/CLAUDE.md` | `CLAUDE.md` (raíz del repo) |
| Gemini CLI | `~/.gemini/GEMINI.md` | `GEMINI.md` (raíz del repo) |
| Cursor | (en Cursor Settings) | `.cursorrules` / `.cursor/rules/*.mdc` |

### Precedencia

En todas las herramientas, el archivo del repositorio **tiene mayor prioridad** que el global:

```
[Instrucciones globales del usuario]
      ↓ (se combinan, repo tiene prioridad)
[Instrucciones del repositorio]
      ↓ (resultado)
[Contexto que recibe la IA]
```

---

## Anatomía de buenas instrucciones

Una buena instrucción tiene estas secciones:

```markdown
# Contexto del Proyecto
Qué es el proyecto, para qué sirve, quiénes lo usan.

## Stack Tecnológico
Lista de tecnologías, frameworks y versiones.

## Estructura del Proyecto
Dónde va cada cosa (brevemente).

## Convenciones de Código
Reglas de estilo, naming, patrones a seguir.

## Comandos Importantes
npm run dev, npm test, npm run build, etc.

## Lo que NUNCA debes hacer
Reglas que nunca deben violarse (explica el por qué).

## Cómo trabajar en este proyecto
Flujo de trabajo esperado para nuevas features.
```

---

## Instrucciones vs. Agentes

Una confusión común es pensar que las instrucciones reemplazan a los agentes. Son complementarias:

| Aspecto | Instrucciones del sistema | Agentes |
|---|---|---|
| Propósito | Contexto del proyecto | Tarea específica |
| Alcance | Todas las conversaciones | Conversación específica |
| Contenido | Convenciones, stack, estructura | Comportamiento especializado |
| Ejemplos | "Usamos TypeScript estricto" | "Revisar PRs con criterio X" |

:::tip La combinación ganadora
El escenario ideal es: instrucciones del sistema que explican el proyecto + agentes especializados que saben cómo trabajar en ese contexto. Los agentes pueden incluir explícitamente el archivo de instrucciones del repo para tener ambos contextos.
:::

---

## Instrucciones para equipos

El mayor valor de los archivos de instrucciones en el repositorio es que se comparten con todo el equipo. Cuando alguien nuevo llega al proyecto:

```bash
git clone proyecto
# Las instrucciones de IA ya están incluidas
# .github/copilot-instructions.md → Copilot ya sabe el contexto
# CLAUDE.md → Claude Code ya sabe el contexto
# .cursorrules → Cursor ya sabe el contexto
```

No hay "configuración de IA" manual que hacer. El contexto vive en el código.
