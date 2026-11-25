# F00 · foundation

**Plataformas:** BE · WEB · TRANS  **Semanas:** 1-2  **Estado:** pendiente

## Resultado esperado
Un entorno reproducible (`docker compose up`) con API, base de datos y PWA que ya autentica por rol y aísla datos por salón. Sin esto ninguna otra feature es segura.
**Métrica:** un usuario de un salón no puede leer datos de otro (test automatizado); el entorno levanta en un comando.

## Alcance
- Dentro: monolito modular Django/DRF, PostgreSQL, scaffold React + TypeScript PWA, Docker Compose, autenticación, roles (administradora, especialista, lector), `salon_id` en todas las tablas, auditoría base.
- Fuera: lógica financiera, n8n, IA.

## Requisitos cubiertos
RF-19, RF-20 (base) · RN-06 · cap. 10 (principios, seguridad, despliegue)

## Tareas
- [ ] **F00-T1 [TRANS]** Repo y estructura del monolito modular (paquetes por dominio, versiones fijadas). *RED:* el test de arranque de la API falla sin la app. *Acept.:* `docker compose up` levanta API + Postgres + frontend.
- [ ] **F00-T2 [BE]** Modelo `Salon`, `Usuario/Rol` y permisos por operación. *RED:* test de que una especialista no accede a endpoints de administración. *Acept.:* 403 y registro del intento.
- [ ] **F00-T3 [BE]** Aislamiento por salón en todas las consultas (manager base + RLS en PostgreSQL). *RED:* usuario del salón A pide recursos del salón B. *Acept.:* 404/403; el test demuestra el aislamiento, no solo la presencia de `tenant_id`.
- [ ] **F00-T4 [BE]** Auditoría base (`Auditoria`: actor, antes/después, evento). *RED:* cambiar un registro sin entrada de auditoría. *Acept.:* cada escritura deja bitácora.
- [ ] **F00-T5 [WEB]** Scaffold PWA: login, shell con navegación según rol, manifest y service worker vacío. *Acept.:* instalable en móvil; las rutas se muestran según el rol.
- [ ] **F00-T6 [TRANS]** CI mínima (lint, tests) y `.env.example`. Los secretos no van al repo. *Acept.:* la CI corre en cada push.

## Dependencias
Ninguna. Bloquea todas las demás.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F01-caja-ventas-pagos
