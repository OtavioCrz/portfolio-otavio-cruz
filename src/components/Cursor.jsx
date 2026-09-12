import { useEffect, useRef } from 'react'
import { gsap, demote, promote, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'

const HOVER_TARGETS = '[data-cursor="hover"], a, button'

/**
 * Cursor customizado: um ponto que acompanha 1:1 e um anel com atraso,
 * em mix-blend-difference.
 *
 * Só transform e opacity. O anel tem duas bordas empilhadas, marfim e neon, e
 * o hover cruza a opacidade delas — em vez de animar `border-color`, que
 * repinta a cada quadro. Ponto e anel ganham camada de GPU enquanto o cursor
 * está visível: eles se movem a cada mousemove.
 *
 * Visibilidade e estado de hover são DERIVADOS a cada mousemove, nunca
 * memorizados a partir de eventos de entrada/saída isolados. É isso que
 * impede o cursor de ficar preso invisível depois que o mouse sai da
 * janela, ou preso encolhido quando o elemento que disparou o hover é
 * desmontado — o próximo movimento sempre recalcula a partir do elemento
 * que está de fato sob o ponteiro.
 */
export default function Cursor() {
  const root = useRef(null)
  const controls = useRef(null)
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  /* Animação: estado inicial e setters. Expõe `move`/`hide` para a
     escuta global abaixo. */
  useGSAP(
    () => {
      if (!canHover) return

      const dot = root.current.querySelector('[data-dot]')
      const ring = root.current.querySelector('[data-ring]')
      const idle = ring.querySelector('[data-ring-idle]')
      const hot = ring.querySelector('[data-ring-hot]')

      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 })

      const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' })
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' })
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' })
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' })

      let visible = false
      let hovering = false

      const setVisible = (next) => {
        if (next === visible) return
        visible = next
        if (next) promote([dot, ring])
        gsap.to([dot, ring], {
          autoAlpha: next ? 1 : 0,
          duration: 0.25,
          overwrite: 'auto',
          onComplete: next ? undefined : () => demote([dot, ring]),
        })
      }

      const setHovering = (next) => {
        if (next === hovering) return
        hovering = next
        const motion = { duration: 0.4, ease: 'power3.out', overwrite: 'auto' }
        gsap.to(ring, { scale: next ? 2.1 : 1, ...motion })
        gsap.to(hot, { opacity: next ? 1 : 0, ...motion })
        gsap.to(idle, { opacity: next ? 0 : 1, ...motion })
        gsap.to(dot, { scale: next ? 0.2 : 1, ...motion })
      }

      controls.current = {
        move(x, y, target) {
          dotX(x)
          dotY(y)
          ringX(x)
          ringY(y)
          setVisible(true)
          setHovering(Boolean(target?.closest?.(HOVER_TARGETS)))
        },
        hide() {
          setVisible(false)
        },
      }

      return () => {
        controls.current = null
        demote([dot, ring])
      }
    },
    { scope: root, dependencies: [canHover], revertOnUpdate: true }
  )

  /* Escuta global: qualquer movimento do mouse reativa a opacidade e devolve
     a escala a 1 (ou à escala de hover, se o ponteiro estiver mesmo
     sobre um alvo). */
  useEffect(() => {
    if (!canHover) return

    const onMouseMove = (event) => {
      controls.current?.move(event.clientX, event.clientY, event.target)
    }
    /* relatedTarget nulo = o ponteiro saiu da janela */
    const onMouseOut = (event) => {
      if (!event.relatedTarget) controls.current?.hide()
    }
    const onBlur = () => controls.current?.hide()

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('blur', onBlur)
    }
  }, [canHover])

  if (!canHover) return null

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference"
    >
      <span
        data-dot
        className="fixed left-0 top-0 block h-1.5 w-1.5 rounded-full bg-bone"
      />
      <span data-ring className="fixed left-0 top-0 block h-9 w-9">
        <span data-ring-idle className="absolute inset-0 rounded-full border border-bone/65" />
        <span data-ring-hot className="absolute inset-0 rounded-full border border-neon/95 opacity-0" />
      </span>
    </div>
  )
}
