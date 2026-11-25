# offline

**Responsabilidad:** estado de conexión y cola de envío de registros; pantalla «Sincronización».

**Contrato público (`index.ts`):** `OfflineProvider`, `useOfflineQueue` (`enqueue`, `retry`, `confirmReview`), `SincronizacionPage`, `DevConnectionToggle` (solo desarrollo), `SAMPLE_QUEUE`.

**Cómo alimenta a los demás:** publica el estado en `shared/connection` (`online`, `pending`); los shells lo muestran en la barra de estado y `payroll`/`cashier` lo leen para exigir conexión. `sales` llama a `enqueue` al guardar.

**Reglas:** cada registro lleva una clave única (el mismo id no se encola dos veces); sin conexión queda «pendiente», con conexión «confirmada»; un registro en revisión espera a que la usuaria confirme el importe; aprobar liquidación y cerrar caja no se encolan: requieren conexión.

**Eventos:** no emite ni consume todavía.

**Estado:** simulación en memoria. Pendientes: Service Worker con caché, IndexedDB, sincronizador real y pruebas de campo (F05-T1/T2/T4/T6).
