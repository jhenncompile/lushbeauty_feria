import { Link } from 'react-router-dom'
import { ROUTES } from '../../../shared/layout'
import { ART, Wordmark } from '../../../shared/ui'

/**
 * Propuesta de banner para la feria (impreso). Medidas ilustrativas, según el stand.
 * Los datos del stand y el QR siguen pendientes: se muestran como marcadores, no se inventan.
 */
export function BannerFeriaPage() {
  return (
    <div className="lx banner">
      <div className="banner__piece">
        <p className="eyebrow">Roll-up · 85 × 200 cm · vertical</p>
        <div className="bn banner__rollup">
          <img className="fill-img" src={ART.pattern} alt="" aria-hidden="true" style={{ opacity: 0.5 }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '44%', width: 560, height: 560, margin: '-280px 0 0 -280px', zIndex: -1, opacity: 0.75 }}>
            <img src={ART.profile} alt="" style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="above"><Wordmark size={22} tone="inverse" /></div>
          <div className="above banner__block">
            <p className="eyebrow">Caja y nómina para salones</p>
            <h1 className="banner__title" style={{ fontSize: 56 }}>El arte del detalle, con las cuentas claras.</h1>
          </div>
          <div className="above banner__block banner__foot">
            <div>
              <p className="banner__line">Visite nuestro stand</p>
              <p className="banner__line banner__dim">[Número de stand] · [Nombre de la feria]</p>
              <p className="banner__line banner__dim" style={{ marginTop: 12 }}>[Sitio web] · [Contacto]</p>
            </div>
            <div className="qr" role="img" aria-label="Código QR pendiente">QR<br />pendiente</div>
          </div>
        </div>
      </div>

      <div className="banner__piece">
        <p className="eyebrow">Banner horizontal · 300 × 100 cm · fondo de stand</p>
        <div className="bn banner__wide">
          <img className="fill-img" src={ART.pattern} alt="" aria-hidden="true" style={{ opacity: 0.55 }} />
          <div className="above" style={{ background: '#0a0a0a', padding: '28px 0' }}>
            <p className="eyebrow">Lush Beauty Smart</p>
            <h2 className="banner__title" style={{ fontSize: 76, lineHeight: 0.98, letterSpacing: '-.025em', marginTop: 14 }}>
              Belleza en la silla.<br /><span className="banner__dim">Exactitud en la caja.</span>
            </h2>
          </div>
          <div className="above" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20, textAlign: 'right' }}>
            <Wordmark size={22} tone="inverse" />
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div style={{ background: '#0a0a0a', padding: 8 }}>
                <p className="banner__line">Registro, caja y nómina semanal</p>
                <p className="banner__line banner__dim">[Sitio web] · [Contacto]</p>
              </div>
              <div className="qr" role="img" aria-label="Código QR pendiente">QR<br />pendiente</div>
            </div>
          </div>
        </div>

        <div className="stack" style={{ marginTop: 40, maxWidth: 1200 }}>
          <p className="eyebrow">Notas de la propuesta</p>
          <p className="t-body">Mensaje único: exactitud. Fondo negro y lámina en línea fina para que se lea a 3 metros; el texto va sobre un bloque sólido, no sobre las líneas.</p>
          <p className="t-body">Pendiente de definir: nombre y número de stand, contacto y QR hacia la landing. Si hay fotografía en blanco y negro, reemplaza la lámina.</p>
          <p className="t-body">Para imprenta: exportar a las medidas indicadas con sangrado de 3 cm y las láminas en vector. Medidas ilustrativas, según el stand.</p>
          <Link className="lb-btn lb-btn--link" style={{ alignSelf: 'flex-start' }} to={ROUTES.landing}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
