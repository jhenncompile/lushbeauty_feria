# audit

**Responsabilidad:** bitácora de solo inserción (`auditoria`): quién, qué, antes/después, cuándo.

**Contrato público** (`contracts.py`): `registrar_evento`, `registrar_acceso_denegado`, `sql_activar_auditoria(tabla)`.
Un módulo que quiera historial automático en una tabla suya llama a `sql_activar_auditoria` desde su migración
(trigger `fn_auditar`, que toma salón y usuario de la sesión y nunca guarda `password_hash`).

**Tablas propias:** `auditoria` (con RLS; `UPDATE`, `DELETE` y `TRUNCATE` están prohibidos por trigger).

**Eventos:** no emite ni consume ninguno todavía.

**Aviso:** `valor_anterior`/`valor_nuevo` guardan los importes como `jsonb` (exactos en la base), pero Python los
lee como `float`. Sirven para mostrar el historial; no los uses para calcular dinero.
