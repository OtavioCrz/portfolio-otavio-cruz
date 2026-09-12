import { useEffect, useRef, useState } from 'react'
import { gsap, demote, promote, reveal, useGSAP } from '../lib/gsap'
import MagneticButton from './MagneticButton'
import { CONTACT } from '../data/projects'

/* Rodapé utilitário: redes e contato direto */
const LINKS = [
  { label: 'WhatsApp', href: CONTACT.whatsapp },
  { label: 'Instagram', href: CONTACT.instagram },
  { label: 'LinkedIn', href: CONTACT.linkedin },
  { label: 'GitHub', href: CONTACT.github },
  { label: 'E-mail', href: `mailto:${CONTACT.email}` },
]

/* Relógio isolado: só ele renderiza de novo a cada segundo, não o rodapé inteiro */
function LocalClock() {
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
  return <span className="tabular-nums text-bone/70">{time}</span>
}

export default function Footer() {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const glowEl = q('[data-glow]')[0]

      reveal(
        q('[data-reveal]'),
        { yPercent: 180, duration: 1.05, ease: 'power4.out', stagger: 0.08 },
        { trigger: root.current, start: 'top 78%' }
      )

      /* Brilho roxo que respira atrás do CTA. Loop infinito: roda só com o rodapé na
         tela, e com camada de GPU só enquanto respira. */
      const glow = gsap.to(glowEl, {
        opacity: 0.55,
        scale: 1.12,
        duration: 3.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true,
      })
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          promote(glowEl)
          glow.play()
        } else {
          glow.pause()
          demote(glowEl)
        }
      })
      io.observe(root.current)

      return () => {
        io.disconnect()
        demote(glowEl)
      }
    },
    { scope: root }
  )

  return (
    <footer
      ref={root}
      id="contato"
      className="relative z-10 flex min-h-svh flex-col justify-between overflow-hidden border-t border-bone/12 bg-ink px-6 md:px-[6vw] pb-[6vh] pt-[16vh]"
    >
      {/* Halo de fundo: gradiente radial (.footer-glow, index.css), e não um disco com
          blur(120px). Na tela é o mesmo brilho difuso, mas o desfoque era refeito a cada
          quadro do respiro — o filtro mais caro que há, numa área de meia tela. O
          gradiente é rasterizado uma vez; o respiro vira só composição. */}
      <div
        data-glow
        aria-hidden="true"
        className="footer-glow pointer-events-none absolute left-1/2 -z-0 -translate-x-1/2 opacity-25"
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

      {/* Rodapé utilitário — em linha só a partir do lg: com cinco links,
          no tablet ele não cabe numa linha e empilha como no celular */}
      <div className="relative mt-[14vh] flex flex-col gap-6 border-t border-bone/12 pt-8 lg:flex-row lg:items-center lg:justify-between">
        <span className="type-eyebrow text-ash">© {new Date().getFullYear()} Otávio Cruz</span>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3" aria-label="Links de contato">
          {LINKS.map(({ label, href }) => {
            const external = href.startsWith('http')
            return (
              <a
                key={label}
                data-cursor="hover"
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="type-eyebrow text-bone/80 transition-colors duration-300 hover:text-neon"
              >
                {label}
              </a>
            )
          })}
        </nav>

        <span className="type-eyebrow text-ash">
          Fortaleza, BR — <LocalClock />
        </span>
      </div>
    </footer>
  )
}
