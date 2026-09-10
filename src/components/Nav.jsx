import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { CONTACT } from '../data/projects'

/* Mesma ordem das seções na página */
const LINKS = [
  { href: '#perfil', label: 'Perfil' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#work', label: 'Work' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contato', label: 'Contato' },
]

const pad = (n) => String(n).padStart(2, '0')

/**
 * Barra fixa + menu mobile.
 *
 * Desktop (md+): os cinco links em linha. Abaixo disso eles não cabem, então
 * um botão "Menu" abre uma tela cheia com os links em tipografia gigante —
 * fecha com Esc, com o clique num link ou com o próprio botão; enquanto está
 * aberto, trava a rolagem e deixa o resto da página `inert`.
 *
 * Nada de mix-blend-difference na barra: ele isola o backdrop e recorta a
 * camada de grão num retângulo visível. O contraste sobre a mídia vem de um
 * scrim que vive DENTRO do hero.
 */
export default function Nav({ ready }) {
  const header = useRef(null)
  const overlay = useRef(null)
  const toggle = useRef(null)
  const menuTl = useRef(null)
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  /* entrada da barra quando o preloader sai */
  useGSAP(
    () => {
      if (!ready) return
      gsap.from(header.current, {
        yPercent: -120,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.15,
      })
    },
    { dependencies: [ready] }
  )

  /* timeline do menu: montada pausada; o estado `open` toca ou reverte */
  useGSAP(
    () => {
      const q = gsap.utils.selector(overlay)
      menuTl.current = gsap
        .timeline({ paused: true })
        .fromTo(
          overlay.current,
          { autoAlpha: 0, yPercent: -100 },
          { autoAlpha: 1, yPercent: 0, duration: 0.7, ease: 'expo.inOut' }
        )
        .fromTo(
          q('[data-menu-word]'),
          { yPercent: 180 },
          { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.06 },
          '-=0.25'
        )
        .fromTo(q('[data-menu-meta]'), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.03 }, '-=0.5')

      return () => {
        menuTl.current = null
      }
    },
    { scope: overlay }
  )

  useEffect(() => {
    const tl = menuTl.current
    if (!tl) return
    if (prefersReduced) tl.progress(open ? 1 : 0).pause()
    else if (open) tl.timeScale(1).play()
    else tl.timeScale(1.5).reverse()
  }, [open, prefersReduced])

  /* aberto: trava a rolagem, isola a página, foca o primeiro link, Esc fecha */
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const page = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean)
    const button = toggle.current

    html.style.overflow = 'hidden'
    page.forEach((el) => el.setAttribute('inert', ''))
    /* O GSAP só pinta o 1º quadro no próximo tick; até lá o menu segue com
       `visibility: hidden`, e elemento invisível não recebe foco. Liberar a
       visibilidade já (a opacidade ainda é 0) deixa o foco entrar agora. */
    overlay.current.style.visibility = 'visible'
    overlay.current.querySelector('[data-menu-link]')?.focus({ preventScroll: true })

    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      html.style.overflow = ''
      page.forEach((el) => el.removeAttribute('inert'))
      window.removeEventListener('keydown', onKey)
      button?.focus({ preventScroll: true })
    }
  }, [open])

  /* se a janela crescer até o desktop com o menu aberto, fecha */
  useEffect(() => {
    if (isDesktop) setOpen(false)
  }, [isDesktop])

  const close = () => setOpen(false)

  return (
    <>
      {/* Menu mobile — irmão do <header>, e não filho: a entrada da barra deixa
          um transform nela, e um `fixed` dentro de um elemento com transform
          passa a se posicionar por ele, não pela tela. */}
      <div
        ref={overlay}
        id="menu-mobile"
        data-lenis-prevent
        className="invisible fixed inset-0 z-[45] flex flex-col justify-between bg-ink px-6 pb-[6vh] pt-[16vh] md:hidden"
      >
        <nav aria-label="Menu">
          <ul className="border-t border-bone/12">
            {LINKS.map((link, i) => (
              <li key={link.href} className="border-b border-bone/12">
                <a
                  href={link.href}
                  data-menu-link
                  onClick={close}
                  className="group flex items-baseline gap-4 py-3"
                >
                  <span data-menu-meta className="type-eyebrow w-6 shrink-0 text-neon">
                    {pad(i + 1)}
                  </span>
                  <span className="line-mask flex-1">
                    <span
                      data-menu-word
                      className="type-brutal block text-[clamp(2.4rem,13vw,4.5rem)] leading-[0.9] text-bone transition-colors duration-300 group-hover:text-neon group-focus-visible:text-neon"
                    >
                      {link.label}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div data-menu-meta className="flex items-end justify-between gap-6">
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
            </span>
            <span className="type-eyebrow text-bone/85">Disponível para projetos</span>
          </span>
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="type-eyebrow text-bone underline decoration-neon underline-offset-4"
          >
            WhatsApp ↗
          </a>
        </div>
      </div>

      <header ref={header} className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="relative flex items-center justify-between px-6 py-[3vh] md:px-[6vw]">
          <a
            data-cursor="hover"
            href="#hero"
            onClick={close}
            className="pointer-events-auto type-brutal text-[clamp(1rem,1.4vw,1.35rem)] tracking-[-0.03em] text-bone"
          >
            OC<span className="text-neon">.</span>
          </a>

          <nav className="hidden items-center gap-10 md:flex" aria-label="Navegação principal">
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

          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((value) => !value)}
            className="pointer-events-auto type-eyebrow flex items-center gap-2.5 py-2 text-bone md:hidden"
          >
            <span
              aria-hidden="true"
              className={`block h-1.5 w-1.5 rounded-full bg-neon transition-[scale] duration-300 ${open ? 'scale-150' : ''}`}
            />
            {open ? 'Fechar' : 'Menu'}
          </button>
        </div>
      </header>
    </>
  )
}
