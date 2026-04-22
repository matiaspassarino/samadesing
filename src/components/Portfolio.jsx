const projects = [
  {
    url: 'https://poligiros.com/',
    image: '/assets/screenshots/poligiros-desktop.png',
    alt: 'Poligiros',
    category: 'WordPress · Diseño + Implementación',
    title: 'Poligiros',
    description: 'Academia de coaching de carrera. Diseño visual completo e implementación en WordPress.',
    tags: ['WordPress', 'Coaching', 'Academia']
  },
  {
    url: 'https://www.amahogar.com.ar',
    image: '/assets/screenshots/ama-desktop.png',
    alt: 'Ama Hogar',
    category: 'Shopify · Maquetación e Implementación',
    title: 'Ama Hogar',
    description: 'Tienda e-commerce de electrodomésticos con catálogo amplio, cuotas y múltiples categorías.',
    tags: ['Shopify', 'E-commerce', 'Retail']
  },
  {
    url: 'https://martinmorris.ar/',
    image: '/assets/screenshots/morris-desktop.png',
    alt: 'Martin Morris',
    category: 'Shopify · Maquetación e Implementación',
    title: 'Martin Morris S.A.',
    description: 'Repuestos agrícolas y herramientas. Catálogo técnico con agricultura de precisión y marcas premium.',
    tags: ['Shopify', 'Agro', 'B2B']
  },
  {
    url: 'https://wuala.net/',
    image: '/assets/screenshots/wuala-desktop.png',
    alt: 'Wuala',
    category: 'Shopify · Maquetación e Implementación',
    title: 'Wuala',
    description: 'Agencia de eCommerce. Sitio institucional con Shopify Plus Partner y Tiendanube Partner.',
    tags: ['Shopify', 'Institucional', 'Agencia']
  },
  {
    url: 'https://grow2on.com/',
    image: '/assets/screenshots/grow-desktop.png',
    alt: 'Grow2On',
    category: 'WordPress · Maquetación e Implementación',
    title: 'Grow2On',
    description: 'Conector multicanal ERP-ecommerce. Ahorrá 80% en tiempo de gestión de tu negocio online.',
    tags: ['WordPress', 'SaaS', 'Integraciones']
  },
  {
    url: 'https://emeingenieriasrl.com.ar/',
    image: '/assets/screenshots/eme-desktop.png',
    alt: 'EME Ingeniería',
    category: 'WordPress · Diseño + Implementación',
    title: 'EME Ingeniería',
    description: 'Sitio institucional para estudio de ingeniería. Diseño visual completo e implementación en WordPress.',
    tags: ['WordPress', 'Institucional', 'Ingeniería']
  }
]

export default function Portfolio() {
  return (
    <section className="section-portfolio" id="portfolio">
      <div className="section-label">// Portfolio seleccionado</div>
      <div className="section-title">
        Proyectos <span>recientes</span>
      </div>

      <div className="portfolio-grid">
        {projects.map((p) => (
          <a
            key={p.url}
            className="portfolio-card"
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="card-thumb">
              <img src={p.image} alt={p.alt} />
            </div>
            <div className="card-body-inner">
              <div className="card-cat">{p.category}</div>
              <div className="card-title-inner">{p.title}</div>
              <div className="card-desc-inner">{p.description}</div>
              <div className="card-tags">
                {p.tags.map((t) => (
                  <span key={t} className="tag-pill">{t}</span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
