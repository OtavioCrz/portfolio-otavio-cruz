import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap, demote, promote, ScrollTrigger, useGSAP } from '../lib/gsap'
import { setStageHidden } from '../lib/stage'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { TEXT_OUTLINE } from '../lib/type'
import { CONTACT, PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../data/privacy'
import MagneticButton from './MagneticButton'

const pad = (n) => String(n).padStart(2, '0')
const BODY = 'font-mono text-[clamp(0.9rem,1.05vw,1rem)] leading-[1.85] text-bone/85'

function Block({ block }) {
  if (block.type === 'list') {
    return (
      <ul data-rise className="flex max-w-[68ch] flex-col gap-4">
        {block.items.map((item) => (
          <li key={item.text} className={`flex gap-4 ${BODY}`}>
            <span aria-hidden="true" className="mt-[0.75em] h-1.5 w-1.5 shrink-0 rotate-45 bg-neon" />
            <span>
              {item.lead && <strong className="font-semibold text-bone">{item.lead} </strong>}
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'table') {
    return (
      <div data-rise className="max-w-full overflow-x-auto border border-bone/15">
        <table className="w-full min-w-[34rem] border-collapse text-left font-mono text-[0.8rem] leading-relaxed">
          <thead>
            <tr>
              {block.head.map((cell) => (
                <th key={cell} scope="col" className="type-eyebrow border-b border-bone/15 px-4 py-3 font-normal text-neon">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row[0]} className="border-b border-bone/10 last:border-0">
                {row.map((cell, i) => (
                  <td key={cell} className={`px-4 py-3 align-top ${i === 0 ? 'text-bone' : 'text-bone/70'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.type === 'contact') {
    return (
      <p data-rise className={`max-w-[68ch] ${BODY}`}>
        {block.text}{' '}
        <a
          href={`mailto:${CONTACT.email}`}
          data-cursor="hover"
          className="text-bone underline decoration-neon underline-offset-4 transition-colors duration-300 hover:text-neon"
        >
          {CONTACT.email}
        </a>
        .
      </p>
    )
  }

  return (
    <p data-rise className={`max-w-[68ch] ${BODY}`}>
      {block.text}
    </p>
  )
}

/**
 * Política de Privacidade — overlay de tela cheia (o site é uma página só), com
 * endereço próprio: /#privacidade (ver hooks/usePrivacyRoute). É um chunk à parte,
 * baixado só quando alguém a abre.
 *
 * Entrada: a cortina sobe do pé da tela, o título gigante vazado sobe linha a
 * linha e cada seção sobe em stagger (y 50 → 0, opacidade 0 → 1) — as da primeira
 * dobra logo na abertura, o resto conforme a leitura (ScrollTrigger com o próprio
 * overlay como scroller). Saída: a cortina desce, e só então o App desmonta.
 *
 * Coberto o palco 3D pela cortina opaca, o diamante para de renderizar (lib/stage).
 */
export default function PrivacyPolicy({ open, onClose, onExited }) {
  const root = useRef(null)
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  /* Modal de verdade: o resto da página fica inert e sem rolagem, Esc fecha, e o
     foco entra no diálogo e volta para onde estava. O overlay mora num portal no
     <body>, então dá para deixar o #root inteiro inert. */
  useEffect(() => {
    const html = document.documentElement
    const app = document.getElementById('root')
    const previous = document.activeElement
    html.style.overflow = 'hidden'
    app?.setAttribute('inert', '')
    root.current.focus({ preventScroll: true })

    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      html.style.overflow = ''
      app?.removeAttribute('inert')
      window.removeEventListener('keydown', onKey)
      setStageHidden('privacy', false)
      previous?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  useGSAP(
    (context, contextSafe) => {
      const el = root.current
      const rise = gsap.utils.toArray(el.querySelectorAll('[data-rise]'))

      if (prefersReduced) {
        gsap.set(el, { autoAlpha: 1 })
        setStageHidden('privacy', true)
        return
      }

      /* uma entrada por seção: título e texto sobem juntos, em sequência — nunca uma
         seção pela metade na dobra */
      const revealOnScroll = contextSafe(() => {
        for (const group of el.querySelectorAll('[data-reveal-group]')) {
          const items = group.querySelectorAll('[data-rise]')
          ScrollTrigger.create({
            trigger: group,
            scroller: el,
            start: 'top 88%',
            once: true,
            onEnter: contextSafe(() => {
              promote(items)
              gsap.to(items, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.08,
                onComplete: () => demote(items),
              })
            }),
          })
        }
      })

      gsap.set(rise, { y: 50, opacity: 0 })
      promote(el)
      gsap
        .timeline()
        .fromTo(el, { yPercent: 100, autoAlpha: 1 }, { yPercent: 0, duration: 0.9, ease: 'expo.inOut' })
        .from(el.querySelectorAll('[data-title-line]'), { yPercent: 180, duration: 1.1, ease: 'power4.out', stagger: 0.08 }, '-=0.3')
        .add(() => {
          demote(el)
          setStageHidden('privacy', true)
          revealOnScroll()
        }, 0.9)
    },
    { scope: root }
  )

  /* saída: a cortina desce e o App desmonta no fim */
  useEffect(() => {
    if (open) return
    setStageHidden('privacy', false)
    if (prefersReduced) {
      onExited()
      return
    }
    const el = root.current
    promote(el)
    const tween = gsap.to(el, { yPercent: 100, duration: 0.7, ease: 'expo.inOut', overwrite: true, onComplete: onExited })
    return () => tween.kill()
  }, [open, prefersReduced, onExited])

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      tabIndex={-1}
      data-lenis-prevent
      className="invisible fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-ink text-bone outline-none"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bone/12 bg-ink px-6 py-5 md:px-[6vw]">
        <span className="type-brutal text-[clamp(1rem,1.4vw,1.35rem)] tracking-[-0.03em]">
          OC<span className="text-neon">.</span>
        </span>
        <button
          type="button"
          data-cursor="hover"
          onClick={onClose}
          className="type-eyebrow text-bone/85 transition-colors duration-300 hover:text-neon"
        >
          Fechar ✕
        </button>
      </div>

      <article className="px-6 pb-[8vh] pt-[12vh] md:px-[6vw]">
        <header data-reveal-group className="mb-[10vh]">
          <p data-rise className="type-eyebrow text-neon">
            Política de Privacidade — LGPD
          </p>
          {/* 11vw: "PRIVACIDADE" vazado ocupa ~92% da largura útil — folga para o traço */}
          <h1 id="privacy-title" className="type-brutal mt-6 text-[min(11vw,10rem)] leading-[0.9]">
            <span className="line-mask">
              <span data-title-line className={`block ${TEXT_OUTLINE}`}>
                Privacidade
              </span>
            </span>
            <span className="line-mask">
              <span data-title-line className="block">
                e cookies<span className="text-neon">.</span>
              </span>
            </span>
          </h1>
          <p data-rise className="type-eyebrow mt-8 text-ash">
            Última atualização: {PRIVACY_UPDATED}
          </p>
        </header>

        {PRIVACY_SECTIONS.map((section, i) => (
          <section
            key={section.id}
            data-reveal-group
            aria-labelledby={`privacy-${section.id}`}
            className="grid gap-6 border-t border-bone/12 py-[7vh] lg:grid-cols-12 lg:gap-[4vw]"
          >
            <div className="lg:col-span-4">
              <span data-rise className="type-eyebrow block text-neon">
                {pad(i + 1)}
              </span>
              <h2
                data-rise
                id={`privacy-${section.id}`}
                className="type-brutal mt-3 text-[clamp(1.6rem,3.4vw,3rem)] leading-[0.95]"
              >
                {section.title}
              </h2>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-8">
              {section.blocks.map((block, k) => (
                <Block key={`${section.id}-${k}`} block={block} />
              ))}
            </div>
          </section>
        ))}

        <div data-reveal-group className="flex flex-col items-center border-t border-bone/12 pt-[8vh] text-center">
          <p data-rise className="type-eyebrow text-ash">
            Fim da política
          </p>
          <MagneticButton onClick={onClose} aria-label="Voltar para o portfólio">
            ← Voltar
          </MagneticButton>
        </div>
      </article>
    </div>,
    document.body
  )
}
