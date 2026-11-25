# F06 · importador-excel

**Plataformas:** BE · WEB  **Semana:** 3  **Estado:** pendiente

## Resultado esperado
Importar la planilla actual del salón con mapeo, normalización y revisión humana antes de confirmar.
**Métrica:** el 100 % de las filas queda como aceptada, pendiente o rechazada con causa; 0 filas integradas en silencio.

## Alcance
- Dentro: carga `.xlsx` (openpyxl), mapeo de hojas/columnas, normalización, aliases, RapidFuzz con umbral conservador, descomposición de combos con reglas explícitas, trazabilidad por fila, confirmación en una transacción.
- Fuera: LLM de interpretación (opcional posterior), aprendizaje de aliases.

## Requisitos cubiertos
RF-12, RF-13, RF-14 · HU-05 · CP-05

## Tareas
- [ ] **F06-T1 [BE]** `POST /importaciones/` lee el XLSX y propone el mapeo de columnas. *RED:* hoja con encabezados distintos. *Acept.:* propuesta de mapeo sin escribir ventas.
- [ ] **F06-T2 [BE]** Normalización + aliases + RapidFuzz. *RED:* CP-05, importar « PEDI» y «PEDI». *Acept.:* se sugiere un mismo servicio antes de aprobar.
- [ ] **F06-T3 [BE]** Combos y duplicados. *RED:* un combo conocido y una fila duplicada. *Acept.:* el combo se descompone por regla y el duplicado se marca.
- [ ] **F06-T4 [BE]** Modelo `Importacion/Incidencia`: fuente, hoja, fila, propuesta y decisión final. *Acept.:* RF-14 trazable fila por fila.
- [ ] **F06-T5 [BE]** `POST /importaciones/{id}/confirmar/` en transacción. *RED:* falla a mitad de la importación. *Acept.:* no queda un estado parcial.
- [ ] **F06-T6 [WEB]** Vista previa con filas aceptadas/revisar/rechazadas y corrección manual. *Acept.:* HU-05, reporte antes de confirmar.
- [ ] **F06-T7 [TRANS]** Archivo XLSX sintético con nombres inconsistentes conocidos para la demo y los tests. *Acept.:* no contiene datos reales.

## Dependencias
F01 (catálogo). Fixture: el Anexo F (planilla anonimizada).

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F07-dashboard-financiero
