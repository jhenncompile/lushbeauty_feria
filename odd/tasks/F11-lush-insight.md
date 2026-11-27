# F11 · lush-insight

**Plataformas:** BE · WEB  **Semanas:** 6-7  **Estado:** sin backend; UI con respuestas fijas; falta elegir proveedor de IA  **Recorte:** prioridad baja si falta tiempo

## Resultado esperado
Un asistente que responde cinco preguntas financieras con cifras reales y enlace a su fuente, sin inventar nada.
**Métrica:** 100 % de las respuestas de prueba coinciden con el reporte fuente; 0 cifras sin respaldo.

## Alcance
- Dentro: 5 intenciones (resumen de caja por período, distribución por método de pago, composición de liquidación, comparación de comisiones, anomalías), *tool calling* de solo lectura, redacción en español, enlace al reporte, registro de versión de prompt y filtros.
- Fuera: escrituras, acceso a salarios ajenos, más intenciones.

## Requisitos cubiertos
RF-16 · HU-06 · CP-07 · RN-07 · cap. 10 (diseño de Lush Insight)

## Tareas
- [ ] **F11-T1 [BE]** Funciones de consulta de solo lectura por contrato (ej. `obtener_impacto_descuentos`). *RED:* intentar invocar una escritura. *Acept.:* el LLM no tiene acceso a ninguna escritura financiera. **Auditoría 2026-11-26:** Existe: `analytics` ya ofrece lecturas agregadas por contrato HTTP; no hay funciones para otros módulos. Falta: Funciones de solo lectura expuestas por contrato. Bloquea: Nada.
- [ ] **F11-T2 [BE]** Clasificador de intención y validación de fechas, usuario y salón. *RED:* intención fuera de las cinco. *Acept.:* se rechaza con mensaje claro. **Auditoría 2026-11-26:** Existe: Nada. Falta: Clasificador de intención y validación. Bloquea: Elegir proveedor de IA (no definido en el backlog).
- [ ] **F11-T3 [BE]** Respuesta sin datos. *RED:* CP-07, período sin datos. *Acept.:* «Información insuficiente» y se pide un período válido. **Auditoría 2026-11-26:** Existe: `analytics` ya informa `hay_datos`. Falta: Respuesta «información insuficiente». Bloquea: T1.
- [ ] **F11-T4 [BE]** Permisos: una especialista no obtiene salarios de otras. *Acept.:* respuesta rechazada y auditada (`CONSULTAR`/`ACCESO_DENEGADO` en `auditoria`). **Esquema DB:** no hay permiso propio para Insight ni tabla de conversaciones; se usa `REPORTE_VER` y no se persiste el chat. **Auditoría 2026-11-26:** Existe: Bitácora con `CONSULTAR` y `ACCESO_DENEGADO`; regla de especialista ya aplicada en `analytics`. Falta: Aplicarla al chat. Bloquea: T1.
- [~] **F11-T5 [WEB]** Chat con respuesta + «ver reporte fuente». *Acept.:* HU-06, el asistente consulta el período y muestra la fuente. **Auditoría 2026-11-26:** Existe: Chat con respuestas fijas (`insight`). Falta: Conectar al backend y mostrar la fuente. Bloquea: T1–T4.
- [ ] **F11-T6 [TRANS]** Sin IA disponible, la caja y los reportes siguen operando. *Acept.:* caída del proveedor simulada sin afectar el resto. **Auditoría 2026-11-26:** Existe: Nada. Falta: Probar la caída del proveedor sin afectar el resto. Bloquea: T2.

## Dependencias
F07, F03. Minimizar y anonimizar los datos enviados a un proveedor externo.

## Evidencia
_(se completa al cerrar)_

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
Elegir proveedor de IA; F11-T1 se apoya en `analytics`.
