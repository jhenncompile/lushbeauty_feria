# identity

**Responsabilidad:** ingreso, sesión y rol de la usuaria; decide qué rutas puede abrir cada rol.

**Contrato público (`index.ts`):** `LoginPage`, `SessionProvider`, `useSession`, `RequireRole`, `homeRouteFor`, `listSpecialists()`, tipos `Role`, `Session` y `Specialist`.

**Eventos:** no emite ni consume (fase de UI).

**Estado:** UI con sesión simulada en memoria. Con el backend (F00-T2/T3) el rol y el salón vendrán del servidor; la interfaz de este módulo no cambia.
