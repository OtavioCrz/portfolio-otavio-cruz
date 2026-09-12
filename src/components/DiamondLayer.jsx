import { lazy, Suspense, useEffect, useState } from 'react'
import ChunkBoundary from './ChunkBoundary'

/* O palco 3D (three + R3F + drei, ~290 KB gzip, mais o HDR e o modelo) é um chunk à
   parte, montado só no navegador e depois da hidratação. Fica fora do HTML
   pré-renderizado — robôs e SEO não precisam dele — e fora do caminho do FCP/LCP.
   Sem WebGL de verdade, ou com movimento reduzido, nada é montado. O contato, que o
   final revela, então continua visível como sempre: quem esconde o rodapé é o palco. */
const DiamondStage = lazy(() => import('../three/DiamondStage'))

/* WebGL por software (SwiftShader, llvmpipe… — GPU bloqueada pelo navegador, máquina
   virtual) não sustenta o material de transmissão nem no degrau mais baixo: medido, a
   página travava em 1–2 fps até o palco desistir sozinho. Melhor nem montar.
   O teste pede o contexto com failIfMajorPerformanceCaveat: nesse caso o navegador
   devolve null, e sem contexto criado não há o que derrubar depois — derrubar um contexto
   por software (loseContext ou o coletor de lixo) trava a página por segundos. Numa GPU de
   verdade, criar e descartar o contexto de teste é barato. A string do renderer fica como
   segunda checagem, para navegador que não sinaliza o caveat. */
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i
const PROBE = { failIfMajorPerformanceCaveat: true }

function canRender3D() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', PROBE) || canvas.getContext('webgl', PROBE)
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    return !SOFTWARE_GL.test(renderer)
  } catch {
    return false
  }
}

export default function DiamondLayer({ ready }) {
  const [enabled, setEnabled] = useState(false)

  /* No servidor e na hidratação o palco não existe: o HTML dos dois lados bate. O
     chunk sai na primeira folga do navegador depois da hidratação — as fontes, que são
     o que segura o preloader, já foram pedidas antes (pré-carregadas no <head>), e o
     preloader ainda cobre o download e a compilação dos shaders. */
  useEffect(() => {
    let idle = null
    let timer = null
    const start = () => {
      if (canRender3D()) setEnabled(true)
    }
    if ('requestIdleCallback' in window) idle = window.requestIdleCallback(start, { timeout: 500 })
    else timer = window.setTimeout(start, 60)
    return () => {
      if (idle !== null) window.cancelIdleCallback(idle)
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  if (!enabled) return null
  return (
    <ChunkBoundary>
      <Suspense fallback={null}>
        <DiamondStage ready={ready} />
      </Suspense>
    </ChunkBoundary>
  )
}
