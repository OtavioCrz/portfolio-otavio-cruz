import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import MagneticButton from './MagneticButton'
import { CONTACT } from '../data/projects'

function useLocalClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Fortaleza',
        }).format(new Date())
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function Footer() {
  const root = useRef(null)
  const time = useLocalClock()

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)

      gsap.from(q('[data-reveal]'), {
        yPercent: 180,
        duration: 1.05,
        ease: 'power4.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 78%' },
      })

      /* brilho roxo que respira atrás do CTA */
      gsap.to(q('[data-glow]'), {
        opacity: 0.55,
        scale: 1.12,
        duration: 3.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    },
    { scope: root }
  )

  return (
    <footer
      ref={root}
      id="contato"
      className="relative z-10 overflow-hidden border-t border-bone/12 bg-ink px-6 md:px-[6vw] pb-[6vh] pt-[16vh]"
    >
      {/* halo de fundo */}
      <div
        data-glow
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-neon/25 opacity-25 blur-[120px]"
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="line-mask">
          <span data-reveal className="type-eyebrow block text-neon">
            Contato — 007
          </span>
        </div>

        <div className="line-mask mt-6 max-w-[36ch]">
          <p data-reveal className="block font-mono text-[clamp(0.8rem,1.1vw,0.95rem)] leading-relaxed text-bone/60">
            Tem um projeto que merece ser feito direito? Comece a conversa.
          </p>
        </div>

        <div className="mt-[4vh]">
          <MagneticButton href={CONTACT.whatsapp} aria-label="Falar com Otávio Cruz no WhatsApp">
            Let&rsquo;s talk
          </MagneticButton>
        </div>

        <div className="line-mask">
          <span data-reveal className="type-eyebrow block text-ash">
            {CONTACT.phoneLabel}
          </span>
        </div>
      </div>

      {/* Rodapé utilitário */}
      <div className="relative mt-[14vh] flex flex-col gap-6 border-t border-bone/12 pt-8 md:flex-row md:items-center md:justify-between">
        <span className="type-eyebrow text-ash">© {new Date().getFullYear()} Otávio Cruz</span>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3" aria-label="Links de contato">
          <a
            data-cursor="hover"
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="type-eyebrow text-bone/80 transition-colors duration-300 hover:text-neon"
          >
            WhatsApp
          </a>
          <a
            data-cursor="hover"
            href={CONTACT.github}
            target="_blank"
            rel="noopener noreferrer"
            className="type-eyebrow text-bone/80 transition-colors duration-300 hover:text-neon"
          >
            GitHub
          </a>
          <a
            data-cursor="hover"
            href={`mailto:${CONTACT.email}`}
            className="type-eyebrow text-bone/80 transition-colors duration-300 hover:text-neon"
          >
            E-mail
          </a>
        </nav>

        <span className="type-eyebrow text-ash">
          Fortaleza, BR — <span className="tabular-nums text-bone/70">{time}</span>
        </span>
      </div>
    </footer>
  )
}
