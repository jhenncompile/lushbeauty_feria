# cashier (Flutter)

**Responsabilidad:** cierre de caja diario desde el teléfono.
**Contrato público (`cashier.dart`):** `CashController`, `CierreCajaPage`. **Dominio puro:** `domain/reconcile.dart` (centavos; solo el efectivo se cuenta).
**Reglas:** diferencia ≠ 0 exige justificación; cerrar requiere conexión; cerrada no se edita. **Estado:** esperado sintético.
