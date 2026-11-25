# payroll

**Responsabilidad:** liquidación semanal por especialista (comisión + propinas − deducciones), estados Borrador → Verificada → Aprobada, avisos y vista «Mi liquidación».

**Contrato público (`index.ts`):** `PayrollProvider` y las pantallas `LiquidacionPage`, `DetalleLiquidacionPage`, `AprobadaPage`, `MiLiquidacionPage`, `WebNominaPage`.

**Dependencias (solo por contrato):** `catalog` (`getPolicy`), `identity` (`useSession`), `shared/connection`.

**Reglas puras (`domain/payroll.ts`):** centavos enteros; comisión línea por línea sobre lista o sobre cobrado (esta última solo como simulación); neto = comisión + propinas − deducciones. La comisión de cada especialista es el snapshot guardado en sus ventas.

**Invariantes de UI:** una liquidación aprobada no se puede reabrir; aprobar requiere conexión; un aviso fallido no afecta la liquidación; una especialista solo ve la suya.

**Eventos:** no emite ni consume todavía. Con backend emitirá `liquidacion_aprobada` por el outbox (F13).

**Estado:** datos sintéticos en memoria. Pendientes: registrar deducción, exportar a Excel, descargar comprobante PDF.
