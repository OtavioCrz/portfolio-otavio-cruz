import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { readConsent, startAnalytics } from './lib/analytics'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { usePrivacyRoute } from './hooks/usePrivacyRoute'

import Preloader from './components/Preloader'
import Grain from './components/Grain'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import HeroMask from './components/HeroMask'
import About from './components/About'
import Services from './components/Services'
import Projects from './components/Projects'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import DiamondLayer from './components/DiamondLayer'
import CookieBanner from './components/CookieBanner'
import ChunkBoundary from './components/ChunkBoundary'

/* A política só é baixada quando alguém a abre: link do aviso, do rodapé ou /#privacidade */
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))

export default function App() {
  const [ready, setReady] = useState(false)
  /* aviso de cookies: null = fechado; { delay } = aberto */
  const [cookies, setCookies] = useState(null)
  const privacy = usePrivacyRoute()

  /* Lenis só entra em cena depois da cortina sair */
  useSmoothScroll(ready)

  /* Trava o scroll durante o preloader */
  useEffect(() => {
    const el = document.documentElement
    el.style.overflow = ready ? '' : 'hidden'
    return () => {
      el.style.overflow = ''
    }
  }, [ready])

  const handleReady = useCallback(() => {
    setReady(true)
    /* recalcula start/end depois que fontes e layout assentaram */
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  /* Imagens do hero podem alterar alturas — refresh defensivo */
  useEffect(() => {
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  /* Analytics (lib/analytics): quem já aceitou recebe o GA numa folga depois do load;
     quem ainda não escolheu vê o aviso — depois da cortina, sem disputar a abertura. */
  useEffect(() => {
    startAnalytics()
  }, [])
  useEffect(() => {
    if (ready && readConsent() === null) setCookies({ delay: 1.2 })
  }, [ready])
  const openCookies = useCallback(() => setCookies((current) => current ?? { delay: 0 }), [])
  const closeCookies = useCallback(() => setCookies(null), [])

  return (
    <>
      <Grain />
      <Cursor />
      <Preloader onComplete={handleReady} />
      <Nav ready={ready} />

      {/* Palco 3D: canvas fixo em z-0, atrás do conteúdo. Só existe no cliente. */}
      <DiamondLayer ready={ready} />

      {/* Trava rolagem horizontal acidental. `overflow-x-clip`, e não
          `overflow-x-hidden`: hidden força overflow-y: auto e transforma o
          wrapper num container de rolagem — isso quebra position: sticky e
          pode confundir o pin do ScrollTrigger. clip só recorta.
          `relative z-[1]` põe todo o conteúdo acima do canvas do diamante: as
          seções não têm fundo próprio, então o palco aparece por trás delas. */}
      <div className="relative z-[1] overflow-x-clip">
        <main>
          <HeroMask />
          <About />
          <Services />
          <Projects />
          <Testimonials />
          <FAQ />
        </main>

        <Footer onOpenPolicy={privacy.show} onOpenCookies={openCookies} />
      </div>

      {/* Aviso de cookies e política: só no cliente — dependem do localStorage e do
          endereço, e ficam fora do HTML pré-renderizado. */}
      {cookies && <CookieBanner delay={cookies.delay} onOpenPolicy={privacy.show} onClosed={closeCookies} />}
      {privacy.mounted && (
        <ChunkBoundary>
          <Suspense fallback={null}>
            <PrivacyPolicy open={privacy.open} onClose={privacy.hide} onExited={privacy.onExited} />
          </Suspense>
        </ChunkBoundary>
      )}
    </>
  )
}
