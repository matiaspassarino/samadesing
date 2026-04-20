export default function Nav() {
  return (
    <nav className="nav">
      <a className="nav-logo" href="#inicio">
        <img src="/assets/logo-verde.png" alt="Sama Desing" />
      </a>
      <ul className="nav-links">
        <li><a href="#portfolio">Portfolio</a></li>
        <li><a href="#servicios">Servicios</a></li>
        <li><a href="#contacto">Contacto</a></li>
      </ul>
      <a className="nav-cta" href="#contacto">
        <i className="fas fa-envelope" /> Escribime
      </a>
    </nav>
  )
}
