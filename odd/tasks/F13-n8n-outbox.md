# F13 · n8n-outbox

**Plataformas:** BE · TRANS  **Semana:** 7  **Estado:** pendiente

## Resultado esperado
Tres avisos automáticos (cierre, liquidación, alerta) que nunca duplican ni alteran la contabilidad.
**Métrica:** un evento repetido genera un solo aviso lógico; un fallo de correo no afecta la nómina.

## Alcance
- Dentro: patrón outbox transaccional, publicador al webhook de n8n, flujos E1 (cierre), E2 (liquidación con enlace temporal), E3 (alerta), reintentos limitados, registro de acuses.
- Fuera: WhatsApp (integración oficial posterior).

## Requisitos cubiertos
RF-18 · HU-08 · CP-08, CP-10 · RN-08 · Anexos K y L

## Tareas
- [ ] **F13-T1 [BE]** `EventoOutbox` escrito en la misma transacción que la aprobación. *RED:* aprobar sin evento persistido. *Acept.:* siempre existe el evento. **Esquema DB:** `evento_outbox` (estado, intentos, último error, índice parcial de pendientes) ya existe y no se audita.
- [ ] **F13-T2 [BE]** Publicador con firma, `event_id` único y reintentos limitados. *RED:* CP-08, emitir dos veces `cierre_caja.aprobado`. *Acept.:* un solo aviso lógico (la restricción `UNIQUE (salon, tipo, entidad_id)` ya lo garantiza; `event_id` = `id`). El publicador es un proceso sin petición: fija `app.salon_id` por salón (RLS) y toma lotes con `FOR UPDATE SKIP LOCKED`.
- [ ] **F13-T3 [BE]** Enlace temporal autorizado para el PDF individual. *RED:* el enlace vence o lo usa otra persona. *Acept.:* se rechaza; no se envían importes personales en el evento.
- [ ] **F13-T4 [TRANS]** Flujos n8n E1, E2 y E3 exportados al repo, secretos fuera. *Acept.:* HU-08, el flujo registra éxito o fallo y permite reintentar.
- [ ] **F13-T5 [BE]** Fallo de correo. *RED:* CP-10, error al enviar el PDF. *Acept.:* la nómina persiste y la notificación se reintenta.
- [ ] **F13-T6 [WEB]** Vista de eventos y estado de envío. *Acept.:* la administradora ve los envíos fallidos.

## Dependencias
F03, F04, F12. Las notificaciones nunca son el registro contable oficial.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F14-seguridad-demo-feria
