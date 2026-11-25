# notifications

**Responsabilidad:** avisos automáticos vía n8n con patrón outbox (F13, solo UI con estados de ejemplo): qué avisos existen, su último envío y los fallos reintentables.

**Contrato público (`index.ts`):** `AutomationsSection` (bloque que `identity` coloca dentro de Ajustes).

**Dependencias:** `shared/ui`. No importa otros módulos.

**Invariantes de UI:** un aviso nunca reemplaza el registro contable; un fallo no deshace la operación y se puede reintentar; los avisos no llevan datos salariales innecesarios. El reintento de la maqueta solo lo registra: no hay envío real.

**Eventos:** con backend consumirá `liquidacion_aprobada`, `cierre_caja_aprobado` y `alerta_creada` desde el outbox.
