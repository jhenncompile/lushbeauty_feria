# audit

**Responsabilidad:** historial de cambios (auditoría) para la administradora (F14, solo UI con registros sintéticos): quién, cuándo, qué, valor anterior y posterior, motivo.

**Contrato público (`index.ts`):** `WebAuditoriaPage`.

**Dependencias:** `shared/layout` y `shared/ui`. No importa otros módulos.

**Invariantes de UI:** solo lectura; los filtros no alteran el historial; no hay acción de editar ni borrar. Con backend los ajustes serán nuevos registros que apuntan al anterior.

**Eventos:** no emite. Con backend consumirá los hechos de todos los módulos (`venta_registrada`, `liquidacion_aprobada`, …) para construir el historial.
