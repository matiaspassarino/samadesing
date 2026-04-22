export default function Contact() {
  return (
    <section className="section-contact" id="contacto">
      <div className="section-label">// ¿Tenés un proyecto?</div>
      <div className="section-title">
        Trabajemos <span className="accent-lime">juntos</span>
      </div>
      <p className="contact-lead">
        Si querés ver mi portfolio completo o charlar sobre un proyecto, escribime. Respondo rápido.
      </p>
      <div className="contact-btns">
        <a className="btn-contact" href="mailto:matiaspass@gmail.com">
          <i className="fas fa-envelope" /> matiaspass@gmail.com
        </a>
        <a
          className="btn-contact-orange"
          href="https://wa.me/543513856836"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fab fa-whatsapp" /> +54 351 385-6836
        </a>
      </div>
      <img className="contact-avatar" src="/assets/avatar-crema.png" alt="Matías Passarino" />
    </section>
  )
}
