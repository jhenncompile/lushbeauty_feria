# analytics

**Responsabilidad:** panel financiero del salón (F07): cobrado, descuentos, comisiones y propinas por período, método de pago, día y especialista.
No tiene tablas: calcula al vuelo leyendo de `sales` (`resumen_de_lineas`, `cobros_confirmados`) y `catalog` (nombres) solo por sus contratos.

**API:** `GET /api/v1/analytics/panel/?desde=&hasta=&especialista_id=` (rango máximo 366 días). Devuelve `hay_datos`, `ventas`, `servicios`, `bruto`, `descuentos`,
`descuento_pct` (fracción del bruto, nula si no hubo bruto), `cobrado`, `comisiones`, `propinas`, `por_metodo`, `por_dia` y `por_especialista`.

**Reglas de negocio**
- Solo cuentan ventas **CONFIRMADAS**: lo anulado, pendiente o en revisión no se suma como cobrado. Por RN-04 el cobrado de las líneas coincide con la suma de los pagos, y el test lo comprueba.
- `hay_datos` es falso cuando no hubo ventas, para que la pantalla diga «sin datos» en vez de mostrar ceros como si fueran reales (F07-T4, parte del servidor).
- Quien tiene `REPORTES_VER` (administradora, lector) ve todo el salón y puede filtrar por especialista. Una especialista ve **solo lo suyo**: el servidor fija su identidad; pedir la de otra da 403 y queda `ACCESO_DENEGADO` en la bitácora.
- Con filtro de especialista (o en su vista) `por_metodo` es nulo: los pagos pertenecen a la venta, no a una línea.
- `comisiones` suma el snapshot de F02; las líneas anteriores a F02 (sin snapshot) aportan 0.
- Los porcentajes y el desglose se calculan en `domain/` con `Decimal` (mitad hacia arriba), sin base de datos.

**Eventos:** no emite ni consume ninguno.

**Pendiente:** conectar la pantalla (cada cifra enlazando a su reporte, filtros), estados de carga, y el costo de materiales / contribución (F08, decisión 3).
