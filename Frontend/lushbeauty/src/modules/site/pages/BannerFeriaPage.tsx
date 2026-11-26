import { Link } from 'react-router-dom'
import { ROUTES } from '../../../shared/layout'
import { ART } from '../../../shared/ui'

/**
 * Propuesta de banner para la feria (impreso). Medidas ilustrativas, según el stand.
 * La ilustración manda; marca, mensaje, datos y QR quedan chicos y en los márgenes.
 * Los datos del stand y el QR siguen pendientes: se muestran como marcadores, no se inventan.
 */
export function BannerFeriaPage() {
  return (
    <main className="lx banner">
      <div className="banner__piece">
        <p className="eyebrow">Roll-up · 85 × 200 cm · vertical</p>
        <div className="bn banner__rollup">
          <div className="banner__mark">
            <p className="banner__brand">LUSH BEAUTY</p>
            <p className="banner__descriptor">Salón de belleza</p>
          </div>
          <img className="banner__art banner__art--rollup" src={ART.cover} alt="" aria-hidden="true" />
          <div className="banner__message">
            <p className="banner__kicker">Caja y nómina para salones</p>
            <h1 className="banner__title">
              El arte del detalle,
              <br />
              <span className="banner__dim">con las cuentas claras.</span>
            </h1>
          </div>
          <div className="banner__foot">
            <div>
              <p className="banner__line">Visite nuestro stand</p>
              <p className="banner__small">[Número de stand] · [Nombre de la feria]</p>
              <p className="banner__small">[Sitio web] · [Contacto]</p>
            </div>
            <div className="qr" role="img" aria-label="Código QR pendiente">
              QR
              <br />
              pendiente
            </div>
          </div>
        </div>
      </div>

      <div className="banner__piece">
        <p className="eyebrow">Banner horizontal · 300 × 100 cm · fondo de stand</p>
        <div className="bn banner__wide">
          <div className="banner__message">
            <p className="banner__kicker">Lush Beauty Smart</p>
            <h2 className="banner__title banner__title--wide">
              Belleza en la silla.
              <br />
              <span className="banner__dim">Exactitud en la caja.</span>
            </h2>
            <p className="banner__small">Registro, caja y nómina semanal · [Sitio web] · [Contacto]</p>
          </div>
          <img className="banner__art banner__art--wide" src={ART.cover} alt="" aria-hidden="true" />
          <div className="banner__mark banner__mark--bottom">
            <p className="banner__brand">LUSH BEAUTY</p>
            <p className="banner__descriptor">Salón de belleza</p>
          </div>
          <div className="qr qr--corner" role="img" aria-label="Código QR pendiente">
            QR
            <br />
            pendiente
          </div>
        </div>

        <div className="stack" style={{ marginTop: 40, maxWidth: 1200 }}>
          <p className="eyebrow">Notas de la propuesta</p>
          <p className="t-body">
            La ilustración es la protagonista: el perfil con los utensilios del salón. Marca, mensaje, datos y QR van
            chicos y en los márgenes, para que se lea a 3 metros sin competir con la imagen.
          </p>
          <p className="t-body">Pendiente de definir: nombre y número de stand, contacto y QR hacia la landing.</p>
          <p className="t-body">
            Para imprenta: exportar a las medidas indicadas con sangrado de 3 cm y las láminas en vector (componentes
            editables en Figma, página «Banner feria»). Medidas ilustrativas, según el stand.
          </p>
          <Link className="lb-btn lb-btn--link" style={{ alignSelf: 'flex-start' }} to={ROUTES.landing}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
