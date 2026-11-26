# F07 · dashboard-financiero

**Plataformas:** BE · WEB  **Semanas:** 3-4  **Estado:** UI parcial (T3 maqueta sin filtros)

## Resultado esperado
Un panel que responde en segundos: cuánto se vendió, cobró, descontó y se debe a las especialistas.
**Métrica:** cada cifra del panel coincide con el reporte fuente (conciliación 100 %).

## Alcance
- Dentro: ventas brutas y netas, descuentos, comisiones estimadas, propinas, pagos por método, cierres pendientes; filtros por período, especialista y servicio; distinción cobrado vs no confirmado.
- Fuera: analítica avanzada y proyecciones.

## Requisitos cubiertos
RF-15 · cap. 08 (centro de inteligencia financiera)

## Tareas
- [ ] **F07-T1 [BE]** Consultas agregadas con filtros y permisos. *RED:* el total del panel ≠ suma de pagos confirmados. *Acept.:* ningún importe no confirmado cuenta como cobrado (solo `venta.estado = CONFIRMADA`; el esquema no trae vistas de reporte, las consultas son del módulo).
- [ ] **F07-T2 [BE]** Una especialista ve solo lo suyo. *RED:* consulta de otra especialista. *Acept.:* se rechaza.
- [ ] **F07-T3 [WEB]** Tablero con tarjetas, filtros y desglose por método de pago. *Acept.:* cada cifra enlaza a su reporte fuente. **UI parcial (`feat/f07-ui-panel`):** tarjetas, cobrado por método y tabla por especialista con cifras sintéticas, y enlaces de «Requiere atención» a Caja y Ventas. Faltan filtros, que cada cifra enlace a su reporte y que los datos salgan de las ventas reales.
- [ ] **F07-T4 [WEB]** Estados vacíos y de carga. *Acept.:* cuando no hay datos, el panel lo dice en lugar de mostrar 0 como si fuera real.

## Dependencias
F01, F03, F04.

## Evidencia
UI (parcial, `feat/f07-ui-panel`): `pnpm test` 83 pruebas en verde (cifras 2.320 / 2.206 / 114 = 4,9 % / 812,00; total por especialista coincide con las tarjetas; una especialista no accede; la administradora en pantalla ancha entra al panel web). `pnpm lint` y `pnpm build` sin errores. Revisión visual con capturas de Playwright en 390px y 1440px de Hoy, Registrar, Nómina, Panel y Ventas; se corrigieron enlaces subrayados y tablas con saltos de línea. No se revisó visualmente Descuento, Guardado, Caja ni Sincronización. Las cifras son del diseño, no del salón. F07-T4 (vacíos y carga) no se hizo.

## Siguiente paso
F08-dss-contribucion-whatif
