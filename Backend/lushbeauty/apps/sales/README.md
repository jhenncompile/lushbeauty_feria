# sales

**Responsabilidad:** ventas multilínea, pagos divididos, descuentos con motivo y anulación auditada.
La comisión (F02) y la liquidación (F03) viven en otros módulos y leen estas ventas por contrato.

**Contrato público** (`contracts.py`): `registrar_venta`, `anular_venta`, `calcular_linea`, `validar_pagos`, `METODOS_PAGO`.

**Tablas propias:** `venta`, `linea_venta`, `pago` (RLS por salón, auditoría automática, líneas inmutables,
prohibido borrar, pagos = líneas al confirmar). Referencias a `servicio`, `especialista`, `cliente` por ID, sin ForeignKey.

**API:** `POST/GET /api/v1/ventas/` (idempotente por `uuid_cliente`), `GET /api/v1/ventas/<id>/`,
`POST /api/v1/ventas/<id>/anular/`.

**Reglas:** dinero con `Decimal` y a lo sumo 2 decimales; el precio de lista lo pone el servidor desde el catálogo;
un descuento sobre el umbral exige `DESCUENTO_APROBAR`; sobre el máximo del salón se rechaza;
una especialista solo registra sus propios servicios.

**Eventos:** ninguno todavía (F13 los publicará por outbox).
