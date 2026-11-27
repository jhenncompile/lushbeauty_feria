# cashier

**Responsabilidad:** cierre de caja diario: esperado vs. declarado por método de pago, diferencia, justificación y aprobación (F04).

**Contrato público** (`contracts.py`): `resumen(desde, hasta)`, `registrar_cierre(fecha, declaraciones, usuario_id)`, `aprobar_cierre(id, usuario)`, `listar(...)`, `diferencia`, `METODOS`.
Los cobros los lee de `sales` solo por su contrato (`cobros_confirmados`, `descuentos_confirmados`); nunca consulta sus tablas.

**Tablas propias:** `cierre_caja` (RLS por salón, auditoría automática). Una fila por salón, día y método (hasta 4 por día).
`esperado` es una foto del momento del registro; la diferencia **no se guarda**, se calcula (`declarado − esperado`: negativa = falta, positiva = sobra).
Aprobado, un cierre no se modifica y ninguno se borra (trigger).

**Reglas de negocio**
- El esperado de un método es la suma de los **pagos de ventas CONFIRMADAS** cuyo servicio cae en ese día (zona del salón). Las anuladas y pendientes no cuentan. El día es el de `fecha_servicio`, no el de `pagado_en`.
- Las **propinas no se suman** al esperado: no son parte de `pago`. Si el efectivo contado debe incluirlas, hay que decidirlo (pendiente).
- Una diferencia sin justificación se rechaza ya al registrar (la base solo lo exige al aprobar). Un reintento antes de aprobar actualiza la fila; después, 409.
- No se cierra un día futuro. Aprobar exige `CAJA_CERRAR` y deja una entrada `APROBAR` en la bitácora.

**API** (todo con permiso `CAJA_CERRAR`, hoy solo la administradora): `GET /api/v1/caja/resumen/?desde=&hasta=`,
`GET/POST /api/v1/caja/cierres/` (`fecha` + `declaraciones[{metodo, declarado, justificacion}]`), `POST /api/v1/caja/cierres/<id>/aprobar/`.

**Eventos:** todavía ninguno. Aprobar debería emitir `caja.cierre_aprobado` al outbox (F13); falta decidir si es por método o al completar el día, y unificar el nombre con `cierre_caja.aprobado` (decisión 9).

**Pendiente:** la pantalla y la vista móvil conectadas al servidor; si una especialista puede registrar el conteo (hoy no tiene permiso).
