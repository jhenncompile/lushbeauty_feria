# F04 · cierre-caja

**Plataformas:** BE · WEB  **Semana:** 2  **Estado:** pendiente

## Resultado esperado
Cerrar y conciliar la caja diaria: importe esperado vs declarado, diferencia y justificación.
**Métrica:** el 100 % de los cierres de prueba reporta la diferencia correcta.

## Alcance
- Dentro: `CierreCaja` (fecha, esperado por medio de pago, declarado, diferencia, justificación, aprobador), resumen de caja por período.
- Fuera: aviso por n8n (F13).

## Requisitos cubiertos
RF-08 · HU (aviso de cierre, HU-08, en F13) · cap. 10 (K: endpoints de caja)

## Tareas
- [ ] **F04-T1 [BE]** `GET /caja/resumen/?desde=&hasta=` consolida cobros por método y descuentos. *RED:* el resumen no coincide con la suma de pagos. *Acept.:* solo cuenta importes confirmados.
- [ ] **F04-T2 [BE]** `POST /caja/cierres/` registra declarado, diferencia y justificación. *RED:* diferencia ≠ 0 sin justificación. *Acept.:* se rechaza.
- [ ] **F04-T3 [BE]** Aprobar el cierre emite `caja.cierre_aprobado` al outbox (el publicador queda en F13). *Acept.:* el evento se persiste en la misma transacción.
- [ ] **F04-T4 [WEB]** Pantalla de cierre diario: esperado, declarado, diferencia, justificar y aprobar. *Acept.:* flujo completo.

## Dependencias
F01. El outbox lo cierra F13.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F05-pwa-offline-sync
