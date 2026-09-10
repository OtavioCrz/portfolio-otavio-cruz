import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { PROJECTS } from '../data/projects'

/**
 * Projects — a Vitrine.
 * Lista tipográfica limpa; no desktop o hover revela a capa do projeto
 * seguindo o cursor. No mobile a capa aparece embutida na própria linha.
 */
export default function Projects() {
  const root = useRef(null)
  const previewRef = useRef(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  /* As capas da prévia só são requisitadas quando a seção chega perto.
     A prévia é `fixed` no canto do viewport: só com loading="lazy" ela
     já "intersecta" no primeiro frame, e as três PNGs disputariam banda
     com o hero ainda durante o preloader. */
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setArmed(true)
        observer.disconnect()
      },
      { rootMargin: '100% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)

      /* -- Reveal das linhas ao entrar na viewport ------------ */
      gsap.from(q('[data-reveal]'), {
        yPercent: 180,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 72%' },
      })

      gsap.from(q('[data-rule]'), {
        scaleX: 0,
        transformOrigin: '0% 50%',
        duration: 1.1,
        ease: 'power3.inOut',
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 72%' },
      })

      /* -- Hover reveal (somente desktop com mouse) ----------- */
      if (!isDesktop) return

      const preview = previewRef.current
      const images = q('[data-preview-img]')
      const rows = q('[data-project]')

      gsap.set(preview, { autoAlpha: 0, scale: 0.86 })
      gsap.set(images, { autoAlpha: 0 })

      /* Segue o cursor sem rotação: capas de site precisam chegar
         alinhadas ao grid da tela, não inclinadas. */
      const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' })
      const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' })
      const onMove = (event) => {
        xTo(event.clientX)
        yTo(event.clientY)
      }
      window.addEventListener('pointermove', onMove, { passive: true })

      const cleanups = rows.map((row, i) => {
        const title = row.querySelector('[data-title]')
        const arrow = row.querySelector('[data-arrow]')
        gsap.set(arrow, { x: -24 })

        const onEnter = () => {
          gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' })
          gsap.to(images, { autoAlpha: 0, duration: 0.2 })
          gsap.to(images[i], { autoAlpha: 1, duration: 0.35 })
          gsap.to(title, { x: 28, color: '#A855F7', duration: 0.55, ease: 'power3.out' })
          gsap.to(arrow, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' })
        }
        const onLeave = () => {
          gsap.to(preview, { autoAlpha: 0, scale: 0.86, duration: 0.4, ease: 'power3.out' })
          gsap.to(title, { x: 0, color: '#F2F0EA', duration: 0.55, ease: 'power3.out' })
          gsap.to(arrow, { autoAlpha: 0, x: -24, duration: 0.4, ease: 'power3.out' })
        }

        row.addEventListener('pointerenter', onEnter)
        row.addEventListener('pointerleave', onLeave)
        return () => {
          row.removeEventListener('pointerenter', onEnter)
          row.removeEventListener('pointerleave', onLeave)
        }
      })

      return () => {
        window.removeEventListener('pointermove', onMove)
        cleanups.forEach((fn) => fn())
      }
    },
    { scope: root, dependencies: [isDesktop], revertOnUpdate: true }
  )

  return (
    <section
      ref={root}
      id="work"
      className="relative z-10 bg-ink px-6 md:px-[6vw] py-[16vh]"
    >
      {/* Cabeçalho */}
      <div className="mb-[9vh] flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="line-mask">
            <span data-reveal className="type-eyebrow block text-neon">
              Vitrine — 003
            </span>
          </span>
          <div className="line-mask mt-4">
            <h2
              data-reveal
              className="type-brutal block text-[clamp(2.4rem,8vw,8rem)]"
            >
              Work
            </h2>
          </div>
        </div>
        <div className="line-mask">
          <p data-reveal className="block max-w-[34ch] font-mono text-xs leading-relaxed text-ash">
            Três projetos em produção. Passe o cursor para ver.
          </p>
        </div>
      </div>

      {/* Lista */}
      <ul className="w-full">
        {PROJECTS.map((project) => (
          <li key={project.id}>
            <span data-rule className="block h-px w-full bg-bone/18" />
            <a
              data-project
              data-cursor="hover"
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block py-[6vw] md:py-[2.6vw]"
              aria-label={`${project.title} — ${project.role} (abre em nova aba)`}
            >
              {/* O título ocupa a linha inteira; a função e o ano descem
                  para uma segunda linha. É o que permite manter a escala
                  tipográfica sem estourar a máscara em títulos longos. */}
              <div className="flex items-center gap-5 md:gap-8">
                <span className="type-eyebrow w-8 shrink-0 text-ash md:w-10">{project.index}</span>

                {/* A seta fica FORA da máscara (para não ser recortada)
                    e é absoluta, para não empurrar o título no layout. */}
                <span className="relative flex min-w-0 flex-1 items-center">
                  <span
                    data-arrow
                    aria-hidden="true"
                    className="absolute left-0 hidden shrink-0 text-neon opacity-0 md:block"
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>

                  {/* Quebra linha no mobile: a 390px "Maria Pitanga Portugal"
                      já passa da largura útil e a máscara cortaria o fim. */}
                  <span className="line-mask w-full">
                    <span
                      data-title
                      data-reveal
                      className="type-brutal block whitespace-normal text-[clamp(1.35rem,4.6vw,4.6rem)] text-bone md:whitespace-nowrap"
                    >
                      {project.title}
                    </span>
                  </span>
                </span>

                <span className="type-eyebrow hidden shrink-0 text-smoke lg:block">
                  {project.year}
                </span>
              </div>

              <div className="mt-3 flex pl-[calc(2rem+1.25rem)] md:mt-4 md:pl-[calc(2.5rem+2rem)]">
                <span className="type-eyebrow text-ash">{project.role}</span>
              </div>

              {/* Capa embutida — mobile. Mesma proporção do arquivo: sem corte. */}
              <span className="mt-6 block overflow-hidden border border-bone/15 md:hidden">
                <img
                  src={project.cover}
                  alt={`Prévia do projeto ${project.title}`}
                  width={project.coverWidth}
                  height={project.coverHeight}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[1905/945] w-full object-cover object-top"
                />
              </span>
            </a>
          </li>
        ))}
        <li aria-hidden="true">
          <span data-rule className="block h-px w-full bg-bone/18" />
        </li>
      </ul>

      {/* Prévia flutuante — desktop */}
      <div
        ref={previewRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-40 hidden md:block"
      >
        {/* Caixa em px pares e na proporção das capas (~2:1). Com isso o
            -50% de centralização cai sempre em pixel inteiro e a capa
            para no lugar nítida — sem reamostragem de meio pixel — e
            object-cover nunca distorce, só apara <1% das bordas. */}
        <div className="relative h-[158px] w-[320px] -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-bone/20 bg-ink shadow-[0_30px_80px_-20px_rgba(168,85,247,0.45)] lg:h-[188px] lg:w-[380px] xl:h-[208px] xl:w-[420px]">
          {PROJECTS.map((project) => (
            <img
              key={project.id}
              data-preview-img
              src={armed ? project.cover : undefined}
              alt=""
              width={project.coverWidth}
              height={project.coverHeight}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
