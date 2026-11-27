# Backend · Lush Beauty

Monolito modular Django + DRF sobre PostgreSQL. Reglas de arquitectura: `AGENTS.md` en la raíz.

```
apps/<modulo>/{domain,services,api,persistence,events,tests}  contracts.py  README.md
shared/                         contexto de salón (tenancy) y middleware, sin lógica de negocio
```

Módulos hoy: `identity`, `audit`, `catalog`, `commissions`, `sales` (más `demo`, solo siembra datos de desarrollo).

## Aislamiento por salón
Dos capas: `SalonScopedManager` (ORM) y RLS en PostgreSQL (`app.salon_id`). El rol de la base que usa la app
**no puede ser superusuario** ni tener `BYPASSRLS`; hay una prueba que lo verifica.

## Desarrollo
```
cp ../../.env.example ../../.env      # y ajusta
docker compose up                      # desde la raíz: db + api + web
```
Sin Docker: levanta un PostgreSQL, crea el rol con `docker/postgres-init.sh`, exporta las variables de
`.env.example` y corre `uv run python manage.py migrate` / `uv run python manage.py test`.
Los tests necesitan PostgreSQL (el rol debe poder crear bases: `CREATEDB`).

Los datos de prueba son siempre sintéticos. Para tener usuarios y catálogo en desarrollo: `python manage.py seed_demo` (cuentas y clave en `apps/demo/README.md`).
