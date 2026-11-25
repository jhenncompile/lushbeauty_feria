# decisions

**Responsabilidad:** Lush Decision Studio en la PWA: contribución por servicio, simulación What-If, matriz multicriterio con sensibilidad, recomendación explicable e historial de decisiones (F08–F10, solo UI con datos sintéticos).

**Contrato público (`index.ts`):** `SimuladorPage`, `ComparacionPage`, `RecomendacionPage`, `HistorialPage`, `WebDecisionesPage`.

**Dependencias:** `shared/layout`, `shared/ui`, `shared/money`. No importa otros módulos.

**Reglas puras:** `domain/simulation.ts` (contribución y servicios para igualar, centavos enteros) y `domain/matrix.ts` (puntaje ponderado en décimas, pesos enteros que deben sumar 100). Se prueban sin React.

**Invariantes de UI:** todo escenario se rotula «hipotético e ilustrativo»; los supuestos se marcan «Supuesto» o «Dato»; sin costos registrados no se calcula contribución («Datos insuficientes»); la IA sugiere y la administradora aprueba. Ninguna pantalla modifica ventas, nóminas ni políticas.

**Eventos:** no emite ni consume todavía. Con backend emitirá `decision_aprobada` (F10).
