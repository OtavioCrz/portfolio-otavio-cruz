import { useEffect } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { setStageHidden } from '../lib/stage'
import { KEYFRAMES, heroKeyframe } from './diamondState'

/* jornada: [quadro-chave, seção]. Cada trecho vai do topo da seção entrando na tela até
   ele chegar a 25% dela — a pedra chega cedo ao canto dela e espera ali, em vez de
   atravessar o texto a seção inteira a caminho do próximo canto. */
const JOURNEY = [
  ['perfil', '#perfil'],
  ['servicos', '#servicos'],
  ['work', '#work'],
  ['depoimentos', '#depoimentos'],
  ['faq', '#faq'],
]

/**
 * Coreografia do diamante: o hook do GSAP que move o estado do three.js com o scroll.
 *
 * Jornada — um fromTo por trecho, cada um partindo EXATAMENTE do quadro-chave anterior.
 *
 * scrub: true (sem atraso próprio) em tudo, de propósito. A suavidade já vem do Lenis, e
 * assim o ScrollTrigger atualiza os gatilhos em ordem de posição no MESMO quadro: num salto
 * pelo menu (Perfil → Contato), os trechos passados fecham em 1 e o mais adiante escreve
 * por último.
 *
 * Final — o rodapé (#contato) fica fixo por 1,6 tela de scroll. A timeline anima só as
 * misturas do final (center/turn/zoom/reveal, 0 → 1); o Diamond as compõe por cima da
 * jornada. Por isso ela nunca reescreve a posição da pedra, nem quando o ScrollTrigger a
 * renderiza no tempo 0 durante um refresh.
 *   0.00–0.25  center: vai ao centro e para de flutuar
 *   0.00–0.30  turn: gira com força até a culeta apontar para a câmera (rotX → -π/2),
 *              dando uma volta inteira na linha de visão (rotZ)
 *   0.30–0.85  zoom: escala até FINALE_SCALE, acelerando — o interior engole a tela
 *   0.35–0.85  reveal: a máscara abre e o contato aparece DENTRO da silhueta do diamante
 *   0.85–1.00  o palco some; no fim, o canvas para de renderizar
 */
export function useDiamondChoreography({ state, intro, outro, ready }) {
  /* entrada: depois que a cortina do preloader sai */
  useEffect(() => {
    if (!ready) return
    const tween = gsap.to(intro.current, { autoAlpha: 1, duration: 1.6, ease: 'power2.out', delay: 0.2 })
    return () => tween.kill()
  }, [ready, intro])

  useGSAP(() => {
    const footer = document.getElementById('contato')
    if (!footer) return

    let previous = heroKeyframe()
    for (const [key, section] of JOURNEY) {
      const target = KEYFRAMES[key]
      gsap.fromTo(
        state,
        { ...previous },
        {
          ...target,
          ease: 'power1.inOut',
          immediateRender: false,
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: true },
        }
      )
      previous = target
    }

    gsap
      .timeline({
        defaults: { ease: 'none' },
        /* No fim o palco está invisível: parar de renderizar libera a GPU (lib/stage).
           Decide pelo progresso DA TIMELINE, e o clip-path final é escrito aqui, antes de
           o palco parar — com ele parado, ninguém mais escreveria no rodapé. */
        onUpdate() {
          const done = this.progress() >= 0.999
          if (done) footer.style.clipPath = ''
          setStageHidden('finale', done)
        },
        scrollTrigger: {
          trigger: footer,
          start: 'top top',
          end: () => `+=${window.innerHeight * 1.6}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(state, { center: 0 }, { center: 1, duration: 0.25, ease: 'power2.inOut' }, 0)
      .fromTo(state, { turn: 0 }, { turn: 1, duration: 0.3, ease: 'power3.inOut' }, 0)
      .fromTo(state, { zoom: 0 }, { zoom: 1, duration: 0.55, ease: 'power3.in' }, 0.3)
      .fromTo(state, { reveal: 0 }, { reveal: 1, duration: 0.5, ease: 'power2.in' }, 0.35)
      /* renderiza na criação: o "from" (visível) é o estado inicial certo do palco */
      .fromTo(outro.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15, immediateRender: true }, 0.85)

    /* um pin novo no fim da página muda a altura dela: recalcula tudo */
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      cancelAnimationFrame(frame)
      footer.style.clipPath = ''
      setStageHidden('finale', false)
    }
  })
}
