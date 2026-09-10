import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { buildStructuredData } from './seo/structured-data.js'
import { TESTIMONIALS_ARE_PROVISIONAL } from './data/testimonials.js'

/**
 * Entrada de pré-renderização (roda em Node, só no build — ver
 * scripts/prerender.mjs). Devolve o HTML do app, o JSON-LD gerado dos dados
 * das seções e avisos para o terminal.
 *
 * Os efeitos (useGSAP, useEffect) não rodam aqui: o HTML sai no estado
 * inicial do React, sem nenhum estilo inline de animação.
 */
export function render() {
  const html = renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  )

  const warnings = []
  if (TESTIMONIALS_ARE_PROVISIONAL) {
    warnings.push(
      'Depoimentos PROVISÓRIOS (fictícios) no site — troque por falas reais e aprovadas antes de publicar (src/data/testimonials.js).'
    )
  }

  return { html, structuredData: buildStructuredData(), warnings }
}
