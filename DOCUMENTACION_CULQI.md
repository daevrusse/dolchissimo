# Gregorisa + Culqi — instalación y uso

## Alcance de esta versión

Esta integración permite cobrar pedidos de Gregorisa mediante **Culqi Checkout Custom** y registrar automáticamente el resultado en Supabase.

Incluye:

- Botón **Cobrar Culqi** en los pedidos activos.
- Checkout seguro para pagos con tarjeta.
- Backend en Vercel: la llave privada nunca se publica en el navegador.
- Prevención básica de cobros duplicados.
- Registro de pagos aprobados y rechazados.
- Referencia Culqi en el pedido y en el ticket.
- Impresión y reimpresión desde el navegador.
- Pagos manuales para efectivo y Yape mediante el flujo existente.

Esta versión **no controla el lector ni la impresora interna del POS Culqi P3**. Eso requiere un SDK privado del Smart POS. El Checkout funciona desde navegador, tablet o Android con acceso web.

---

## 1. Preparar Supabase

### Proyecto existente

1. Abre tu proyecto en Supabase.
2. Entra a **SQL Editor**.
3. Copia y ejecuta `supabase_culqi_migration.sql`.

### Proyecto nuevo

Ejecuta `supabase_setup.sql`, que ya contiene las tablas originales y el módulo de pagos.

### Tablas y campos nuevos

- `pagos`: historial de intentos y cobros.
- `pedidos.estado_pago`: pendiente, pagado, rechazado o reembolsado.
- `pedidos.referencia_pago`: referencia mostrada en el ticket.
- `pedidos.culqi_charge_id`: identificador único del cargo.
- `pedidos.fecha_pago`: fecha de aprobación.

---

## 2. Obtener las llaves de Culqi

En CulqiPanel ingresa a **Desarrollo → API Keys**.

Para las primeras pruebas usa las llaves de integración:

- Llave pública: comienza con `pk_test_`.
- Llave privada: comienza con `sk_test_`.

No coloques la llave privada dentro de ningún archivo HTML o JavaScript público.

---

## 3. Configurar variables en Vercel

En Vercel abre el proyecto y entra a:

**Settings → Environment Variables**

Agrega:

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
CULQI_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxx
CULQI_PRIVATE_KEY=sk_test_xxxxxxxxxxxxxxxxx
```

Dónde encontrar las llaves de Supabase:

- `SUPABASE_URL`: Project Settings → API.
- `SUPABASE_ANON_KEY`: Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API → service_role.

La `service_role` es secreta y solo debe guardarse en Vercel.

Después de agregarlas, realiza un nuevo despliegue.

---

## 4. Subir el proyecto

1. Sube los archivos actualizados a GitHub.
2. En Vercel pulsa **Redeploy**.
3. Abre `/mozo.html` e inicia sesión.
4. Comprueba que un pedido activo muestre **Cobrar Culqi**.

---

## 5. Cómo cobrar un pedido

1. El mozo registra y envía el pedido a cocina.
2. En **Pedidos**, pulsa **Cobrar Culqi**.
3. El sistema abre el formulario seguro de Culqi.
4. El cliente completa el pago.
5. Si Culqi aprueba la operación:
   - el pedido cambia a **Pago aprobado**;
   - se guarda el identificador del cargo;
   - se registra la referencia;
   - se ofrece imprimir el ticket.
6. Si el banco rechaza el pago, el pedido permanece pendiente y se muestra el motivo disponible.

### Efectivo o Yape manual

En **Editar pedido**, selecciona Efectivo o Yape. Al guardar, Gregorisa marca el pago como registrado manualmente. Para tarjeta se debe utilizar **Cobrar Culqi**.

---

## 6. Impresión

Pulsa **Imprimir** en un pedido. El ticket contiene:

- número de pedido;
- cliente y mesa;
- productos y total;
- método de pago;
- estado del pago;
- referencia Culqi, cuando existe.

Para una impresora térmica:

1. Instálala en Android o Windows.
2. Selecciónala en el diálogo de impresión.
3. Usa papel de 58 mm u 80 mm según el equipo.
4. Desactiva encabezados y pies del navegador.
5. Usa escala 100 % y márgenes mínimos.

La impresión automática sin diálogo necesita una aplicación puente o un servicio local; no se activa por defecto por seguridad del navegador.

---

## 7. Pasar de pruebas a producción

Antes de producción:

1. Confirma que todos los pagos de prueba se registran correctamente.
2. Reemplaza en Vercel las llaves `pk_test_` y `sk_test_` por las llaves de producción.
3. Verifica el dominio autorizado en CulqiPanel.
4. Haz una compra real de monto bajo.
5. Compara el cargo en CulqiPanel con la tabla `pagos` de Supabase.

Nunca mezcles una llave pública de prueba con una llave privada de producción.

---

## 8. Archivos principales

- `mozo.html`: botón, apertura del Checkout, envío del token y ticket.
- `api/culqi-config.js`: entrega al navegador únicamente la llave pública.
- `api/culqi-charge.js`: crea el cargo usando la llave privada.
- `supabase_culqi_migration.sql`: actualiza una base existente.
- `supabase_setup.sql`: instalación completa desde cero.
- `.env.example`: ejemplo de variables.

---

## 9. Solución de problemas

### “Culqi aún no está configurado”

Falta `CULQI_PUBLIC_KEY` o el proyecto no fue redesplegado.

### “Faltan variables privadas”

Revisa `CULQI_PRIVATE_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel.

### El Checkout no abre

Comprueba la conexión a internet y que el navegador no bloquee scripts externos.

### El pago fue aprobado, pero no se registró

Busca el `chargeId` mostrado en el error dentro de CulqiPanel. No vuelvas a cobrar hasta comprobar la operación.

### No aparece el botón Cobrar Culqi

El pedido ya puede figurar como pagado, o el navegador conserva una versión anterior. Fuerza la recarga y revisa el último despliegue.

---

## 10. Seguridad

- Los datos completos de tarjeta no pasan por Gregorisa: Culqi los captura en su Checkout.
- La llave privada se usa únicamente en la función serverless.
- El endpoint valida que el usuario tenga una sesión de Supabase.
- El servidor consulta nuevamente el total del pedido; no confía en un monto enviado desde el navegador.
- Un pedido con `culqi_charge_id` no puede cobrarse nuevamente desde este flujo.
