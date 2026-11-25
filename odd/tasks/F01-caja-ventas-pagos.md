# F01 · caja-ventas-pagos

**Plataformas:** BE · WEB · MOB  **Semana:** 2  **Estado:** pendiente

## Resultado esperado
Registrar una venta con una o varias líneas, pagos por medio y descuentos con motivo, con importes exactos y trazables.
**Métrica:** tasa de errores de cálculo = 0 en los casos de prueba CP-01 y de combos/pagos divididos (cap. 12).

## Alcance
- Dentro: catálogo de servicios con vigencia, venta multilínea, pagos (efectivo/QR/transferencia), descuento con motivo y aprobación, anulación con ajuste (no se borra), `Decimal`, copia inmutable de lista/descuento/cobrado.
- Fuera: comisión (F02), sincronización offline (F05), importación (F06).

## Requisitos cubiertos
RF-01, RF-02, RF-03, RF-04 · RN-01, RN-03, RN-04 · HU-01, HU-10 · CP-01

## Tareas
- [ ] **F01-T1 [BE]** Entidades `ServicioCatalogo`, `Venta`, `LineaVenta`, `Pago` con `Decimal` y criterio de redondeo explícito. *RED:* suma de líneas ≠ suma de pagos debe rechazarse. *Acept.:* RN-03/RN-04 verificadas.
- [ ] **F01-T2 [BE]** Descuento con motivo y límite autorizado. *RED:* CP-01 (lista Bs 120, descuento Bs 8 → cobro Bs 112, se conserva la lista). *Acept.:* un descuento sobre el umbral exige aprobación de la administradora.
- [ ] **F01-T3 [BE]** Anulación/devolución como ajuste auditado. *RED:* borrar una venta usada en una liquidación. *Acept.:* HU-10: historial conservado y ajuste generado.
- [ ] **F01-T4 [BE]** `POST /api/v1/ventas/` idempotente por UUID de cliente (RN-01). *RED:* dos POST con el mismo UUID. *Acept.:* una sola venta confirmada.
- [ ] **F01-T5 [WEB]** Pantalla de venta de la administradora: líneas, pagos, descuento y motivo. *Acept.:* HU-01: el importe de líneas coincide con pagos y se muestra el detalle.
- [ ] **F01-T6 [MOB]** Pantalla de registro rápido para la especialista: servicio → especialista → monto → método de pago. *Acept.:* una venta se registra en pocos toques, con estado visible.

## Dependencias
F00. **Bloqueo a validar:** regla de redondeo (RN-03) y lista de métodos de pago, con la administradora.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F02-comisiones-versionadas
