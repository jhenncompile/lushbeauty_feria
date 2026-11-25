# Backlog ODD · Lush Beauty Smart

Fuente: `docs/latex/latex/chapters/` (cap. 04, 08, 09, 10, 14 y Anexos H, I, J, K, L, N, P, Q).
Convención ODD: un documento por feature en `odd/tasks/<feature>.md`; tareas test-first (RED → GREEN → REFACTOR); commits de ~400 líneas; la evidencia se completa al cerrar cada feature.
Etiquetas: `[BE]` backend Django/DRF · `[WEB]` vista de administradora · `[MOB]` vista de especialista (misma PWA) · `[TRANS]` seguridad, n8n, despliegue, pruebas.

## Orden y estado

| Sem | Feature | Estado | Prioridad |
|---|---|---|---|
| 1-2 | [F00 foundation](F00-foundation.md) | UI parcial (T5 maqueta) | Protegida |
| 2 | [F01 caja-ventas-pagos](F01-caja-ventas-pagos.md) | UI parcial (T5/T6 maqueta) | Protegida |
| 2 | [F02 comisiones-versionadas](F02-comisiones-versionadas.md) | pendiente | Protegida |
| 2 | [F03 liquidacion-semanal](F03-liquidacion-semanal.md) | pendiente | Protegida |
| 2 | [F04 cierre-caja](F04-cierre-caja.md) | pendiente | Protegida |
| 3 | [F05 pwa-offline-sync](F05-pwa-offline-sync.md) | pendiente | Alta |
| 3 | [F06 importador-excel](F06-importador-excel.md) | pendiente | Alta |
| 3-4 | [F07 dashboard-financiero](F07-dashboard-financiero.md) | pendiente | Alta |
| 4 | [F08 dss-contribucion-whatif](F08-dss-contribucion-whatif.md) | pendiente | Protegida (ciclo DSS) |
| 5 | [F09 dss-matriz-sensibilidad](F09-dss-matriz-sensibilidad.md) | pendiente | Protegida (ciclo DSS) |
| 6 | [F10 dss-recomendacion-decisiones](F10-dss-recomendacion-decisiones.md) | pendiente | Protegida (ciclo DSS) |
| 6-7 | [F11 lush-insight](F11-lush-insight.md) | pendiente | Recortable |
| 7 | [F12 lush-guard](F12-lush-guard.md) | pendiente | Recortable |
| 7 | [F13 n8n-outbox](F13-n8n-outbox.md) | pendiente | Recortable (un flujo mínimo) |
| 7-8 | [F14 seguridad-demo-feria](F14-seguridad-demo-feria.md) | pendiente | Protegida |

Si falta tiempo (cap. 14): se protege el ciclo completo de F00–F04 + F08–F10 y un flujo de F13; se aplazan IA generativa avanzada, ML y optimización.

## Vistas por plataforma

**Mobile (especialista, PWA)**: F01-T6 registro rápido · F03-T6 «Mi liquidación» · F05-T3/T4/T5/T6 cola offline, sincronizador, estados y pruebas de campo.

**Web (administradora)**: F00-T5 shell y login · F01-T5 venta · F02-T4 políticas · F03-T5 liquidación · F04-T4 cierre · F06-T6 vista previa de importación · F07-T3/T4 dashboard · F08-T5/T6 escenarios · F09-T4 matriz · F10-T5/T6 recomendación y seguimiento · F11-T5 chat · F12-T4 alertas · F13-T6 eventos.

**Backend**: F00-T2/T3/T4 · F01-T1..T4 · F02-T1..T3 · F03-T1..T4 · F04-T1..T3 · F05-T1/T2 · F06-T1..T5 · F07-T1/T2 · F08-T1..T4 · F09-T1..T3 · F10-T1..T4 · F11-T1..T4 · F12-T1..T3, T5 · F13-T1/T2/T3/T5.

**Transversal**: F00-T1/T6 · F03-T7 · F05-T6 · F06-T7 · F10-T7 · F11-T6 · F13-T4 · F14-T1..T6.

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
2. Base de comisión: precio de lista o importe neto → F02.
3. Costos variables de materiales por servicio → F08.
4. Pesos de la matriz multicriterio → F09.
5. Fecha real de la feria, para revisar el plan de 8 semanas → todo el calendario.
6. Día de corte semanal y política de propinas → F03.
