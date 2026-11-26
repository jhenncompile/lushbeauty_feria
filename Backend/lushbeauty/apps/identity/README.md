# identity

**Responsabilidad:** salones (inquilinos), usuarios, roles y permisos; inicio de sesión y token.

**Contrato público** (`contracts.py`): `crear_salon`, `crear_usuario`, `iniciar_sesion`, `permisos_de_roles`, constantes de rol.
Otros módulos fijan el salón activo con `shared.tenancy`, nunca leen tablas de `identity`.

**Tablas propias:** `salon`, `usuario`, `usuario_rol`, `rol`, `permiso`, `rol_permiso`. Con RLS: `salon`, `usuario`, `usuario_rol`.

**API:** `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/identity/usuarios`, `GET /api/identity/usuarios/<id>`.

**Eventos:** no emite ni consume ninguno todavía.
