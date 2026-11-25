# F07 · dashboard-financiero

**Plataformas:** BE · WEB  **Semanas:** 3-4  **Estado:** pendiente

## Resultado esperado
Un panel que responde en segundos: cuánto se vendió, cobró, descontó y se debe a las especialistas.
**Métrica:** cada cifra del panel coincide con el reporte fuente (conciliación 100 %).

## Alcance
- Dentro: ventas brutas y netas, descuentos, comisiones estimadas, propinas, pagos por método, cierres pendientes; filtros por período, especialista y servicio; distinción cobrado vs no confirmado.
- Fuera: analítica avanzada y proyecciones.

## Requisitos cubiertos
RF-15 · cap. 08 (centro de inteligencia financiera)

## Tareas
- [ ] **F07-T1 [BE]** Consultas agregadas con filtros y permisos. *RED:* el total del panel ≠ suma de pagos confirmados. *Acept.:* ningún importe no confirmado cuenta como cobrado.
- [ ] **F07-T2 [BE]** Una especialista ve solo lo suyo. *RED:* consulta de otra especialista. *Acept.:* se rechaza.
- [ ] **F07-T3 [WEB]** Tablero con tarjetas, filtros y desglose por método de pago. *Acept.:* cada cifra enlaza a su reporte fuente.
- [ ] **F07-T4 [WEB]** Estados vacíos y de carga. *Acept.:* cuando no hay datos, el panel lo dice en lugar de mostrar 0 como si fuera real.

## Dependencias
F01, F03, F04.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F08-dss-contribucion-whatif
