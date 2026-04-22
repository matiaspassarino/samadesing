import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Portfolio from './components/Portfolio.jsx'
import Branding from './components/Branding.jsx'
import Services from './components/Services.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Portfolio />
        <Branding />
        <Services />
        <Contact />
      </main>
      <Footer />
      <div className="film-grain" aria-hidden="true" />
    </>
  )
}
