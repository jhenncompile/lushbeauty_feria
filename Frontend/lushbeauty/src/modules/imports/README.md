# imports

**Responsabilidad:** importador de planillas Excel en la PWA (F06, solo UI con datos sintéticos): mapear columnas, revisar correcciones propuestas fila por fila y confirmar.

**Contrato público (`index.ts`):** `ImportarCargarPage`, `ImportarRevisarPage`, `WebImportarPage`.

**Dependencias:** `shared/layout` y `shared/ui`. No importa otros módulos.

**Reglas puras (`domain/review.ts`):** el conteo (aceptadas, por revisar, rechazadas) sale de las decisiones; confirmar solo con cero pendientes.

**Invariantes de UI:** nada se guarda hasta confirmar; un descuento sin motivo exige elegir motivo para aceptarse; el resultado de cada decisión se dice con palabras. La comisión de la planilla no se importa: se recalcula.

**Eventos:** no emite ni consume todavía. Con backend conservará archivo, hoja, fila, propuesta y decisión de cada registro (F06).
