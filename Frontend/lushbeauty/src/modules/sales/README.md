# sales

**Responsabilidad:** registrar un servicio (servicio, especialista, método de pago, descuento con motivo), mostrar el resumen del día y el listado de ventas con anulación.

**Contrato público (`index.ts`):** `SalesProvider` y las pantallas `HoyPage`, `RegistrarPage`, `DescuentoPage`, `GuardadoPage`, `WebVentasPage`.

**Dependencias (solo por contrato):** `catalog` (`listServices`, `getPolicy`), `identity` (`listSpecialists`, `useSession`).

**Reglas puras (`domain/sale.ts`):** importes en centavos enteros; lista se conserva, cobrado = lista − descuento, comisión sobre lista, límite de descuento comparado sin redondeos. El redondeo de la comisión es provisional (decisión abierta 1).

**Eventos:** no emite ni consume todavía. Con backend emitirá la venta con su `clientUuid` (idempotencia, RN-01).

**Estado:** datos sintéticos en memoria, sin servidor. Anular una venta la deja con estado «Anulada»; nada se borra.
