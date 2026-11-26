import { Link } from 'react-router-dom'
import { ROUTES, useDocumentTitle } from '../../../shared/layout'
import { useReveal } from '../../../shared/motion'
import { ART, Backdrop, Profile, ServiceRow, Stat, Wordmark } from '../../../shared/ui'
import { DecisionDemo } from '../components/DecisionDemo'
import { CHAPTERS, FAQ, SERVICES, STEPS } from '../fixtures'

const SERVICE_NAMES = ['Manicura', 'Pedicura', 'Depilación', 'Cejas', 'Pestañas', 'Lush Little Princess']

/** Inicio público: presenta el sistema. Cifras de la «planilla de ejemplo»: ilustrativas. */
export function LandingPage() {
  useDocumentTitle('Lush Beauty Smart · Caja y nómina para salones')
  const page = useReveal<HTMLDivElement>()
  return (
    <div className="lx web site" ref={page} style={{ position: 'relative' }}>
        <header className="lb-nav noir" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, background: 'transparent', borderBottomColor: 'rgba(255,255,255,.16)' }}>
          <nav className="lb-nav__links" aria-label="Principal">
            <a className="lb-nav__link" href="#sistema">Sistema</a>
            <a className="lb-nav__link" href="#como">Cómo funciona</a>
            <a className="lb-nav__link" href="#decisiones">Decisiones</a>
            <a className="lb-nav__link" href="#preguntas">Preguntas</a>
          </nav>
          <Link className="lb-nav__brand" to={ROUTES.landing} aria-label="Lush Beauty, inicio"><Wordmark size={20} /></Link>
          <div className="lb-nav__actions"><Link className="lb-nav__link" to={ROUTES.login}>Ingresar</Link></div>
        </header>
      <main>
      <section className="noir hero-full">
        <Profile src={ART.cover} className="hero-art" opacity={0.9} />
        <div className="wrap above" style={{ paddingBottom: 'var(--space-8)' }}>
          <p className="eyebrow rise d1">Lush Beauty Smart · Caja y nómina</p>
          <h1 style={{ margin: 'var(--space-5) 0 0' }}>
            <span className="display-2xl rise d2" style={{ display: 'block', maxWidth: '11ch' }}>El arte del detalle,</span>
            <span className="display-2xl rise d3" style={{ display: 'block', color: 'var(--ink-muted)', maxWidth: '14ch' }}>con las cuentas claras.</span>
          </h1>
          <div className="row rise d5" style={{ marginTop: 'var(--space-7)' }}>
            <Link className="lb-btn lb-btn--primary" to={ROUTES.login}>Ingresar</Link>
            <a className="lb-btn lb-btn--secondary" href="#como">Ver cómo funciona</a>
          </div>
        </div>
        <div className="wrap above fade" style={{ animationDelay: '1.2s', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-4)', borderTop: '1px solid var(--hairline)', paddingBlock: 'var(--space-4)' }}>
          <span className="t-caption">Santa Cruz de la Sierra, Bolivia</span>
          <span className="t-caption">Belleza en la silla. Exactitud en la caja.</span>
          <span className="t-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}><span className="live" aria-hidden="true" />Desplácese</span>
        </div>
      </section>

      <section className="marquee" aria-hidden="true">
        <div className="marquee__track" aria-hidden="true">
          {[0, 1].flatMap((copy) =>
            SERVICE_NAMES.flatMap((name) => [<span key={`${copy}-${name}`}>{name}</span>, <i key={`${copy}-${name}-dot`}>·</i>]),
          )}
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: 'clamp(96px, 14vw, 200px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-7)' }}>
        <div className="reveal"><Wordmark variant="mark" size={64} /></div>
        <h2 className="display-xl reveal" style={{ maxWidth: '16ch' }}>Belleza en la silla. Exactitud en la caja.</h2>
        <p className="body-lg muted measure reveal">
          Una casa de belleza se mide por el detalle. Lush Beauty Smart lleva esa disciplina a cada cifra: cada
          servicio, cada comisión y cada cierre, explicados.
        </p>
        <div className="reveal-line" style={{ width: 96, height: 1, background: 'var(--ink)' }} />
      </section>

      <section className="noir rel" style={{ paddingBlock: 'var(--space-9)' }}>
        <Backdrop opacity={0.28} />
        <div className="wrap above stack--lg stack">
          <div className="stack">
            <p className="eyebrow reveal">El punto de partida</p>
            <h2 className="display-lg measure reveal">La planilla de agosto, en cifras</h2>
          </div>
          <div className="grid grid--3 reveal">
            <Stat label="Monto bruto" value="Bs 11.462" delta="91 servicios en tres hojas" note="Ilustrativo · planilla de ejemplo" />
            <Stat label="Descuentos" value="Bs 1.424" delta="12,4 % del monto bruto" note="Ilustrativo · planilla de ejemplo" />
            <Stat label="Diferencia por la base de comisión" value="Bs 498,40" delta="Sobre lista frente a sobre lo cobrado" tone="down" note="Ilustrativo · planilla de ejemplo" />
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: 'var(--space-9)' }}>
        <div className="grid grid--3" style={{ gap: 'var(--space-8)' }}>
          {[
            { n: '01', k: 'Exactitud', t: 'Cada cifra, calculada', d: 'El catálogo fija el nombre y el precio de cada servicio. Las comisiones se calculan con decimales exactos, sin sumas escritas a mano.' },
            { n: '02', k: 'Eficiencia', t: 'Una semana, un borrador', d: 'La liquidación deja de revisarse hoja por hoja. Se verifica un borrador, se aprueba y cada especialista recibe su comprobante.' },
            { n: '03', k: 'Trazabilidad', t: 'Todo deja huella', d: 'Cada venta conserva su precio de lista, su descuento y la regla aplicada. Cada cambio guarda quién lo hizo y el valor anterior.' },
          ].map((item) => (
            <div className="stack reveal" key={item.n}>
              <span className="numeral" aria-hidden="true">{item.n}</span>
              <div className="rule" />
              <p className="eyebrow">{item.k}</p>
              <h2 className="t-headline">{item.t}</h2>
              <p className="t-body muted">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sistema" className="wrap" style={{ paddingBottom: 'var(--space-10)' }}>
        <div className="stack--lg stack">
          <div className="stack">
            <p className="eyebrow reveal">El sistema</p>
            <h2 className="display-xl reveal measure">Siete módulos, una sola caja</h2>
          </div>
          <div style={{ borderTop: '1px solid var(--ink)' }}>
            {CHAPTERS.map((chapter, index) => (
              <div className="chapter reveal" key={chapter.title}>
                <span className="chapter__num">{String(index + 1).padStart(2, '0')}</span>
                <span className="chapter__title">{chapter.title}</span>
                <span className="chapter__desc">{chapter.description}</span>
                <span className="chapter__tag">{chapter.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band-raised" style={{ paddingBlock: 'var(--space-9)' }}>
        <div className="wrap cols cols--12" style={{ alignItems: 'stretch' }}>
          <div className="stack">
            <div className="plate plate--light" style={{ minHeight: 560, flex: 1 }}>
              <img src={ART.tools} alt="" aria-hidden="true" style={{ objectFit: 'contain', padding: 'var(--space-6)', filter: 'invert(1)', animation: 'none' }} />
            </div>
          </div>
          <div className="stack--lg stack" style={{ justifyContent: 'center' }}>
            <div className="stack">
              <p className="eyebrow reveal">Catálogo</p>
              <h2 className="display-lg reveal">Cada servicio, con su nombre y su precio</h2>
              <p className="t-body muted measure reveal">
                Se acabó escribir «PEDI» y « PEDI». El sistema usa el nombre del catálogo y descompone los combos en sus
                servicios.
              </p>
            </div>
            <div className="reveal">
              <div style={{ borderTop: '1px solid var(--ink)' }}>
                {SERVICES.map((service, index) => (
                  <ServiceRow key={service.title} index={String(index + 1).padStart(2, '0')} {...service} />
                ))}
              </div>
              <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>Precios y duraciones ilustrativos.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="como" className="wrap" style={{ paddingBlock: 'var(--space-10)' }}>
        <div className="stack--lg stack">
          <div className="stack">
            <p className="eyebrow reveal">Cómo funciona</p>
            <h2 className="display-xl reveal measure">De la silla a la nómina, en tres pasos</h2>
          </div>
          <div className="grid grid--3" style={{ gap: 'var(--space-8)' }}>
            {STEPS.map((step, index) => (
              <div className="stack" key={step.title}>
                <span className="numeral reveal" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div className="rule reveal-line" />
                <h3 className="t-headline reveal">{step.title}</h3>
                <p className="t-body muted reveal">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 'var(--space-10)' }}>
        <div className="cols" style={{ alignItems: 'center' }}>
          <div className="stack">
            <p className="eyebrow reveal">En el teléfono</p>
            <h2 className="display-lg reveal">Funciona sin conexión</h2>
            <p className="t-body muted measure reveal">
              El registro queda guardado en el teléfono con una clave única. Al volver la conexión se envía una sola
              vez, sin duplicar ventas.
            </p>
          </div>
          <div className="panel reveal" style={{ padding: 'var(--space-7)' }}>
            <p className="eyebrow">Estado de cada registro</p>
            <div className="line" style={{ paddingTop: 0 }}><span className="line__label">Guardado en el teléfono</span><span className="tag"><span className="live" aria-hidden="true" style={{ marginRight: 'var(--space-2)' }} />Pendiente</span></div>
            <div className="line" style={{ paddingTop: 0 }}><span className="line__label">Enviado al servidor</span><span className="tag">Enviada</span></div>
            <div className="line" style={{ paddingTop: 0 }}><span className="line__label">Recibido y guardado</span><span className="tag tag--ok">Confirmada</span></div>
            <div className="line" style={{ paddingTop: 0, borderBottom: 0 }}><span className="line__label">Necesita un dato más</span><span className="tag tag--rouge">Requiere revisión</span></div>
          </div>
        </div>
      </section>

      <section id="decisiones" className="noir rel" style={{ paddingBlock: 'var(--space-10)' }}>
        <div className="wrap cols" style={{ alignItems: 'center' }}>
          <div className="stack above">
            <p className="eyebrow reveal">Decision Studio</p>
            <h2 className="display-lg reveal">La inteligencia artificial sugiere. La administradora decide.</h2>
            <p className="t-body muted measure reveal">
              Compare descuentos, precios y comisiones con escenarios hipotéticos. Cada recomendación explica sus
              supuestos y nada cambia sin su aprobación.
            </p>
          </div>
          <div className="panel above reveal" style={{ padding: 'var(--space-7)' }}>
            <p className="eyebrow">Lush Insight sugiere</p>
            <h3 className="t-headline">Mantener el precio de Bs 120</h3>
            <div>
              <div className="line" style={{ paddingTop: 0 }}><span className="t-body">100 servicios por semana</span><span className="tag">Supuesto</span></div>
              <div className="line" style={{ paddingTop: 0 }}><span className="t-body">Comisión de 35&thinsp;% sobre lista</span><span className="tag tag--ok">Dato</span></div>
            </div>
            <DecisionDemo />
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: 'var(--space-10)' }}>
        <div className="grid grid--3" style={{ gap: 'var(--space-8)' }}>
          {[
            { k: 'Roles', t: 'Cada quien ve lo suyo', d: 'La administradora configura y aprueba. La especialista registra y consulta solo su liquidación. El contador, si se habilita, lee reportes.' },
            { k: 'Historial', t: 'Nada se borra sin rastro', d: 'Las anulaciones generan ajustes. Los cambios de precio o de comisión no recalculan ventas pasadas.' },
            { k: 'Privacidad', t: 'Los datos de su salón, separados', d: 'Cada salón trabaja en su propio espacio. Los avisos nunca reemplazan el registro contable.' },
          ].map((item) => (
            <div className="stack reveal" style={{ borderTop: '1px solid var(--ink)', paddingTop: 'var(--space-5)' }} key={item.k}>
              <p className="eyebrow">{item.k}</p>
              <h2 className="t-headline">{item.t}</h2>
              <p className="t-body muted">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="preguntas" className="wrap" style={{ paddingBottom: 'var(--space-10)' }}>
        <div className="cols cols--12">
          <div className="stack"><p className="eyebrow">Preguntas</p><h2 className="display-lg">Antes de ingresar</h2></div>
          <div className="faq">
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p className="t-body muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      </main>

      <section className="noir rel" style={{ overflow: 'hidden' }}>
        <Backdrop opacity={0.35} />
        <div className="mark-bg" aria-hidden="true" style={{ right: '-4%', top: '-6%', color: '#1c1c1c' }}><Wordmark variant="mark" size={620} /></div>
        <div className="wrap above stack--lg stack" style={{ paddingBlock: 'var(--space-10)', alignItems: 'flex-start' }}>
          <h2 className="display-xl reveal" style={{ maxWidth: '14ch' }}>Cierre la semana con las cuentas claras.</h2>
          <Link className="lb-btn lb-btn--primary reveal" to={ROUTES.login}>Ingresar</Link>
        </div>
        <footer className="wrap above" style={{ paddingBlock: 'var(--space-7)', borderTop: '1px solid var(--hairline)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-5)', alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            <Wordmark size={16} />
            <p className="t-caption">Lush Beauty Smart · Santa Cruz de la Sierra, Bolivia</p>
          </div>
          <p className="t-caption" style={{ maxWidth: '48ch' }}>
            Prototipo con datos ilustrativos: el registro sin conexión, los comprobantes y los avisos se muestran como maqueta hasta conectar el servidor.
            <br />
            Proyecto académico · Universidad Autónoma Gabriel René Moreno · Economía para la gestión · Semestre 2 – 2026
          </p>
        </footer>
      </section>
    </div>
  )
}
