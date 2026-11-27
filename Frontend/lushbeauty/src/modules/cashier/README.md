# cashier

**Responsabilidad:** cierre de caja diario: esperado vs declarado por método, diferencia en efectivo con justificación obligatoria y últimos cierres.

**Contrato público (`index.ts`):** `CashProvider`, `CierreCajaPage`, `WebCajaPage`.

**Dependencias:** `shared/connection` y `shared/money`. No importa otros módulos: el esperado es un dato sintético propio hasta que las ventas del día lleguen por contrato o evento (F04-T1).

**Reglas puras (`domain/reconcile.ts`):** centavos enteros; solo el efectivo se cuenta a mano, QR y transferencia se toman iguales a lo esperado; diferencia ≠ 0 exige justificación.

**Estado:** con sesión real lee `/api/v1/caja/resumen/` y `/cierres/` y cierra con `POST` (`api/caja.ts`); sin token usa datos de ejemplo. Aprobar aún no está conectado.

**Invariantes de UI:** cerrar requiere conexión; una caja cerrada no se edita; la diferencia siempre se muestra con palabra («Falta», «Sobra», «Conciliado»).

**Eventos:** no emite ni consume todavía. Con backend emitirá `cierre_caja_aprobado` por el outbox (F13).
