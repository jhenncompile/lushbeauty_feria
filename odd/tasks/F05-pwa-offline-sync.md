# F05 · pwa-offline-sync

**Plataformas:** MOB · BE  **Semana:** 3  **Estado:** pendiente

## Resultado esperado
Registrar servicios sin internet y sincronizarlos sin crear duplicados.
**Métrica:** 0 duplicados en las pruebas de pérdida de red (antes y después de enviar, doble reintento, reinicio del teléfono).

## Alcance
- Dentro: Service Worker, IndexedDB, UUID por operación, estados `pendiente → enviada → confirmada / requiere revisión`, reintento con clave de idempotencia, conflictos visibles (precio cambiado, descuento no autorizado).
- Fuera: aprobar liquidaciones, cambiar reglas y cierres finales (se hacen en línea en el MVP).

## Requisitos cubiertos
RF-10, RF-11 · RN-01 · HU-02 · CP-03, CP-04

## Tareas
- [ ] **F05-T1 [BE]** Endpoint idempotente: misma clave devuelve el resultado original; validación de permisos, catálogo y descuento. *RED:* CP-03, UUID idéntico dos veces. *Acept.:* una sola venta confirmada.
- [ ] **F05-T2 [BE]** Registro de conflictos de sincronización (precio o descuento). *RED:* venta offline con precio vencido. *Acept.:* queda «requiere revisión», no se confirma sola.
- [ ] **F05-T3 [MOB]** Cola local en IndexedDB con UUID y estado. *RED:* CP-04, cortar internet antes de registrar. *Acept.:* HU-02, registro local pendiente y luego confirmado.
- [ ] **F05-T4 [MOB]** Sincronizador con reintentos y *backoff*. *RED:* la red falla tras persistir pero antes de la respuesta. *Acept.:* el reintento devuelve el resultado original.
- [ ] **F05-T5 [MOB]** UI de estado: banner «no confirmada por el servidor», lista de pendientes y conflictos. *Acept.:* la usuaria sabe qué ventas faltan por confirmar.
- [ ] **F05-T6 [TRANS]** Pruebas de campo: reinicio del teléfono, modo avión, dos intentos seguidos. *Acept.:* checklist ejecutado con evidencia.

## Dependencias
F01. Comparte el endpoint de ventas.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F06-importador-excel
