# F12 · lush-guard

**Plataformas:** BE · WEB  **Semana:** 7  **Estado:** pendiente  **Recorte:** reglas sí; ML solo como prueba de concepto

## Resultado esperado
Alertas explicables basadas en reglas que ayudan a revisar anomalías sin acusar a nadie.
**Métrica:** cada alerta indica regla, dato observado, umbral y estado; falsos positivos documentados.

## Alcance
- Dentro: reglas configurables (descuento sobre lo autorizado, pago sin método, total ≠ pagos, servicio sin catálogo, edición tardía de liquidación cerrada, reintento con clave repetida), estados de revisión.
- Fuera: Isolation Forest desplegado (solo experimento etiquetado si hay historial suficiente).

## Requisitos cubiertos
RF-17 · HU-07 · RN-07 · `GET /api/v1/alertas/`

## Tareas
- [ ] **F12-T1 [BE]** Motor de reglas configurable. *RED:* descuento superior al umbral. *Acept.:* genera alerta con regla, valor y umbral.
- [ ] **F12-T2 [BE]** Alertas sin efecto contable. *RED:* una alerta intenta modificar una venta. *Acept.:* RN-07, solo se marca revisión.
- [ ] **F12-T3 [BE]** Estados (pendiente, en revisión, resuelta) y permisos. *Acept.:* HU-07, se puede marcar como revisada.
- [ ] **F12-T4 [WEB]** Bandeja de alertas. *Acept.:* la copia no usa lenguaje de culpa («conducta indebida»).
- [ ] **F12-T5 [BE]** *(opcional)* Notebook experimental de Isolation Forest con casos etiquetados. *Acept.:* queda marcado «prueba de concepto».

## Dependencias
F01, F03.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F13-n8n-outbox
