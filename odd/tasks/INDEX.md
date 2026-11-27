# Backlog ODD · Lush Beauty Smart

Fuente: `docs/latex/latex/chapters/` (cap. 04, 08, 09, 10, 14 y Anexos H, I, J, K, L, N, P, Q).
Convención ODD: un documento por feature en `odd/tasks/<feature>.md`; tareas test-first (RED → GREEN → REFACTOR); commits de ~400 líneas; la evidencia se completa al cerrar cada feature.
Etiquetas: `[BE]` backend Django/DRF · `[WEB]` vista de administradora · `[MOB]` vista de especialista (misma PWA) · `[TRANS]` seguridad, n8n, despliegue, pruebas.

## Orden y estado

| Sem | Feature | Estado | Prioridad |
|---|---|---|---|
| 1-2 | [F00 foundation](F00-foundation.md) | Hecho salvo T1/T6 parciales (CI y PWA en Docker sin verificar); UI solo consume el login | Protegida |
| 2 | [F01 caja-ventas-pagos](F01-caja-ventas-pagos.md) | Backend T1–T4/T7 hecho; UI T5/T6 en maqueta sin conectar | Protegida |
| 2 | [F02 comisiones-versionadas](F02-comisiones-versionadas.md) | Backend T1–T3 hecho; T4: API lista, pantalla de lectura con fixtures | Protegida |
| 2 | [F03 liquidacion-semanal](F03-liquidacion-semanal.md) | Backend sin empezar (T2 bloqueada por decisión 6); UI T5/T6 maqueta | Protegida |
| 2 | [F04 cierre-caja](F04-cierre-caja.md) | Backend T1–T3 hecho; UI T4 maqueta | Protegida |
| 3 | [F05 pwa-offline-sync](F05-pwa-offline-sync.md) | T1 casi hecho (falta `PWA_OFFLINE`); T2 bloqueada por decisión 10; UI T5 maqueta | Alta |
| 3 | [F06 importador-excel](F06-importador-excel.md) | Backend sin empezar; UI T6 maqueta; decisiones 11 y 12 abiertas | Alta |
| 3-4 | [F07 dashboard-financiero](F07-dashboard-financiero.md) | Backend T1/T2 hecho; UI T3/T4 maqueta | Alta |
| 4 | [F08 dss-contribucion-whatif](F08-dss-contribucion-whatif.md) | T1 parcial; sin backend DSS; UI maqueta; decisiones 3, 13 y 14 | Protegida (ciclo DSS) |
| 5 | [F09 dss-matriz-sensibilidad](F09-dss-matriz-sensibilidad.md) | Sin backend; UI maqueta; decisión 4 | Protegida (ciclo DSS) |
| 6 | [F10 dss-recomendacion-decisiones](F10-dss-recomendacion-decisiones.md) | Sin backend; UI maqueta; decisión 14 | Protegida (ciclo DSS) |
| 6-7 | [F11 lush-insight](F11-lush-insight.md) | Sin backend; UI con respuestas fijas; falta proveedor de IA | Recortable |
| 7 | [F12 lush-guard](F12-lush-guard.md) | Sin backend; UI maqueta; decisión 15 | Recortable |
| 7 | [F13 n8n-outbox](F13-n8n-outbox.md) | T1 (cierre) y T2 hechos; falta liquidación y flujos n8n | Recortable (un flujo mínimo) |
| 7-8 | [F14 seguridad-demo-feria](F14-seguridad-demo-feria.md) | T1/T2 parciales; resto pendiente | Protegida |

Si falta tiempo (cap. 14): se protege el ciclo completo de F00–F04 + F08–F10 y un flujo de F13; se aplazan IA generativa avanzada, ML y optimización.

## Vistas por plataforma

**Mobile (especialista, PWA)**: F01-T6 registro rápido · F03-T6 «Mi liquidación» · F05-T3/T4/T5/T6 cola offline, sincronizador, estados y pruebas de campo.

**Web (administradora)**: F00-T5 shell y login · F01-T5 venta · F02-T4 políticas · F03-T5 liquidación · F04-T4 cierre · F06-T6 vista previa de importación · F07-T3/T4 dashboard · F08-T5/T6 escenarios · F09-T4 matriz · F10-T5/T6 recomendación y seguimiento · F11-T5 chat · F12-T4 alertas · F13-T6 eventos.

**Mobile Flutter (réplica de las vistas de especialista, decisión «ambas»)**: implementadas con datos sintéticos en `Mobile/lushbeauty`: ingreso, Hoy, registrar/descuento/guardado, sincronización, Mi liquidación y cierre de caja. Ver `Mobile/lushbeauty/DESIGN.md`.

**Backend hecho** (202 pruebas en la suite; módulos `identity`, `audit`, `catalog`, `commissions`, `sales`, `cashier`, `analytics`, `notifications`, `demo`): F00-T2/T3/T4/T7 · F01-T1..T4, T7 · F02-T1..T3 · F04-T1..T3 · F07-T1/T2 · F13-T1 (cierre), T2.
**Backend parcial**: F05-T1 (falta `PWA_OFFLINE`) · F08-T1 (falta vigencia del costo)  · F13-T1 (falta la liquidación).
**Backend pendiente**: F03-T1..T4 · F05-T2 · F06-T1..T5 · F08-T2..T4 · F09-T1..T3 · F10-T1..T4 · F11-T1..T4 · F12-T1..T3, T5 · F13-T3, T5.

**Transversal**: hecho F00-T1/T6 parciales, F14-T1/T2 parciales (RLS, triggers y `seed_demo`). Pendiente F03-T7 · F05-T6 · F06-T7 · F10-T7 · F11-T6 · F13-T4 · F14-T3..T6.

**Endpoints que ya existen y la UI todavía no consume** (la web solo llama a `POST /api/auth/login`; Flutter no llama a la red): `/api/auth/me`, `/api/identity/usuarios`, `/api/identity/historial`, `/api/v1/ventas/` (+ detalle y anular), `/api/v1/servicios/`, `/api/v1/especialistas/`, `/api/v1/clientes/`, `/api/v1/comisiones/reglas/`, `/api/v1/caja/resumen/`, `/api/v1/caja/cierres/` (+ aprobar), `/api/v1/analytics/panel/`. Conectarlos es lo que convierte las maquetas de F01, F02, F04 y F07 en pantallas reales.

## Revisión contra el esquema de BD (`db/LushBeauty_feria_postgresql.sql`)

El esquema ya implementa varias reglas en la base (RLS, auditoría por trigger, inmutabilidad de líneas y liquidaciones, RN-04, idempotencia, outbox único). Efecto en el backlog:

- **Reducidas:** F00-T4 (auditoría: queda la inyección de contexto y las acciones que el trigger no ve), F03-T1 (la propina es columna de la línea), F06-T4 (el modelo existe), F08-T1 (sin vigencia ni fuente), F10-T4 (sin tabla propia), F12-T1 (reglas fijas) y F12-T3 (dos estados).
- **Añadidas:** F00-T7 (migración base e historial por usuario) y F01-T7 (CRUD de catálogo, clientes y especialistas, que nadie construía).
- **Con restricciones nuevas en el criterio de aceptación:** F00-T2/T3, F01-T1..T4, F02-T1/T2, F03-T2..T3, F04-T2/T3, F05-T1/T2, F06-T2/T3/T5, F08-T2/T4, F09-T1/T2, F10-T1/T3, F13-T1/T2, F14-T1/T3.
- **Cambia la implementación:** (a) la fórmula de la liquidación incluye el sueldo fijo; (b) el cierre de caja es por método; (c) los alias de F06 salen de filas aceptadas; (d) un escenario no existe sin su `decision`; (e) los procesos sin petición (outbox) deben fijar `app.salon_id`; (f) la excepción de un trigger hace rollback, así que auditoría de intentos y alertas se escriben en otra transacción.
- **Resuelve a medias decisiones abiertas:** la 2 (la base se elige por regla), la 1 (propuesta `round(x, 2)`), la 3 (el costo es nullable, pero sin vigencia). Las 4, 5 y 6 siguen abiertas; el esquema trae pesos por defecto 40/25/20/15, que son de ejemplo.

## Cobertura de requisitos

| Requisito | Feature |
|---|---|
| RF-01..04 | F01 |
| RF-05 | F02 |
| RF-06, 07, 09 | F03 |
| RF-08 | F04 |
| RF-10, 11 | F05 |
| RF-12..14 | F06 |
| RF-15 | F07 |
| RF-16 | F11 |
| RF-17 | F12 |
| RF-18 | F13 |
| RF-19, 20 | F00, F14 |
| HU-01, 10 | F01 |
| HU-02 | F05 |
| HU-03 | F02 |
| HU-04, 09 | F03 |
| HU-05 | F06 |
| HU-06 | F11 |
| HU-07 | F12 |
| HU-08 | F13 |
| DSS-01, 02 | F08 |
| DSS-03, 04 | F09 |
| DSS-05, 06, 07 | F10 |
| CP-01 | F01 |
| CP-02, 09 | F02 |
| CP-03, 04 | F05 |
| CP-05 | F06 |
| CP-06 | F03, F14 |
| CP-07 | F11 |
| CP-08, 10 | F13 |
| DSS-CP01, 02, 04, 05 | F08 |
| DSS-CP03 | F09 |
| DSS-CP06, 07 | F10 |
| RN-01..08 | F01, F02, F03, F05, F11, F13 (RN-07 en F11 y F12) |

## Fase posterior (fuera del MVP)
DSS-08 (proyección de caja) · DSS-09 (optimización de capacidad) · DSS-10 (pronósticos ML) · React Native/Expo · agenda · inventario · WhatsApp oficial · aliases aprendidos del historial.

## Decisiones abiertas que bloquean tasks (validar con la administradora)
1. Redondeo de moneda (RN-03) → F01.
2. ~~Base de comisión~~ Resuelta técnicamente **por regla** (cada versión elige lista o neto); la administradora debe confirmar cuál usar → F02.
3. Costos variables de materiales por servicio → F08.
4. Pesos de la matriz multicriterio → F09.
5. Fecha real de la feria, para revisar el plan de 8 semanas → todo el calendario.
6. Día de corte semanal y política de propinas → F03.
7. ~~**Esquema único vs. módulos**~~ **Cerrada: migraciones por módulo** (sin FK entre módulos; `db/…sql` es la referencia). Texto original: `db/…sql` tiene unas 60 claves foráneas compuestas entre tablas de lo que serían módulos distintos (p. ej. `linea_venta` → `servicio`, `especialista`, `regla_comision`, `liquidacion`), y la tabla `decision` es compartida por F08, F09 y F10. `AGENTS.md` regla 2 prohíbe FK entre módulos. Hay que decidir: relajar la regla (misma BD, FK dentro de ella, módulos que hablan por servicios) o rediseñar el esquema. Afecta F00-T7 y a toda la estructura de `persistence/`.
8. Umbral de descuento sin aprobación y registro de quién lo aprueba (el esquema solo tiene el tope de 50 %) → F01-T2.
9. ~~Eventos de cierre de caja~~ **Cerrada: un evento por método aprobado, nombre `cierre_caja.aprobado`** (entidad = id del cierre) → F04-T3, F13.
10. Dónde guardar la causa de un conflicto de sincronización → F05-T2.
11. ¿Aliases aprendidos de filas aceptadas entran en el MVP? (hoy están fuera) → F06-T2.
12. Pago de las ventas importadas sin método de pago en la planilla → F06-T5.
13. Costos de materiales con vigencia y fuente: ¿tabla nueva o solo costo actual + snapshot? → F08-T1.
14. Estructura de la recomendación (texto serializado o `jsonb`) → F10-T1.
15. Estados de alerta: ¿bastan PENDIENTE/REVISADA? → F12-T3.

**Cambios propuestos al esquema (no aplicados):** `regla_comision.motivo` y restricción `EXCLUDE` de solapamiento; `tipo_alerta` con conflicto de sincronización; trigger de inmutabilidad en `decision`; `descuento` con aprobador; `jsonb` para la recomendación.
