# F09 · dss-matriz-sensibilidad

**Plataformas:** BE · WEB  **Semana:** 5  **Estado:** pendiente

## Resultado esperado
Comparar alternativas con criterios ponderados y ver si el ranking cambia al variar pesos y demanda.
**Métrica:** el caso de ejemplo reproduce A = 4,60, B = 3,60, C = 3,60, y la sensibilidad muestra el cambio de preferencia al subir el peso de contribución.

## Alcance
- Dentro: `criteria_evaluation`: criterios, escalas 1-5 normalizadas, pesos que suman 100 %, umbrales de exclusión previos al ranking, sensibilidad a pesos y a demanda (90-140 servicios).
- Fuera: MCDA exhaustivo (el documento lo declara como herramienta didáctica).

## Requisitos cubiertos
DSS-03, DSS-04 · DSS-CP03 · Ficha DEC-02

## Tareas
- [ ] **F09-T1 [BE]** Matriz con puntuación ponderada normalizada. *RED:* pesos ≠ 100 %. *Acept.:* DSS-CP03, bloquea la evaluación o normaliza solo con confirmación visible.
- [ ] **F09-T2 [BE]** Reglas de exclusión previas al ranking. *RED:* alternativa que supera el descuento máximo aprobado. *Acept.:* se descarta antes de puntuar.
- [ ] **F09-T3 [BE]** Sensibilidad automática a pesos y a demanda. *RED:* subir contribución de 40 % a 75 %. *Acept.:* el sistema detecta si cambia la preferida y lo explica.
- [ ] **F09-T4 [WEB]** Editor de criterios/pesos, ranking y gráfico de sensibilidad. *Acept.:* la sensibilidad es visible, no oculta; los valores cualitativos se justifican.

## Dependencias
F08. **Bloqueo a validar:** los pesos son de ejemplo y los valida la administradora.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F10-dss-recomendacion-decisiones
