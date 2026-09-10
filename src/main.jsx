import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

/* Em produção o #root já chega com o HTML pré-renderizado
   (scripts/prerender.mjs): o React só adota esse DOM. No dev ele vem
   vazio e o React renderiza do zero. */
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
