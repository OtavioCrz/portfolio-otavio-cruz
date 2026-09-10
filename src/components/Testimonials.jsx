import { Fragment, useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { TESTIMONIALS } from '../data/testimonials'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Depoimentos — bloco fixado (pin) durante a leitura.
 *
 * Uma timeline com scrub percorre os depoimentos: as palavras do atual
 * acendem uma a uma; seguindo o scroll, ele esmaece e o próximo surge no
 * mesmo lugar. Todos ocupam a mesma célula do grid ([grid-area:stack]),
 * então o bloco tem a altura do maior depoimento e nada salta.
 *
 * As palavras são <span> renderizados pelo React, e não pelo SplitText:
 * o GSAP nunca reescreve DOM que o React controla — essencial agora que o
 * HTML chega pré-renderizado e é hidratado.
 *
 * Com movimento reduzido não há pin: os depoimentos ficam empilhados.
 */
export default function Testimonials() {
  const root = useRef(null)
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      if (prefersReduced) return
      const q = gsap.utils.selector(root)
      const quotes = q('[data-quote]')
      const counter = q('[data-counter]')[0]
      const bar = q('[data-progress]')[0]
      let active = -1

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => {
          let index = 0
          quotes.forEach((_, i) => {
            if (tl.time() >= tl.labels[`q${i}`]) index = i
          })
          if (index === active) return
          active = index
          counter.textContent = `${pad(index + 1)} / ${pad(quotes.length)}`
        },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * quotes.length * 1.1}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      quotes.forEach((quote, i) => {
        const words = quote.querySelectorAll('[data-word]')
        const author = quote.querySelector('[data-author]')

        if (i > 0) {
          /* o anterior esmaece e sobe; immediateRender: false para não
             reexibir, na criação, um depoimento que ainda nem entrou */
          tl.fromTo(
            quotes[i - 1],
            { autoAlpha: 1, yPercent: 0 },
            { autoAlpha: 0, yPercent: -10, duration: 0.45, ease: 'power1.in', immediateRender: false }
          )
          tl.fromTo(quote, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, '<0.3')
        }

        tl.addLabel(`q${i}`, i > 0 ? '<' : 0)
        tl.fromTo(
          words,
          { opacity: 0.1, yPercent: 35 },
          { opacity: 1, yPercent: 0, duration: 0.5, stagger: 0.04, ease: 'power2.out' },
          `q${i}`
        )
        tl.fromTo(author, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, '>-0.25')
        tl.to({}, { duration: 0.9 }) // tempo de leitura
      })

      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: tl.duration() }, 0)
    },
    { scope: root, dependencies: [prefersReduced], revertOnUpdate: true }
  )

  return (
    <section
      ref={root}
      id="depoimentos"
      aria-label="Depoimentos"
      className="relative z-10 flex flex-col justify-between gap-[6vh] overflow-hidden bg-ink px-6 py-[14vh] md:px-[6vw] motion-safe:h-svh"
    >
      <div className="flex items-center justify-between">
        <span className="type-eyebrow text-neon">Depoimentos — 005</span>
        <span data-counter className="type-eyebrow tabular-nums text-ash motion-reduce:hidden">
          {`01 / ${pad(TESTIMONIALS.length)}`}
        </span>
      </div>

      <div className="grid gap-[10vh] [grid-template-areas:'stack'] motion-safe:gap-0">
        {TESTIMONIALS.map((item) => (
          <figure key={item.author} data-quote className="self-center motion-safe:[grid-area:stack]">
            <span aria-hidden="true" className="type-brutal block text-[clamp(4rem,10vw,9rem)] leading-[0.6] text-neon">
              “
            </span>
            <blockquote>
              <p className="max-w-[24ch] font-display text-[clamp(1.75rem,4.4vw,4.6rem)] font-semibold italic leading-[1.06] tracking-[-0.02em] text-bone [word-spacing:0.1em]">
                {item.quote.split(' ').map((word, i) => (
                  <Fragment key={i}>
                    <span data-word className="inline-block">
                      {word}
                    </span>{' '}
                  </Fragment>
                ))}
              </p>
            </blockquote>
            <figcaption
              data-author
              className="type-eyebrow mt-[5vh] flex flex-wrap items-center gap-x-4 gap-y-1 text-ash"
            >
              <span className="text-bone">— {item.author}</span>
              <span>{item.context}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex items-center gap-6 motion-reduce:hidden">
        <div className="h-px flex-1 bg-bone/15">
          <span data-progress className="block h-px w-full origin-left bg-neon" />
        </div>
        <span className="type-eyebrow text-ash">Role para ler</span>
      </div>
    </section>
  )
}
