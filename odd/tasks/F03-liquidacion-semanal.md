# F03 · liquidacion-semanal

**Plataformas:** BE · WEB · MOB  **Semana:** 2  **Estado:** pendiente

## Resultado esperado
Generar, verificar y aprobar la liquidación semanal por especialista, con comprobante, en una fracción del tiempo actual.
**Métrica:** tiempo de liquidación semanal vs línea base retrospectiva (Hi principal); errores de cálculo vs línea base.

## Alcance
- Dentro: propinas y deducciones, liquidación `borrador → verificada → aprobada`, versionada e inmutable tras aprobar, PDF por especialista, exportación XLSX, vista propia de la especialista, instrumentación de tiempos.
- Fuera: envío automático (F13).

## Requisitos cubiertos
RF-06, RF-07, RF-09 · RN-05, RN-06, RN-08 · HU-04, HU-09

## Tareas
- [ ] **F03-T1 [BE]** `Propina` y `Deduccion` con motivo. *RED:* deducción sin motivo. *Acept.:* se rechaza.
- [ ] **F03-T2 [BE]** `POST /liquidaciones/generar/` crea el borrador para el período; `Detalle` reproducible por concepto. *RED:* el total no coincide con la suma de comisiones + propinas − deducciones. *Acept.:* total verificable.
- [ ] **F03-T3 [BE]** `POST /liquidaciones/{id}/aprobar/` y congelación. *RED:* editar una liquidación aprobada. *Acept.:* se rechaza; la corrección genera ajuste auditado (RN-05).
- [ ] **F03-T4 [BE]** PDF por especialista y XLSX. *Acept.:* HU-04, un PDF por especialista; solo accesible a su destinataria (RN-08).
- [ ] **F03-T5 [WEB]** Pantalla de liquidación: borrador, revisión por línea, aprobar. *Acept.:* flujo completo con totales visibles.
- [ ] **F03-T6 [MOB]** Vista «Mi liquidación» de la especialista. *RED:* CP-06, consultar la nómina ajena. *Acept.:* HU-09, acceso rechazado y registro de incidencia.
- [ ] **F03-T7 [TRANS]** Instrumentación para el piloto: cronometraje de la liquidación y export para la ficha C.2. *Acept.:* se pueden comparar tiempos con la línea base.

## Dependencias
F01, F02. **Bloqueo a validar:** día de corte semanal y política de propinas con la administradora.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F04-cierre-caja
