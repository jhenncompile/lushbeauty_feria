# site

**Responsabilidad:** presencia pública del proyecto: inicio (landing) y propuesta de banner para la feria. No es un módulo de dominio: no tiene reglas de negocio, datos de salón ni backend.

**Contrato público (`index.ts`):** `LandingPage`, `BannerFeriaPage`.

**Dependencias:** `shared/layout`, `shared/motion` y `shared/ui`. No importa otros módulos.

**Invariantes de contenido:** las cifras de la planilla de ejemplo se rotulan «Ilustrativo»; los datos del stand y el QR del banner son marcadores `[…]` hasta que el equipo los defina; no se inventa contacto ni fecha. El banner es una propuesta de impresión, no una pantalla de la aplicación.

**Eventos:** no emite ni consume.
