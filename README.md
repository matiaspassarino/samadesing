# Sama Desing — Portfolio

Portfolio personal de **Matías Passarino** (Sama Desing) — diseño, desarrollo web y branding.
Córdoba, Argentina.

Sitio en producción: [samadesing.ar](https://samadesing.ar)

## Stack

- React 18 + Vite 5
- CSS vanilla con variables (paleta lime / cream / black / orange / navy)
- Estética CRT retro-futurista: scanlines, vignette, film grain, flicker
- Tipografías: IBM Plex Sans + Space Grotesk + Space Mono
- Iconos: Font Awesome (via CDN en `index.html`)
- Deploy: Netlify (push a `main` dispara build automático)

## Estructura

```
src/
├── App.jsx               # Composición de secciones
├── main.jsx              # Entry point
├── styles.css            # Estilos globales y por sección
└── components/
    ├── Nav.jsx           # Nav fijo con enlaces a secciones
    ├── Hero.jsx          # Título, subtítulo, CTAs
    ├── Portfolio.jsx     # Grid de proyectos (Shopify / WordPress)
    ├── Branding.jsx      # Carrusel de piezas de identidad visual
    ├── Services.jsx      # Grid de servicios
    ├── Contact.jsx       # CTA de contacto
    └── Footer.jsx
public/assets/
├── logo-verde.png
├── logo-texto.png
├── screenshots/          # Capturas de proyectos del portfolio
└── branding/             # Imágenes del carrusel de branding
pages/
└── propuesta-el-rey-mayorista.html   # Landing de propuesta comercial
```

## Secciones

1. **Hero** — "Diseño, web & branding" + bio + CTAs.
2. **Portfolio** — proyectos recientes (Poligiros, Ama Hogar, Martin Morris, Wuala, Grow2On).
3. **Branding** — carrusel con piezas de identidad visual y diseño gráfico.
4. **Servicios** — implementación e-commerce, desarrollo web, diseño gráfico, capacitación.
5. **Contacto** — botones a WhatsApp / email.

## Desarrollo

```bash
npm install
npm run dev       # localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/
```

## Deploy

Push a `main` en GitHub → Netlify ejecuta `npm run build` y publica `dist/` en `samadesing.ar`. Configuración en [netlify.toml](netlify.toml).

## Paleta

| Token     | Hex       | Uso                            |
|-----------|-----------|--------------------------------|
| `--black` | `#1d1d1b` | Fondo principal                |
| `--cream` | `#f5e6cc` | Texto claro / fondo servicios  |
| `--lime`  | `#c1cb33` | Acento primario, CTAs, glow    |
| `--orange`| `#e8601c` | Acento secundario (servicios)  |
| `--navy`  | `#283044` | Fondo sección contacto         |
| `--slate` | `#607189` | Texto secundario               |
