import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'

const LINKS = [
  { href: '#perfil', label: 'Perfil' },
  { href: '#work', label: 'Work' },
  { href: '#contato', label: 'Contato' },
]

/**
 * Barra fixa.
 * Nada de mix-blend-difference: ele isola o backdrop e recorta a camada
 * de grão num retângulo visível. O contraste sobre a mídia vem de um
 * scrim que vive DENTRO do hero — um scrim fixo aqui escureceria o topo
 * de todas as seções durante o scroll.
 */
export default function Nav({ ready }) {
  const root = useRef(null)

  useGSAP(
    () => {
      if (!ready) return
      gsap.from(root.current, {
        yPercent: -120,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.15,
      })
    },
    { dependencies: [ready] }
  )

  return (
    <header ref={root} className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="relative flex items-center justify-between px-6 md:px-[6vw] py-[3vh]">
        <a
          data-cursor="hover"
          href="#hero"
          className="pointer-events-auto type-brutal text-[clamp(1rem,1.4vw,1.35rem)] tracking-[-0.03em] text-bone"
        >
          OC<span className="text-neon">.</span>
        </a>

        <nav className="flex items-center gap-5 md:gap-10" aria-label="Navegação principal">
          {LINKS.map((link) => (
            <a
              key={link.href}
              data-cursor="hover"
              href={link.href}
              className="pointer-events-auto type-eyebrow text-bone/85 transition-opacity duration-300 hover:opacity-55"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <span className="hidden items-center gap-2.5 md:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
          </span>
          <span className="type-eyebrow text-bone/85">Disponível</span>
        </span>
      </div>
    </header>
  )
}
