# payroll

**Responsabilidad:** deducciones y liquidación semanal por especialista (F03). Hoy: deducciones (T1) y borrador de liquidación (T2). La aprobación, el PDF y la vista propia llegan con F03-T3, T4 y T6.

**Contrato público** (`contracts.py`): `registrar_deduccion`, `generar_borrador`, `listar`, `periodo_de`, `NominaRechazada`.
Lee ventas por `sales.lineas_para_liquidar`, el sueldo fijo por `catalog.obtener_especialista` y el día de corte por `identity.dia_corte_del_salon`; no consulta tablas ajenas.

**Tablas propias:** `liquidacion` y `movimiento_nomina` (RLS por salón, auditoría automática). Referencias por ID, sin ForeignKey.

**Decisión 6 (valor inicial, a confirmar con la administradora):** la semana va de **lunes a domingo** (`salon.dia_corte_semana = 6`, configurable por salón: 0 = lunes … 6 = domingo, es el último día de la semana) y la **propina es 100 % de la especialista** que la recibió, visible aparte de la comisión. Cambiar el corte no requiere tocar el modelo.

**Fórmula** (igual que la restricción de la base): `neto − excedente = sueldo fijo + comisión + propina + movimientos`. Si el total es negativo, `neto = 0` y la diferencia queda como `excedente`, que entra a la semana siguiente como movimiento `EXCEDENTE` (monto negativo) cuando la semana anterior ya está aprobada. Supuesto sin validar: el `sueldo_fijo` del catálogo se paga **por semana de liquidación**.

**Reglas de negocio**
- Una deducción es un monto **negativo** con **motivo** obligatorio y tipo `ADELANTO`, `FALTA` o `MATERIAL`; no se acepta sobre una semana ya aprobada (409). `AJUSTE` y `EXCEDENTE` no se crean a mano.
- El borrador es idempotente: regenerarlo recalcula el mismo registro (una fila por especialista y semana). Una semana aprobada no se recalcula (409). **El borrador no marca ni bloquea ventas**: anular una venta sigue permitido y el siguiente recálculo la descuenta. La congelación de líneas y movimientos ocurre al aprobar (F03-T3).
- Solo cuentan líneas de ventas CONFIRMADAS del día de servicio dentro de la semana. Las líneas anteriores a F02 (sin snapshot) aportan 0 y se avisan en `lineas_sin_comision`.
- Defensas en la base (RN-05): la liquidación aprobada solo admite pasar a `PAGADA` y adjuntar el comprobante; nada entra a una aprobada; ni liquidaciones ni movimientos se borran; el neto debe cuadrar con la fórmula.

**API** (permiso `LIQUIDACION_APROBAR`, hoy solo la administradora): `POST /api/v1/nomina/deducciones/`, `POST /api/v1/nomina/liquidaciones/generar/` (`especialista_id`, `fecha`),
`GET /api/v1/nomina/liquidaciones/?especialista_id=&desde=&hasta=`, `GET /api/v1/nomina/liquidaciones/<id>/` (con detalle por línea y movimiento mientras sea borrador).

**Eventos:** no emite ni consume ninguno todavía; el evento de liquidación aprobada (E2) llega con F03-T3.

**Pendiente:** aprobar y congelar (T3), marcar pagada, ajuste por venta ya liquidada, PDF/XLSX (T4), vista «Mi liquidación» de la especialista con `LIQUIDACION_VER_PROPIA` (T6), generar para todas las especialistas de una vez.
