# F12 · lush-guard

**Plataformas:** BE · WEB  **Semana:** 7  **Estado:** sin backend; UI en maqueta; decisión 15 abierta  **Recorte:** reglas sí; ML solo como prueba de concepto

## Resultado esperado
Alertas explicables basadas en reglas que ayudan a revisar anomalías sin acusar a nadie.
**Métrica:** cada alerta indica regla, dato observado, umbral y estado; falsos positivos documentados.

## Alcance
- Dentro: reglas configurables (descuento sobre lo autorizado, pago sin método, total ≠ pagos, servicio sin catálogo, edición tardía de liquidación cerrada, reintento con clave repetida), estados de revisión.
- Fuera: Isolation Forest desplegado (solo experimento etiquetado si hay historial suficiente).

## Requisitos cubiertos
RF-17 · HU-07 · RN-07 · `GET /api/v1/alertas/`

## Tareas
- [ ] **F12-T1 [BE]** *(reducida)* Reglas fijas en código, una por `tipo_alerta` (6 tipos: DESCUENTO_EXCEDIDO, PAGO_DESCUADRADO, DIFERENCIA_CAJA, SIN_CATALOGO, EDICION_TARDIA, CLAVE_REPETIDA); el esquema no tiene tabla de reglas, solo `salon.descuento_maximo`. Regla, valor y umbral van en `alerta.detalle`. *RED:* descuento superior al umbral. *Acept.:* genera alerta con regla, valor y umbral. **Auditoría 2026-11-26:** Existe: `descuento_maximo` y la regla de umbral ya existen en ventas. Falta: Reglas fijas por tipo de alerta y la tabla/servicio de alertas. Bloquea: Decisión 15 (estados) para el diseño final; las reglas se pueden adelantar.
- [ ] **F12-T2 [BE]** Alertas sin efecto contable. *RED:* una alerta intenta modificar una venta. *Acept.:* RN-07, solo se marca revisión. **Auditoría 2026-11-26:** Existe: Nada. Falta: Garantizar que una alerta no modifica ventas (RN-07). Bloquea: T1.
- [ ] **F12-T3 [BE]** Estados (pendiente, en revisión, resuelta) y permisos. *Acept.:* HU-07, se puede marcar como revisada. **Esquema DB (reducida):** solo hay PENDIENTE y REVISADA; «en revisión» y «resuelta» requerirían un cambio al esquema (decisión 15). Las alertas se escriben en una transacción aparte: si la operación que las causó hace rollback (p. ej. un trigger rechaza), la alerta se perdería. **Auditoría 2026-11-26:** Existe: Nada. Falta: Estados y permisos. Bloquea: Decisión 15.
- [~] **F12-T4 [WEB]** Bandeja de alertas. *Acept.:* la copia no usa lenguaje de culpa («conducta indebida»). **Auditoría 2026-11-26:** Existe: Bandeja en maqueta (`guard`). Falta: Conectar a las alertas reales. Bloquea: T1–T3.
- [ ] **F12-T5 [BE]** *(opcional)* Notebook experimental de Isolation Forest con casos etiquetados. *Acept.:* queda marcado «prueba de concepto». **Auditoría 2026-11-26:** Existe: Nada. Falta: Notebook experimental (opcional). Bloquea: Datos etiquetados.

## Dependencias
F01, F03.

## Evidencia
_(se completa al cerrar)_

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
Resolver la decisión 15; F12-T1/T2 se pueden adelantar.
