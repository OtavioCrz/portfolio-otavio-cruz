import { useSyncExternalStore } from 'react'

/**
 * Media query reativa e SSR-safe.
 * Usada como dependência do useGSAP para reconstruir timelines
 * quando o breakpoint muda (desktop <-> mobile).
 */
export function useMediaQuery(query) {
  const subscribe = (callback) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }
  const getSnapshot = () => window.matchMedia(query).matches
  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
