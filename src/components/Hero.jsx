export default function Hero() {
  return (
    <section className="hero" id="inicio">
      <img className="hero-logo" src="/assets/logo-verde.png" alt="Sama Desing" />

      <div className="status-tag">
        <span className="dot" /> Disponible para proyectos · 2026
      </div>

      <h1>
        Implementador<br />
        e-commerce &amp;<br />
        <em>desarrollador web</em>
      </h1>

      <p className="hero-sub">
        Más de 5 años implementando tiendas en Shopify, WooCommerce, Prestashop y Tiendanube — desde el prototipo hasta el go-live. Background en diseño gráfico que me permite entender el proyecto completo, no solo el código.
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
