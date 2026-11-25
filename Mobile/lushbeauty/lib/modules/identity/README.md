# identity (Flutter)

**Responsabilidad:** ingreso por PIN, sesión y rol; lista de especialistas.
**Contrato público (`identity.dart`):** `LoginPage`, `Session`, `Role`, `SessionController`, `Specialist`, `listSpecialists()`, `homeRouteFor()`.
**Eventos:** no emite ni consume (fase de UI). **Estado:** sesión simulada en memoria; con backend el rol vendrá del servidor.
