# F00 · foundation

**Plataformas:** BE · WEB · TRANS  **Semanas:** 1-2  **Estado:** backend T2/T3/T4 hechos; T1/T6 hechos salvo verificación de `web` y de CI en GitHub; T5 UI parcial (falta login real)

## Resultado esperado
Un entorno reproducible (`docker compose up`) con API, base de datos y PWA que ya autentica por rol y aísla datos por salón. Sin esto ninguna otra feature es segura.
**Métrica:** un usuario de un salón no puede leer datos de otro (test automatizado); el entorno levanta en un comando.

## Alcance
- Dentro: monolito modular Django/DRF, PostgreSQL, scaffold React + TypeScript PWA, Docker Compose, autenticación, roles (administradora, especialista, lector), `salon_id` en todas las tablas, auditoría base.
- Fuera: lógica financiera, n8n, IA.

## Requisitos cubiertos
RF-19, RF-20 (base) · RN-06 · cap. 10 (principios, seguridad, despliegue)

## Tareas
- [~] **F00-T1 [TRANS]** Repo y estructura del monolito modular (paquetes por dominio, versiones fijadas). *RED:* el test de arranque de la API falla sin la app. *Acept.:* `docker compose up` levanta API + Postgres + frontend. **Hecho** (rama `feat/f00-foundation`): `docker-compose.yml` con `db` + `api` + `web`; `db` y `api` verificados (migra y responde 401/200); `web` no se construyó aquí.
- [x] **F00-T2 [BE]** Modelo `Salon`, `Usuario/Rol` y permisos por operación. *RED:* test de que una especialista no accede a endpoints de administración. *Acept.:* 403 y registro del intento. **Hecho:** módulo `identity` (Salon, Usuario, Rol, Permiso), `TienePermiso` y bitácora `ACCESO_DENEGADO`. **Esquema DB:** los 3 roles y los 16 permisos ya vienen sembrados; las clases de permiso de DRF consultan `fn_tiene_permiso(usuario, codigo)` y no inventan códigos. El intento denegado se registra como `accion = ACCESO_DENEGADO` con `permiso_id`, en una transacción aparte (la que falla hace rollback y se llevaría el registro).
- [x] **F00-T3 [BE]** Aislamiento por salón en todas las consultas (manager base + RLS en PostgreSQL). *RED:* usuario del salón A pide recursos del salón B. *Acept.:* 404/403; el test demuestra el aislamiento, no solo la presencia de `tenant_id`. **Hecho:** `SalonScopedManager` + RLS forzada; el rol de la app no es superusuario (test). **Esquema DB:** la RLS (`FORCE`) y las claves compuestas `(salon_id, id)` ya existen; falta que cada transacción ejecute `SET LOCAL app.salon_id` y `app.usuario_id`. La API debe conectarse con un rol que **no** sea superusuario (el superusuario se salta la RLS). Los procesos sin petición (publicador del outbox, F13) fijan `app.salon_id` por salón en cada lote. El test corre con ese rol sin privilegios.
- [x] **F00-T4 [BE]** Auditoría base (`Auditoria`: actor, antes/después, evento). *RED:* cambiar un registro sin entrada de auditoría. *Acept.:* cada escritura deja bitácora. **Hecho:** trigger `fn_auditar` en `salon`, `usuario`, `usuario_rol`; `auditoria` es de solo inserción. Los módulos futuros deben activarlo con `sql_activar_auditoria`. **Esquema DB (reducida):** el trigger `fn_auditar` ya audita toda escritura (excepto `auditoria` y `evento_outbox`) y la bitácora es de solo inserción. Queda: inyectar `app.usuario_id`, y que la aplicación escriba las acciones que el trigger no ve (`INICIAR_SESION`, `ACCESO_DENEGADO`, `CONSULTAR`, `EXPORTAR`). Tests: un UPDATE/DELETE/TRUNCATE sobre `auditoria` falla; una escritura sin `app.salon_id` no pasa silenciosa.
- [ ] **F00-T5 [WEB]** Scaffold PWA: login, shell con navegación según rol, manifest y service worker vacío. *Acept.:* instalable en móvil; las rutas se muestran según el rol. **UI parcial (rama `feat/f00-ui-shell-login`):** login, shell móvil/web, pestañas y guardas por rol con sesión simulada, manifest y service worker vacío hechos; faltan íconos PNG 192/512 para que sea instalable y el login real contra el API.
- [~] **F00-T6 [TRANS]** CI mínima (lint, tests) y `.env.example`. Los secretos no van al repo. *Acept.:* la CI corre en cada push. **Hecho:** `.github/workflows/ci.yml` y `.env.example`; la CI aún no se ha visto correr en GitHub.
- [ ] **F00-T7 [BE]** *(nueva, desde el esquema)* Cargar `db/LushBeauty_feria_postgresql.sql` como migración base (RunSQL o equivalente) y consulta del historial por usuario sobre `v_historial_usuario` con permiso `AUDITORIA_VER`. *RED:* migrar una base vacía y verificar triggers, RLS y vistas; un lector sin `AUDITORIA_VER` recibe 403. *Acept.:* la base se levanta con un comando y los tests no dependen de datos reales. **Depende de la decisión nueva 7 (INDEX).**

## Dependencias
Ninguna. Bloquea todas las demás.

## Evidencia
Backend (`feat/f00-foundation`): `manage.py test` 24 pruebas OK sobre PostgreSQL 17 (dominio de roles; login y 401; 403 + auditoría; 404 entre salones; RLS con SQL crudo; auditoría antes/después sin `password_hash`; bitácora inmutable). Control negativo: con el rol `postgres` (superusuario) fallan 5 pruebas de aislamiento, es decir, las pruebas sí detectan RLS ausente. `docker compose up db api`: migra y responde. No verificado: servicio `web`, CI en GitHub, login real del frontend.
UI (parcial, `feat/f00-ui-shell-login`): `pnpm test` 14 pruebas (dinero en centavos; ingreso con errores; entrada por rol; redirección de una especialista que pide `/caja`), `pnpm lint` y `pnpm build` sin errores. No verificado: render visual en navegador ni instalación PWA. Sin backend: la sesión y el rol son simulados en memoria.

## Siguiente paso
Pendiente de F00: T5 (login real contra `/api/auth/login`, íconos PNG) y ver correr la CI. Luego F01-caja-ventas-pagos (antes, decidir redondeo, RN-03).
