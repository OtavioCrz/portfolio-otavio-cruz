import { useRef } from 'react'
import { gsap, reveal, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { TEXT_OUTLINE } from '../lib/type'
import { SERVICES, SERVICE_AREA } from '../data/services'

/**
 * Serviços — lista vertical em tipografia gigante vazada.
 *
 * Hover (ou foco pelo teclado): o contorno preenche de neon e a descrição, que já ocupa
 * o seu lugar esmaecida, acende e sobe. O espaço fica reservado de propósito: a versão
 * anterior abria a descrição por grid-template-rows (0fr → 1fr), o que recalculava o
 * layout da página inteira a cada quadro do hover — e mudava a altura da página embaixo
 * dos pins do ScrollTrigger. Agora o hover só mexe em opacity e translate, que o
 * navegador anima no compositor. Em telas de toque (sem hover) a descrição já nasce acesa.
 *
 * Cada linha é um link de orçamento no WhatsApp com o serviço já escrito —
 * o que também a torna focável pelo teclado.
 */
export default function Services() {
  const root = useRef(null)
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      if (prefersReduced) return
      const q = gsap.utils.selector(root)
      const list = q('[data-service-list]')[0]

      reveal(
        q('[data-head]'),
        { yPercent: 180, duration: 1.05, ease: 'power4.out', stagger: 0.08 },
        { trigger: root.current, start: 'top 72%' }
      )
      reveal(
        q('[data-rule]'),
        { scaleX: 0, transformOrigin: '0% 50%', duration: 1.2, ease: 'power3.inOut', stagger: 0.12 },
        { trigger: list, start: 'top 85%' }
      )
      reveal(
        q('[data-title]'),
        { yPercent: 180, duration: 1.1, ease: 'power4.out', stagger: 0.12 },
        { trigger: list, start: 'top 85%' }
      )
      reveal(
        q('[data-meta]'),
        { opacity: 0, y: 14, duration: 0.8, ease: 'power3.out', stagger: 0.12, delay: 0.3 },
        { trigger: list, start: 'top 85%' }
      )
    },
    { scope: root, dependencies: [prefersReduced], revertOnUpdate: true }
  )

  return (
    <section ref={root} id="servicos" className="relative z-10 px-6 py-[16vh] md:px-[6vw]">
      <div className="mb-[8vh] flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="line-mask">
            <span data-head className="type-eyebrow block text-neon">
              Serviços — 003
            </span>
          </div>
          <div className="line-mask mt-4">
            <h2 data-head className="type-brutal block text-[clamp(2.4rem,8vw,8rem)]">
              Serviços
            </h2>
          </div>
        </div>
        <div className="line-mask">
          <p data-head className="block max-w-[38ch] font-mono text-xs leading-relaxed text-ash">
            {SERVICE_AREA.summary}. Clique em um serviço para pedir orçamento.
          </p>
        </div>
      </div>

      <ul data-service-list>
        {SERVICES.map((service) => (
          <li key={service.id}>
            <span data-rule className="block h-px w-full bg-bone/18" />
            <a
              href={service.cta}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="hover"
              aria-label={`${service.name} — pedir orçamento no WhatsApp (abre em nova aba)`}
              className="group block py-8 md:py-10"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-8">
                <span data-meta className="type-eyebrow w-10 shrink-0 text-neon md:pt-[0.9em]">
                  {service.index}
                </span>

                <h3 className="type-brutal min-w-0 flex-1 text-[clamp(1.6rem,8.4vw,3.4rem)] leading-[0.94] md:text-[min(5.6vw,6.5rem)]">
                  <span className="line-mask">
                    <span
                      data-title
                      className={`block text-balance ${TEXT_OUTLINE} transition-[color,-webkit-text-stroke-color] duration-500 ease-out group-hover:text-neon group-hover:[-webkit-text-stroke-color:var(--color-neon)] group-focus-visible:text-neon group-focus-visible:[-webkit-text-stroke-color:var(--color-neon)]`}
                    >
                      {service.display}
                    </span>
                  </span>
                  <span
                    data-meta
                    className="type-eyebrow mt-4 block text-ash transition-colors duration-500 group-hover:text-bone"
                  >
                    {service.qualifier}
                  </span>
                </h3>

                <span
                  data-meta
                  aria-hidden="true"
                  className="hidden shrink-0 text-bone/50 transition-[color,rotate] duration-500 ease-out group-hover:rotate-45 group-hover:text-neon md:block md:pt-[0.4em]"
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </div>

              {/* Espaço sempre reservado: o hover só mexe em opacity e translate */}
              <p className="max-w-[58ch] translate-y-2 pt-6 font-mono text-[clamp(0.82rem,1vw,0.95rem)] leading-[1.8] text-bone/70 opacity-35 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 md:pl-[4.5rem] [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
                {service.description}
              </p>
            </a>
          </li>
        ))}
        <li aria-hidden="true">
          <span data-rule className="block h-px w-full bg-bone/18" />
        </li>
      </ul>
    </section>
  )
}
