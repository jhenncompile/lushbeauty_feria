# offline (Flutter)

**Responsabilidad:** cola de envío y estado de conexión; pantalla «Sincronización».
**Contrato público (`offline.dart`):** `OfflineController`, `QueueItem`, `QueueStatus`, `sampleQueue`, `SincronizacionPage`.
**Reglas:** mismo id no se encola dos veces; sin conexión queda «pendiente», con conexión «confirmada»; un registro en revisión espera la confirmación del importe.
**Estado:** simulación en memoria; falta persistencia local, sincronizador real y detección de red real (F05).
