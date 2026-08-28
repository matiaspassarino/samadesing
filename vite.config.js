import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/pages/industrias-sur') {
            req.url = '/pages/industrias-sur/';
          }
          if (req.url === '/pages/estudio-juridico') {
            req.url = '/pages/estudio-juridico/';
          }
          next();
        });
      }
    }
  ],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        estudioJuridico: './pages/estudio-juridico/index.html',
        industriasSur: './pages/industrias-sur/index.html'
      }
    }
  }
})
