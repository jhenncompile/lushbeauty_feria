# F08 · dss-contribucion-whatif

**Plataformas:** BE · WEB  **Semana:** 4  **Estado:** pendiente

## Resultado esperado
Calcular la contribución por servicio y comparar tres escenarios What-If sin tocar datos reales.
**Métrica:** los resultados coinciden con el caso de referencia (DSS-CP01/02) y un escenario guardado nunca modifica ventas ni políticas.

## Alcance
- Dentro: costos variables con vigencia y fuente, `U = R − c·B − M`, `CT = U·Q`, escenario base + alternativas, parámetros y carácter supuesto/observado, punto de equilibrio de volumen, paquetes `financial_models` y `decision_scenarios`.
- Fuera: matriz multicriterio (F09), proyección de caja (DSS-08, fase posterior).

## Requisitos cubiertos
DSS-01, DSS-02 · DSS-CP01, DSS-CP02, DSS-CP04, DSS-CP05

## Tareas
- [ ] **F08-T1 [BE]** *(reducida)* Costos directos: `servicio.costo_materiales` (nullable, valor actual) y el snapshot `linea_venta.costo_materiales`. **El esquema no tiene vigencia ni fuente**; si se quieren, requieren una tabla nueva (decisión 13). Hasta entonces, costo nulo = «evidencia insuficiente». *RED:* costo faltante. *Acept.:* DSS-CP05, muestra «evidencia insuficiente» y no informa utilidad neta.
- [ ] **F08-T2 [BE]** `financial_models`: contribución unitaria y total con `Decimal`. *RED:* DSS-CP01 (Bs 120, 10 %, 35 % sobre lista, Bs 20 → cobrado 108, comisión 42, contribución 46). *Acept.:* resultado exacto. **Esquema DB:** la vista `v_ranking_escenario` calcula la misma contribución en SQL; test de paridad con el dominio (dos fuentes de verdad deben coincidir).
- [ ] **F08-T3 [BE]** Punto de equilibrio entre alternativas. *RED:* DSS-CP02 (100 servicios sin descuento = Bs 5.800; con 10 % el mínimo es 127). *Acept.:* redondeo hacia arriba, con advertencia de que omite capacidad.
- [ ] **F08-T4 [BE]** `decision_scenarios`: crear/editar/comparar ≥ 3 escenarios, cada uno con parámetros, fecha y responsable. *RED:* DSS-CP04, guardar un escenario. *Acept.:* no se altera ninguna venta, remuneración ni política. **Esquema DB:** un `escenario` siempre cuelga de una `decision` (con servicio, tipo y supuestos obligatorios), así que esta tarea crea la decisión EN_ANALISIS como contenedor. La tabla es compartida con F09/F10 (ver decisión 7). No hay fecha por escenario: fecha y responsable salen de `decision.creada_por` y `auditoria`; «≥ 3 escenarios» lo valida el servicio.
- [ ] **F08-T5 [WEB]** Pantalla de escenarios: tabla comparativa, rótulo visible «simulación», diferenciación de supuesto y observado. *Acept.:* DSS-02, tres escenarios comparables.
- [ ] **F08-T6 [WEB]** Gráfico de contribución por alternativa. *Acept.:* los volúmenes se rotulan como supuestos, no como pronósticos.

## Dependencias
F01, F02. **Bloqueo a validar:** costos variables de materiales por servicio.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F09-dss-matriz-sensibilidad
