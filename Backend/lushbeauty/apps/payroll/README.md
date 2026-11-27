# payroll

**Responsabilidad:** deducciones y liquidación semanal por especialista (F03). Hoy: deducciones (T1), borrador (T2), aprobación, pago y ajustes (T3), PDF y XLSX (T4) y vista propia (T6).

**Contrato público** (`contracts.py`): `registrar_deduccion`, `generar_borrador`, `aprobar`, `marcar_pagada`, `listar`, `periodo_de`, `NominaRechazada`.
Lee ventas por `sales.lineas_para_liquidar`, el sueldo fijo por `catalog.obtener_especialista` y el día de corte por `identity.dia_corte_del_salon`; no consulta tablas ajenas.

**Tablas propias:** `liquidacion` y `movimiento_nomina` (RLS por salón, auditoría automática). Referencias por ID, sin ForeignKey.

**Decisión 6 (valor inicial, a confirmar con la administradora):** la semana va de **lunes a domingo** (`salon.dia_corte_semana = 6`, configurable por salón: 0 = lunes … 6 = domingo, es el último día de la semana) y la **propina es 100 % de la especialista** que la recibió, visible aparte de la comisión. Cambiar el corte no requiere tocar el modelo.

**Fórmula** (igual que la restricción de la base): `neto − excedente = sueldo fijo + comisión + propina + movimientos`. Si el total es negativo, `neto = 0` y la diferencia queda como `excedente`, que entra a la semana siguiente como movimiento `EXCEDENTE` (monto negativo) cuando la semana anterior ya está aprobada. Supuesto sin validar: el `sueldo_fijo` del catálogo se paga **por semana de liquidación**.

**Reglas de negocio**
- Una deducción es un monto **negativo** con **motivo** obligatorio y tipo `ADELANTO`, `FALTA` o `MATERIAL`; no se acepta sobre una semana ya aprobada (409). `AJUSTE` y `EXCEDENTE` no se crean a mano.
- El borrador es idempotente: regenerarlo recalcula el mismo registro (una fila por especialista y semana). Una semana aprobada no se recalcula (409). **El borrador no marca ni bloquea ventas**: anular una venta sigue permitido y el siguiente recálculo la descuenta. La congelación de líneas y movimientos ocurre al aprobar (F03-T3).
- Solo cuentan líneas de ventas CONFIRMADAS del día de servicio dentro de la semana. Las líneas anteriores a F02 (sin snapshot) aportan 0 y se avisan en `lineas_sin_comision`.
- Defensas en la base (RN-05): la liquidación aprobada solo admite pasar a `PAGADA` y adjuntar el comprobante; nada entra a una aprobada; ni liquidaciones ni movimientos se borran; el neto debe cuadrar con la fórmula.

**Aprobar y congelar (RN-05):** `POST …/<id>/aprobar/` recalcula con lo último, liga a la liquidación las líneas de venta (`liquidacion_id`) y los movimientos del período, la marca `APROBADA` (con quién y cuándo), deja `APROBAR` en la bitácora y el evento `liquidacion.aprobada` en el outbox, **todo en una transacción**: si el evento falla, no se aprueba nada. El evento lleva solo el id y el período, sin importes ni la especialista. `POST …/<id>/pagar/` pasa `APROBADA` → `PAGADA` y guarda el `comprobante_url` (es lo único que admite una aprobada). El detalle de una aprobada sale de lo que quedó ligado a ella.

**Venta anulada después de liquidarse (decisión del usuario):** anular **no se bloquea**. La liquidación aprobada no cambia; la primera liquidación de una semana posterior descuenta `−(comisión + propina)` de la línea como un movimiento `AJUSTE`, con el motivo de la anulación, una sola vez por línea (`ajuste_de_linea_id` único). Supuesto sin validar: el ajuste descuenta la comisión y la propina de esa línea, no el sueldo fijo.

**API** (permiso `LIQUIDACION_APROBAR`, hoy solo la administradora): `POST /api/v1/nomina/deducciones/`, `POST /api/v1/nomina/liquidaciones/generar/` (`especialista_id`, `fecha`), `POST …/liquidaciones/<id>/aprobar/`, `POST …/liquidaciones/<id>/pagar/`,
`GET /api/v1/nomina/liquidaciones/?especialista_id=&desde=&hasta=`, `GET /api/v1/nomina/liquidaciones/<id>/` (con detalle por línea y movimiento).

**«Mi liquidación» (F03-T6, HU-09, CP-06):** con el permiso `LIQUIDACION_VER_PROPIA`, la especialista vinculada a su usuario ve **solo las suyas y solo aprobadas o pagadas** (un borrador es de trabajo y puede cambiar): `GET /api/v1/nomina/mis-liquidaciones/` y `GET …/mis-liquidaciones/<id>/` (con detalle). Pedir una liquidación de otra persona, una inexistente o un borrador da **403 y deja `ACCESO_DENEGADO`** en la bitácora (mismo código en los tres casos para no revelar cuáles existen). Quien no es especialista (administradora, lector) o no tiene ficha vinculada también recibe 403. Las rutas de administración siguen cerradas a la especialista.

**Documentos (F03-T4, RN-08):** `GET …/liquidaciones/<id>/pdf/` (administradora) y `GET …/mis-liquidaciones/<id>/pdf/` (la destinataria) devuelven el comprobante PDF de una liquidación **aprobada o pagada** (ReportLab): salón, especialista, período, estado, resumen (sueldo fijo, comisión, propinas, deducciones, excedente, neto), deducciones y servicios. Un borrador no tiene comprobante (409). Pedir el PDF de otra persona, inexistente o en borrador por la vía propia da 403 y `ACCESO_DENEGADO`. La respuesta lleva `Cache-Control: private, no-store`. `GET …/liquidaciones/exportar/?desde=&hasta=` (solo administradora) devuelve un XLSX con una fila por liquidación (importes como números; los textos que parecen fórmula se neutralizan). Cada descarga deja una entrada `EXPORTAR` en la bitácora, sin el contenido. El PDF va sin comprimir (es corto) para poder verificarlo en las pruebas. El `comprobante_url` de `pagar` sigue siendo un dato libre: el enlace temporal autorizado es F13-T3.

**Eventos que emite:** `liquidacion.aprobada` (entidad = id de la liquidación; payload `periodo_inicio`, `periodo_fin`).

**Pendiente:** enlace temporal para enviar el PDF (F13-T3), un PDF con logotipo, y generar para todas las especialistas a la vez, vista «Mi liquidación» de la especialista con `LIQUIDACION_VER_PROPIA` (T6), generar para todas las especialistas de una vez.
