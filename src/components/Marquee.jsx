import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'

/**
 * Letreiro infinito.
 * O track carrega o conteúdo duplicado e anda até -50%: nesse ponto a
 * segunda cópia ocupa exatamente o lugar da primeira e o loop recomeça
 * sem emenda. Para isso cada cópia precisa ser mais larga que a tela —
 * garantido pela escala tipográfica em vw.
 *
 * `className` estiliza o letreiro inteiro (tipografia herdada pelos itens);
 * `itemClassName` vai em cada palavra.
 */
export default function Marquee({
  items,
  duration = 26,
  reverse = false,
  className = '',
  itemClassName = '',
}) {
  const root = useRef(null)
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      if (prefersReduced) return
      const track = root.current.querySelector('[data-track]')
      gsap.fromTo(
        track,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration, ease: 'none', repeat: -1 }
      )
    },
    { scope: root, dependencies: [duration, reverse, prefersReduced], revertOnUpdate: true }
  )

  return (
    /* overflow-x-clip, e não overflow-hidden: recorta só na horizontal.
       overflow-hidden também cortaria na vertical o topo das letras que,
       com leading apertado, passam da caixa da linha. */
    <div ref={root} aria-hidden="true" className={`w-full overflow-x-clip ${className}`}>
      <div data-track className="flex w-max items-center [will-change:transform]">
        {[...items, ...items].map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center">
            <span className={`whitespace-nowrap px-[2.5vw] ${itemClassName}`}>{item}</span>
            <span className="h-[0.12em] w-[0.12em] shrink-0 rotate-45 bg-neon" />
          </span>
        ))}
      </div>
    </div>
  )
}
