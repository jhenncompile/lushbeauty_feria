# sales (Flutter)

**Responsabilidad:** Hoy, registrar servicio, descuento con motivo y servicio guardado.
**Contrato público (`sales.dart`):** `SalesController`, `HoyPage`, `RegistrarPage`, `DescuentoPage`, `GuardadoPage`.
**Dependencias (por contrato):** `catalog`, `identity`, `offline`. **Dominio puro:** `domain/sale.dart` (centavos enteros, límite de descuento sin redondeos).
**Eventos:** no emite todavía; con backend enviará la venta con su `clientUuid` (RN-01). **Estado:** datos en memoria, sin servidor.
