import { useRef } from 'react'
import { gsap, reveal, ScrollTrigger, useGSAP, whileActive } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { TEXT_OUTLINE } from '../lib/type'
import { PROFILE, STACK } from '../data/profile'
import Marquee from './Marquee'

const TONE = {
  bone: 'text-bone',
  neon: 'text-neon',
}

/**
 * Perfil — foto + declaração, fechado pelo letreiro da stack.
 *
 * A foto tem três camadas de movimento, cada uma num elemento próprio
 * para que nenhuma sobrescreva a transformação da outra:
 *   [data-curtain]   cortina que se recolhe na entrada   (GSAP · scaleY)
 *   [data-parallax]  moldura interna mais lenta          (GSAP · yPercent)
 *   <img>            grayscale -> cor e zoom no hover    (CSS · filter/scale)
 */
export default function About() {
  const root = useRef(null)
  const canHover = useMediaQuery('(hover: hover)')
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const photo = q('[data-photo]')[0]
      const curtain = q('[data-curtain]')[0]
      const parallax = q('[data-parallax]')[0]

      /* sem hover (toque), a cor entra quando a foto cruza o meio da tela */
      if (!canHover) {
        ScrollTrigger.create({
          trigger: photo,
          start: 'top 65%',
          end: 'bottom 35%',
          toggleClass: 'is-inview',
        })
      }

      if (prefersReduced) {
        gsap.set(curtain, { scaleY: 0 })
        return
      }

      /* cortina recolhe para baixo: o rosto aparece primeiro */
      gsap.set(curtain, { transformOrigin: '50% 100%' })
      reveal(
        curtain,
        { scaleY: 0, duration: 1.3, ease: 'expo.inOut' },
        { trigger: photo, start: 'top 78%', method: 'to' }
      )

      /* A moldura interna tem 120% da altura e começa 10% acima:
         ±7% de yPercent (±8.4% do container) nunca expõe a borda.
         Camada de GPU só enquanto a foto está na tela. */
      gsap.fromTo(
        parallax,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: {
            trigger: photo,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            onToggle: whileActive(parallax),
          },
        }
      )

      reveal(
        q('[data-reveal]'),
        { yPercent: 180, duration: 1.05, ease: 'power4.out', stagger: 0.07 },
        { trigger: q('[data-copy]')[0], start: 'top 75%' }
      )
      reveal(
        q('[data-principle]'),
        { opacity: 0, x: -24, duration: 0.8, ease: 'power3.out', stagger: 0.08 },
        { trigger: q('[data-principles]')[0], start: 'top 88%' }
      )
    },
    { scope: root, dependencies: [canHover, prefersReduced], revertOnUpdate: true }
  )

  return (
    <section ref={root} id="perfil" className="relative z-10">
      <div className="grid grid-cols-1 gap-[8vh] px-6 md:px-[6vw] pb-[14vh] pt-[18vh] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-[5vw]">
        {/* -- Foto ----------------------------------------------- */}
        <figure>
          <div
            data-photo
            className="photo-reveal relative aspect-[4/5] w-full overflow-hidden border border-bone/15 bg-carbon"
          >
            <div data-parallax className="absolute inset-x-0 -top-[10%] h-[120%]">
              <img
                src={PROFILE.photo}
                alt={PROFILE.photoAlt}
                width={PROFILE.photoWidth}
                height={PROFILE.photoHeight}
                loading="lazy"
                decoding="async"
                draggable="false"
                className="h-full w-full object-cover"
                style={{ objectPosition: PROFILE.photoPosition }}
              />
            </div>

            {/* marcas de registro */}
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-bone/70" />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-bone/70" />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-bone/70" />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-bone/70" />
            <span aria-hidden="true" className="type-eyebrow pointer-events-none absolute bottom-5 left-10 text-bone/70">
              Fig. 01
            </span>

            <span data-curtain aria-hidden="true" className="absolute inset-0 z-10 bg-ink" />
          </div>

          {/* Duas linhas fixas: nome e local nas pontas, função embaixo.
              Numa linha só, a função empurrava o local para baixo e ainda
              quebrava no meio ("WEB / DESIGNER"). */}
          <figcaption className="type-eyebrow mt-4 grid gap-y-2 text-ash">
            <span className="flex justify-between gap-6">
              <span className="text-bone/80">Otávio Cruz</span>
              <span>{PROFILE.location}</span>
            </span>
            <span>{PROFILE.role}</span>
          </figcaption>
        </figure>

        {/* -- Texto ---------------------------------------------- */}
        <div data-copy className="flex flex-col justify-between gap-[6vh]">
          <div>
            <div className="line-mask mb-[4vh]">
              <span data-reveal className="type-eyebrow block text-neon">
                Perfil — 002
              </span>
            </div>

            <h2 className="type-brutal text-[11vw] leading-[0.94] md:text-[min(6vw,5.75rem)]">
              {PROFILE.headline.map((line) => (
                <span key={line.text} className="line-mask">
                  <span data-reveal className={`block whitespace-nowrap ${TONE[line.tone]}`}>
                    {line.text}
                  </span>
                </span>
              ))}
            </h2>
          </div>

          <div>
            <div className="line-mask">
              <p
                data-reveal
                className="max-w-[52ch] font-mono text-[clamp(0.82rem,1.05vw,0.95rem)] leading-[1.85] text-bone/75"
              >
                {PROFILE.statement}
              </p>
            </div>

            <ul data-principles className="mt-[5vh] border-t border-bone/12">
              {PROFILE.principles.map((item, i) => (
                <li
                  key={item}
                  data-principle
                  className="flex items-baseline gap-5 border-b border-bone/12 py-4"
                >
                  <span className="type-eyebrow text-neon">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[clamp(1rem,1.4vw,1.25rem)] font-medium text-bone/90">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* -- Stack: letreiro que separa o perfil da vitrine ------- */}
      <div className="border-y border-bone/12 py-[5vh]">
        <p className="sr-only">Stack: {STACK.join(', ')}.</p>
        <div className="mb-[2vh] flex items-center justify-between px-6 md:px-[6vw]">
          <span className="type-eyebrow text-neon">Stack</span>
          <span className="type-eyebrow text-ash">Ferramentas de trabalho</span>
        </div>
        <Marquee
          items={STACK}
          duration={30}
          className="type-brutal text-[clamp(4rem,13vw,13rem)] leading-[1.1]"
          itemClassName={TEXT_OUTLINE}
        />
      </div>
    </section>
  )
}
