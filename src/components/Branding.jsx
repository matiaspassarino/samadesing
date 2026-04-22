import { useEffect, useRef, useState } from 'react'

const slides = [
  { src: '/assets/branding/branding1.jpg', alt: 'Branding 01' },
  { src: '/assets/branding/branding2.jpg', alt: 'Branding 02' },
  { src: '/assets/branding/branding3.jpg', alt: 'Branding 03' },
  { src: '/assets/branding/branding4.jpg', alt: 'Branding 04' },
  { src: '/assets/branding/branding5.jpg', alt: 'Branding 05' },
  { src: '/assets/branding/branding6.jpg', alt: 'Branding 06' }
]

export default function Branding() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = slides.length
  const timerRef = useRef(null)

  const goTo = (i) => setIndex(((i % total) + total) % total)
  const prev = () => goTo(index - 1)
  const next = () => goTo(index + 1)

  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(() => goTo(index + 1), 4500)
    return () => clearTimeout(timerRef.current)
  }, [index, paused])

  return (
    <section className="section-branding" id="branding">
      <div className="section-label">// Identidad visual</div>
      <div className="section-title">
        Branding <span>&amp; diseño</span>
      </div>

      <div
        className="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="carousel-frame">
          <div className="carousel-corner tl" aria-hidden="true" />
          <div className="carousel-corner tr" aria-hidden="true" />
          <div className="carousel-corner bl" aria-hidden="true" />
          <div className="carousel-corner br" aria-hidden="true" />

          <div
            className="carousel-track"
            style={{ transform: `translateX(calc(-${index} * (100% + 16px) / var(--cols, 3)))` }}
          >
            {slides.map((s, i) => (
              <div
                key={s.src}
                className={`carousel-slide${i === index ? ' is-current' : ''}`}
              >
                <img src={s.src} alt={s.alt} loading="lazy" />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="carousel-btn carousel-btn-prev"
            onClick={prev}
            aria-label="Anterior"
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            type="button"
            className="carousel-btn carousel-btn-next"
            onClick={next}
            aria-label="Siguiente"
          >
            <i className="fas fa-chevron-right" />
          </button>

          <div className="carousel-meta">
            <span className="carousel-counter">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="carousel-dots" role="tablist" aria-label="Navegación de branding">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className={`carousel-dot${i === index ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir a ${s.alt}`}
              aria-selected={i === index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
