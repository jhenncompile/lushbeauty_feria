# DESIGN · Lush Beauty Smart (Mobile · Flutter)

Este cliente replica **solo las vistas de especialista y administradora en teléfono** de la PWA. La fuente de verdad del diseño (principios, tokens, componentes, microcopy, flujos y accesibilidad) es `Frontend/lushbeauty/DESIGN.md`; si algo difiere, manda ese documento.

## Estado de la decisión

El README del repo define una sola PWA y excluye una app nativa. El equipo decidió mantener **ambas**. Consecuencias: dos clientes que deben mostrar el mismo contenido y los mismos importes; cualquier cambio de copy, token o regla de UI se aplica en los dos. Si el costo resulta alto, este cliente es el primero en recortarse.

## Pantallas incluidas (datos sintéticos, sin backend)

| Feature | Pantalla | Módulo | Ruta |
|---|---|---|---|
| F00 | Ingreso con PIN de 6 dígitos | `identity` | `/ingresar` |
| F01 | Hoy | `sales` | `/hoy` |
| F01 | Registrar servicio | `sales` | `/registrar` |
| F01 | Descuento con motivo | `sales` | `/registrar/descuento` |
| F01 | Servicio guardado | `sales` | `/registrar/guardado` |
| F03 | Mi liquidación | `payroll` | `/mi-liquidacion` |
| F04 | Cierre de caja | `cashier` | `/caja` |
| F05 | Sin conexión · cola de envío | `offline` | `/sincronizacion` |

No incluidas (se usan desde la PWA): nómina de administradora, ventas web, catálogo, panel, importar, Guard, Insight, Decision Studio, ajustes, auditoría.

## Estructura

```
lib/
  app/            router y raíz de la app
  shared/
    theme/        tokens (colores Blanc/Noir, espacios), ThemeData cuadrado, Jost
    ui/           LushButton, LushField, LushChoice, LushStat, LushTag, LushLine, StatusBar, BottomTabs
    money.dart    importes en centavos (int), formato «Bs 1.236» / «Bs 112,00»
  modules/<modulo>/
    domain/       reglas puras (p. ej. porcentaje de descuento), sin Flutter
    pages/        pantallas
    fixtures.dart datos sintéticos propios del módulo
    <modulo>.dart API pública del módulo (único archivo que importan otros módulos)
    README.md
```
Misma regla de fronteras que el resto del repo: un módulo no importa archivos internos de otro.

## Equivalencias de diseño en Flutter

| Diseño | Flutter |
|---|---|
| Radio 0 | `RoundedRectangleBorder(borderRadius: BorderRadius.zero)` en botones, campos, tarjetas |
| Hairline / borde fuerte | `BorderSide(width: 1, color: hairline / borderStrong)` |
| Campo con subrayado | `InputDecoration` con `UnderlineInputBorder`, etiqueta eyebrow encima |
| Botón primario | `FilledButton` negro, 48px de alto mínimo, texto 11px MAYÚS, `letterSpacing` ≈ 0.22em (2.4px) |
| `Choice` con `aria-pressed` | `Semantics(button: true, selected: …)` + relleno negro al seleccionar |
| Cifras | `FontFeature.tabularFigures()` y `lining` en Jost 300 |
| Sin sombras | `elevation: 0`, `surfaceTintColor: transparent`; solo `shadow-veil` en hojas modales |
| Foco | `FocusableActionDetector` / `Focus` con contorno de 2px, offset 2px |
| `prefers-reduced-motion` | `MediaQuery.disableAnimationsOf(context)` desactiva `rise`/`grow` |
| Objetivo táctil 48px | `constraints: BoxConstraints(minHeight: 48)` |

Fuente: Jost 300/400/500 con el paquete `google_fonts` (descarga en runtime). Para uso offline real se empaquetan los `.ttf` en `assets/fonts/` antes de la feria.

## Reglas específicas del móvil

- Las 2 pestañas inferiores (Registrar · Mi liquidación) son la navegación de la especialista; la administradora ve 4.
- El estado de conexión es una barra bajo la cabecera, igual que en la PWA, y se alimenta de un único servicio de conectividad simulado en esta fase.
- Dinero siempre en centavos `int`; nunca `double`.
- Sin datos reales de nómina ni de clientas en tests ni fixtures.

## Pruebas

- `flutter analyze` sin avisos.
- Un widget test por pantalla: renderiza, muestra los textos clave del diseño y los estados importantes (Guardar deshabilitado sin método de pago, descuento >límite pide aprobación, cola con estado «Requiere revisión»).
- Prueba unitaria de `money.dart` (formato y lectura de `8`, `8,5`, `8,50`).
