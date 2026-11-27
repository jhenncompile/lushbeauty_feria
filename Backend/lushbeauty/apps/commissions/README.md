# commissions

**Responsabilidad:** políticas de comisión versionadas y el cálculo de la comisión de cada línea de venta (F02).

**Contrato público** (`contracts.py`): `comision_de_linea(especialista_id, dia, precio_lista, cantidad, importe_cobrado)`
(devuelve regla, base, tasa y comisión; lanza `SinReglaVigente`), `crear_version(...)`, `listar(...)`, constantes `PRECIO_LISTA`/`PRECIO_COBRADO`.
`sales` lo usa al registrar una venta y guarda el resultado como *snapshot* en la línea; este módulo no lee ventas.

**Tablas propias:** `regla_comision` (RLS por salón, auditoría automática). `especialista_id` vacío = regla general.
Referencia a la especialista por ID, sin ForeignKey.

**Reglas de negocio**
- La comisión es `round(base × tasa, 2)`, mitad hacia arriba. La base se elige **por regla**: `PRECIO_LISTA` (lista × cantidad, ignora el descuento) o `PRECIO_COBRADO` (importe neto). Eso resuelve la decisión abierta 2 sin fijarla para todo el salón.
- Gana la regla propia vigente de la especialista; si no hay, la general vigente. Si no hay ninguna, la venta se rechaza (`sin_regla_comision`).
- Se usa la regla vigente el **día del servicio** (zona del salón), no el de registro: una venta offline sincronizada tarde toma la regla de su día.
- Publicar una versión cierra la abierta del mismo ámbito el día anterior. El motivo es obligatorio. Una versión nueva no puede empezar en el pasado salvo que sea la primera del ámbito.
- Defensas en la base: `EXCLUDE` contra vigencias solapadas (extensión `btree_gist`), `CHECK` de porcentaje 0..1, y un trigger que prohíbe editar o borrar una regla publicada (solo se le puede poner `vigente_hasta`, una vez).

**API** (permiso `CATALOGO_GESTIONAR`): `GET /api/v1/comisiones/reglas/?especialista_id=&ambito=general` (historial),
`POST /api/v1/comisiones/reglas/` (versión nueva: `porcentaje`, `base`, `vigente_desde`, `motivo`, `especialista_id` opcional).

**Eventos:** no emite ni consume ninguno todavía.

**Pendiente:** la pantalla web para crear versiones y ver el historial (F02-T4); los porcentajes de ejemplo no son decisión de negocio.
