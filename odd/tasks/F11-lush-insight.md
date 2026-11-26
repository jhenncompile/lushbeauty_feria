# F11 · lush-insight

**Plataformas:** BE · WEB  **Semanas:** 6-7  **Estado:** pendiente  **Recorte:** prioridad baja si falta tiempo

## Resultado esperado
Un asistente que responde cinco preguntas financieras con cifras reales y enlace a su fuente, sin inventar nada.
**Métrica:** 100 % de las respuestas de prueba coinciden con el reporte fuente; 0 cifras sin respaldo.

## Alcance
- Dentro: 5 intenciones (resumen de caja por período, distribución por método de pago, composición de liquidación, comparación de comisiones, anomalías), *tool calling* de solo lectura, redacción en español, enlace al reporte, registro de versión de prompt y filtros.
- Fuera: escrituras, acceso a salarios ajenos, más intenciones.

## Requisitos cubiertos
RF-16 · HU-06 · CP-07 · RN-07 · cap. 10 (diseño de Lush Insight)

## Tareas
- [ ] **F11-T1 [BE]** Funciones de consulta de solo lectura por contrato (ej. `obtener_impacto_descuentos`). *RED:* intentar invocar una escritura. *Acept.:* el LLM no tiene acceso a ninguna escritura financiera.
- [ ] **F11-T2 [BE]** Clasificador de intención y validación de fechas, usuario y salón. *RED:* intención fuera de las cinco. *Acept.:* se rechaza con mensaje claro.
- [ ] **F11-T3 [BE]** Respuesta sin datos. *RED:* CP-07, período sin datos. *Acept.:* «Información insuficiente» y se pide un período válido.
- [ ] **F11-T4 [BE]** Permisos: una especialista no obtiene salarios de otras. *Acept.:* respuesta rechazada y auditada (`CONSULTAR`/`ACCESO_DENEGADO` en `auditoria`). **Esquema DB:** no hay permiso propio para Insight ni tabla de conversaciones; se usa `REPORTE_VER` y no se persiste el chat.
- [ ] **F11-T5 [WEB]** Chat con respuesta + «ver reporte fuente». *Acept.:* HU-06, el asistente consulta el período y muestra la fuente.
- [ ] **F11-T6 [TRANS]** Sin IA disponible, la caja y los reportes siguen operando. *Acept.:* caída del proveedor simulada sin afectar el resto.

## Dependencias
F07, F03. Minimizar y anonimizar los datos enviados a un proveedor externo.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F12-lush-guard
