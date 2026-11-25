# F02 · comisiones-versionadas

**Plataformas:** BE · WEB  **Semana:** 2  **Estado:** pendiente

## Resultado esperado
La comisión de cada línea se calcula con la regla vigente al vender y nunca se recalcula hacia atrás.
**Métrica:** diferencia entre comisión del sistema y cálculo manual de referencia = Bs 0,00 (ficha C.2).

## Alcance
- Dentro: `ReglaComision` con porcentaje, base (lista o neto), vigencia y motivo del cambio; snapshot de tasa y política en cada `LineaVenta`.
- Fuera: simulación de políticas (F08).

## Requisitos cubiertos
RF-05 · RN-02 · HU-03 · CP-02, CP-09

## Tareas
- [ ] **F02-T1 [BE]** Entidad versionada `ReglaComision` (porcentaje, base, `fecha_inicio`, motivo). *RED:* dos reglas con vigencia solapada. *Acept.:* se rechaza el solapamiento.
- [ ] **F02-T2 [BE]** Cálculo por línea con snapshot. *RED:* CP-02 (35 % sobre lista Bs 120 → Bs 42,00). *Acept.:* se guardan tasa, base y política aplicada en la línea.
- [ ] **F02-T3 [BE]** Inmutabilidad histórica. *RED:* CP-09, modificar una política ya aplicada. *Acept.:* las ventas históricas no se recalculan.
- [ ] **F02-T4 [WEB]** Pantalla de políticas de comisión (solo administradora): crear versión nueva, ver historial. *Acept.:* HU-03, el cambio conserva el motivo y no pisa la versión anterior.

## Dependencias
F01. **Bloqueo a validar:** si la base es precio de lista o importe neto (el documento usa lista como caso ilustrativo).

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
F03-liquidacion-semanal
