# site

**Responsabilidad:** presencia pública del proyecto: inicio (landing) y propuesta de banner para la feria. No es un módulo de dominio: no tiene reglas de negocio, datos de salón ni backend.

**Contrato público (`index.ts`):** `LandingPage`, `BannerFeriaPage`.

**Dependencias:** `shared/layout`, `shared/motion` y `shared/ui`. No importa otros módulos.

**Invariantes de contenido:** las cifras de la planilla de ejemplo se rotulan «Ilustrativo»; los datos del stand y el QR del banner son marcadores `[…]` hasta que el equipo los defina; no se inventa contacto ni fecha. El banner es una propuesta de impresión, no una pantalla de la aplicación.

**Portada animada:** `HeroScene` dibuja el perfil de marca con el scroll (`useScrollProgress` de `shared/motion` escribe `--p` 0–1; el CSS en `app.css` lo traduce a trazo, utensilios y relleno del título). `heroArt.ts` guarda el perfil vectorizado a partir del logotipo (relleno fiel + líneas centrales). En pantallas anchas la escena queda fija durante ~130vh; con «reducir movimiento» se ve completa y sin pin. `public/art/cover.svg` y `profile.svg` son la versión estática del mismo dibujo (ingreso y banner).

**Eventos:** no emite ni consume.
