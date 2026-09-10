import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'

/**
 * Cortina de entrada.
 * Segura a cena até as fontes estarem prontas — o HeroMask depende de
 * medidas tipográficas corretas para o ScrollTrigger não recalcular
 * no meio da primeira animação.
 *
 * intro roda sempre; outro só dispara quando (fontes prontas + intro
 * terminada), com um limite de segurança para nunca prender o site.
 */
export default function Preloader({ onComplete }) {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const num = q('[data-num]')[0]
      const bar = q('[data-bar]')[0]
      const brand = q('[data-brand]')
      const meta = q('[data-meta]')

      gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' })

      const counter = { value: 0 }

      const intro = gsap.timeline()
      intro
        .to(counter, {
          value: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            num.textContent = String(Math.round(counter.value)).padStart(3, '0')
          },
        })
        .to(bar, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
        .from(brand, { yPercent: 180, duration: 0.9, ease: 'power4.out', stagger: 0.06 }, 0.1)

      const outro = gsap.timeline({
        paused: true,
        onComplete: () => onComplete?.(),
      })
      outro
        .to(brand, { yPercent: -180, duration: 0.7, ease: 'power3.inOut', stagger: 0.05 })
        .to(meta, { autoAlpha: 0, duration: 0.35 }, '<')
        .to(root.current, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '<0.25')
        .set(root.current, { display: 'none' })

      let released = false
      const release = () => {
        if (released) return
        released = true
        outro.play()
      }

      const fontsReady =
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()

      Promise.all([fontsReady, intro.then()]).then(release)

      /* rede de segurança: nada segura a página por mais de 4.5s */
      const failsafe = gsap.delayedCall(4.5, release)

      return () => failsafe.kill()
    },
    { scope: root }
  )

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[110] flex flex-col justify-between bg-ink px-6 md:px-[6vw] py-[6vh]"
    >
      <div data-meta className="type-eyebrow flex justify-between text-ash">
        <span>Otávio Cruz</span>
        <span>Portfólio 2026</span>
      </div>

      <div className="flex flex-col items-center">
        <h2 className="type-brutal text-center text-[clamp(2.2rem,11vw,10rem)] leading-[0.86]">
          <span className="line-mask">
            <span data-brand className="block">
              OTÁVIO
            </span>
          </span>
          <span className="line-mask">
            <span data-brand className="block text-neon">
              CRUZ
            </span>
          </span>
        </h2>
      </div>

      <div data-meta className="flex items-end justify-between gap-6">
        <span
          data-num
          className="type-brutal text-[clamp(2rem,7vw,5rem)] leading-none tabular-nums"
        >
          000
        </span>
        <div className="mb-3 h-px flex-1 bg-bone/15">
          <span data-bar className="block h-px w-full bg-neon" />
        </div>
      </div>
    </div>
  )
}
