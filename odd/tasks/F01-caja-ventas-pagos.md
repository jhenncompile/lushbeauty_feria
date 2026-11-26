# F01 · caja-ventas-pagos

**Plataformas:** BE · WEB · MOB  **Semana:** 2  **Estado:** UI parcial (T5 y T6 en maqueta; backend pendiente)

## Resultado esperado
Registrar una venta con una o varias líneas, pagos por medio y descuentos con motivo, con importes exactos y trazables.
**Métrica:** tasa de errores de cálculo = 0 en los casos de prueba CP-01 y de combos/pagos divididos (cap. 12).

## Alcance
- Dentro: catálogo de servicios con vigencia, venta multilínea, pagos (efectivo/QR/transferencia), descuento con motivo y aprobación, anulación con ajuste (no se borra), `Decimal`, copia inmutable de lista/descuento/cobrado.
- Fuera: comisión (F02), sincronización offline (F05), importación (F06).

## Requisitos cubiertos
RF-01, RF-02, RF-03, RF-04 · RN-01, RN-03, RN-04 · HU-01, HU-10 · CP-01

## Tareas
- [ ] **F01-T1 [BE]** Entidades `ServicioCatalogo`, `Venta`, `LineaVenta`, `Pago` con `Decimal` y criterio de redondeo explícito. *RED:* suma de líneas ≠ suma de pagos debe rechazarse. *Acept.:* RN-03/RN-04 verificadas. **Esquema DB:** la BD ya impone `importe = lista×cantidad − descuento`, la comisión redondeada a 2 decimales y que los pagos igualen las líneas de una venta CONFIRMADA (trigger diferido). El dominio sigue calculando con `Decimal` y se agrega un test de paridad: lo que el dominio acepta, la BD lo acepta, y viceversa. Estados: PENDIENTE, CONFIRMADA, REQUIERE_REVISION, ANULADA; origen: WEB, PWA_OFFLINE, IMPORTACION. Redondeo propuesto: `round(x, 2)` de PostgreSQL (mitad hacia arriba); la administradora lo valida (decisión 1).
- [ ] **F01-T2 [BE]** Descuento con motivo y límite autorizado. *RED:* CP-01 (lista Bs 120, descuento Bs 8 → cobro Bs 112, se conserva la lista). *Acept.:* un descuento sobre el umbral exige aprobación de la administradora. **Esquema DB:** hay un solo tope por salón (`descuento_maximo`, por defecto 50 %) y el permiso `DESCUENTO_APROBAR`, pero no hay umbral «sin aprobación» (la UI usa 10 %) ni columna de quién aprobó el descuento. Hasta decidir (decisión 8) el umbral vive en configuración y la aprobación queda en `auditoria`.
- [ ] **F01-T3 [BE]** Anulación/devolución como ajuste auditado. *RED:* borrar una venta usada en una liquidación. *Acept.:* HU-10: historial conservado y ajuste generado. **Esquema DB:** anular = `estado ANULADA` + `motivo_anulacion`; las líneas quedan inmutables. La BD **no** impide anular una venta cuyas líneas ya están en una liquidación aprobada: el servicio lo rechaza y, si corresponde, genera un `MovimientoNomina` tipo `AJUSTE` en la liquidación abierta siguiente (RN-05).
- [ ] **F01-T4 [BE]** `POST /api/v1/ventas/` idempotente por UUID de cliente (RN-01). *RED:* dos POST con el mismo UUID. *Acept.:* una sola venta confirmada. **Esquema DB:** `UNIQUE (salon_id, uuid_cliente)` da la idempotencia; el servicio captura el conflicto y devuelve la venta original (y puede alertar `CLAVE_REPETIDA`).
- [ ] **F01-T5 [WEB]** Pantalla de venta de la administradora: líneas, pagos, descuento y motivo. *Acept.:* HU-01: el importe de líneas coincide con pagos y se muestra el detalle. **UI parcial (`feat/f01-ui-registro-servicio`):** listado de ventas con detalle inmutable, filtro por estado y anulación con motivo (conserva la fila). Falta venta multilínea y pagos divididos.
- [ ] **F01-T6 [MOB]** Pantalla de registro rápido para la especialista: servicio → especialista → monto → método de pago. *Acept.:* una venta se registra en pocos toques, con estado visible. **UI parcial:** Hoy, Registrar, Descuento y Servicio guardado; datos en memoria, sin envío al servidor.
- [ ] **F01-T7 [BE]** *(nueva, desde el esquema)* Gestión de catálogo y personas: `servicio` (con `costo_materiales` nullable), `cliente` y `especialista` (con `sueldo_fijo`), con permisos `CATALOGO_GESTIONAR`/`USUARIO_GESTIONAR`. *RED:* una especialista intenta crear un servicio; precio negativo. *Acept.:* 403 / validación; cada cambio auditado. Sin esto F01-T1 y F02 no tienen de dónde leer.

## Dependencias
F00. **Bloqueo a validar:** regla de redondeo (RN-03) y lista de métodos de pago, con la administradora.

## Evidencia
UI (parcial, `feat/f01-ui-registro-servicio`): `pnpm test` 32 pruebas en verde, incluido CP-01 en dominio y en pantalla (lista Bs 120, descuento Bs 8 → cobra Bs 112, comisión Bs 42,00 sobre lista); límite de 10 % exacto sin aprobación y un centavo más con aprobación; guardado bloqueado sin método de pago; anulación exige motivo. `pnpm lint` y `pnpm build` sin errores. Verificado a ojo solo el ingreso (captura 390px y 1280px); el resto de pantallas no se inspeccionó visualmente. Valores 35 % y 10 % son ilustrativos del diseño; el redondeo de comisión es provisional (decisión abierta 1). Desviación del diseño: el motivo del descuento no viene preseleccionado, para que sea obligatorio elegirlo.

## Siguiente paso
F02-comisiones-versionadas
