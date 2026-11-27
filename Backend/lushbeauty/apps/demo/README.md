# demo

**Responsabilidad:** datos sintéticos de desarrollo. No tiene tablas ni lógica de negocio; compone los contratos de `identity`, `catalog` y `sales`.

**Uso:** `python manage.py seed_demo` (en Docker: `docker compose exec api python manage.py seed_demo`). Solo corre con `DJANGO_DEBUG=true`. Es idempotente.

**Qué crea:** dos salones (para probar el aislamiento), cuentas `admin@lush.test`, `especialista@lush.test`, `lector@lush.test` y `admin@otro.test`, todas con la clave `demo-lush-2026`; servicios, especialistas, clientas, políticas de comisión (35 % sobre lista para el salón y 40 % sobre lo cobrado para la segunda especialista; porcentajes de ejemplo) y tres ventas con su comisión. Todo es ficticio.

**Eventos:** no emite ni consume ninguno.
