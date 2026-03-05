---
sidebar_position: 2
title: Ejemplos Prácticos de Skills
---

# Ejemplos Prácticos de Skills

Aquí encontrarás skills reales que puedes usar directamente en tus proyectos.

---

## Skill 1: Búsqueda Semántica en el Código

Este skill permite a los agentes encontrar código relevante en proyectos grandes.

```yaml
# ~/.copilot/skills/buscar-en-codigo.yaml
name: buscar-en-codigo
description: |
  Busca código relevante en el proyecto usando patrones semánticos.
  Usa este skill cuando necesites encontrar dónde se implementa algo,
  qué archivos están relacionados con una funcionalidad, o cómo
  se usa una función/clase en el proyecto.

instructions: |
  Para buscar código efectivamente:
  
  ## Búsqueda por funcionalidad
  Cuando te pidan encontrar "dónde se maneja X", busca:
  1. El nombre obvio de la función/clase
  2. Variantes de naming (camelCase, snake_case, kebab-case)
  3. Comentarios relacionados
  4. Tests que cubran esa funcionalidad
  
  ## Búsqueda por patrón
  Usa patrones regex para encontrar:
  - Importaciones: `import.*NombreClase`
  - Uso: `new NombreClase|NombreClase\(`
  - Definición: `class NombreClase|function nombreFuncion`
  
  ## Reporte de resultados
  Para cada resultado, muestra:
  - Ruta del archivo
  - Línea aproximada
  - Contexto (2-3 líneas alrededor)
  - Relevancia (alta/media/baja)

tools:
  - name: search_code
    description: Búsqueda por texto/regex en el código
  - name: list_directory
    description: Explorar estructura del proyecto
  - name: read_file
    description: Leer archivos encontrados para más contexto
```

### Invocar el skill desde un agente

```yaml
# ~/.copilot/agents/code-navigator.yaml
name: code-navigator
description: Navega y explica la arquitectura del proyecto
version: "1.0"

instructions: |
  Eres un experto en la arquitectura del proyecto actual.
  Ayudas al equipo a entender cómo está organizado el código y
  dónde encontrar cosas específicas.
  
  Siempre:
  - Muestra las rutas completas de los archivos
  - Explica el patrón de diseño usado
  - Sugiere archivos relacionados que podrían ser relevantes

skills:
  - buscar-en-codigo

tools:
  - name: read_file
    description: Lee archivos para dar contexto
```

---

## Skill 2: Generador de Documentación JSDoc/TSDoc

```yaml
# ~/.copilot/skills/generar-jsdoc.yaml
name: generar-jsdoc
description: |
  Genera documentación JSDoc o TSDoc para funciones, clases y métodos.
  Usa este skill cuando necesites documentar código TypeScript o JavaScript.
  
  Produce documentación que incluye: descripción, parámetros, valor de retorno,
  excepciones que puede lanzar, y ejemplos de uso.

instructions: |
  Para generar documentación de calidad:
  
  ## Análisis previo
  Antes de documentar, entiende:
  1. ¿Qué hace la función/clase? (no lo que dice el nombre, sino el comportamiento)
  2. ¿Cuáles son los casos de uso principales?
  3. ¿Hay comportamiento no obvio que deba documentarse?
  4. ¿Qué errores puede lanzar?
  
  ## Formato TSDoc
  ```typescript
  /**
   * Breve descripción en una línea.
   * 
   * Descripción extendida (opcional) que explica el contexto,
   * casos de uso, o comportamiento especial a tener en cuenta.
   * 
   * @param nombreParam - Descripción del parámetro y su propósito
   * @param opciones - Objeto de configuración
   * @param opciones.propiedad - Descripción de cada propiedad
   * @returns Descripción de lo que devuelve y en qué condiciones
   * @throws {NombreError} Cuándo se lanza este error
   * 
   * @example
   * ```typescript
   * // Ejemplo de uso típico
   * const resultado = miFuncion(param1, { opcion: valor });
   * console.log(resultado); // { success: true, data: ... }
   * ```
   * 
   * @example
   * ```typescript
   * // Ejemplo con manejo de error
   * try {
   *   const resultado = miFuncion(null);
   * } catch (error) {
   *   // NombreError cuando param es null
   * }
   * ```
   */
  ```
  
  ## Reglas de calidad
  - La primera línea debe ser una oración completa (no fragmento)
  - Los @param deben explicar el propósito, no el tipo (el tipo ya está en TypeScript)
  - El @returns debe describir CUÁNDO devuelve qué
  - Los ejemplos deben ser ejecutables y representativos
  - No documentes lo obvio: documenta lo que no es obvio

tools:
  - name: read_file
    description: Lee el código a documentar
  - name: write_file
    description: Escribe el código documentado
```

---

## Skill 3: Analizador de Performance

```yaml
# ~/.copilot/skills/analizar-performance.yaml
name: analizar-performance
description: |
  Analiza código en busca de problemas de rendimiento comunes.
  Identifica N+1 queries, operaciones bloqueantes, loops ineficientes,
  y otros problemas de performance.

instructions: |
  ## Problemas a buscar
  
  ### Base de datos
  - N+1 queries: loops que ejecutan queries dentro
  - Queries sin índices obvios (buscar por campos no indexados)
  - Select * cuando solo se necesitan algunos campos
  - Transacciones demasiado largas
  
  ### JavaScript/TypeScript
  - Operaciones síncronas bloqueantes en código async
  - Closures que crean memory leaks
  - Event listeners que no se remueven
  - Arrays grandes iterados múltiples veces (usar un solo reduce)
  - Regex complejos recompilados en cada iteración
  
  ### APIs
  - Endpoints que devuelven demasiados datos (sin paginación)
  - Llamadas secuenciales que podrían ser paralelas (Promise.all)
  - Cache que nunca expira o que nunca se usa
  
  ## Formato del reporte
  Para cada problema encontrado:
  
  **🐢 [TIPO] Descripción del problema**
  
  Código problemático (con línea):
  ```typescript
  // código lento
  ```
  
  Código optimizado:
  ```typescript
  // código rápido
  ```
  
  Impacto estimado: Alto/Medio/Bajo
  Razón técnica: Explicación de por qué esto es lento

tools:
  - name: read_file
    description: Lee el código a analizar
  - name: search_code
    description: Busca patrones de performance conocidos
```

---

## Cómo combinar skills en un agente

El verdadero poder de los skills aparece cuando los combinas:

```yaml
# ~/.copilot/agents/code-quality-assistant.yaml
name: code-quality-assistant
description: Asistente completo de calidad de código
version: "1.0"

instructions: |
  Eres un asistente de calidad de código. Tienes acceso a múltiples
  capacidades especializadas. Usa la más apropiada según la tarea.
  
  Cuando el usuario pida un "análisis completo", usa todos los skills
  en orden: performance → documentación → búsqueda de contexto.

skills:
  - analizar-performance      # Para problemas de rendimiento
  - generar-jsdoc             # Para documentación
  - buscar-en-codigo          # Para navegación del código

tools:
  - name: write_file
    description: Escribe reportes o código actualizado
  - name: run_command
    description: Ejecuta linters y tests
```

```bash
# Usar el agente combinado
gh copilot chat --agent=code-quality-assistant "Haz un análisis completo de src/services/orderService.ts"
```

:::info Reutilización real
Si actualizas el skill `analizar-performance` para detectar un nuevo patrón problemático, todos los agentes que lo usen (incluido `code-quality-assistant`) se benefician automáticamente del cambio.
:::
