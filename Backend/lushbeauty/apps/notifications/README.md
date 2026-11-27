# notifications

**Responsabilidad:** outbox transaccional y publicador hacia n8n (F13). Las notificaciones **nunca** son el registro contable oficial.

**Contrato público** (`contracts.py`): `publicar_evento(tipo, entidad_id, payload)` y `reintentar(evento_id)`.
Un módulo de negocio llama a `publicar_evento` **dentro de la misma transacción** que el hecho que lo origina
(si no hay transacción abierta lanza `FueraDeTransaccion`): el evento y el hecho se confirman o se deshacen juntos.

**Tablas propias:** `evento_outbox` (RLS por salón; no se audita). Clave única `(salón, tipo, entidad)`: emitir dos veces el mismo hecho deja un solo aviso lógico (CP-08);
la segunda llamada devuelve el evento original. El `id` del evento es el `event_id` que ve n8n.

**Publicador** (`python manage.py publicar_outbox [--una-vez] [--intervalo 15]`): proceso sin petición.
- Lista los salones con eventos pendientes y procesa cada uno con su `app.salon_id` (RLS). Para poder listarlos, la política `lectura_publicador` da **solo lectura** mientras la sesión declara `app.publicador = 'on'`; escribir y tomar lotes sigue exigiendo un salón.
- Toma lotes con `FOR UPDATE SKIP LOCKED`: dos publicadores no toman el mismo evento. El envío ocurre con el lote bloqueado, así que los lotes deben ser chicos (50 por defecto).
- Un fallo se guarda en `ultimo_error` (recortado a 500 caracteres) y suma un intento; no frena al resto. Tras `OUTBOX_MAX_INTENTOS` (5) queda `FALLIDO`. El espaciado entre reintentos es el intervalo entre corridas. `reintentar` devuelve un `FALLIDO` a la cola.
- Transporte HTTP firmado: `POST` con `X-Lush-Event-Id`, `X-Lush-Timestamp` y `X-Lush-Signature: sha256=HMAC(secreto, "<timestamp>.<cuerpo>")`. n8n debe verificar la firma y deduplicar por `event_id` (la entrega es *al menos una vez*).
- Configuración por entorno: `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `OUTBOX_MAX_INTENTOS`. Sin URL o secreto el comando se niega y los eventos quedan pendientes.

**Eventos:** este módulo no emite ninguno propio. Hoy lo usa `cashier` (`cierre_caja.aprobado`, uno por método). Falta cablear `payroll` (liquidación aprobada), que aún no existe.

**Pendiente:** enlace temporal para el PDF y sin importes personales en el evento (F13-T3), flujos de n8n (T4), fallo de correo (T5) y la vista de eventos (T6).
