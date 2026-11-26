# catalog

**Responsabilidad:** servicios con precio de lista y costo de materiales, clientas y especialistas (con sueldo fijo).

**Contrato público** (`contracts.py`): `obtener_servicio` (DTO), `especialista_activa_existe`, `especialista_de_usuario`,
`cliente_existe`, `crear_servicio`, `crear_especialista`, `crear_cliente`.

**Tablas propias:** `servicio`, `cliente`, `especialista` (RLS por salón y auditoría automática).
Referencia a usuarios por `usuario_id` (valor, sin ForeignKey).

**API:** `/api/v1/servicios/`, `/api/v1/especialistas/`, `/api/v1/clientes/`. Alta y cambios exigen `CATALOGO_GESTIONAR`
(clientes: `VENTA_REGISTRAR`). `costo_materiales` y `sueldo_fijo` solo se muestran a quien gestiona el catálogo.

**Eventos:** ninguno todavía.
