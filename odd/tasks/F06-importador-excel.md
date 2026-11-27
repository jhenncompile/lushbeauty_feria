# F06 · importador-excel

**Plataformas:** BE · WEB  **Semana:** 3  **Estado:** backend sin empezar; T6 en maqueta; decisiones 11 y 12 abiertas

## Resultado esperado
Importar la planilla actual del salón con mapeo, normalización y revisión humana antes de confirmar.
**Métrica:** el 100 % de las filas queda como aceptada, pendiente o rechazada con causa; 0 filas integradas en silencio.

## Alcance
- Dentro: carga `.xlsx` (openpyxl), mapeo de hojas/columnas, normalización, aliases, RapidFuzz con umbral conservador, descomposición de combos con reglas explícitas, trazabilidad por fila, confirmación en una transacción.
- Fuera: LLM de interpretación (opcional posterior), aprendizaje de aliases.

## Requisitos cubiertos
RF-12, RF-13, RF-14 · HU-05 · CP-05

## Tareas
- [ ] **F06-T1 [BE]** `POST /importaciones/` lee el XLSX y propone el mapeo de columnas. *RED:* hoja con encabezados distintos. *Acept.:* propuesta de mapeo sin escribir ventas. **Auditoría 2026-11-26:** Existe: Nada en backend (sin app `imports`; faltan `openpyxl` y `rapidfuzz` en `pyproject.toml`). Falta: Lectura de XLSX y propuesta de mapeo. Bloquea: F06-T7 para tener archivo de prueba.
- [ ] **F06-T2 [BE]** Normalización + aliases + RapidFuzz. **Esquema DB:** no hay tabla de aliases; los alias salen de `fila_importacion` (filas ACEPTADAS: `texto_servicio` → `servicio_id`). Reduce el trabajo, pero toca «aliases aprendidos», que el INDEX deja fuera del MVP: confirmar con el equipo (decisión 11). *RED:* CP-05, importar « PEDI» y «PEDI». *Acept.:* se sugiere un mismo servicio antes de aprobar. **Auditoría 2026-11-26:** Existe: Nada. Falta: Normalización, alias y coincidencia difusa. Bloquea: Decisión 11 (¿alias aprendidos en el MVP?).
- [ ] **F06-T3 [BE]** Combos y duplicados. **Esquema DB:** el archivo repetido ya se rechaza (`UNIQUE (salon, hash_archivo)`); el duplicado por fila no tiene restricción y es regla del servicio. *RED:* un combo conocido y una fila duplicada. *Acept.:* el combo se descompone por regla y el duplicado se marca. **Auditoría 2026-11-26:** Existe: El hash de archivo único está en el esquema SQL; no hay modelo en Django. Falta: Reglas de combos y de fila duplicada. Bloquea: F06-T1.
- [ ] **F06-T4 [BE]** *(reducida: el modelo ya existe)* `importacion` + `fila_importacion` (hoja, fila, `datos_originales`, estado, observación) en lugar de un modelo `Incidencia`; falta solo el servicio. *Acept.:* RF-14 trazable fila por fila. **Auditoría 2026-11-26:** Existe: Tablas `importacion` y `fila_importacion` solo en el esquema SQL. Falta: Modelos Django y servicio de trazabilidad por fila. Bloquea: Nada.
- [ ] **F06-T5 [BE]** `POST /importaciones/{id}/confirmar/` en transacción. *RED:* falla a mitad de la importación. *Acept.:* no queda un estado parcial. **Esquema DB (riesgo):** una venta CONFIRMADA exige pagos = líneas y cada línea exige especialista y una regla de comisión vigente en la fecha. Si la planilla no trae método de pago o la regla no existe, la fila queda en revisión y no se confirma. Decidir cómo se asigna el pago de lo importado (decisión 12). **Auditoría 2026-11-26:** Existe: Se puede crear una venta confirmada con `registrar_venta` (exige pagos = líneas, especialista y comisión vigente). Falta: Confirmación en transacción; origen `IMPORTACION`; regla de pago para filas sin método. Bloquea: Decisión 12 (pago de ventas importadas) y que exista regla de comisión en las fechas importadas.
- [~] **F06-T6 [WEB]** Vista previa con filas aceptadas/revisar/rechazadas y corrección manual. *Acept.:* HU-05, reporte antes de confirmar. **Auditoría 2026-11-26:** Existe: Pantallas de carga y revisión con fixtures (`imports`). Falta: Conectar al backend; corrección manual. Bloquea: F06-T1…T5.
- [ ] **F06-T7 [TRANS]** Archivo XLSX sintético con nombres inconsistentes conocidos para la demo y los tests. *Acept.:* no contiene datos reales. **Auditoría 2026-11-26:** Existe: `seed_demo` crea catálogo y ventas sintéticas, pero no hay XLSX. Falta: Archivo XLSX sintético con nombres inconsistentes. Bloquea: Nada: se puede adelantar.

## Dependencias
F01 (catálogo). Fixture: el Anexo F (planilla anonimizada).

## Evidencia
_(se completa al cerrar)_

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
Adelantar F06-T7 (XLSX sintético) y añadir `openpyxl` y `rapidfuzz`; resolver las decisiones 11 y 12.
