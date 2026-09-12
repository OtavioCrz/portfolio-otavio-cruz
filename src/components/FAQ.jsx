import { useId, useLayoutEffect, useRef, useState } from 'react'
import { gsap, demote, promote, reveal, ScrollTrigger, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { TEXT_OUTLINE } from '../lib/type'
import { FAQ as ITEMS } from '../data/faq'
import { CONTACT } from '../data/projects'

const pad = (n) => String(n).padStart(2, '0')

/* abrir desacelera (a resposta assenta); fechar acelera e sai */
const OPEN = { duration: 0.55, ease: 'expo.out' }
const CLOSE = { duration: 0.4, ease: 'power3.inOut' }

/**
 * FAQ — accordion brutalista.
 *
 * Padrão de accordion da WAI-ARIA: cada pergunta é um <button> dentro de um
 * <h3>, com aria-expanded/aria-controls. Fechada, a resposta fica `inert` —
 * fora do foco e do leitor de tela, mas presente no HTML pré-renderizado, que
 * é o que os robôs leem.
 *
 * Movimento só com transform (FLIP). A versão anterior animava
 * grid-template-rows, o que recalculava o layout da página inteira a cada
 * quadro da abertura. Agora o layout muda UMA vez por clique, e o que se vê é
 * transform:
 *   abrir  — o layout abre na hora; as linhas de baixo partem de onde estavam
 *            e descem, e a resposta desliza de trás da pergunta junto com elas,
 *            como uma gaveta;
 *   fechar — anima primeiro (resposta e linhas de baixo sobem juntas) e só no
 *            fim fecha o layout, no mesmo quadro em que os transforms são
 *            zerados: nada pula.
 * Trocar de pergunta = fechar a aberta e depois abrir a nova. A cada mudança o
 * ScrollTrigger recalcula: a página mudou de altura, e o pin do rodapé vem logo
 * abaixo.
 */
export default function FAQ() {
  const root = useRef(null)
  const list = useRef(null)
  const flip = useRef(null) // posições de antes do commit, para o FLIP
  const closing = useRef(null) // fechamento em curso: { index, next }
  const baseId = useId()
  const [open, setOpen] = useState(null)
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      if (prefersReduced) return
      const q = gsap.utils.selector(root)

      reveal(
        q('[data-head]'),
        { yPercent: 180, duration: 1.05, ease: 'power4.out', stagger: 0.08 },
        { trigger: root.current, start: 'top 72%' }
      )
      reveal(
        q('[data-rule]'),
        { scaleX: 0, transformOrigin: '0% 50%', duration: 1.1, ease: 'power3.inOut', stagger: 0.08 },
        { trigger: list.current, start: 'top 85%' }
      )
      reveal(
        q('[data-question]'),
        { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.08 },
        { trigger: list.current, start: 'top 85%' }
      )
    },
    { scope: root, dependencies: [prefersReduced], revertOnUpdate: true }
  )

  const rows = () => [...list.current.children]
  const answerOf = (i) => rows()[i].querySelector('[data-answer]')
  const heightOf = (i) => rows()[i].querySelector('[role="region"]').offsetHeight

  /* grava onde cada linha está na tela (com transform) e muda o layout */
  const commit = (next) => {
    flip.current = rows().map((row) => row.getBoundingClientRect().top)
    setOpen(next)
  }

  const toggle = (i) => {
    if (prefersReduced) {
      setOpen(open === i ? null : i)
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return
    }
    if (closing.current) {
      /* no meio de um fechamento, o clique só decide o que abre em seguida */
      closing.current.next = closing.current.next === i ? null : i
      return
    }
    if (open === null) {
      commit(i)
      return
    }

    /* fecha a aberta: resposta e linhas de baixo sobem juntas; o layout fecha no fim */
    const moving = [answerOf(open), ...rows().slice(open + 1)]
    closing.current = { index: open, next: open === i ? null : i }
    gsap.killTweensOf(moving)
    promote(moving)
    gsap.to(moving, {
      y: -heightOf(open),
      ...CLOSE,
      onComplete: () => {
        const { next } = closing.current
        closing.current = null
        commit(next)
      },
    })
  }

  /* FLIP: depois do commit e antes da pintura, cada linha volta para onde estava
     (translateY) e anima até o lugar novo */
  useLayoutEffect(() => {
    const before = flip.current
    if (!before) return
    flip.current = null

    const all = rows()
    const answers = all.map((row) => row.querySelector('[data-answer]')).filter(Boolean)
    gsap.killTweensOf([...all, ...answers])
    gsap.set([...all, ...answers], { clearProps: 'transform' })
    demote([...all, ...answers])

    /* primeiro todas as leituras, depois todas as escritas */
    const offsets = all.map((row, k) => before[k] - row.getBoundingClientRect().top)
    const moved = all.filter((_, k) => Math.abs(offsets[k]) >= 0.5)
    moved.forEach((row) => gsap.set(row, { y: offsets[all.indexOf(row)] }))

    const drawer = open === null ? null : answerOf(open)
    if (drawer) gsap.set(drawer, { y: -heightOf(open) })

    const targets = drawer ? [...moved, drawer] : moved
    if (!targets.length) {
      ScrollTrigger.refresh()
      return
    }
    promote(targets)
    gsap.to(targets, {
      y: 0,
      ...OPEN,
      clearProps: 'transform',
      onComplete: () => {
        demote(targets)
        ScrollTrigger.refresh()
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <section ref={root} id="faq" className="relative z-10 px-6 py-[16vh] md:px-[6vw]">
      <div className="grid grid-cols-1 gap-[7vh] lg:grid-cols-12 lg:gap-[4vw]">
        <div className="lg:col-span-5">
          <div className="line-mask">
            <span data-head className="type-eyebrow block text-neon">
              FAQ — 006
            </span>
          </div>
          <h2 className="type-brutal mt-4 text-[clamp(2rem,9vw,4.5rem)] leading-[0.94] lg:text-[min(4.2vw,5rem)]">
            <span className="line-mask">
              <span data-head className="block">
                Perguntas
              </span>
            </span>
            <span className="line-mask">
              <span data-head className={`block ${TEXT_OUTLINE}`}>
                frequentes
              </span>
            </span>
          </h2>
          <div className="line-mask mt-6">
            <p data-head className="max-w-[34ch] font-mono text-xs leading-relaxed text-ash">
              Não achou sua dúvida?{' '}
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="text-bone underline decoration-neon underline-offset-4 transition-colors hover:text-neon"
              >
                Pergunte no WhatsApp
              </a>
              .
            </p>
          </div>
        </div>

        <ul ref={list} data-faq-list className="lg:col-span-7">
          {ITEMS.map((item, i) => {
            const isOpen = open === i
            const questionId = `${baseId}-q${i}`
            const answerId = `${baseId}-a${i}`

            return (
              <li key={item.question}>
                <span data-rule className="block h-px w-full bg-bone/25" />
                <h3 data-question>
                  <button
                    type="button"
                    id={questionId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    data-cursor="hover"
                    onClick={() => toggle(i)}
                    className="group flex w-full items-center gap-5 py-6 text-left md:gap-8 md:py-8"
                  >
                    <span className="type-eyebrow w-8 shrink-0 text-neon">{pad(i + 1)}</span>
                    <span
                      className={`flex-1 font-display text-[clamp(1.2rem,2.4vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.02em] [word-spacing:0.08em] transition-colors duration-300 group-hover:text-neon ${
                        isOpen ? 'text-neon' : 'text-bone'
                      }`}
                    >
                      {item.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`relative h-6 w-6 shrink-0 transition-colors duration-300 group-hover:text-neon ${
                        isOpen ? 'text-neon' : 'text-bone'
                      }`}
                    >
                      <span className="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-current" />
                      <span
                        className={`absolute left-1/2 top-0 h-6 w-0.5 -translate-x-1/2 bg-current transition-[rotate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </span>
                  </button>
                </h3>

                {/* Aberta ou fechada, sem transição de layout: quem anima é o FLIP */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  inert={!isOpen}
                  className={`grid ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div data-answer>
                      <p
                        className={`mb-7 border-l-2 border-neon bg-plum px-5 py-5 font-mono text-[clamp(0.85rem,1.05vw,1rem)] leading-[1.8] text-bone/85 transition-opacity duration-500 md:ml-[4.5rem] md:px-8 md:py-6 ${
                          isOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
          <li aria-hidden="true">
            <span data-rule className="block h-px w-full bg-bone/25" />
          </li>
        </ul>
      </div>
    </section>
  )
}
