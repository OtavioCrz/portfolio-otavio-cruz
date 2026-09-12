import { useRef } from 'react'
import { gsap, demote, promote, useGSAP } from '../lib/gsap'
import { setStageHidden } from '../lib/stage'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { HERO_FRAMES, FRAME_DURATION } from '../data/media'
import Manifesto from './Manifesto'

/**
 * HeroMask
 * ---------------------------------------------------------------
 * A seção é pinada e uma única timeline com scrub controla tudo:
 *
 *   1. As palavras OTÁVIO / CRUZ deslizam para fora do viewport
 *   2. A "fresta" (clip-path inset) se expande até cobrir a tela
 *   3. A mídia perde a escala de 1.45 -> 1 (parallax de profundidade)
 *   4. O véu escurece e o Manifesto sobe linha a linha
 *
 * Por que clip-path e não width/height:
 * a mídia permanece SEMPRE do tamanho do viewport — só a janela de
 * recorte abre. Zero reflow por frame, zero reescala de imagem, e o
 * enquadramento nunca "salta" no fim da animação.
 */

/* Deslocamento de reveal das linhas do manifesto.
   Precisa exceder a altura da linha + o padding da .line-mask, senão
   o texto fica espiando pela borda inferior da máscara. */
const REVEAL_OFFSET = 180

/* Recorte da fresta, em porcentagem do viewport.
   Ver .hero-mask no index.css para o motivo de serem variáveis. */
const CLIP_OPEN = { '--clip-y': '0%', '--clip-x': '0%' }
/* Fresta vertical entre as palavras (desktop) -> 12vw x 61vh */
const CLIP_CLOSED_DESKTOP = { '--clip-y': '19.5%', '--clip-x': '44%' }
/* Faixa horizontal entre as palavras empilhadas (mobile) -> 88vw x 23vh */
const CLIP_CLOSED_MOBILE = { '--clip-y': '38.5%', '--clip-x': '6%' }
/* Instante da timeline mestre em que a fresta termina de abrir e a mídia cobre a tela */
const MASK_OPEN_AT = 0.56

export default function HeroMask() {
  const root = useRef(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)

      const mask = q('[data-mask]')[0]
      const media = q('[data-media]')[0]
      const veil = q('[data-veil]')[0]
      const ring = q('[data-ring]')[0]
      const wordL = q('[data-word="left"]')[0]
      const wordR = q('[data-word="right"]')[0]
      const hint = q('[data-hint]')[0]
      const hintLine = q('[data-hint-line]')[0]
      const frames = q('[data-frame]')
      const lines = q('[data-line]')

      const clipClosed = isDesktop ? CLIP_CLOSED_DESKTOP : CLIP_CLOSED_MOBILE

      /* -- Estado inicial -------------------------------------
         Só o que a timeline NÃO possui. Os estados de origem de
         mask/media/veil/lines vêm dos `fromTo` abaixo: duplicá-los aqui
         faz o React StrictMode (que monta o efeito duas vezes) aplicar
         a transformação em dobro e a animação nunca fecha em zero. */
      gsap.set(media, { transformOrigin: '50% 50%' })
      gsap.set(frames, { autoAlpha: 0 })
      gsap.set(frames[0], { autoAlpha: 1 })

      /* -- Loop stop-motion dentro da fresta ------------------ */
      const sequence = gsap.timeline({ repeat: -1 })
      frames.forEach((frame, i) => {
        sequence.set(frames, { autoAlpha: 0 }, i * FRAME_DURATION)
        sequence.set(frame, { autoAlpha: 1 }, i * FRAME_DURATION)
      })
      /* tween vazio apenas para dar duração ao último frame */
      sequence.to({}, { duration: FRAME_DURATION }, (frames.length - 1) * FRAME_DURATION)

      /* -- Só com o hero na tela ------------------------------
         Stop-motion e pulso são loops infinitos: sem isto, seguiam trocando
         quadros e escrevendo estilo a cada frame até o fim da visita. E a
         mídia e as palavras — o que o primeiro gesto de scroll move — só têm
         camada de GPU enquanto o hero aparece. O véu e o manifesto, não: eles
         se movem com a mídia já cobrindo a tela, e o GSAP os promove só durante
         os próprios tweens. Camada a mais custa composição em todo quadro em
         que algo na tela muda — o diamante, por exemplo. */
      const layers = [media, wordL, wordR]
      let pulse = null
      let visible = true
      let scrolled = 0
      const syncLoops = () => {
        sequence.paused(!visible)
        pulse?.paused(!visible || scrolled > 0.05)
      }
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && !prefersReduced) promote(layers)
        else demote(layers)
        syncLoops()
      })
      io.observe(root.current)
      const cleanup = () => {
        io.disconnect()
        demote(layers)
        setStageHidden('hero', false)
      }

      /* -- Rota acessível: sem pin, sem scrub ----------------- */
      if (prefersReduced) {
        gsap.set(mask, CLIP_OPEN)
        gsap.set(media, { scale: 1 })
        gsap.set(veil, { opacity: 0.8 })
        gsap.set(lines, { yPercent: 0 })
        gsap.set([wordL, wordR, hint], { autoAlpha: 0 })
        gsap.set(ring, { opacity: 0 })
        sequence.timeScale(0.3)
        return cleanup
      }

      /* -- Pulso do indicador de scroll ----------------------- */
      pulse = gsap.fromTo(
        hintLine,
        { scaleY: 0.12, transformOrigin: '50% 0%' },
        { scaleY: 1, duration: 1.35, ease: 'power2.inOut', repeat: -1, yoyo: true }
      )

      /* A mídia aberta cobre a tela inteira, e com ela o palco 3D, que fica
         atrás do conteúdo: com o hero fixo e a fresta toda aberta, o diamante
         não renderiza. Decide pelo tempo DA TIMELINE, que o scrub atrasa em
         relação ao scroll — é o que está de fato na tela. */
      const syncStage = (tl) =>
        setStageHidden('hero', tl.scrollTrigger?.isActive === true && tl.time() >= MASK_OPEN_AT)

      /* -- Timeline mestre (pinada + scrub) ------------------- */
      const master = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate() {
          syncStage(this)
        },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => '+=' + window.innerHeight * 2.35,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.85,
          invalidateOnRefresh: true,
          onToggle: (self) => syncStage(self.animation),
          onUpdate: (self) => {
            /* o stop-motion desacelera conforme a mídia toma a tela */
            sequence.timeScale(1 - self.progress * 0.78)
            scrolled = self.progress
            syncLoops()
          },
        },
      })

      master
        /* 1 - o indicador some no primeiro gesto */
        .to(hint, { autoAlpha: 0, duration: 0.08 }, 0)

        /* 2 - as palavras abrem caminho */
        .to(
          wordL,
          {
            x: () => (isDesktop ? -window.innerWidth * 0.68 : 0),
            y: () => (isDesktop ? 0 : -window.innerHeight * 0.62),
            duration: 0.52,
            ease: 'power2.in',
          },
          0
        )
        .to(
          wordR,
          {
            x: () => (isDesktop ? window.innerWidth * 0.68 : 0),
            y: () => (isDesktop ? 0 : window.innerHeight * 0.62),
            duration: 0.52,
            ease: 'power2.in',
          },
          0
        )
        .to([wordL, wordR], { opacity: 0, duration: 0.14 }, 0.36)

        /* 3 - a fresta se abre até o viewport inteiro.
           fromTo (e não to) porque `invalidateOnRefresh` faz o GSAP
           reler os valores de origem: com `to`, um refresh depois do
           primeiro render grava o estado FINAL como origem e a fresta
           nasce aberta. Com origem explícita isso não acontece. */
        .fromTo(
          mask,
          { ...clipClosed },
          { ...CLIP_OPEN, duration: MASK_OPEN_AT, ease: 'power2.inOut', immediateRender: true },
          0
        )
        .fromTo(
          media,
          { scale: 1.45 },
          { scale: 1, duration: 0.64, ease: 'power1.out', immediateRender: true },
          0
        )
        .to(ring, { opacity: 0, duration: 0.2 }, 0.4)

        /* 4 - véu + manifesto */
        .fromTo(
          veil,
          { opacity: 0 },
          { opacity: 0.8, duration: 0.18, immediateRender: true },
          0.5
        )
        .fromTo(
          lines,
          { yPercent: REVEAL_OFFSET },
          {
            yPercent: 0,
            duration: 0.34,
            stagger: 0.075,
            ease: 'power3.out',
            immediateRender: true,
          },
          0.56
        )

        /* 5 - respiro antes de soltar o pin */
        .to({}, { duration: 0.16 })

      return cleanup
    },
    { scope: root, dependencies: [isDesktop, prefersReduced], revertOnUpdate: true }
  )

  return (
    <section ref={root} id="hero" className="relative h-svh w-full overflow-hidden">
      {/* -- CAMADA 1 - mídia recortada pela fresta ------------ */}
      <div data-mask className="hero-mask absolute inset-0 z-10">
        <div data-media className="absolute inset-0">
          {/* Primeiro fold: nada de lazy. Só o 1º quadro ganha prioridade alta
              (é o que aparece na fresta quando o preloader sai); os outros sete
              vêm na prioridade normal, sem disputar banda com as fontes, que
              são o que segura o preloader. Decodificação assíncrona em todos,
              inclusive no 1º: com `sync`, a primeira pintura da página — a do
              preloader, que cobre o hero — esperava a rasterização do SVG. */}
          {HERO_FRAMES.map((frame, i) => (
            <img
              key={frame.id}
              data-frame
              src={frame.src}
              alt={frame.alt}
              aria-hidden="true"
              draggable="false"
              loading="eager"
              fetchPriority={i === 0 ? 'high' : undefined}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ))}
        </div>

        {/* véu para legibilidade do manifesto */}
        <div
          data-veil
          className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/35 to-ink/85"
        />

        {/* moldura de 1px - recortada junto com a fresta */}
        <div
          data-ring
          aria-hidden="true"
          className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(242,240,234,0.32)]"
        />
      </div>

      {/* scrim de topo: só existe enquanto o hero está na tela, para a
          barra fixa continuar legível quando a mídia preenche o quadro */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[30vh] bg-gradient-to-b from-ink/85 to-transparent"
      />

      {/* -- CAMADA 2 - tipografia gigante -------------------- */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 md:px-[1vw]">
        {/* Cada palavra ocupa metade exata do espaço restante (flex-1),
            o que trava o espaçador — e portanto a fresta — no centro
            geométrico do viewport, independente da largura das palavras. */}
        <h1 className="type-brutal flex w-full flex-col items-center justify-center text-[19vw] leading-[0.86] md:flex-row md:text-[min(10.3vw,11.5rem)]">
          <span className="sr-only">
            Otávio Cruz — Desenvolvedor Front-End e Web Designer
          </span>

          <span
            data-word="left"
            aria-hidden="true"
            className="block w-full text-center md:w-auto md:flex-1 md:text-right"
          >
            OTÁVIO
          </span>

          {/* espaçador que reserva exatamente a área da fresta */}
          <span
            aria-hidden="true"
            className="block h-[var(--hero-gap-h)] w-full shrink-0 md:h-auto md:w-[var(--hero-gap-w)]"
          />

          <span
            data-word="right"
            aria-hidden="true"
            className="block w-full text-center md:w-auto md:flex-1 md:text-left"
          >
            CRUZ
          </span>
        </h1>
      </div>

      {/* -- CAMADA 3 - manifesto ----------------------------- */}
      <Manifesto />

      {/* -- CAMADA 4 - indicador de scroll ------------------- */}
      <div
        data-hint
        className="pointer-events-none absolute bottom-[4vh] left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="type-eyebrow text-bone/55">Scroll</span>
        <span
          data-hint-line
          className="block h-12 w-px bg-gradient-to-b from-bone/80 to-transparent"
        />
      </div>
    </section>
  )
}
