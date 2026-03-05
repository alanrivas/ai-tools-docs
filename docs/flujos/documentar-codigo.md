---
sidebar_position: 4
title: Documentación Automática de Código
---

# Documentación Automática de Código

Este flujo automatiza la generación de documentación en el código (JSDoc, docstrings) y archivos de documentación (README, API docs) usando un agente especializado.

## Visión General del Flujo

```
1. Desarrollador identifica código sin documentar
        │
        ▼
2. Invoca @doc-writer con el archivo o directorio
        │
        ▼
3. Agente lee el código y comprende la estructura
        │
        ▼
4. Genera JSDoc/docstrings para cada función/clase
        │
        ▼
5. Opcionalmente genera README o documentación de API
        │
        ▼
6. Revisa que la documentación es precisa y completa
```

---

## Paso 1: Agente `doc-writer`

```yaml
# ~/.copilot/agents/doc-writer.yml
name: doc-writer
description: >
  Genera documentación automática para código TypeScript/JavaScript.
  Crea JSDoc para funciones y clases, y puede generar README y documentación de API.
tools:
  - read_file
  - write_file
  - list_directory
  - run_terminal_command
instructions: |
  Eres un escritor técnico experto especializado en documentación de código.
  Tu objetivo es hacer el código más comprensible sin cambiar su comportamiento.

  ## Tipos de Documentación que Generas

  ### 1. JSDoc para TypeScript/JavaScript
  Documenta:
  - Todas las funciones y métodos públicos
  - Todas las clases e interfaces exportadas
  - Parámetros complejos o no obvios
  - Valores de retorno
  - Casos de error (@throws)

  ### 2. README.md para módulos
  Cuando se te pida documentar un directorio completo:
  - Qué hace el módulo
  - Cómo se usa (con ejemplos de código)
  - Dependencias principales
  - Guía de contribución si aplica

  ## Estilo de Documentación

  ### JSDoc — Formato Correcto
  \`\`\`typescript
  /**
   * Busca un usuario por su identificador único.
   *
   * @param id - Identificador UUID del usuario
   * @returns El usuario encontrado, o null si no existe
   * @throws {DatabaseError} Si hay un problema de conexión con la base de datos
   *
   * @example
   * const user = await getUserById('550e8400-e29b-41d4-a716-446655440000');
   * if (user) {
   *   console.log(user.name);
   * }
   */
  async function getUserById(id: string): Promise<User | null>
  \`\`\`

  ## Reglas de Calidad

  1. La documentación describe el **"qué"** y el **"por qué"**, no el **"cómo"**
  2. Incluye siempre un ejemplo `@example` para funciones públicas
  3. No documentes lo obvio (getters/setters simples no necesitan JSDoc)
  4. Si el código es confuso, menciona por qué está escrito así
  5. Usa el mismo idioma que el resto de la documentación del proyecto

  ## NUNCA hagas esto
  - Cambiar la lógica del código al documentarlo
  - Agregar comentarios inline a cada línea (solo donde haya algo no obvio)
  - Documentar parámetros con tipos que ya están en TypeScript (son redundantes)
  - \`@param {string} name - The name\` → en TS el tipo ya está, omite \`{string}\`
```

---

## Paso 2: Instrucciones de Estilo de Documentación

Define el estilo de documentación en las instrucciones del proyecto:

```markdown
# Convenciones de Documentación del Proyecto

## Idioma
- Comentarios de código: español
- JSDoc: español
- Nombres de variables y funciones: inglés

## JSDoc Obligatorio Para
- Todas las funciones exportadas (públicas)
- Todos los métodos públicos de clases
- Todas las interfaces con más de 3 propiedades
- Cualquier algoritmo no trivial

## JSDoc NO Requerido Para
- Funciones privadas simples (menos de 5 líneas)
- Getters/setters que solo acceden a una propiedad
- Constructores simples que solo asignan parámetros

## Ejemplo Esperado para Funciones de Servicio
\`\`\`typescript
/**
 * Procesa un pago con la pasarela configurada.
 * Intenta el cobro hasta 3 veces antes de fallar.
 *
 * @param orderId - ID de la orden a cobrar
 * @param amount - Monto en centavos (evita problemas de punto flotante)
 * @returns Resultado del procesamiento con estado y ID de transacción
 *
 * @example
 * const result = await processPayment('order-123', 4999);
 * if (result.success) {
 *   await confirmOrder(result.transactionId);
 * }
 */
async function processPayment(
  orderId: string,
  amount: number
): Promise<PaymentResult>
\`\`\`
```

---

## Paso 3: Ejemplo Completo de Documentación

### Antes (código sin documentar)

```typescript
// src/services/email.service.ts
export class EmailService {
  private transporter: Transporter;
  private maxRetries = 3;

  constructor(config: EmailConfig) {
    this.transporter = createTransport(config);
  }

  async send(to: string, subject: string, body: string): Promise<boolean> {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to,
          subject,
          html: body,
        });
        return true;
      } catch (error) {
        attempts++;
        if (attempts === this.maxRetries) {
          logger.error('Email send failed after retries', { to, subject, error });
          return false;
        }
        await sleep(1000 * attempts);
      }
    }
    return false;
  }

  async sendBulk(recipients: string[], subject: string, body: string): Promise<BulkResult> {
    const results = await Promise.allSettled(
      recipients.map(to => this.send(to, subject, body))
    );
    return {
      sent: results.filter(r => r.status === 'fulfilled' && r.value).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value).length,
    };
  }
}
```

### Invocación

```
@doc-writer documenta la clase EmailService en src/services/email.service.ts
Agrega JSDoc completo siguiendo las convenciones del proyecto.
```

### Después (con documentación generada)

```typescript
// src/services/email.service.ts

/**
 * Servicio de envío de emails con reintentos automáticos.
 * Usa el transportador configurado en EmailConfig y reintenta
 * automáticamente con backoff exponencial en caso de fallos.
 */
export class EmailService {
  private transporter: Transporter;
  private maxRetries = 3;

  /**
   * Crea una nueva instancia del servicio de email.
   *
   * @param config - Configuración del transportador (host, puerto, credenciales)
   */
  constructor(config: EmailConfig) {
    this.transporter = createTransport(config);
  }

  /**
   * Envía un email a un destinatario con reintentos automáticos.
   *
   * Si el primer intento falla, reintenta hasta 3 veces con backoff
   * exponencial (1s, 2s, 3s entre intentos).
   *
   * @param to - Dirección email del destinatario
   * @param subject - Asunto del email
   * @param body - Cuerpo del email en formato HTML
   * @returns true si el email fue enviado exitosamente, false si falló tras todos los reintentos
   *
   * @example
   * const sent = await emailService.send(
   *   'usuario@ejemplo.com',
   *   'Bienvenido',
   *   '<h1>Hola!</h1>'
   * );
   * if (!sent) {
   *   logger.warn('No se pudo enviar el email de bienvenida');
   * }
   */
  async send(to: string, subject: string, body: string): Promise<boolean> {
    // ... (código sin cambios)
  }

  /**
   * Envía el mismo email a múltiples destinatarios en paralelo.
   *
   * Ejecuta todos los envíos concurrentemente con Promise.allSettled,
   * garantizando que un fallo no cancela los demás envíos.
   *
   * @param recipients - Lista de direcciones email destinatarias
   * @param subject - Asunto del email (igual para todos)
   * @param body - Cuerpo del email en HTML (igual para todos)
   * @returns Conteo de emails enviados y fallidos
   *
   * @example
   * const { sent, failed } = await emailService.sendBulk(
   *   ['a@test.com', 'b@test.com', 'c@test.com'],
   *   'Newsletter Mensual',
   *   '<p>Contenido del newsletter...</p>'
   * );
   * console.log(`Enviados: ${sent}, Fallidos: ${failed}`);
   */
  async sendBulk(recipients: string[], subject: string, body: string): Promise<BulkResult> {
    // ... (código sin cambios)
  }
}
```

---

## Flujo Avanzado: Documentar un Directorio Completo

Para documentar un módulo entero de una vez:

```
@doc-writer necesito documentar el directorio src/services/ completo.
1. Revisa qué archivos tienen documentación insuficiente
2. Genera JSDoc para los archivos más críticos primero (los que exportan más cosas)
3. Genera un README.md en src/services/ que explique el módulo
```

:::tip Integración con TypeDoc
Una vez que el código tiene JSDoc completo, puedes generar documentación HTML automáticamente con TypeDoc:

```bash
npx typedoc --entryPoints src/index.ts --out docs-output
```

El agente `doc-writer` puede ayudarte a configurar TypeDoc si lo necesitas.
:::

:::info Mantenimiento de la Documentación
La documentación generada automáticamente debe mantenerse actualizada. Considera agregar una instrucción al agente `code-reviewer` para que verifique que los cambios de código tienen la documentación JSDoc actualizada.
:::
