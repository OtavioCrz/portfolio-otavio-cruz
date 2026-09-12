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

/* ---------------------------------------------------------------------------
   Camadas de GPU sob demanda

   `will-change-transform` promove o elemento a uma camada própria: transform e
   opacity viram só composição, sem repintar. Mas cada camada ocupa memória de
   GPU enquanto existe — dezenas delas para sempre é o que estoura a memória no
   celular. Por isso a classe entra ANTES do movimento (a camada já chega
   rasterizada no 1º quadro, sem engasgo) e sai quando ele acaba.

   A classe é mexida direto no DOM: só usar em elementos cujo className o React
   não reescreve depois de montado.
   --------------------------------------------------------------------------- */
const GPU_LAYER = 'will-change-transform'

export function promote(targets) {
  for (const el of gsap.utils.toArray(targets)) el.classList.add(GPU_LAYER)
}

export function demote(targets) {
  for (const el of gsap.utils.toArray(targets)) el.classList.remove(GPU_LAYER)
}

/** Para gatilhos com scrub ou pin: a camada existe só enquanto o trecho está ativo. */
export const whileActive = (targets) => (self) => (self.isActive ? promote(targets) : demote(targets))

/**
 * Entrada disparada pelo scroll (gsap.from, ou gsap.to com method: 'to') com a camada
 * na medida: promove quando o gatilho aparece na tela, anima quando ele cruza `start` e
 * devolve a camada no onComplete — a entrada toca uma vez só, então a camada não volta.
 */
export function reveal(targets, vars, { trigger, start, method = 'from' }) {
  const els = gsap.utils.toArray(targets)
  const prepare = ScrollTrigger.create({
    trigger,
    start: 'top bottom',
    onEnter: () => promote(els),
    onLeaveBack: () => demote(els),
  })
  return gsap[method](els, {
    ...vars,
    scrollTrigger: { trigger, start },
    onComplete() {
      prepare.kill()
      demote(els)
    },
  })
}

export { gsap, ScrollTrigger, useGSAP }
