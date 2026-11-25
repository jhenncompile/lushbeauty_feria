# F10 · dss-recomendacion-decisiones

**Plataformas:** BE · WEB  **Semana:** 6  **Estado:** pendiente

## Resultado esperado
Cerrar el ciclo de decisión completo: recomendación explicable, aprobación humana y seguimiento posterior.
**Métrica:** un caso completo ejecutable de punta a punta (criterio de aceptación global del cap. 04); rúbrica de 5 puntos del Anexo Q.

## Alcance
- Dentro: `recommendations` con los seis elementos obligatorios, estado de evidencia, aprobación de la administradora, `decision_outcomes` con resultado esperado, fecha de revisión y resultado observado, bitácora que no reescribe el escenario original.
- Fuera: atribución causal automática, cambios automáticos de remuneración.

## Requisitos cubiertos
DSS-05, DSS-06, DSS-07 · DSS-CP05, DSS-CP06, DSS-CP07 · Fichas DEC-01, DEC-03 · Anexo Q

## Tareas
- [ ] **F10-T1 [BE]** Recomendación con problema, alternativas y criterios, procedencia, operaciones, supuestos y límites, alternativa sugerida. *RED:* falta alguno de los seis elementos. *Acept.:* no se emite la recomendación.
- [ ] **F10-T2 [BE]** Caso de datos insuficientes. *RED:* costos o precios ausentes. *Acept.:* «evidencia insuficiente» y qué dato falta.
- [ ] **F10-T3 [BE]** Aprobación humana y permisos. *RED:* DSS-CP06, un usuario sin rol de administración intenta aprobar. *Acept.:* se rechaza; nada se aplica sin aprobación.
- [ ] **F10-T4 [BE]** `decision_outcomes`: guardar motivo, responsable, supuestos, esperado, fecha de revisión y observado. *RED:* DSS-CP07, editar el escenario original. *Acept.:* el historial es inmutable.
- [ ] **F10-T5 [WEB]** Pantalla de recomendación con advertencias y botón «Aprobar» (rol administradora). *Acept.:* se ve qué es supuesto y qué es observado.
- [ ] **F10-T6 [WEB]** Pantalla de seguimiento de decisiones y registro del resultado observado. *Acept.:* la coincidencia temporal no se presenta como causalidad.
- [ ] **F10-T7 [TRANS]** Datos sintéticos para el caso de la feria (DEC-01/02/03). *Acept.:* el recorrido completo corre en el entorno demo.

## Dependencias
F08, F09.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F11-lush-insight
