export default function Hero() {
  return (
    <section className="hero" id="inicio">
      <img className="hero-logo" src="/assets/logo-verde.png" alt="Sama Desing" />

      <div className="status-tag">
        <span className="dot" /> Disponible para proyectos · 2026
      </div>

      <h1>
        Diseño, web<br />
        &amp; <em>branding</em>
      </h1>

      <p className="hero-sub">
        Profesional digital con más de 10 años de experiencia en diseño, desarrollo web, comunicación y branding. Especialista en implementar tiendas Ecommerce en distintas plataformas y personalización.
      </p>

      <div className="hero-mono">&lt; Córdoba, Argentina · Matías Passarino /&gt;</div>

      <div className="hero-actions">
        <a className="btn-primary" href="#portfolio">
          <i className="fas fa-grip" /> Ver proyectos
        </a>
        <a className="btn-ghost" href="#contacto">Contactame →</a>
      </div>

      <div className="scroll-hint">
        <div className="scroll-line" />
        Scroll
      </div>
    </section>
  )
}
