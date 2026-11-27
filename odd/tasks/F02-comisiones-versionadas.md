# F02 · comisiones-versionadas

**Plataformas:** BE · WEB  **Semana:** 2  **Estado:** backend T1–T3 hecho; T4 con API de versiones y UI solo de lectura

## Resultado esperado
La comisión de cada línea se calcula con la regla vigente al vender y nunca se recalcula hacia atrás.
**Métrica:** diferencia entre comisión del sistema y cálculo manual de referencia = Bs 0,00 (ficha C.2).

## Alcance
- Dentro: `ReglaComision` con porcentaje, base (lista o neto), vigencia y motivo del cambio; snapshot de tasa y política en cada `LineaVenta`.
- Fuera: simulación de políticas (F08).

## Requisitos cubiertos
RF-05 · RN-02 · HU-03 · CP-02, CP-09

## Tareas
- [x] **F02-T1 [BE]** Entidad versionada `ReglaComision` (porcentaje, base, `fecha_inicio`, motivo). *RED:* dos reglas con vigencia solapada. *Acept.:* se rechaza el solapamiento. **Esquema DB (huecos):** `regla_comision` no tiene `motivo` (lo pide HU-03) ni una restricción de no solapamiento, aunque la extensión `btree_gist` está cargada y sin uso. Propuesta de cambio al esquema: columna `motivo` y `EXCLUDE USING gist (salon_id WITH =, coalesce(especialista_id, uuid_nil) WITH =, daterange(vigente_desde, vigente_hasta, '[]') WITH &&)`. La regla de precedencia (específica antes que general) va en `domain/`. **Hecho** (`feat/f02-comisiones-versionadas`): módulo `commissions`, tabla `regla_comision` con `motivo`; la superposición se rechaza en el dominio y en la base (`EXCLUDE` con `btree_gist`). Una versión nueva cierra la abierta del ámbito el día anterior.
- [x] **F02-T2 [BE]** Cálculo por línea con snapshot. *RED:* CP-02 (35 % sobre lista Bs 120 → Bs 42,00). *Acept.:* se guardan tasa, base y política aplicada en la línea. **Esquema DB:** la línea guarda `regla_comision_id`, `base_comision` y `tasa_comision`; la base se elige por regla (enum `PRECIO_LISTA`/`PRECIO_COBRADO`), lo que cubre la decisión 2 sin fijarla globalmente. **Hecho:** `sales` guarda `regla_comision_id`, `base_comision`, `tasa_comision` y `comision` en cada línea; la base verifica la fórmula (`ck_linea_venta_07`). CP-02 (35 % sobre lista Bs 120 → Bs 42,00) pasa. Se usa la regla vigente el día del servicio.
- [x] **F02-T3 [BE]** Inmutabilidad histórica. *RED:* CP-09, modificar una política ya aplicada. *Acept.:* las ventas históricas no se recalculan. **Hecho:** CP-09: cambiar la política no toca ventas pasadas, y la línea y la regla publicada son inmutables por trigger.
- [ ] **F02-T4 [WEB]** Pantalla de políticas de comisión (solo administradora): crear versión nueva, ver historial. *Acept.:* HU-03, el cambio conserva el motivo y no pisa la versión anterior. **UI parcial (`feat/f02-ui-catalogo-politicas`):** pantalla «Catálogo y reglas» solo de lectura (servicios, comisión vigente, descuento máximo, combos). **Backend listo** (`GET/POST /api/v1/comisiones/reglas/`); falta que la pantalla cree versiones con motivo y muestre el historial.

## Dependencias
F01. **Bloqueo a validar:** si la base es precio de lista o importe neto (el documento usa lista como caso ilustrativo).

## Evidencia
UI (parcial, `feat/f02-ui-catalogo-politicas`): `pnpm test` 34 pruebas en verde (la pantalla lista los 6 servicios y muestra 35 % y 10 % rotulados como ilustrativos; una especialista no accede), `pnpm lint` y `pnpm build` sin errores. No se inspeccionó visualmente. Los valores 35 % «sobre lista» y 10 % son del diseño, no decisiones de negocio (decisiones abiertas 2 y 6).

Backend (`feat/f02-comisiones-versionadas`): `manage.py test` 131 pruebas OK en el contenedor `api` (20 de dominio sin base de datos, incluida CP-02; 14 de API y base de `commissions`: versionado, motivo, 403 con bitácora, aislamiento, `EXCLUDE`, trigger de inmutabilidad, RLS; 8 de `sales` sobre el snapshot, regla propia vs. general, vigencia por día, venta sin regla y fórmula en la base). `migrate` y `seed_demo` verificados sobre la base de desarrollo. **Decisión 2:** se resolvió *por regla* (cada versión elige `PRECIO_LISTA` o `PRECIO_COBRADO`); los porcentajes de la demo son de ejemplo y la administradora debe confirmar cuál usa. No verificado: la CI en GitHub, la pantalla (T4) ni la métrica contra un cálculo manual real de la ficha C.2. Las 3 ventas demo anteriores a F02 de una base ya sembrada quedan sin comisión (snapshot nulo); una base nueva no tiene ese caso. Los tests se escribieron junto con el código; no se observó el RED por separado.

## Siguiente paso
F02-T4 (pantalla de versiones) cuando se retome la UI; en backend, F03-liquidacion-semanal (depende de la decisión 6: día de corte y propinas)
