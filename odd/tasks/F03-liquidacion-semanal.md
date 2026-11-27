# F03 · liquidacion-semanal

**Plataformas:** BE · WEB · MOB  **Semana:** 2  **Estado:** backend T1/T2 hecho (decisión 6 adoptada como valor inicial); T3–T4 pendientes; T5/T6 en maqueta

## Resultado esperado
Generar, verificar y aprobar la liquidación semanal por especialista, con comprobante, en una fracción del tiempo actual.
**Métrica:** tiempo de liquidación semanal vs línea base retrospectiva (Hi principal); errores de cálculo vs línea base.

## Alcance
- Dentro: propinas y deducciones, liquidación `borrador → verificada → aprobada`, versionada e inmutable tras aprobar, PDF por especialista, exportación XLSX, vista propia de la especialista, instrumentación de tiempos.
- Fuera: envío automático (F13).

## Requisitos cubiertos
RF-06, RF-07, RF-09 · RN-05, RN-06, RN-08 · HU-04, HU-09

## Tareas
- [x] **F03-T1 [BE]** *(reducida)* Deducciones con motivo sobre `movimiento_nomina`; la propina ya es columna de `linea_venta` (`propina`, `metodo_propina`), no una entidad aparte. *RED:* deducción sin motivo o con monto positivo. *Acept.:* se rechaza (la BD ya lo exige; el servicio da el mensaje). **Hecho** (`feat/f03-liquidacion-base`): `POST /api/v1/nomina/deducciones/` con tipo `ADELANTO`/`FALTA`/`MATERIAL`, monto negativo y motivo obligatorio (positivo o sin motivo se rechaza, y la base lo vuelve a exigir); auditada, sin borrado, no acepta semanas aprobadas.
- [x] **F03-T2 [BE]** `POST /liquidaciones/generar/` crea el borrador para el período; `Detalle` reproducible por concepto. *RED:* el total no coincide con la suma de comisiones + propinas − deducciones. *Acept.:* total verificable. **Esquema DB:** la fórmula incluye el sueldo fijo: `neto − excedente = sueldo_fijo + comisión + propina + movimientos`. Si el total es negativo, `neto = 0` y la diferencia queda como `excedente` (que pasa al período siguiente como movimiento `EXCEDENTE`). Una línea se liga a una liquidación con `liquidacion_id`; la clave `(salon, especialista, periodo_inicio)` es única. El día de corte sigue abierto (decisión 6). **Hecho (una especialista por llamada):** `POST /api/v1/nomina/liquidaciones/generar/` crea o recalcula el borrador de la semana; fórmula con sueldo fijo, comisión, propina y movimientos; excedente y arrastre `EXCEDENTE`; detalle por línea y movimiento reproducible; el total cuadra con la restricción de la base. **Decisión 6 adoptada como valor inicial** (semana lun–dom configurable por salón; propina 100 % de la especialista). **Falta:** generar para todas las especialistas a la vez.
- [ ] **F03-T3 [BE]** `POST /liquidaciones/{id}/aprobar/` y congelación. *RED:* editar una liquidación aprobada. *Acept.:* se rechaza; la corrección genera ajuste auditado (RN-05). **Esquema DB:** aprobada, solo cambian `estado` (→ PAGADA) y `comprobante_url`; aprobar exige `LIQUIDACION_APROBAR`. Agregar a esta tarea el paso «marcar pagada». **Auditoría 2026-11-26 (actualizada):** Existe: `LIQUIDACION_APROBAR`, el outbox, y en la base el trigger RN-05 (aprobada = inmutable) y el estado `PAGADA`. Falta: aprobar (asignar `liquidacion_id` a líneas y movimientos), «marcar pagada», el ajuste por venta ya liquidada (`sales` hoy responde 409 `venta_liquidada`) y el evento E2. Bloquea: nada, T2 ya está.
- [ ] **F03-T4 [BE]** PDF por especialista y XLSX. *Acept.:* HU-04, un PDF por especialista; solo accesible a su destinataria (RN-08). **Auditoría 2026-11-26:** Existe: Nada (ni `openpyxl` ni librería de PDF en `pyproject.toml`). Falta: PDF por especialista, XLSX y acceso solo de su destinataria. Bloquea: T2/T3; enlace temporal de F13-T3.
- [~] **F03-T5 [WEB]** Pantalla de liquidación: borrador, revisión por línea, aprobar. *Acept.:* flujo completo con totales visibles. **UI parcial (`feat/f03-ui-liquidacion`):** móvil y web con Verificada → Aprobada, totales, detalle por línea de Paty, comparación de políticas (simulación) y avisos con reintento. Falta el estado Borrador editable, registrar deducción, exportar a Excel y comprobante PDF. **Auditoría 2026-11-26:** Existe: Maqueta web (`payroll`) con estado en memoria: Verificada → Aprobada y totales. Falta: Conectar al backend; estado Borrador, deducciones, exportar. Bloquea: T1–T3.
- [~] **F03-T6 [MOB]** Vista «Mi liquidación» de la especialista. *RED:* CP-06, consultar la nómina ajena. *Acept.:* HU-09, acceso rechazado y registro de incidencia (`ACCESO_DENEGADO`). **Esquema DB:** la RLS aísla por salón, no por especialista; que una especialista vea solo lo suyo lo hace el servicio, y F14-T1 lo prueba. **UI parcial:** «Mi liquidación» muestra solo la propia y una especialista que abre `/nomina` es redirigida; no hay registro de incidencia (requiere backend). **Auditoría 2026-11-26:** Existe: «Mi liquidación» en web y Flutter con datos sintéticos. Falta: CP-06 real: consultar nómina ajena debe dar 403 y `ACCESO_DENEGADO`; requiere backend. Bloquea: T2.
- [ ] **F03-T7 [TRANS]** Instrumentación para el piloto: cronometraje de la liquidación y export para la ficha C.2. *Acept.:* se pueden comparar tiempos con la línea base. **Auditoría 2026-11-26:** Existe: Nada. Falta: Cronometraje y export para la ficha C.2. Bloquea: T2–T5.

## Dependencias
F01, F02. **Bloqueo a validar:** día de corte semanal y política de propinas con la administradora.

## Evidencia
UI (parcial, `feat/f03-ui-liquidacion`): `pnpm test` 52 pruebas en verde. Dominio: comisión de Paty Bs 161,00 sobre lista vs Bs 154,70 sobre cobrado (diferencia Bs 6,30), neto Bs 146,00 y total Bs 817,00. Pantallas: aprobar lleva a «aprobada»; sin conexión el botón queda deshabilitado con explicación; el aviso fallido se reintenta sin tocar la liquidación; una especialista solo ve su neto y no puede abrir `/nomina`. `pnpm lint` y `pnpm build` sin errores. No se inspeccionó visualmente. Limitación: solo Paty tiene detalle por línea en los datos sintéticos; Katherine y Marisol muestran el resumen y un aviso.

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

Backend (`feat/f03-liquidacion-base`): `manage.py test` 249 pruebas OK en el contenedor `api` (12 de dominio sin base de datos: períodos con cualquier día de corte, fórmula, excedente, validación de deducciones; 21 de API y base: deducciones, total verificable, solo confirmadas y de esa especialista, regenerar sin duplicar, el borrador no bloquea anular, excedente que pasa a la semana siguiente, semana aprobada no se recalcula, día de corte del salón, líneas sin comisión, permisos con bitácora, aislamiento, RN-05 y `neto` que no cuadra). `migrate` aplicado en desarrollo. No verificado: la CI en GitHub, ni que el sueldo fijo sea semanal, ni con datos reales de una semana. Tests escritos junto con el código, sin observar el RED por separado.

## Siguiente paso
F03-T3: aprobar y congelar (con ajuste por venta liquidada y evento E2) y marcar pagada; después T4 (PDF/XLSX) y conectar T5/T6. Confirmar con la administradora el corte y la propina, y si el sueldo fijo es semanal.
