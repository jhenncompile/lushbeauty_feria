# guard

**Responsabilidad:** Lush Guard en la PWA (F12, solo UI con alertas de ejemplo): alertas por reglas con dato observado, umbral y estado de revisión.

**Contrato público (`index.ts`):** `GuardPage`, `WebGuardPage`.

**Dependencias:** `shared/layout` y `shared/ui`. No importa otros módulos.

**Reglas puras (`domain/alerts.ts`):** contar pendientes y marcar una alerta pendiente como revisada guardando quién lo hizo.

**Invariantes de UI:** una alerta pide revisión, no acusa; las reglas muestran su umbral; el detector estadístico se rotula «Experimental». Marcar revisada no borra la alerta.

**Eventos:** no emite ni consume todavía. Con backend consumirá hechos de otros módulos por evento y emitirá `alerta_creada` hacia notificaciones (F12/F13).
