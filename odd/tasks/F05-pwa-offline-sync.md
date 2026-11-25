# F05 · pwa-offline-sync

**Plataformas:** MOB · BE  **Semana:** 3  **Estado:** UI parcial (T5 maqueta; cola persistente y sincronizador pendientes)

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
- [ ] **F05-T5 [MOB]** UI de estado: banner «no confirmada por el servidor», lista de pendientes y conflictos. *Acept.:* la usuaria sabe qué ventas faltan por confirmar. **UI parcial (`feat/f05-ui-offline-estados`):** barra de estado que enlaza a la cola, pantalla «Sincronización» (pendiente / confirmada / requiere revisión con causa y «Confirmar importe»), atajo en Hoy y aviso al guardar sin conexión. La cola vive en memoria y se pierde al recargar: falta IndexedDB (T3), sincronizador con backoff (T4) y el banner «no confirmada por el servidor» sobre cada venta.
- [ ] **F05-T6 [TRANS]** Pruebas de campo: reinicio del teléfono, modo avión, dos intentos seguidos. *Acept.:* checklist ejecutado con evidencia.

## Dependencias
F01. Comparte el endpoint de ventas.

## Evidencia
UI (parcial, `feat/f05-ui-offline-estados`): `pnpm test` 74 pruebas en verde. Sin conexión: la barra dice «Sin conexión · 3 pendientes»; guardar un servicio lo deja «Pendiente» con su importe (Bs 120,00) y la pantalla avisa que se enviará al volver la conexión; con conexión se confirma al instante; reintentar sin conexión no pierde nada; un registro en revisión espera la confirmación del importe; el mismo id no se encola dos veces. `pnpm lint` y `pnpm build` sin errores. **No verificado:** Service Worker real, persistencia entre recargas, reinicio del teléfono ni modo avión (F05-T6); el estado de conexión se simula con eventos `online`/`offline` y un conmutador solo de desarrollo. No se inspeccionó visualmente.

## Siguiente paso
F06-importador-excel
