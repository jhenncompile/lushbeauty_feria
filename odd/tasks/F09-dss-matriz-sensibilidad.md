# F09 · dss-matriz-sensibilidad

**Plataformas:** BE · WEB  **Semana:** 5  **Estado:** sin backend; UI en maqueta; decisión 4 abierta

## Resultado esperado
Comparar alternativas con criterios ponderados y ver si el ranking cambia al variar pesos y demanda.
**Métrica:** el caso de ejemplo reproduce A = 4,60, B = 3,60, C = 3,60, y la sensibilidad muestra el cambio de preferencia al subir el peso de contribución.

## Alcance
- Dentro: `criteria_evaluation`: criterios, escalas 1-5 normalizadas, pesos que suman 100 %, umbrales de exclusión previos al ranking, sensibilidad a pesos y a demanda (90-140 servicios).
- Fuera: MCDA exhaustivo (el documento lo declara como herramienta didáctica).

## Requisitos cubiertos
DSS-03, DSS-04 · DSS-CP03 · Ficha DEC-02

## Tareas
- [ ] **F09-T1 [BE]** Matriz con puntuación ponderada normalizada. *RED:* pesos ≠ 100 %. *Acept.:* DSS-CP03, bloquea la evaluación o normaliza solo con confirmación visible. **Esquema DB:** los pesos viven en `decision` (por defecto 40/25/20/15 %, deben sumar exactamente 1); normalizar ocurre antes de guardar. Puntajes por escenario de 1 a 5. **Auditoría 2026-11-26:** Existe: Nada en backend. Falta: Matriz ponderada normalizada. Bloquea: Decisión 4 para los pesos definitivos; se puede construir con pesos de entrada.
- [ ] **F09-T2 [BE]** Reglas de exclusión previas al ranking. *RED:* alternativa que supera el descuento máximo aprobado. *Acept.:* se descarta antes de puntuar (la vista ya expone `elegible = tasa_descuento ≤ salon.descuento_maximo`). **Auditoría 2026-11-26:** Existe: `salon.descuento_maximo` ya existe. Falta: Exclusión previa al ranking. Bloquea: T1.
- [ ] **F09-T3 [BE]** Sensibilidad automática a pesos y a demanda. *RED:* subir contribución de 40 % a 75 %. *Acept.:* el sistema detecta si cambia la preferida y lo explica. **Auditoría 2026-11-26:** Existe: Nada. Falta: Sensibilidad a pesos y demanda. Bloquea: T1.
- [~] **F09-T4 [WEB]** Editor de criterios/pesos, ranking y gráfico de sensibilidad. *Acept.:* la sensibilidad es visible, no oculta; los valores cualitativos se justifican. **Auditoría 2026-11-26:** Existe: Componente de matriz en maqueta (`decisions`). Falta: Editor de pesos y gráfico conectados. Bloquea: T1–T3.

## Dependencias
F08. **Bloqueo a validar:** los pesos son de ejemplo y los valida la administradora.

## Evidencia
_(se completa al cerrar)_

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
F09-T1 con los pesos como entrada; resolver la decisión 4.
