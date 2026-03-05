---
sidebar_position: 3
title: Generación Automática de Tests
---

# Generación Automática de Tests

Este flujo usa un agente especializado para generar tests unitarios y de integración automáticamente, con un hook de validación que evita sobrescribir tests existentes.

## Visión General del Flujo

```
1. Desarrollador escribe código nuevo
        │
        ▼
2. Invoca @test-generator con el archivo
        │
        ▼
3. Agente lee el archivo y comprende la lógica
        │
        ▼
4. Hook PreToolUse valida antes de escribir
        │
        ▼
5. Agente genera el archivo de test
        │
        ▼
6. Ejecuta los tests para verificar que pasan
```

---

## Paso 1: Agente `test-generator`

### Para GitHub Copilot CLI

```yaml
# ~/.copilot/agents/test-generator.yml
name: test-generator
description: >
  Genera tests unitarios y de integración para código TypeScript/JavaScript
  usando Jest o Vitest, siguiendo las convenciones del proyecto.
tools:
  - read_file
  - write_file
  - list_directory
  - run_terminal_command
instructions: |
  Eres un experto en testing de software con profundo conocimiento de Jest, 
  Vitest, Testing Library y patrones de testing modernos.

  ## Tu Proceso

  1. **Lee el archivo fuente** que necesita tests
  2. **Identifica qué probar**: funciones exportadas, clases, componentes
  3. **Determina el framework**: busca jest.config.* o vitest.config.* en el proyecto
  4. **Detecta la convención de naming**: ¿usa .test.ts o .spec.ts?
  5. **Genera el archivo de test** en la misma carpeta que el archivo fuente
  6. **Ejecuta los tests** con run_terminal_command para verificar que pasan

  ## Principios de Testing

  ### Estructura AAA (Arrange, Act, Assert)
  \`\`\`typescript
  it('should return user by id', async () => {
    // Arrange
    const userId = 'user-123';
    const expectedUser = { id: userId, name: 'Test User' };
    mockUserRepo.findById.mockResolvedValue(expectedUser);

    // Act
    const result = await getUserById(userId);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
  });
  \`\`\`

  ### Casos a Cubrir Siempre
  - Caso feliz (happy path)
  - Valores null/undefined
  - Errores esperados
  - Casos límite (arrays vacíos, strings vacíos, 0)

  ### Naming Convention
  - `describe`: nombre de la función/clase en formato "functionName"
  - `it`: "should [comportamiento esperado] when [condición]"

  ## Estructura de un Test Completo
  \`\`\`typescript
  import { funcionATestear } from './mi-modulo';

  // Mock de dependencias externas
  jest.mock('./dependencia-externa');

  describe('funcionATestear', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should [happy path]', () => { ... });
    it('should throw when [error condition]', () => { ... });
    it('should return empty when [edge case]', () => { ... });
  });
  \`\`\`

  ## IMPORTANTE
  - Si el archivo de test ya existe, NO lo sobreescribas. Agrega los tests faltantes.
  - Usa mocks para dependencias externas (DB, APIs, filesystem)
  - Cada test debe ser independiente (no depender del orden de ejecución)
```

---

## Paso 2: Instrucciones de Convenciones de Tests

Agrega al archivo de instrucciones del proyecto las convenciones específicas de testing:

```markdown
# Convenciones de Testing del Proyecto

## Framework
- Tests unitarios: Jest + ts-jest
- Tests de integración: Jest + Supertest
- Tests de componentes React: Testing Library

## Estructura de Archivos
\`\`\`
src/
  users/
    users.service.ts        ← Código fuente
    users.service.test.ts   ← Test unitario (mismo directorio)
  __tests__/
    users.integration.test.ts ← Tests de integración
\`\`\`

## Cobertura Mínima
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Mocking
- Base de datos: siempre mockear con jest.mock()
- APIs externas: usar nock o msw
- Tiempo: usar jest.useFakeTimers() cuando sea necesario
```

---

## Paso 3: Hook de Validación PreToolUse (Claude Code)

Este hook previene que el agente sobreescriba tests existentes sin confirmación:

```bash
#!/bin/bash
# ~/.claude/hooks/protect-test-files.sh
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Solo actuar en operaciones de escritura
if [[ "$TOOL" != "Write" ]]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Verificar si es un archivo de test existente
if [[ "$FILE" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]] && [ -f "$FILE" ]; then
  LINES=$(wc -l < "$FILE")
  if [ "$LINES" -gt 5 ]; then
    echo "{\"decision\": \"block\", \"reason\": \"El archivo de test $FILE ya existe con $LINES líneas. Revisa el archivo existente antes de sobreescribirlo.\"}"
    exit 0
  fi
fi

echo '{"decision": "allow"}'
exit 0
```

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/protect-test-files.sh"
          }
        ]
      }
    ]
  }
}
```

:::warning
Recuerda dar permisos de ejecución al script: `chmod +x ~/.claude/hooks/protect-test-files.sh`
:::

---

## Paso 4: Invocación y Ejemplo Completo

### Invocación Básica

```
@test-generator genera tests para src/services/payment.service.ts
```

### Invocación con Contexto Adicional

```
@test-generator genera tests unitarios para src/auth/jwt.service.ts
El proyecto usa Jest con ts-jest. Los tests van en el mismo directorio.
Asegúrate de cubrir los casos de token expirado y token inválido.
```

### Qué Sucede Paso a Paso

1. El agente lee `src/auth/jwt.service.ts`:

```typescript
// src/auth/jwt.service.ts
export class JwtService {
  sign(payload: object, expiresIn: string = '1h'): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
  }

  verify(token: string): object | null {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as object;
    } catch {
      return null;
    }
  }
}
```

2. El agente detecta Jest buscando `jest.config.ts`
3. El agente detecta la convención `.test.ts`
4. El hook PreToolUse verifica que `jwt.service.test.ts` no existe
5. El agente genera:

```typescript
// src/auth/jwt.service.test.ts
import { JwtService } from './jwt.service';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
const mockJwt = jest.mocked(jwt);

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService();
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  describe('sign', () => {
    it('should sign a payload with default expiration', () => {
      mockJwt.sign.mockReturnValue('signed-token' as never);

      const result = service.sign({ userId: '123' });

      expect(result).toBe('signed-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: '123' },
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should sign with custom expiration', () => {
      mockJwt.sign.mockReturnValue('custom-token' as never);

      service.sign({ userId: '123' }, '24h');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '24h' }
      );
    });
  });

  describe('verify', () => {
    it('should return payload for valid token', () => {
      const payload = { userId: '123' };
      mockJwt.verify.mockReturnValue(payload as never);

      const result = service.verify('valid-token');

      expect(result).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = service.verify('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const result = service.verify('expired-token');

      expect(result).toBeNull();
    });
  });
});
```

6. Ejecuta `npx jest src/auth/jwt.service.test.ts` para verificar que todos los tests pasan
7. Reporta el resultado al usuario

:::tip Resultado Esperado
Si el flujo funciona correctamente, obtendrás un archivo de test completo con cobertura del happy path, errores esperados y casos límite, y todos los tests pasarán en la primera ejecución.
:::
