/**
 * Google Analytics 4 com Consent Mode v2, no modo básico.
 *
 * O index.html declara o dataLayer, o gtag() e o consentimento padrão — tudo
 * "denied" — antes de qualquer outro script. Este módulo cuida do resto:
 *   - a escolha do visitante, guardada no localStorage por 12 meses;
 *   - o gtag.js, que só é carregado DEPOIS do aceite. Sem aceite, nenhuma
 *     requisição vai para o Google — e o Lighthouse, que abre o site sem
 *     aceite, nunca vê o script: zero custo de LCP e de TBT.
 *
 * Quem aceitou numa visita anterior recebe o script numa folga do navegador,
 * depois do evento load, fora do caminho da primeira pintura.
 *
 * Só analytics_storage é liberado no aceite: o site não tem anúncios, então
 * ad_storage, ad_user_data e ad_personalization ficam negados sempre.
 */
export const GA_ID = 'G-Y1E48EC0N9'

const STORAGE_KEY = 'oc-consent'
/* Suba a versão quando a política mudar de um jeito que envolva cookies: todo
   mundo volta a ver o aviso. */
const VERSION = 1
const MAX_AGE = 365 * 24 * 60 * 60 * 1000

/* o gtag() de verdade é o do index.html, que empilha `arguments` no dataLayer */
const gtag = (...args) => window.gtag?.(...args)

/** 'granted' | 'denied' | null — null é "sem escolha válida": mostrar o aviso. */
export function readConsent() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (!saved || saved.v !== VERSION || Date.now() - saved.at > MAX_AGE) return null
    return saved.analytics === 'granted' ? 'granted' : 'denied'
  } catch {
    return null
  }
}

function saveConsent(analytics) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, analytics, at: Date.now() }))
  } catch {
    /* navegação privada ou armazenamento bloqueado: a escolha vale só para esta visita */
  }
}

let loaded = false

/* A ordem no dataLayer importa: o update "granted" já foi empilhado antes do config,
   então o primeiro page_view sai com o consentimento certo. */
function loadTag() {
  if (loaded) return
  loaded = true
  gtag('js', new Date())
  gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

/* Revogado o consentimento, o gtag para de usar os cookies do GA, mas não os apaga:
   a limpeza fica por nossa conta. */
function clearAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
  const host = window.location.hostname
  const scopes = ['', `; domain=${host}`, `; domain=.${host.replace(/^www\./, '')}`]
  for (const name of names) {
    for (const scope of scopes) document.cookie = `${name}=; Max-Age=0; path=/${scope}`
  }
}

/** Grava a escolha e a aplica: libera e carrega o GA, ou nega, desliga e limpa. */
export function setConsent(analytics) {
  const granted = analytics === 'granted'
  saveConsent(analytics)
  /* opt-out oficial do GA: com o script já carregado, também corta os pings sem cookie */
  window[`ga-disable-${GA_ID}`] = !granted
  gtag('consent', 'update', { analytics_storage: analytics })
  if (granted) loadTag()
  else clearAnalyticsCookies()
}

/** Na montagem do app: quem já aceitou recebe o GA numa folga depois do load. */
export function startAnalytics() {
  if (readConsent() !== 'granted') return
  gtag('consent', 'update', { analytics_storage: 'granted' })
  const whenIdle = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadTag, { timeout: 4000 })
    else window.setTimeout(loadTag, 1500)
  }
  if (document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { once: true })
}
