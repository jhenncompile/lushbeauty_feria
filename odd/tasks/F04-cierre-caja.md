# F04 · cierre-caja

**Plataformas:** BE · WEB  **Semana:** 2  **Estado:** backend T1/T2 hecho; T3 lista para cablear (decisión 9 cerrada); T4 en maqueta

## Resultado esperado
Cerrar y conciliar la caja diaria: importe esperado vs declarado, diferencia y justificación.
**Métrica:** el 100 % de los cierres de prueba reporta la diferencia correcta.

## Alcance
- Dentro: `CierreCaja` (fecha, esperado por medio de pago, declarado, diferencia, justificación, aprobador), resumen de caja por período.
- Fuera: aviso por n8n (F13).

## Requisitos cubiertos
RF-08 · HU (aviso de cierre, HU-08, en F13) · cap. 10 (K: endpoints de caja)

## Tareas
- [x] **F04-T1 [BE]** `GET /caja/resumen/?desde=&hasta=` consolida cobros por método y descuentos. *RED:* el resumen no coincide con la suma de pagos. *Acept.:* solo cuenta importes confirmados. **Hecho** (`feat/f04-cierre-caja`): módulo `cashier`; `GET /api/v1/caja/resumen/` suma pagos por método y descuentos por día solo de ventas CONFIRMADAS; las anuladas no cuentan. Los lee de `sales` por contrato. **Auditoría 2026-11-26:** Existe: `GET /api/v1/caja/resumen/`: solo ventas CONFIRMADAS, por método y descuentos por día. Falta: Nada. Bloquea: Nada.
- [x] **F04-T2 [BE]** `POST /caja/cierres/` registra declarado, diferencia y justificación **por método de pago** (una fila por salón, fecha y método; hasta 4 por día). *RED:* diferencia ≠ 0 sin justificación. *Acept.:* se rechaza. **Esquema DB:** se guarda `esperado` (snapshot) y `declarado`; la diferencia se calcula. La BD solo exige justificación al **aprobar**; el servicio la exige ya al registrar. Aprobar requiere `CAJA_CERRAR`. **Hecho:** `POST /api/v1/caja/cierres/` guarda una fila por método con `esperado` (foto) y `declarado`; la diferencia se calcula y una diferencia sin justificar se rechaza al registrar. Aprobar (`POST …/<id>/aprobar/`) exige `CAJA_CERRAR`, audita y congela el cierre. **Auditoría 2026-11-26:** Existe: Registro por método con esperado (foto) y declarado; diferencia calculada; justificación obligatoria; aprobación que congela. Falta: Si una especialista puede registrar el conteo (hoy solo `CAJA_CERRAR`); si el esperado incluye propinas. Bloquea: Nada.
- [~] **F04-T3 [BE]** Aprobar el cierre emite `cierre_caja.aprobado` al outbox (el publicador queda en F13). *Acept.:* el evento se persiste en la misma transacción. **Resuelto (decisión 9):** nombre único `cierre_caja.aprobado`. Con un cierre por método, la clave única del outbox `(salon, tipo, entidad_id)` emitiría hasta 4 eventos al día: **Decisión 9 cerrada: se emite un evento por fila (método) aprobada**; la entidad del evento es el id del cierre. **Parcial:** aprobar ya funciona y deja una entrada `APROBAR` en la bitácora, pero no emite `cierre_caja.aprobado`: el outbox ya existe (`notifications`, F13-T1/T2) pero este módulo aún no lo llama; la decisión 9 está cerrada. **Auditoría 2026-11-26:** Existe: Aprobar ya funciona y deja `APROBAR` en la bitácora; el outbox existe (`notifications`). Falta: Llamar a `publicar_evento("cierre_caja.aprobado", cierre.id, …)` dentro de `aprobar_cierre`, con payload sin importes personales, y probarlo. Bloquea: Nada: la decisión 9 está cerrada (un evento por método, nombre `cierre_caja.aprobado`).
- [~] **F04-T4 [WEB]** Pantalla de cierre diario: esperado, declarado, diferencia, justificar y aprobar. *Acept.:* flujo completo. **UI parcial (`feat/f04-ui-cierre-caja`):** móvil y web con esperado, efectivo contado, diferencia con palabra, justificación obligatoria y cierre que requiere conexión. **Backend listo** (resumen, registro, aprobación, historial); falta conectar la pantalla y mostrar la aprobación y el historial. **Auditoría 2026-11-26:** Existe: Maqueta web y Flutter con esperado sintético. Falta: Consumir `caja/resumen`, `caja/cierres` y `aprobar`; historial real de cierres. Bloquea: Nada técnico.

## Dependencias
F01. El outbox lo cierra F13.

## Evidencia
UI (parcial, `feat/f04-ui-cierre-caja`): `pnpm test` 65 pruebas en verde. Dominio: contado Bs 402 contra esperado Bs 412 → falta Bs 10,00, total declarado Bs 682 sobre Bs 692; cuadra y sobra también cubiertos. Pantalla: sin contar no se cierra; con diferencia exige justificación; cerrada queda de solo lectura; sin conexión el botón se deshabilita con explicación. `pnpm lint` y `pnpm build` sin errores. No se inspeccionó visualmente. Desviación del diseño: el efectivo contado empieza vacío (el diseño lo trae precargado en 402) para no simular un conteo que nadie hizo. QR y transferencia se toman iguales a lo esperado.

Backend (`feat/f04-cierre-caja`): `manage.py test` 155 pruebas OK en el contenedor `api` (7 de dominio sin base de datos; 17 de API y base: resumen = suma de pagos, anuladas excluidas, rango, diferencia por método, rechazo sin justificación sin dejar filas, reintento sin duplicar, fecha futura, aprobación y congelación por trigger, 403 con bitácora, 404 entre salones, RLS con SQL crudo). `migrate` aplicado sobre la base de desarrollo. **Decisiones tomadas por defecto, a validar:** el esperado no incluye propinas; el día es el de `fecha_servicio`; hoy solo la administradora registra el cierre. No verificado: la CI en GitHub, la pantalla ni el piloto con cierres reales. Los tests se escribieron junto con el código; no se observó el RED por separado.

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
Cablear F04-T3 (`cierre_caja.aprobado`, un evento por método, decisión 9 cerrada) y después conectar T4 a `caja/*`.
