# site

**Responsabilidad:** presencia pública del proyecto: inicio (landing) y propuesta de banner para la feria. No es un módulo de dominio: no tiene reglas de negocio, datos de salón ni backend.

**Contrato público (`index.ts`):** `LandingPage`, `BannerFeriaPage`.

**Dependencias:** `shared/layout`, `shared/motion` y `shared/ui`. No importa otros módulos.

**Invariantes de contenido:** las cifras de la planilla de ejemplo se rotulan «Ilustrativo»; los datos del stand y el QR del banner son marcadores `[…]` hasta que el equipo los defina; no se inventa contacto ni fecha. El banner es una propuesta de impresión, no una pantalla de la aplicación.

**Portada animada:** `HeroScene` dibuja el perfil de marca con el scroll (`useScrollProgress` de `shared/motion` escribe `--p` 0–1; el CSS en `app.css` lo traduce a trazo, utensilios y relleno del título). `heroArt.ts` guarda el perfil vectorizado a partir del logotipo (relleno fiel + líneas centrales). En pantallas anchas la escena queda fija durante ~130vh; con «reducir movimiento» se ve completa y sin pin. `public/art/cover.svg` y `profile.svg` son la versión estática del mismo dibujo (ingreso y banner).

**Hilo y cierre:** `ScrollThread` traza (≥1200 px de ancho) una pincelada de grosor variable (fina → llena → fina, como la silueta; geometría pura en `brush.ts`) que nace de la punta del cabello de la portada y baja en «S» por los márgenes hasta el monograma del cierre. Su cabeza va a ~62 % de la pantalla con inercia, acaba en punta (sin «pluma») y el color se adapta al fondo con `mix-blend-mode: difference`. `FooterScene` dibuja el contorno de la L y la B (`MarkDraw`, de `shared/ui`) y las rellena de abajo hacia arriba. `useScrollProgress` (`shared/motion`) da la inercia común a portada y cierre. Con «reducir movimiento» el hilo y el monograma se ven completos.

**Rulos y aros:** además de bajar en «S», el hilo hace lazos junto al margen (`loopPoints`) y, al pasar, dibuja un aro a mano alrededor de las palabras marcadas con `data-ring` en los `h2` (`ringPoints`, perfil `RING_BRUSH`). Todo es decorativo (`aria-hidden`, sin foco ni clics); el aro rodea las letras sin tocarlas y el texto accesible de los títulos no cambia. Con «reducir movimiento» los aros y rulos se ven completos.

**Eventos:** no emite ni consume.
