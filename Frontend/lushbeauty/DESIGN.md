# DESIGN · Lush Beauty Smart (Frontend PWA)

Documento de diseño UI/UX de la PWA mobile-first. Fuente visual: el lienzo «Lush Beauty Smart · Pantallas y flujo» (33 artboards, sistema LUSH BEAUTY). Fuente de requisitos: `README.md` y `odd/tasks/`. Todas las cifras de las pantallas son **ilustrativas** (datos sintéticos) y se rotulan como tales.

## 1. Principios de experiencia

1. **Exactitud antes que estilo.** Un importe siempre se ve completo, con su desglose (lista → descuento → cobrado → comisión). Nunca se redondea en silencio.
2. **Nada contable se borra.** Se anula con motivo y queda un ajuste visible. La interfaz no ofrece «Eliminar» sobre ventas, cierres ni liquidaciones.
3. **El estado de conexión siempre está a la vista.** Una barra de estado bajo la cabecera dice «En línea · todo sincronizado» o «Sin conexión · N pendientes».
4. **Pocos toques para la especialista.** Registrar un servicio: servicio → especialista → método → guardar. Sin teclear importes cuando hay precio de lista.
5. **La decisión final es humana.** Simulaciones y recomendaciones se rotulan «Supuesto» o «Simulación» y nunca modifican datos reales. La IA no autoriza pagos.
6. **Lujo sobrio.** Cuadrado (sin radios), mucho aire, hairlines en lugar de sombras, tipografía ligera para cifras, mayúsculas con tracking solo en etiquetas y botones.

## 2. Usuarias y qué ve cada una

| Rol | Entra por | Ve | No ve |
|---|---|---|---|
| Administradora | Web y móvil | Panel, Ventas, Caja, Nómina, Catálogo, Auditoría; aprueba descuentos, cierres y liquidaciones | — |
| Especialista | Móvil (PIN de 6 dígitos) | «Registrar» y «Mi liquidación» (solo la suya) | Nómina ajena, caja, configuración |
| Lector/contador | Web (opcional) | Reportes agregados | Detalle por persona, escritura |

La navegación se construye según el rol: la especialista ve 2 pestañas inferiores; la administradora, 4 (Hoy, Caja, Nómina, Decisiones).

## 3. Tokens

Se portan 1:1 del sistema LUSH BEAUTY a variables CSS (`src/shared/design/tokens.css`). Dos temas: **Blanc** (por defecto) y **Noir** (bandas de portada y cifras destacadas).

### Color
| Token | Blanc | Noir | Uso |
|---|---|---|---|
| `--surface` | `#ffffff` | `#0a0a0a` | Fondo de página |
| `--surface-raised` | `#f5f5f5` | `#161616` | Paneles, cabeceras de tabla |
| `--surface-inverse` | `#0a0a0a` | `#ffffff` | Botón primario, bandas negras |
| `--ink` | `#0a0a0a` | `#f5f5f5` | Texto principal |
| `--ink-muted` | `#5a5a5a` | `#a3a3a3` | Texto secundario, etiquetas |
| `--hairline` | `#d9d9d9` | `#2b2b2b` | Divisores decorativos (nunca único borde de un control) |
| `--border-strong` | `#6e6e6e` | `#8c8c8c` | Subrayado de campos, controles con contorno (≥3:1) |
| `--rouge` | `#7d1530` | `#e0606f` | Texto de error, negativos, alertas |
| `--rouge-fill` | `#7d1530` | `#7d1530` | Relleno de botón de peligro |
| `--ok` | `#0f5c6e` | `#6cc4d6` | Confirmación, cifras dentro de rango |
| `--focus` | `#0a0a0a` | `#ffffff` | Anillo de foco 2px, offset 2px |

Regla: **rouge y ok nunca van solos**; siempre acompañados de una palabra o signo («− Bs 10,00 · Falta», «Conciliado»). `ok` es azul-verdoso a propósito para no depender del par rojo/verde.

### Tipografía (Jost 300/400/500; respaldo Futura, Helvetica Neue, Arial)
| Estilo | Tamaño / interlínea / peso | Uso |
|---|---|---|
| display-xl | 72 / 1.05 / 300 | Titular de portada (una por página; ≤44px en <720px) |
| display-lg | 48 / 1.1 / 300 | Título de página web |
| headline | 32 / 1.2 / 300 | Título de pantalla móvil |
| title | 22–24 / 1.3 / 400 | Título de panel |
| figure | 48 / 1 / 300 | Cifra clave (`tabular-nums`) |
| figure-sm | 28 / 1 / 300 | Importes en filas y totales |
| body | 15 / 24 / 400 | Texto por defecto |
| label | 13 / 20 / 500 | Etiqueta en formularios densos |
| caption | 12 / 18 / 400, +0.02em | Notas, ayudas, errores |
| eyebrow | 11 / 16 / 500, +0.24em, MAYÚS | Sobretítulos, cabeceras de tabla, etiquetas de campo |
| nav / button | 12 y 11 px, +0.16em / +0.22em, MAYÚS | Navegación y botones |

Las cifras usan siempre `font-variant-numeric: lining-nums tabular-nums`. El peso 300 solo desde 28px.

### Espaciado, forma y elevación
- Escala: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 160 (`--space-1…10`). Margen de página: 24px móvil, 64px escritorio. Máx. de contenido 1280px.
- Radio: **0** en todo. Solo los puntos de estado y avatares son circulares.
- Sin sombras en tarjetas. Única sombra: `--shadow-veil` para capas flotantes (menús, hojas, avisos).
- Objetivo táctil mínimo 48px. Línea de 1px para hairlines y contornos.
- Movimiento: entrada `rise` .9s por bloques escalonados, barras `grow`; todo se anula con `prefers-reduced-motion`.

## 4. Componentes (`src/shared/ui`)

Presentacionales: reciben datos por props, sin lógica de negocio ni de red.

| Componente | Propósito | Estados / variantes |
|---|---|---|
| `Wordmark` | LUSH BEAUTY en mayúsculas con tracking | apilado / horizontal; tono normal / inverso; descriptor opcional |
| `Button` | Acción | primario (relleno negro), secundario (contorno), peligro (rouge), enlace (subrayado); hover invierte colores; `disabled` gris con texto explicativo debajo |
| `Field` | Campo con subrayado | label en eyebrow, `hint`, `error` (subrayado y mensaje rouge), `inputMode` decimal/numérico, `type=password` |
| `Choice` | Opción excluyente (servicio, especialista, método, motivo) | `aria-pressed`; seleccionado = relleno negro; grupos en 1, 2 o 3 columnas |
| `Stat` | Cifra con etiqueta, variación y nota | tono up (ok) / down (rouge) / neutro |
| `Line` | Fila etiqueta + valor | con borde superior, enlace (≥48px, hover con sangría) |
| `Tag` | Estado en texto | neutro, ok, rouge. Texto siempre explícito («Pendiente», «Requiere revisión») |
| `Panel` | Bloque sobre `surface-raised` | — |
| `Steps` | Borrador → Verificada → Aprobada | `aria-current="step"` |
| Tablas (`.tbl`, `.tbl--web`) | Tablas numéricas, con las clases del diseño (no hay componente React) | primera columna a la izquierda, cifras a la derecha, fila de total con filete negro; en móvil, scroll horizontal |
| `TopBar` (móvil) | «Volver» · título (h1, eyebrow) · vacío | — |
| `MobileScreen` (en `shared/layout`) | Barra, estado de conexión, contenido, pie y pestañas | — |
| `StatusBar` | Conexión | en línea (punto ok) / sin conexión (banda negra, punto claro) |
| `Tabs` (móvil) | Navegación inferior | 4 o 2 pestañas, `aria-current="page"` |
| `WebScreen` (en `shared/layout`) | Navegación web + estado + contenido | enlaces centrados, marca al centro, «Ajustes · Salir» a la derecha; <720px se convierte en `mnav` en fila |
| `ServiceRow` | Fila de catálogo | índice, título, descripción, duración, precio |

### Microcopy (español de Bolivia)
- Moneda: `Bs 1.236` (miles con punto) y `Bs 112,00` (decimales con coma). Entrada de importes acepta `8`, `8,5` y `8,50`.
- Errores en 12px, en rouge, diciendo **qué pasó y qué hacer**: «El catálogo cambió el precio mientras no había conexión. Confirme el importe para reenviarlo.»
- Botones: verbo + objeto («Registrar servicio», «Aprobar liquidación», «Cerrar caja»). Acciones destructivas llevan el importe: «Anular servicio de Bs 112».
- Rótulos de honestidad: «Ilustrativo», «Simulación. No altera la liquidación», «Supuesto».

## 5. Mapa de pantallas por feature

Estado: ✅ se implementa en esta fase (UI con datos sintéticos, sin backend) · 📄 solo documentada (backlog de UI).

| Feature | Pantalla (artboard) | Plataforma | Módulo | Ruta | Estado |
|---|---|---|---|---|---|
| F00 | Ingreso (Main / WebLogin), una sola pantalla responsive | Móvil y web | `identity` | `/ingresar` | ✅ |
| F00 | Shell y navegación por rol | Ambas | `shared/layout` | — | ✅ |
| F01 | Hoy | Móvil | `sales` | `/hoy` | ✅ |
| F01 | Registrar servicio | Móvil | `sales` | `/registrar` | ✅ |
| F01 | Descuento con motivo | Móvil | `sales` | `/registrar/descuento` | ✅ |
| F01 | Servicio guardado | Móvil | `sales` | `/registrar/guardado` | ✅ |
| F01 | Ventas (tabla + venta seleccionada + anular) | Web | `sales` | `/web/ventas` | ✅ |
| F02 | Catálogo y reglas (lectura) | Web | `catalog` | `/web/catalogo` | ✅ parcial |
| F03 | Liquidación semanal | Móvil | `payroll` | `/nomina` | ✅ |
| F03 | Detalle de liquidación | Móvil | `payroll` | `/nomina/:id` | ✅ |
| F03 | Liquidación aprobada | Móvil | `payroll` | `/nomina/aprobada` | ✅ |
| F03 | Mi liquidación (especialista) | Móvil | `payroll` | `/mi-liquidacion` | ✅ |
| F03 | Nómina | Web | `payroll` | `/web/nomina` | ✅ |
| F04 | Cierre de caja | Móvil | `cashier` | `/caja` | ✅ |
| F04 | Caja | Web | `cashier` | `/web/caja` | ✅ |
| F05 | Sin conexión · cola de envío | Móvil | `offline` | `/sincronizacion` | ✅ |
| F07 | Panel financiero | Web | `analytics` | `/web/panel` | ✅ maqueta |
| F06 | Importar · mapear / revisar (móvil), Importar planilla (web) | Ambas | `imports` | — | 📄 |
| F11 | Lush Insight (móvil y web) | Ambas | `insight` | — | 📄 |
| F12 | Lush Guard (móvil y web) | Ambas | `guard` | — | 📄 |
| F08–F10 | Simulador What-If, Comparación multicriterio, Recomendación, Historial de decisiones (móvil); Decision Studio (web) | Ambas | `decision_scenarios` y afines | — | 📄 |
| F00/F14 | Ajustes (usuarias y roles, avisos n8n, seguridad), Auditoría | Web | `identity`, `audit`, `notifications` | — | 📄 |
| — | Inicio público (landing) y Banner para feria | Web / impreso | — | — | 📄 |

## 6. Flujos clave

**Registrar servicio (especialista).** Hoy → «Registrar servicio» → elegir servicio (muestra precio) → especialista → método de pago → (opcional) «Aplicar descuento» → «Guardar servicio» → pantalla «Servicio guardado» con desglose y «Deshacer este registro». El botón Guardar permanece deshabilitado hasta elegir método y dice por qué: «Elija un método de pago para guardar.»

**Descuento.** Importe en Bs + motivo obligatorio (Clienta frecuente, Promoción, Corrección, Otro) + detalle opcional. El panel muestra Cobrado y Comisión recalculados y el porcentaje. Si supera el límite autorizado (10 % en el diseño; valor real a definir con la administradora), el panel pasa a «Requiere aprobación de la administradora» y el botón cambia a «Solicitar aprobación».

**Sin conexión.** La barra se vuelve negra («Sin conexión · 3 pendientes»). Los registros siguen guardándose en el teléfono y entran en la cola con estados `Pendiente`, `Confirmada` o `Requiere revisión` (con la causa y qué hacer). «Reintentar envío» no duplica porque cada registro lleva una clave única. Aprobar liquidaciones y cerrar caja exigen conexión y lo dicen.

**Cierre de caja.** Tabla Esperado vs Declarado por método, campo «Efectivo contado», diferencia en cifra grande con palabra («Falta Bs 10,00»), justificación obligatoria si hay diferencia. Tras cerrar, cualquier cambio deja historial.

**Liquidación semanal.** Borrador → Verificada → Aprobada. Aprobar es irreversible: el pie lo avisa («Al aprobar se emiten los comprobantes y se avisa a cada especialista»). Pantalla «aprobada» muestra el total y el estado de cada aviso; un aviso fallido no deshace la liquidación y se puede reintentar.

**Mi liquidación.** La especialista ve Neto a pagar, comisión, propinas, adelanto y «Descargar comprobante». Un texto fijo aclara que no puede ver las de otras.

## 7. Responsive

- **Móvil (≤720px y vistas de especialista):** columna de 390px de referencia; cabecera de 56px, barra de estado, contenido con margen 24px, pie fijo con botón a ancho completo, pestañas inferiores de 56px.
- **Web (≥721px):** `WebNav` de 72px, contenido centrado a 1280px, rejillas `cols--21` (2/3 + 1/3) que colapsan a una columna bajo 1000px; tablas con scroll horizontal dentro de su caja.
- La PWA decide el shell por ruta (`/web/*` usa `WebScreen`; el resto usa `MobileScreen`), no por ancho de pantalla, para que la administradora pueda usar ambas en teléfono.

## 8. Accesibilidad

- Contraste: texto 4.5:1 (3:1 desde 24px); bordes de controles 3:1 (`--border-strong`, no `--hairline`).
- Elementos reales: `button`, `a href`, `input` + `label`. Nunca `div` con `onClick`.
- `aria-current="page"` en navegación, `aria-current="step"` en pasos, `aria-pressed` en `Choice`, `aria-label` en botones solo-icono, SVG decorativo `aria-hidden`.
- Foco visible 2px con offset 2px (blanco sobre bandas negras).
- Estados nunca solo por color. Objetivos ≥48px.
- `prefers-reduced-motion`: sin animaciones ni transiciones.

## 9. Estados por pantalla

| Situación | Tratamiento |
|---|---|
| Carga | Esqueleto en `surface-raised`; la cifra mantiene su espacio |
| Vacío | Frase corta + acción («Aún no hay servicios hoy. Registre el primero.») |
| Error de red | Banda negra de conexión + causa y reintento; los datos locales se conservan |
| Error de validación | Subrayado y mensaje rouge debajo del campo; foco al primer error |
| Éxito | Confirmación en pantalla propia o `Tag` ok; sin toasts efímeros para dinero |
| Permiso denegado | «Esta sección es solo para la administradora.» sin pistas de datos |

## 10. Imágenes decorativas

El diseño usa láminas fotográficas y una marca giratoria en portadas. En esta fase se sustituyen por bandas `noir` sólidas; el producto no depende de ellas. Se retomarán con material propio del salón (sin datos de clientas).

## 11. Decisiones abiertas que afectan la UI

No se inventan; la UI usa los valores del diseño solo como texto ilustrativo.

1. **Redondeo de moneda** (RN-03): define cuántos decimales se muestran y cómo se aplica el descuento.
2. **Base de comisión** (lista o importe neto): los textos «35 % sobre lista» y la «Comparación de políticas» cambian según la respuesta.
3. **Descuento máximo autorizado** (10 % en el diseño) y quién aprueba.
4. **Día de corte semanal y propinas** (F03): etiquetas de «Semana 17 – 23 nov» y la fila de propinas.
5. **Pesos de la matriz** y **costos de materiales** (F08–F09): afectan solo a pantallas documentadas, no a esta fase.

## 12. Cómo ejecutarlo

`pnpm dev` (en `Frontend/lushbeauty`), `pnpm test`, `pnpm lint`, `pnpm build`. En desarrollo aparece un botón «Simular sin conexión». Al ingresar en pantalla ancha, la administradora llega al Panel web; en pantalla angosta, a Hoy.

## 13. Discrepancia con el README

El README define una sola PWA y excluye una app nativa. El equipo decidió implementar **ambas**: la PWA cubre todo y `Mobile/lushbeauty` (Flutter) replica solo las vistas de especialista (ver `Mobile/lushbeauty/DESIGN.md`). Se asume el costo de mantener dos clientes; el contenido y los tokens deben coincidir con este documento.
