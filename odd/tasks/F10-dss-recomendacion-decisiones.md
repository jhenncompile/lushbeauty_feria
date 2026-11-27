# F10 · dss-recomendacion-decisiones

**Plataformas:** BE · WEB  **Semana:** 6  **Estado:** sin backend; UI en maqueta; decisión 14 abierta

## Resultado esperado
Cerrar el ciclo de decisión completo: recomendación explicable, aprobación humana y seguimiento posterior.
**Métrica:** un caso completo ejecutable de punta a punta (criterio de aceptación global del cap. 04); rúbrica de 5 puntos del Anexo Q.

## Alcance
- Dentro: `recommendations` con los seis elementos obligatorios, estado de evidencia, aprobación de la administradora, `decision_outcomes` con resultado esperado, fecha de revisión y resultado observado, bitácora que no reescribe el escenario original.
- Fuera: atribución causal automática, cambios automáticos de remuneración.

## Requisitos cubiertos
DSS-05, DSS-06, DSS-07 · DSS-CP05, DSS-CP06, DSS-CP07 · Fichas DEC-01, DEC-03 · Anexo Q

## Tareas
- [ ] **F10-T1 [BE]** Recomendación con problema, alternativas y criterios, procedencia, operaciones, supuestos y límites, alternativa sugerida. *RED:* falta alguno de los seis elementos. *Acept.:* no se emite la recomendación. **Esquema DB (hueco):** `decision.recomendacion` es texto libre; los seis elementos no tienen columnas. Armar la recomendación en el servicio y guardarla serializada, o añadir un `jsonb` (decisión 14). **Auditoría 2026-11-26:** Existe: Nada en backend. Falta: Recomendación con los seis elementos. Bloquea: Decisión 14 (texto serializado o `jsonb`) y F08/F09.
- [ ] **F10-T2 [BE]** Caso de datos insuficientes. *RED:* costos o precios ausentes. *Acept.:* «evidencia insuficiente» y qué dato falta. **Auditoría 2026-11-26:** Existe: Nada. Falta: Caso «evidencia insuficiente». Bloquea: T1.
- [ ] **F10-T3 [BE]** Aprobación humana y permisos. *RED:* DSS-CP06, un usuario sin rol de administración intenta aprobar. *Acept.:* se rechaza; nada se aplica sin aprobación. **Esquema DB:** aprobar exige `DECISION_APROBAR`, escenario elegido y `fecha_revision`. Aprobar no cambia precios ni comisiones: eso sería otra acción humana. **Auditoría 2026-11-26:** Existe: `DECISION_APROBAR` existe y solo la administradora lo tiene. Falta: Aprobación humana con escenario elegido y fecha de revisión. Bloquea: T1.
- [ ] **F10-T4 [BE]** *(reducida: sin tabla propia)* `decision_outcomes` = columnas de `decision` (`valor_esperado`, `fecha_revision`, `valor_observado`, `comentario_revision`, estado REVISADA): guardar motivo, responsable, supuestos, esperado, fecha de revisión y observado. *RED:* DSS-CP07, editar el escenario original. *Acept.:* el historial es inmutable. **Esquema DB (hueco):** el trigger congela los escenarios, pero la fila `decision` (pesos, supuestos) se puede editar tras aprobar. Propuesta: trigger análogo a `fn_liquidacion_inmutable` que solo permita registrar el resultado observado. **Auditoría 2026-11-26:** Existe: Nada. Falta: Seguimiento sobre las columnas de `decision`. Bloquea: T3.
- [~] **F10-T5 [WEB]** Pantalla de recomendación con advertencias y botón «Aprobar» (rol administradora). *Acept.:* se ve qué es supuesto y qué es observado. **Auditoría 2026-11-26:** Existe: Pantalla de recomendación en maqueta. Falta: Conectar y mostrar supuesto vs observado. Bloquea: T1–T3.
- [~] **F10-T6 [WEB]** Pantalla de seguimiento de decisiones y registro del resultado observado. *Acept.:* la coincidencia temporal no se presenta como causalidad. **Auditoría 2026-11-26:** Existe: Historial de decisiones en maqueta. Falta: Registro del resultado observado sin sugerir causalidad. Bloquea: T4.
- [ ] **F10-T7 [TRANS]** Datos sintéticos para el caso de la feria (DEC-01/02/03). *Acept.:* el recorrido completo corre en el entorno demo. **Auditoría 2026-11-26:** Existe: `seed_demo` no incluye casos DSS. Falta: Datos sintéticos DEC-01/02/03. Bloquea: F08/F09.

## Dependencias
F08, F09.

## Evidencia
_(se completa al cerrar)_

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
Resolver la decisión 14; depende de F08 y F09.
