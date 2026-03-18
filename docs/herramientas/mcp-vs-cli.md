---
sidebar_position: 5
title: MCP vs CLI - Eficiencia de Contexto
---

# MCP vs CLI: ¿Cuál Usa Más Tokens?

La respuesta corta: **Depende de cómo lo implementes, no de la tecnología misma.**

El mito surge porque hay diferencias reales de implementación. Vamos a analizarlas.

---

## ¿Qué es cada uno?

| | MCP | CLI |
|---|---|---|
| **¿Qué es?** | Protocol estandarizado para conectar tools al modelo | Interfaz de línea de comandos directa |
| **Abstracción** | Define schemas, recursos, prompts | Ejecución directa de comandos |
| **Overhead teórico** | Sí (definiciones + schemas) | No |
| **Integración** | Compleja pero escalable | Simple pero punto a punto |

---

## El Problema Real: Schemas Verbosos

MCP requiere escribir **definiciones explícitas** de cada tool. Esto puede ser verbose:

### ❌ MCP con Schema Verboso (INEFICIENTE)

```json
{
  "name": "analyze_code",
  "description": "Analyzes source code for potential issues including security vulnerabilities, performance bottlenecks, code quality problems, and architectural concerns. Uses advanced heuristics and pattern matching.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "The absolute file path to analyze. Must be a valid file path. Examples: /src/main.ts, src/components/Button.tsx, /api/routes.js"
      },
      "analysisType": {
        "type": "string",
        "enum": ["security", "performance", "quality", "architecture", "all"],
        "description": "The type of analysis to perform. 'security' checks for vulnerabilities, 'performance' identifies bottlenecks, 'quality' checks code style, 'architecture' looks at design patterns, 'all' runs everything"
      },
      "depth": {
        "type": "string",
        "enum": ["shallow", "medium", "deep"],
        "description": "Analysis depth: 'shallow' (quick checks), 'medium' (standard analysis), 'deep' (comprehensive)"
      }
    },
    "required": ["filePath"]
  }
}
```

**Tokens consumidos solo en el schema**: ~350 tokens

Si el agente llama esta herramienta 50 veces en una sesión:
```
50 calls × 350 tokens = 17,500 tokens SOLO en schemas
```

### ✅ MCP con Schema Conciso (EFICIENTE)

```json
{
  "name": "analyze_code",
  "description": "Analyzes code for security, performance, and quality issues",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": { "type": "string" },
      "type": { "type": "string", "enum": ["security", "perf", "quality"] }
    },
    "required": ["filePath"]
  }
}
```

**Tokens consumidos**: ~90 tokens

```
50 calls × 90 tokens = 4,500 tokens (62% menos)
```

---

## Comparativa Real: MCP vs CLI

### Escenario: Revisar 10 archivos de código

#### ❌ CLI Naive (INEFICIENTE)

```bash
# Script que ejecuta comandos CLI directamente

for file in $(find . -name "*.ts" | head -10); do
  # Cada invocación incluye:
  # 1. Cargar el CLI
  # 2. Parsear argumentos
  # 3. Escribir la salida completa al stdout
  # 4. El agente lee la salida (potencialmente muy larga)
  copilot analyze $file
done
```

**Tokens consumidos**:
```
Invocación 1: Carga CLI (2K) + Análisis (5K) + Output (8K) = 15K
Invocación 2: Carga CLI (2K) + Análisis (5K) + Output (8K) = 15K
...
Total: 10 × 15K = 150K tokens
```

**Problema**: Cada invocación es aislada. No hay reutilización de contexto. El agente re-lee instrucciones del CLI cada vez.

---

#### ✅ CLI Optimizado (EFICIENTE)

```bash
# Procesamiento batch con output minimalista

copilot analyze-batch \
  src/file1.ts \
  src/file2.ts \
  src/file3.ts \
  --output json \
  --quiet
```

**Tokens consumidos**:
```
Una invocación: Carga CLI (2K) + Análisis batch (15K) + Output JSON (5K) = 22K
Total: 22K tokens
```

**Ventaja**: Una sola invocación, output minimalista (JSON).

---

#### ✅✅ MCP Bien Implementado (MÁS EFICIENTE)

```typescript
// MCP server con schemas concisos
{
  "tools": [
    {
      "name": "analyze",
      "description": "Code analysis",
      "inputSchema": {
        "type": "object",
        "properties": {
          "files": { "type": "array", "items": { "type": "string" } },
          "type": { "type": "string", "enum": ["sec", "perf", "qual"] }
        }
      }
    }
  ]
}

// Agente usa:
mcp_client.call_tool("analyze", {
  files: ["file1.ts", "file2.ts", ..., "file10.ts"],
  type: "sec"
})
```

**Tokens consumidos**:
```
Schema inicial: 1K (una sola vez)
Llamada a herramienta: 500 bytes
Respuesta JSON: 5K
Total: ~6.5K tokens
```

**Ventaja**: 
- Schema se carga UNA VEZ
- Batch processing
- Respuesta eficiente

---

## Tabla Comparativa en Tokens

| Estrategia | Tokens para 10 archivos | Tokens por archivo | Overhead |
|---|---|---|---|
| **CLI Naive** (invocación por archivo) | 150K | 15K | Alto ❌ |
| **CLI Optimizado** (batch) | 22K | 2.2K | Bajo ✅ |
| **MCP Verboso** | 35K | 3.5K | Medio ⚠️ |
| **MCP Optimizado** | 6.5K | 0.65K | Mínimo ✅ |

---

## Dónde MCP Gasta MÁS Tokens (Justificadamente)

### 1. Schemas Verbosos

**Mal**:
```json
{
  "description": "This tool enables comprehensive code analysis using advanced machine learning algorithms to identify potential issues in your codebase..."
  // 200 palabras más aquí
}
```

**Bien**:
```json
{
  "description": "Analyzes code for issues"
}
```

**Ahorro**: -400 tokens por sesión.

---

### 2. Documentación Innecesaria

**Mal**: MCP server que devuelve respuestas narrativas largas:
```
{
  "result": "After performing a comprehensive analysis of the file src/auth.ts, 
            I found several issues. The first issue is a potential SQL injection 
            vulnerability on line 42 where user input is concatenated directly 
            into the query string. This is a critical security issue because..."
}
```

**Bien**: MCP server que devuelve JSON estructurado:
```json
{
  "vulnerabilities": [
    { "type": "sql_inject", "line": 42, "severity": "critical" }
  ]
}
```

**Diferencia**: 400 tokens vs 40 tokens.

---

### 3. Overhead de Protocol (REAL pero MÍNIMO)

MCP agrega overhead mínimo:
- Serialización MessagePack: +2-5% overhead
- Headers de protocolo: ~100 bytes por mensaje

**Tokens reales**: ~200 tokens por sesión de 1000 llamadas.

---

## Dónde CLI Gasta MÁS Tokens

### 1. Output Verboso Sin Estructura

```bash
$ copilot analyze file.ts

✅ Analysis complete!

Your code looks mostly good, but I found a few things:

SECURITY
--------
Line 42: SQL injection risk. Your code does:
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  
This is bad because an attacker could inject SQL. Fix it with prepared statements.

PERFORMANCE
----------
Line 100: You're using a for loop to find items...
```

**Tokens**: ~2K solo para esta respuesta.

Compare con:
```json
{
  "sec": [{"line": 42, "type": "sql_inject"}],
  "perf": [{"line": 100, "type": "loop_inefficient"}]
}
```

**Tokens**: ~200.

---

### 2. Latencia + Re-parsing

Cada invocación CLI requiere:
1. Spin-up del proceso (hot start)
2. Parseo de argumentos
3. Inicialización del contexto
4. Ejecución

**Vs MCP**: Conexión persistente reutiliza todo.

```
CLI (10 invocaciones):
  Setup: 10 × 500ms = 5 segundos
  Overhead por setup: 10 × 2K tokens = 20K tokens

MCP (10 invocaciones):
  Setup: 1 × 500ms = 500ms
  Overhead por setup: 1 × 2K tokens = 2K tokens
```

---

## La Verdad: Cuándo Elegir Cada Uno

### ✅ Usa CLI cuando:

1. **Tarea puntual y simple**
   ```bash
   copilot "¿Cuál es el error en este archivo?"
   ```
   - No necesitas persistencia
   - Output textual es OK
   - Una sola llamada

2. **Interacción humana requiere**
   ```bash
   # Usuario monitorea en tiempo real
   copilot fix-bugs /src --watch
   ```

3. **No hay integración con agente**
   ```bash
   # Llamada manual, no desde código
   $ gh copilot explain "SELECT * FROM users"
   ```

### ✅ Usa MCP cuando:

1. **Múltiples herramientas coordinadas**
   ```
   Agente necesita: git, API, BD, análisis
   → MCP unifica todo en tokens eficientes
   ```

2. **Tareas de alto volumen**
   ```
   Analizar 1000 archivos
   → CLI: 150K tokens
   → MCP: 6.5K tokens
   ```

3. **Contexto persistente importa**
   ```
   Información de pasos anteriores se necesita
   → MCP mantiene estado eficientemente
   ```

4. **Integración seamless con agentes**
   ```
   El agente ejecuta tareas sin overhead de subprocess
   ```

---

## Checklist: Cómo Optimizar Cada Uno

### Optimizar MCP (Ahorro hasta 80%):

- [ ] **Schemas concisos**: Descripción < 50 palabras
- [ ] **Output estructurado**: JSON/YAML, no narrativa
- [ ] **Batch operations**: 1 llamada por N items, no N llamadas
- [ ] **Reutilizar conexión**: No recrear el servidor
- [ ] **Respuestas mínimas**: Solo campos necesarios
- [ ] **Sin logging de debug**: Limpia output antes de retornar

**Ejemplo antes/después**:
```
Antes: 35K tokens (schemas + output narrativo)
Después: 6.5K tokens (schemas concisos + JSON)
Ahorro: 81%
```

---

### Optimizar CLI (Ahorro hasta 70%):

- [ ] **Batch operations**: `--input file.json`, no loop
- [ ] **Formato minimalista**: `--output json`, no `--verbose`
- [ ] **Una sola invocación**: Agrupa argumentos
- [ ] **Cache de setup**: Reutiliza el proceso si es posible
- [ ] **Sin prompt narrativo**: Solo datos

**Ejemplo antes/después**:
```
Antes: 150K tokens (invocación por archivo)
Después: 22K tokens (batch)
Ahorro: 85%
```

---

## La Conclusión Real

**No es MCP vs CLI. Es IMPLEMENTACIÓN.**

| Scenario | Ganador | Ahorro |
|---|---|---|
| CLI mal (verbose, invocación x archivo) | MCP optimizado | 95% ✅ |
| CLI optimizado (batch, JSON) | MCP vs CLI | Equivalente ≈ |
| Múltiples herramientas | MCP | 60-80% ✅ |
| Tarea puntual | CLI | + simple |

---

## La Recomendación Práctica

**Para máxima eficiencia:**

```
Tarea simple ← CLI (rápido de escribir)
        ↓
    Reutilizable ← MCP (standardizado)
        ↓
    Muchas herramientas ← MCP (coordinación)
        ↓
    Alto volumen ← MCP + Batch (eficiencia)
```

**El "secreto"** que ven en internet:
- Gente que implementa MCP con schemas massivos + respuestas narrativas **vs** CLI minimalista
- Comparan lo peor de MCP con lo mejor de CLI
- **La verdad**: Hacer bien cualquiera es eficiente; hacerlo mal ambos son caros.

---

## Exemplos Prácticos de Tokens

### Escenario Real: Revisar 100 archivos

**CLI Naive**:
```bash
for file in $(find . -name "*.ts" | head -100); do
  copilot analyze $file
done
```
- Tokens: 100 × 15K = **1.5M tokens** ❌❌❌
- Tiempo: 100 × 500ms = **50 segundos**

**CLI Optimizado**:
```bash
copilot analyze-batch \
  $(find . -name "*.ts" | head -100) \
  --output json
```
- Tokens: 1 × 22K = **22K tokens** ✅
- Tiempo: **2.5 segundos**

**MCP Optimizado**:
```python
mcp.call_tool("batch_analyze", {
  "files": list(find_ts_files(limit=100)),
  "format": "json"
})
```
- Tokens: **6.5K tokens** ✅✅
- Tiempo: **1.5 segundos**

**Ahorro de MCP vs CLI Naive**: 99.56% tokens, 97% tiempo.
