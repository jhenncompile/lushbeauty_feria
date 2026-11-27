# sales

**Responsabilidad:** registrar un servicio (servicio, especialista, método de pago, descuento con motivo), mostrar el resumen del día y el listado de ventas con anulación.

**Contrato público (`index.ts`):** `SalesProvider` y las pantallas `HoyPage`, `RegistrarPage`, `DescuentoPage`, `GuardadoPage`, `WebVentasPage`.

**Dependencias (solo por contrato):** `catalog` (`listServices`, `getPolicy`), `identity` (`listSpecialists`, `useSession`).

**Reglas puras (`domain/sale.ts`):** importes en centavos enteros; lista se conserva, cobrado = lista − descuento, comisión sobre lista, límite de descuento comparado sin redondeos. El redondeo de la comisión es provisional (decisión abierta 1).

**Eventos:** no emite ni consume todavía. Con backend emitirá la venta con su `clientUuid` (idempotencia, RN-01).

**Estado:** la pantalla web de ventas con sesión real lee `/api/v1/ventas/` y anula contra el servidor (`api/ventas.ts`, `useWebSales.ts`); el registro y el resto siguen con datos sintéticos en memoria. Anular una venta la deja con estado «Anulada»; nada se borra.
