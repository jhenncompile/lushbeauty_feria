# F02 · comisiones-versionadas

**Plataformas:** BE · WEB  **Semana:** 2  **Estado:** UI parcial (T4 solo lectura)

## Resultado esperado
La comisión de cada línea se calcula con la regla vigente al vender y nunca se recalcula hacia atrás.
**Métrica:** diferencia entre comisión del sistema y cálculo manual de referencia = Bs 0,00 (ficha C.2).

## Alcance
- Dentro: `ReglaComision` con porcentaje, base (lista o neto), vigencia y motivo del cambio; snapshot de tasa y política en cada `LineaVenta`.
- Fuera: simulación de políticas (F08).

## Requisitos cubiertos
RF-05 · RN-02 · HU-03 · CP-02, CP-09

## Tareas
- [ ] **F02-T1 [BE]** Entidad versionada `ReglaComision` (porcentaje, base, `fecha_inicio`, motivo). *RED:* dos reglas con vigencia solapada. *Acept.:* se rechaza el solapamiento. **Esquema DB (huecos):** `regla_comision` no tiene `motivo` (lo pide HU-03) ni una restricción de no solapamiento, aunque la extensión `btree_gist` está cargada y sin uso. Propuesta de cambio al esquema: columna `motivo` y `EXCLUDE USING gist (salon_id WITH =, coalesce(especialista_id, uuid_nil) WITH =, daterange(vigente_desde, vigente_hasta, '[]') WITH &&)`. La regla de precedencia (específica antes que general) va en `domain/`.
- [ ] **F02-T2 [BE]** Cálculo por línea con snapshot. *RED:* CP-02 (35 % sobre lista Bs 120 → Bs 42,00). *Acept.:* se guardan tasa, base y política aplicada en la línea. **Esquema DB:** la línea guarda `regla_comision_id`, `base_comision` y `tasa_comision`; la base se elige por regla (enum `PRECIO_LISTA`/`PRECIO_COBRADO`), lo que cubre la decisión 2 sin fijarla globalmente.
- [ ] **F02-T3 [BE]** Inmutabilidad histórica. *RED:* CP-09, modificar una política ya aplicada. *Acept.:* las ventas históricas no se recalculan.
- [ ] **F02-T4 [WEB]** Pantalla de políticas de comisión (solo administradora): crear versión nueva, ver historial. *Acept.:* HU-03, el cambio conserva el motivo y no pisa la versión anterior. **UI parcial (`feat/f02-ui-catalogo-politicas`):** pantalla «Catálogo y reglas» solo de lectura (servicios, comisión vigente, descuento máximo, combos). Faltan crear versión nueva con motivo e historial de versiones.

## Dependencias
F01. **Bloqueo a validar:** si la base es precio de lista o importe neto (el documento usa lista como caso ilustrativo).

## Evidencia
UI (parcial, `feat/f02-ui-catalogo-politicas`): `pnpm test` 34 pruebas en verde (la pantalla lista los 6 servicios y muestra 35 % y 10 % rotulados como ilustrativos; una especialista no accede), `pnpm lint` y `pnpm build` sin errores. No se inspeccionó visualmente. Los valores 35 % «sobre lista» y 10 % son del diseño, no decisiones de negocio (decisiones abiertas 2 y 6).

## Siguiente paso
F03-liquidacion-semanal
