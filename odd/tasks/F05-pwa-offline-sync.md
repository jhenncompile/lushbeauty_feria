# F05 · pwa-offline-sync

**Plataformas:** MOB · BE  **Semana:** 3  **Estado:** T1 hecho (backend); T2 bloqueada por la decisión 10; UI T5 en maqueta; sin cola persistente

## Resultado esperado
Registrar servicios sin internet y sincronizarlos sin crear duplicados.
**Métrica:** 0 duplicados en las pruebas de pérdida de red (antes y después de enviar, doble reintento, reinicio del teléfono).

## Alcance
- Dentro: Service Worker, IndexedDB, UUID por operación, estados `pendiente → enviada → confirmada / requiere revisión`, reintento con clave de idempotencia, conflictos visibles (precio cambiado, descuento no autorizado).
- Fuera: aprobar liquidaciones, cambiar reglas y cierres finales (se hacen en línea en el MVP).

## Requisitos cubiertos
RF-10, RF-11 · RN-01 · HU-02 · CP-03, CP-04

## Tareas
- [x] **F05-T1 [BE]** Endpoint idempotente: misma clave devuelve el resultado original; validación de permisos, catálogo y descuento. *RED:* CP-03, UUID idéntico dos veces. *Acept.:* una sola venta confirmada. **Esquema DB:** reusa el `UNIQUE (salon_id, uuid_cliente)` de F01-T4; origen `PWA_OFFLINE`. **Hecho** (`feat/f05-t1-origen-offline`): el API acepta `origen = PWA_OFFLINE` (rechaza `IMPORTACION` y valores desconocidos); mismas validaciones que la venta web; CP-03: el mismo UUID dos veces deja una sola venta confirmada y el reintento devuelve la original aunque cambie el cuerpo o el origen; una venta de ayer conserva su fecha y la regla de comisión de ese día. **Falta:** que el cliente (T3/T4) envíe el origen y la clave.
- [ ] **F05-T2 [BE]** Registro de conflictos de sincronización (precio o descuento). *RED:* venta offline con precio vencido. *Acept.:* queda «requiere revisión», no se confirma sola. **Esquema DB (hueco):** existe el estado `REQUIERE_REVISION`, pero no dónde guardar la causa (precio vencido, descuento). Propuesta: nuevo valor `CONFLICTO_SINCRONIZACION` en `tipo_alerta`, con la causa en `detalle`, o una columna en `venta` (decisión 10). **Auditoría 2026-11-26:** Existe: Existe el estado `REQUIERE_REVISION` en `venta`. Falta: Detectar precio vencido o descuento fuera de política al sincronizar y guardar la causa. Bloquea: Decisión 10 (dónde guardar la causa).
- [ ] **F05-T3 [MOB]** Cola local en IndexedDB con UUID y estado. *RED:* CP-04, cortar internet antes de registrar. *Acept.:* HU-02, registro local pendiente y luego confirmado. **Auditoría 2026-11-26:** Existe: Cola en memoria dentro de `offline/queue.ts` (se pierde al recargar). Falta: IndexedDB con UUID y estado; probar CP-04. Bloquea: Nada técnico.
- [ ] **F05-T4 [MOB]** Sincronizador con reintentos y *backoff*. *RED:* la red falla tras persistir pero antes de la respuesta. *Acept.:* el reintento devuelve el resultado original. **Auditoría 2026-11-26:** Existe: Simulación de sincronización sin red real. Falta: Sincronizador con reintentos y *backoff* contra `POST /api/v1/ventas/`. Bloquea: F05-T1 (origen), F05-T3.
- [~] **F05-T5 [MOB]** UI de estado: banner «no confirmada por el servidor», lista de pendientes y conflictos. *Acept.:* la usuaria sabe qué ventas faltan por confirmar. **UI parcial (`feat/f05-ui-offline-estados`):** barra de estado que enlaza a la cola, pantalla «Sincronización» (pendiente / confirmada / requiere revisión con causa y «Confirmar importe»), atajo en Hoy y aviso al guardar sin conexión. La cola vive en memoria y se pierde al recargar: falta IndexedDB (T3), sincronizador con backoff (T4) y el banner «no confirmada por el servidor» sobre cada venta. **Auditoría 2026-11-26:** Existe: Barra de estado y pantalla «Sincronización» con datos simulados (web y Flutter). Falta: Banner «no confirmada por el servidor» sobre cada venta; usar la cola real. Bloquea: F05-T3/T4.
- [ ] **F05-T6 [TRANS]** Pruebas de campo: reinicio del teléfono, modo avión, dos intentos seguidos. *Acept.:* checklist ejecutado con evidencia. **Auditoría 2026-11-26:** Existe: Nada. Falta: Checklist de campo: reinicio del teléfono, modo avión, doble intento. Bloquea: F05-T3/T4.

## Dependencias
F01. Comparte el endpoint de ventas.

## Evidencia
UI (parcial, `feat/f05-ui-offline-estados`): `pnpm test` 74 pruebas en verde. Sin conexión: la barra dice «Sin conexión · 3 pendientes»; guardar un servicio lo deja «Pendiente» con su importe (Bs 120,00) y la pantalla avisa que se enviará al volver la conexión; con conexión se confirma al instante; reintentar sin conexión no pierde nada; un registro en revisión espera la confirmación del importe; el mismo id no se encola dos veces. `pnpm lint` y `pnpm build` sin errores. **No verificado:** Service Worker real, persistencia entre recargas, reinicio del teléfono ni modo avión (F05-T6); el estado de conexión se simula con eventos `online`/`offline` y un conmutador solo de desarrollo. No se inspeccionó visualmente.

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

Origen offline (`feat/f05-t1-origen-offline`): 8 pruebas nuevas en `sales/tests/test_offline.py` (origen por defecto, `PWA_OFFLINE`, rechazo de `IMPORTACION`, CP-03, reintento con cuerpo distinto, fecha de ayer, mismas validaciones, listado); suite del backend 216 pruebas OK. No verificado: con un cliente real (no existe todavía) ni con red cortada de verdad.

## Siguiente paso
Resolver la decisión 10 para F05-T2; luego la cola en IndexedDB (T3) y el sincronizador con *backoff* (T4), que ya pueden enviar `origen = PWA_OFFLINE`.
