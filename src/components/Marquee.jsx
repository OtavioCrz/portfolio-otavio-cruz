import { useEffect, useRef } from 'react'

/**
 * Letreiro infinito.
 * O track carrega o conteúdo duplicado e anda até -50%: nesse ponto a
 * segunda cópia ocupa exatamente o lugar da primeira e o loop recomeça
 * sem emenda. Para isso cada cópia precisa ser mais larga que a tela —
 * garantido pela escala tipográfica em vw.
 *
 * Animação CSS (.marquee-track, index.css), e não GSAP: um loop linear sem
 * fim não precisa de JavaScript a cada quadro. No compositor ele segue liso
 * mesmo com a thread principal ocupada (scroll, WebGL). E fora da tela fica
 * pausado: um loop infinito rodando escondido mantém o compositor produzindo
 * quadros à toa. Com movimento reduzido, a regra global do index.css o para.
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

  useEffect(() => {
    const el = root.current
    const io = new IntersectionObserver(([entry]) => {
      el.dataset.running = String(entry.isIntersecting)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    /* overflow-x-clip, e não overflow-hidden: recorta só na horizontal.
       overflow-hidden também cortaria na vertical o topo das letras que,
       com leading apertado, passam da caixa da linha. */
    <div ref={root} aria-hidden="true" className={`w-full overflow-x-clip ${className}`}>
      <div
        className="marquee-track flex w-max items-center"
        style={{ '--marquee-duration': `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
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
