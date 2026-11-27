# sales

**Responsabilidad:** ventas multilínea, pagos divididos, descuentos con motivo y anulación auditada.
La comisión la calcula `commissions` (F02) y `sales` guarda su resultado; la liquidación (F03) vivirá en otro módulo y leerá estas ventas por contrato.

**Contrato público** (`contracts.py`): `registrar_venta`, `anular_venta`, `calcular_linea`, `validar_pagos`, `METODOS_PAGO`.

**Tablas propias:** `venta`, `linea_venta`, `pago` (RLS por salón, auditoría automática, líneas inmutables,
prohibido borrar, pagos = líneas al confirmar). Referencias a `servicio`, `especialista`, `cliente` por ID, sin ForeignKey.

**API:** `POST/GET /api/v1/ventas/` (idempotente por `uuid_cliente`; el cuerpo admite `origen` = `WEB` (por defecto) o `PWA_OFFLINE`; `IMPORTACION` lo fija el importador y el API lo rechaza), `GET /api/v1/ventas/<id>/`,
`POST /api/v1/ventas/<id>/anular/`.

**Comisión (F02):** al vender, cada línea pide a `commissions` la regla vigente el día del servicio y guarda un *snapshot*
(`regla_comision_id`, `base_comision`, `tasa_comision`, `comision`). La base impone `comision = round(base × tasa, 2)` (`ck_linea_venta_07`) y,
como toda la línea, es inmutable: cambiar una política después no recalcula nada. Sin regla vigente la venta se rechaza (422 `sin_regla_comision`).
Las líneas anteriores a F02 tienen el snapshot en nulo (todo o nada, `ck_linea_venta_09`); no se les inventó una comisión.

**Ventas sin conexión (F05-T1):** una venta `PWA_OFFLINE` pasa las mismas validaciones que una web (permisos, catálogo, descuento, regla de comisión del día del servicio). Un reintento con el mismo `uuid_cliente` devuelve **la venta original** (200, mismo `id`, origen y pagos), aunque el cuerpo o el origen del reintento sean distintos; así un corte de red tras guardar pero antes de responder no duplica nada (CP-03).

**Reglas:** dinero con `Decimal` y a lo sumo 2 decimales; el precio de lista lo pone el servidor desde el catálogo;
un descuento sobre el umbral exige `DESCUENTO_APROBAR`; sobre el máximo del salón se rechaza;
una especialista solo registra sus propios servicios.

**Lectura para caja:** `cobros_confirmados`, `descuentos_confirmados` y `resumen_de_lineas` (agregados por día, método y especialista, solo ventas CONFIRMADAS) están en el contrato; `cashier` y `analytics` no tocan estas tablas.

**Lectura y escritura para nómina:** `lineas_para_liquidar` (líneas CONFIRMADAS del período sin liquidación), `lineas_de_liquidacion`, `asignar_liquidacion` (liga las líneas al aprobar) y `lineas_anuladas_liquidadas` (para los ajustes). `payroll` no toca estas tablas.

**Anular una venta ya liquidada** se permite: la línea conserva su `liquidacion_id` y `payroll` la descuenta como `AJUSTE` en una semana posterior (antes respondía 409 `venta_liquidada`).

**Eventos:** ninguno todavía (F13 los publicará por outbox).
