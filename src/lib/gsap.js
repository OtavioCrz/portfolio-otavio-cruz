import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Ajustes que dependem do navegador. Na pré-renderização este módulo
   roda em Node, sem window. */
if (typeof window !== 'undefined') {
  /* Sem lag smoothing: o scrub acompanha o scroll real, sem "pulos" */
  gsap.ticker.lagSmoothing(0)

  /* A barra de URL do mobile dispara resize e faria o pin recalcular
     no meio da animacao — ignoramos esse caso especifico. */
  ScrollTrigger.config({ ignoreMobileResize: true })

  /* O ScrollTrigger calcula os gatilhos na ordem em que foram criados, e
     cada pin empurra os que vêm abaixo — essa ordem precisa ser a da página.
     Com o HTML pré-renderizado ela se perde: a hidratação renderiza com os
     valores do servidor (isDesktop = false) e o hero, o perfil e o work
     recriam as animações logo depois, indo para o fim da fila. Os
     depoimentos eram calculados sem o espaço do pin do hero e fixavam em
     plena seção de serviços. Reordenar pela posição real no início de todo
     refresh resolve esse caso e qualquer troca de breakpoint. */
  ScrollTrigger.addEventListener('refreshInit', () => {
    ScrollTrigger.sort()
  })
}

export { gsap, ScrollTrigger, useGSAP }
