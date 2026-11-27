# sales

**Responsabilidad:** ventas multilínea, pagos divididos, descuentos con motivo y anulación auditada.
La comisión la calcula `commissions` (F02) y `sales` guarda su resultado; la liquidación (F03) vivirá en otro módulo y leerá estas ventas por contrato.

**Contrato público** (`contracts.py`): `registrar_venta`, `anular_venta`, `calcular_linea`, `validar_pagos`, `METODOS_PAGO`.

**Tablas propias:** `venta`, `linea_venta`, `pago` (RLS por salón, auditoría automática, líneas inmutables,
prohibido borrar, pagos = líneas al confirmar). Referencias a `servicio`, `especialista`, `cliente` por ID, sin ForeignKey.

**API:** `POST/GET /api/v1/ventas/` (idempotente por `uuid_cliente`), `GET /api/v1/ventas/<id>/`,
`POST /api/v1/ventas/<id>/anular/`.

**Comisión (F02):** al vender, cada línea pide a `commissions` la regla vigente el día del servicio y guarda un *snapshot*
(`regla_comision_id`, `base_comision`, `tasa_comision`, `comision`). La base impone `comision = round(base × tasa, 2)` (`ck_linea_venta_07`) y,
como toda la línea, es inmutable: cambiar una política después no recalcula nada. Sin regla vigente la venta se rechaza (422 `sin_regla_comision`).
Las líneas anteriores a F02 tienen el snapshot en nulo (todo o nada, `ck_linea_venta_09`); no se les inventó una comisión.

**Reglas:** dinero con `Decimal` y a lo sumo 2 decimales; el precio de lista lo pone el servidor desde el catálogo;
un descuento sobre el umbral exige `DESCUENTO_APROBAR`; sobre el máximo del salón se rechaza;
una especialista solo registra sus propios servicios.

**Lectura para caja:** `cobros_confirmados(desde, hasta)` y `descuentos_confirmados(desde, hasta)` (agregados por día y método, solo ventas CONFIRMADAS) están en el contrato; `cashier` no toca estas tablas.

**Eventos:** ninguno todavía (F13 los publicará por outbox).
