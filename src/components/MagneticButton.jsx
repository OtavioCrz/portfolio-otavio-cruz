import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useMediaQuery } from '../hooks/useMediaQuery'

/**
 * Botão magnético.
 * A área de captura é maior que o botão visível, então ele começa a
 * ser "puxado" antes do cursor tocá-lo. O rótulo se desloca em uma
 * fração do deslocamento do botão — cria paralaxe interna.
 *
 * Com `href` é um link (externo abre em nova aba); sem ele, um <button>
 * — o "Voltar" da política de privacidade, por exemplo.
 */
export default function MagneticButton({
  href,
  children,
  strength = 0.4,
  className = '',
  ...rest
}) {
  const Tag = href ? 'a' : 'button'
  const external = /^https?:/.test(href ?? '')
  const tagProps = href
    ? { href, ...(external && { target: '_blank', rel: 'noopener noreferrer' }) }
    : { type: 'button' }
  const root = useRef(null)
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useGSAP(
    () => {
      const area = root.current
      const button = area.querySelector('[data-magnet]')
      const label = area.querySelector('[data-label]')
      const halo = area.querySelector('[data-halo]')

      /* estado inicial vem do GSAP (e nao de uma classe utilitaria)
         para nao multiplicar com a propriedade CSS `scale` */
      gsap.set(halo, { scale: 0, transformOrigin: '50% 50%' })

      if (!canHover || prefersReduced) return

      const ease = 'elastic.out(1, 0.55)'
      const xTo = gsap.quickTo(button, 'x', { duration: 0.9, ease })
      const yTo = gsap.quickTo(button, 'y', { duration: 0.9, ease })
      const lxTo = gsap.quickTo(label, 'x', { duration: 1.1, ease })
      const lyTo = gsap.quickTo(label, 'y', { duration: 1.1, ease })

      const onMove = (event) => {
        const rect = button.getBoundingClientRect()
        const relX = event.clientX - (rect.left + rect.width / 2)
        const relY = event.clientY - (rect.top + rect.height / 2)
        xTo(relX * strength)
        yTo(relY * strength)
        lxTo(relX * strength * 0.42)
        lyTo(relY * strength * 0.42)
      }

      const onEnter = () => gsap.to(halo, { scale: 1, duration: 0.6, ease: 'power3.out' })

      const onLeave = () => {
        xTo(0)
        yTo(0)
        lxTo(0)
        lyTo(0)
        gsap.to(halo, { scale: 0, duration: 0.5, ease: 'power3.inOut' })
      }

      area.addEventListener('pointermove', onMove)
      area.addEventListener('pointerenter', onEnter)
      area.addEventListener('pointerleave', onLeave)

      return () => {
        area.removeEventListener('pointermove', onMove)
        area.removeEventListener('pointerenter', onEnter)
        area.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: root, dependencies: [canHover, prefersReduced, strength], revertOnUpdate: true }
  )

  return (
    <div ref={root} className="inline-block p-[3vw] md:p-[2.5vw]">
      <Tag
        data-magnet
        data-cursor="hover"
        {...tagProps}
        className={`group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full border border-bone/25 px-[clamp(2rem,6vw,5rem)] py-[clamp(1.1rem,3vw,2.4rem)] ${className}`}
        {...rest}
      >
        {/* preenchimento que cresce do centro no hover */}
        <span
          data-halo
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-neon"
        />
        <span
          data-label
          className="type-brutal block text-[clamp(1.6rem,5vw,4.5rem)] transition-colors duration-300 group-hover:text-ink"
        >
          {children}
        </span>
      </Tag>
    </div>
  )
}
