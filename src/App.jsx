import { useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { useSmoothScroll } from './hooks/useSmoothScroll'

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

export default function App() {
  const [ready, setReady] = useState(false)

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

  return (
    <>
      <Grain />
      <Cursor />
      <Preloader onComplete={handleReady} />
      <Nav ready={ready} />

      {/* Trava rolagem horizontal acidental. `overflow-x-clip`, e não
          `overflow-x-hidden`: hidden força overflow-y: auto e transforma o
          wrapper num container de rolagem — isso quebra position: sticky e
          pode confundir o pin do ScrollTrigger. clip só recorta. */}
      <div className="overflow-x-clip">
        <main>
          <HeroMask />
          <About />
          <Services />
          <Projects />
          <Testimonials />
          <FAQ />
        </main>

        <Footer />
      </div>
    </>
  )
}
