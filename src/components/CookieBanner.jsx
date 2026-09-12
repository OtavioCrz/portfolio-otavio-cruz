import { useRef } from 'react'
import { gsap, demote, promote, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { setConsent } from '../lib/analytics'

/**
 * Aviso de cookies (LGPD) — faixa fixa no pé da tela.
 *
 * Aparece para quem ainda não escolheu, depois da cortina do preloader (não
 * disputa a abertura), e de novo pelo link "Cookies" do rodapé. Recusar é tão
 * fácil quanto aceitar: dois botões do mesmo tamanho, lado a lado.
 *
 * A escolha vai para o localStorage e para o Consent Mode (lib/analytics); a
 * faixa sai com uma animação e só então é desmontada. Fixa e fora do fluxo, ela
 * não move nada da página (CLS 0), e nunca entra no HTML pré-renderizado.
 */
export default function CookieBanner({ delay = 0, onOpenPolicy, onClosed }) {
  const root = useRef(null)
  const deciding = useRef(false)
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  const { contextSafe } = useGSAP(
    () => {
      const el = root.current
      if (prefersReduced) {
        gsap.set(el, { autoAlpha: 1 })
        return
      }
      /* sobe do pé da tela; texto e botões chegam logo atrás */
      promote(el)
      gsap
        .timeline({ delay, onComplete: () => demote(el) })
        .fromTo(el, { yPercent: 100, autoAlpha: 1 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' })
        .from(el.querySelectorAll('[data-item]'), { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, 0.25)
    },
    { scope: root, dependencies: [prefersReduced], revertOnUpdate: true }
  )

  const decide = contextSafe((analytics) => {
    if (deciding.current) return
    deciding.current = true
    setConsent(analytics)
    if (prefersReduced) {
      onClosed()
      return
    }
    const el = root.current
    promote(el)
    gsap.to(el, {
      yPercent: 100,
      duration: 0.6,
      ease: 'power3.in',
      overwrite: true,
      onComplete: () => {
        demote(el)
        onClosed()
      },
    })
  })

  const openPolicy = (event) => {
    event.preventDefault()
    onOpenPolicy()
  }

  return (
    <section
      ref={root}
      aria-label="Aviso de cookies"
      className="invisible fixed inset-x-0 bottom-0 z-[60] border-t border-bone/15 bg-ink px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 md:px-[6vw] md:py-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-[4vw]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <p data-item className="type-brutal shrink-0 text-[clamp(1.6rem,3vw,2.6rem)] leading-none">
            Cookies<span className="text-neon">?</span>
          </p>
          <p data-item className="max-w-[64ch] font-mono text-[clamp(0.78rem,0.95vw,0.9rem)] leading-relaxed text-bone/75">
            Uso cookies de análise (Google Analytics) para entender, de forma anônima, como o site é
            usado. Eles só entram se você aceitar.{' '}
            <a
              href="#privacidade"
              data-cursor="hover"
              onClick={openPolicy}
              className="text-bone underline decoration-bone/40 underline-offset-4 transition-colors duration-300 hover:text-neon hover:decoration-neon"
            >
              Política de Privacidade
            </a>
          </p>
        </div>

        <div data-item className="flex shrink-0 gap-3">
          <button
            type="button"
            data-cursor="hover"
            onClick={() => decide('denied')}
            className="type-eyebrow flex-1 border border-bone/40 px-6 py-4 text-bone transition-colors duration-300 hover:border-bone lg:flex-none"
          >
            Recusar
          </button>
          <button
            type="button"
            data-cursor="hover"
            onClick={() => decide('granted')}
            className="type-eyebrow group relative flex-1 overflow-hidden border border-bone bg-bone px-7 py-4 text-ink transition-colors duration-500 hover:border-neon focus-visible:border-neon lg:flex-none"
          >
            {/* o neon sobe por dentro no hover — só transform, no compositor */}
            <span
              aria-hidden="true"
              className="absolute inset-0 origin-bottom scale-y-0 bg-neon transition-transform duration-500 ease-out-expo group-hover:scale-y-100 group-focus-visible:scale-y-100"
            />
            <span className="relative">Aceitar</span>
          </button>
        </div>
      </div>
    </section>
  )
}
