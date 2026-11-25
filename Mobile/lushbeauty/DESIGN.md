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

Estado: **implementadas** con datos sintéticos y sin backend. La administradora ve 2 pestañas en el teléfono (Hoy, Caja); Nómina y Decisiones se usan desde la PWA. La especialista ve Registrar y Mi liquidación.

No incluidas (se usan desde la PWA): nómina de administradora, ventas web, catálogo, panel, importar, Guard, Insight, Decision Studio, ajustes, auditoría.

## Estructura

```
lib/
  app/            LushApp: compone controladores y rutas (sin paquetes externos)
  shared/
    theme/        tokens.dart (colores Blanc, espacios, estilos Jost), theme.dart (ThemeData cuadrado)
    ui/           LushButton, LushField, LushChoice, lush_parts (LushTag, LushLine, LushStat, LushPanel), LushScreen (barra, estado, pie, pestañas)
    state/        ControllerScope: expone un ChangeNotifier a los descendientes
    money.dart    importes en centavos (int), formato «Bs 1.236» / «Bs 112,00»
    connection.dart, routes.dart
  modules/<modulo>/
    domain/       reglas puras (descuento, conciliación), sin Flutter
    pages/        pantallas
    <modulo>.dart API pública del módulo (único archivo que importan otros módulos)
    README.md
```

## Cómo ejecutar

- `flutter test` y `flutter analyze` (sin dispositivo).
- `flutter run -d chrome` para ver la app; en debug aparece un botón «Simular sin conexión» para probar la cola.
- `--dart-define=LUSH_DEMO_ROLE=administradora|especialista` salta el ingreso con un usuario sintético (demos y capturas).
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

Fuente: Jost **empaquetada** como fuente variable en `assets/fonts/Jost-Variable.ttf` (licencia OFL en `assets/fonts/LICENSE-Jost.txt`); los pesos 300/400/500 se piden con `FontVariation.weight`. No depende de red.

## Reglas específicas del móvil

- Las 2 pestañas inferiores (Registrar · Mi liquidación) son la navegación de la especialista; la administradora ve 4.
- El estado de conexión es una barra bajo la cabecera, igual que en la PWA, y se alimenta de un único servicio de conectividad simulado en esta fase.
- Dinero siempre en centavos `int`; nunca `double`.
- Sin datos reales de nómina ni de clientas en tests ni fixtures.

## Pruebas

- `flutter analyze` sin avisos.
- Un widget test por pantalla: renderiza, muestra los textos clave del diseño y los estados importantes (Guardar deshabilitado sin método de pago, descuento >límite pide aprobación, cola con estado «Requiere revisión»).
- Prueba unitaria de `money.dart` (formato y lectura de `8`, `8,5`, `8,50`).
