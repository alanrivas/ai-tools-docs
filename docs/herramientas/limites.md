---
sidebar_position: 6
title: Límites y Precios
---

# Límites y Precios

Comparación de planes, límites de uso y precios de las principales herramientas de IA para desarrolladores.

:::warning Esta información puede estar desactualizada
Los precios y límites cambian frecuentemente. Consulta siempre la documentación oficial de cada herramienta antes de tomar decisiones de compra.

- [GitHub Copilot Pricing](https://github.com/features/copilot#pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Google AI Studio](https://ai.google.dev/pricing)
- [Cursor Pricing](https://cursor.com/pricing)
:::

---

## GitHub Copilot

### Planes

| Plan | Precio | Completaciones | Chat |
|---|---|---|---|
| **Free** | Gratis | 2.000/mes | 50 mensajes/mes |
| **Pro** | $10/mes | Ilimitadas | Ilimitado |
| **Business** | $19/usuario/mes | Ilimitadas | Ilimitado |
| **Enterprise** | $39/usuario/mes | Ilimitadas | Ilimitado + políticas de empresa |

### Límites técnicos

- **Ventana de contexto**: Depende del modelo subyacente (Claude Sonnet 4.5, GPT-4o, etc.). Típicamente 32K-200K tokens.
- **Rate limits**: El plan Free tiene límites de velocidad más estrictos durante horas punta.
- **Herramientas de agente**: Las capacidades de agente avanzadas (multi-step, tools) requieren plan Pro o superior.
- **Modelos disponibles**: El plan Free tiene acceso limitado a modelos. Pro y Business dan acceso a todos los modelos disponibles.

### Características exclusivas de planes pagos

- Agentes con múltiples herramientas
- Acceso a modelos más capaces (Claude Opus, GPT-4o)
- Sin límites de tasa en horas punta
- Soporte para políticas de organización (Enterprise)

---

## Claude Code (Anthropic)

### Opciones de acceso

| Opción | Precio | Límite |
|---|---|---|
| **Claude Pro** | $20/mes | Uso moderado (~5x más que free) |
| **Claude Max 5x** | $100/mes | 5x más que Pro |
| **Claude Max 20x** | $200/mes | 20x más que Pro |
| **API (pay-per-use)** | Por tokens | Sin límite fijo |

### Precios API (aproximados para Claude Sonnet 4.5)

| Tipo | Precio por MTok |
|---|---|
| **Input tokens** | ~$3 |
| **Output tokens** | ~$15 |
| **Cache read** | ~$0.30 |
| **Cache write** | ~$3.75 |

> Un MTok = 1 millón de tokens. Una sesión típica de Claude Code consume entre 50K-500K tokens dependiendo de la complejidad de la tarea.

### Límites técnicos

- **Ventana de contexto**: 200K tokens (Claude Sonnet/Opus).
- **Rate limits API**: Depende del tier de uso de la API (Tier 1-5 según el gasto acumulado).
- **Tool calls por sesión**: Sin límite técnico, pero el costo se acumula por tokens.
- **Hooks**: Disponibles en todos los planes.
- **Agentes personalizados**: Disponibles en todos los planes.

---

## Gemini CLI (Google)

### Opciones de acceso

| Opción | Precio | Límite |
|---|---|---|
| **API Free Tier** | Gratis | 15 RPM, 1M TPM (Gemini 1.5 Flash) |
| **API Pay-as-you-go** | Por tokens | Sin límite fijo |
| **Google AI Studio** | Gratis | Interfaz web con límites generosos |

### Precios API (aproximados)

| Modelo | Input por MTok | Output por MTok |
|---|---|---|
| **Gemini 2.0 Flash** | Gratis (free tier) | Gratis (free tier) |
| **Gemini 1.5 Flash** | $0.075 (≤128K ctx) | $0.30 |
| **Gemini 1.5 Pro** | $3.50 (≤128K ctx) | $10.50 |

### Límites técnicos

- **Ventana de contexto**: Hasta 1 millón de tokens (Gemini 1.5 Pro), 128K tokens (Gemini 1.5 Flash).
- **Rate limits free tier**: 15 requests por minuto (RPM), 1 millón de tokens por minuto (TPM).
- **Multimodal**: Gemini acepta imágenes, audio y video además de texto, sin coste adicional en el precio por token.
- **Caché de contexto**: Disponible para reducir costos en sesiones repetidas con el mismo contexto.

---

## Cursor

### Planes

| Plan | Precio | Completaciones | Peticiones premium |
|---|---|---|---|
| **Free (Hobby)** | Gratis | 2.000/mes | 50/mes |
| **Pro** | $20/mes | Ilimitadas | 500/mes (luego $0.04 cada una) |
| **Business** | $40/usuario/mes | Ilimitadas | 500/mes por usuario |

### Límites técnicos

- **Peticiones rápidas (fast requests)**: Modelos rápidos como GPT-4o Mini, ilimitadas en todos los planes.
- **Peticiones premium**: Modelos avanzados (Claude Opus, GPT-4o, o1-preview). Limitadas según plan.
- **Agent mode**: Disponible en todos los planes, pero consume peticiones premium por cada tool call.
- **Background Agents**: Requieren plan Pro o Business.
- **Indexación del codebase**: Incluida en todos los planes, sin límite de tamaño (indexación local).

---

## Comparación Rápida

| Herramienta | Plan mínimo funcional | Costo mensual mín. | Contexto máx. | Agentes |
|---|---|---|---|---|
| **GitHub Copilot** | Free (limitado) | $0 | ~200K tokens | Pro+ |
| **Claude Code** | Pro o API | $20 / pay-per-use | 200K tokens | Todos los planes |
| **Gemini CLI** | Free tier API | $0 | 1M tokens | Todos los planes |
| **Cursor** | Free (limitado) | $0 | ~200K tokens | Free (limitado) |

### ¿Cuál elegir según tu caso de uso?

- **Quieres empezar gratis**: Gemini CLI (free tier generoso) o GitHub Copilot Free.
- **Uso profesional intensivo**: Claude Code Pro/Max para la mejor calidad en tareas complejas.
- **Prefieres IDE integrado**: Cursor Pro para flujo de trabajo visual.
- **Equipo de empresa**: GitHub Copilot Business o Enterprise para gestión centralizada.

:::tip Optimizar costos
Si usas la API directamente, activa el **prompt caching** cuando tengas instrucciones repetitivas. El costo de leer del caché es entre 10x y 100x menor que procesar los tokens de nuevo. Especialmente útil para `CLAUDE.md` o `GEMINI.md` largos que se cargan en cada sesión.
:::
