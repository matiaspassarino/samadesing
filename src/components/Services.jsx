const services = [
  {
    icon: 'fa-store',
    name: 'Implementación e-commerce',
    desc: 'Tiendas en Shopify, WooCommerce, Prestashop y Tiendanube. Desde el prototipo hasta el go-live.'
  },
  {
    icon: 'fa-laptop-code',
    name: 'Desarrollo web',
    desc: 'HTML5, CSS3, JavaScript. Maquetado responsive, personalización de temas y sitios institucionales.'
  },
  {
    icon: 'fa-pencil-ruler',
    name: 'Diseño gráfico',
    desc: 'Identidad visual, piezas para redes sociales y comunicación institucional. Adobe Suite + Figma.'
  },
  {
    icon: 'fa-graduation-cap',
    name: 'Capacitación',
    desc: 'Onboarding y formación de clientes en el uso autónomo de su plataforma. Documentación técnica.'
  }
]

export default function Services() {
  return (
    <section className="section-services" id="servicios">
      <div className="section-label">// Qué hago</div>
      <div className="section-title">
        Servicios <span>disponibles</span>
      </div>

      <div className="services-grid">
        {services.map((s) => (
          <div key={s.name} className="service-item">
            <div className="service-icon">
              <i className={`fas ${s.icon}`} />
            </div>
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
