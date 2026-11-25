# analytics

**Responsabilidad:** panel financiero de la administradora: ventas brutas, cobrado neto, descuentos, comisiones estimadas, propinas, cobrado por método y por especialista, y lo que requiere atención.

**Contrato público (`index.ts`):** `WebPanelPage`.

**Dependencias:** solo `shared` (`layout`, `money`, `ui`). Los enlaces a otras pantallas usan las rutas de `shared/layout`, no importan otros módulos.

**Reglas puras (`domain/metrics.ts`):** porcentajes con enteros (barras en % entero; descuentos con un decimal).

**Eventos:** no emite. Con backend consumirá las ventas confirmadas y los cierres (F07-T1/T2).

**Estado:** maqueta con cifras sintéticas rotuladas «Ilustrativo». Pendientes: filtros por período, especialista y servicio; que las cifras salgan de las ventas reales.
