import { useCallback, useEffect, useState } from 'react'

const HASH = '#privacidade'

/**
 * A política de privacidade como "rota" de uma página só: o overlay abre com o
 * endereço /#privacidade — dá para compartilhar o link, e o botão voltar do
 * navegador fecha, como numa página de verdade.
 *
 * `open` é o endereço; `mounted` segura o componente na tela enquanto a animação
 * de saída roda, e só cai quando ele chama `onExited`.
 */
export function usePrivacyRoute() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const sync = () => {
      const next = window.location.hash === HASH
      setOpen(next)
      if (next) setMounted(true)
    }
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  /* pushState, e não location.hash: não rola a página e marca a entrada no histórico */
  const show = useCallback(() => {
    if (window.location.hash !== HASH) window.history.pushState({ privacy: true }, '', HASH)
    setOpen(true)
    setMounted(true)
  }, [])

  /* aberta por nós: volta no histórico (popstate fecha); aberta por link direto: limpa o endereço */
  const hide = useCallback(() => {
    if (window.history.state?.privacy) {
      window.history.back()
      return
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setOpen(false)
  }, [])

  const onExited = useCallback(() => setMounted(false), [])

  return { open, mounted, show, hide, onExited }
}
