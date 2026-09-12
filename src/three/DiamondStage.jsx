import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping, BackSide } from 'three'
import cityHdr from '../assets/env/potsdamer_platz_512.hdr?url'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { isStageHidden } from '../lib/stage'
import Diamond from './Diamond'
import { createDiamondState } from './diamondState'
import { useDiamondChoreography } from './useDiamondChoreography'

/* Degraus de qualidade, do mais caro ao mais barato. Nenhum recompila shader: as amostras
   da transmissão são compiladas no material e ficam fixas por aparelho; o dpr só
   redimensiona o canvas, a resolução realoca os FBOs da transmissão e `backside` pula uma
   passada inteira de render (último recurso: é o que dá profundidade às facetas de trás).
   Abaixo do último degrau, o palco sai de cena. */
const TIERS = [
  { dpr: 1.5, resolution: 1024, backside: true },
  { dpr: 1.25, resolution: 512, backside: true },
  { dpr: 1, resolution: 512, backside: true },
  { dpr: 1, resolution: 256, backside: false },
]
const OFF = TIERS.length

/* Teto de 60 fps: em telas de 90/120/144 Hz o canvas renderizaria até 2,4× mais quadros
   sem ganho visível. Em aparelho fraco com a página parada, 30 fps bastam para a
   flutuação lenta. */
const FRAME = 1 / 60
const IDLE_FRAME = 1 / 30

/* Medição em janelas de 1 s de quadros renderizados, pela MEDIANA do intervalo — um soluço
   isolado (GC, uma tarefa longa) não derruba a qualidade de um aparelho bom:
     - acima de 1,4× o alvo (abaixo de ~43 fps no teto de 60) em duas janelas seguidas, desce
       um degrau; acima de 3× (abaixo de 20 fps), desce na hora; acima de 6× (abaixo de 10
       fps), pula direto para o último — degrau a degrau seriam segundos de página travada;
     - tirar o 3D pede mais evidência: no último degrau, só com duas janelas acima de 2×
       (abaixo de ~30 fps). A medida é o ritmo da página inteira, e uma página que já roda a
       40 fps sem o 3D não deve perdê-lo por isso.
   Nunca sobe de volta: oscilar entre degraus custa mais do que ficar um abaixo. Depois de
   cada retomada ou troca de degrau, 0,5 s de carência — são os quadros que pagam FBO novo e
   canvas redimensionado. */
const SLOW = 1.4
const CRAWL = 3
const CRASH = 6
const DROP = 2
const GRACE = 0.5

function Choreography(props) {
  useDiamondChoreography(props)
  return null
}

/* Compila os programas antes do 1º quadro, sem travar a thread principal: compileAsync
   usa KHR_parallel_shader_compile e só resolve quando o driver termina. O material de
   transmissão tem duas variantes — a passada de trás usa side = BackSide —, então as duas.
   Sem isto, o 1º render compilava tudo de uma vez numa única tarefa longa. */
async function precompile(gl, scene, camera) {
  await gl.compileAsync(scene, camera)
  const flipped = []
  scene.traverse((object) => {
    const material = object.material
    if (material?.uniforms?._transmission && material.side !== BackSide) {
      flipped.push([material, material.side])
      material.side = BackSide
      material.needsUpdate = true
    }
  })
  if (!flipped.length) return
  await gl.compileAsync(scene, camera)
  for (const [material, side] of flipped) {
    material.side = side
    material.needsUpdate = true
  }
}

/* Environment "silencioso": o HDR do preset "city" do drei (Potsdamer Platz, Poly Haven,
   CC0), servido pelo próprio site, com background={false} — reflexos sem mexer no preto da
   página. Reduzido de 1024×512 para 512×256: a 0,1 de intensidade a cidade é só textura nas
   facetas, e a metade da resolução custa 1/3 do download (525 KB em vez de 1,5 MB) e 1/4
   da decodificação. frames={1}: o cubo é renderizado uma vez, não a cada quadro.
   memo: sem props, o componente nunca re-renderiza. Uma troca de degrau re-renderiza o
   palco, e um <Environment> re-renderizado refaz o cubo e o PMREM — caro justamente no
   aparelho que acabou de pedir alívio. */
const DarkStudio = memo(function DarkStudio() {
  return (
    /* environmentIntensity, e não envMapIntensity no material: com environment de cena, o
       three (r163+) usa scene.environmentIntensity e ignora o do material. */
    <Environment files={cityHdr} background={false} environmentIntensity={0.1} resolution={512} frames={1}>
      {/* Anel, e não retângulo: várias facetas pegam filetes de roxo em vez de uma só
          acender inteira. Violeta #6d28d9: o tone mapping ACES puxa roxos saturados e
          intensos para o rosa. 12 × 0,1 = 1,2 efetivo — forte, e ainda roxo. */}
      <Lightformer form="ring" color="#6d28d9" intensity={12} position={[0, -5, 0]} scale={8} target={[0, 0, 0]} />
    </Environment>
  )
})

/**
 * Dono do loop de render. O Canvas roda com frameloop="never" e cada quadro sai daqui, no
 * ticker do GSAP — o mesmo relógio do scroll e das timelines. Um quadro só é renderizado
 * quando:
 *   - o preloader já saiu. O 1º quadro é a exceção: sai ainda escondido, para compilar os
 *     shaders e preencher os FBOs durante o preloader, e não no meio da entrada;
 *   - nada opaco cobre o palco (lib/stage: hero aberto, menu mobile, fim do final);
 *   - a aba está visível;
 *   - o teto de fps permite.
 * Parado, o canvas mantém o último quadro na tela e a GPU fica livre.
 */
function RenderDriver({ ready, lowPower, last, onSlow }) {
  const advance = useThree((three) => three.advance)
  const gl = useThree((three) => three.gl)
  const scene = useThree((three) => three.scene)
  const camera = useThree((three) => three.camera)
  const readyRef = useRef(ready)
  const lastRef = useRef(last)

  useEffect(() => {
    readyRef.current = ready
    lastRef.current = last
  }, [ready, last])

  useEffect(() => {
    let compiled = false
    let compiling = false
    let warmed = false
    let next = 0
    let previous = 0
    let graceUntil = 0
    let windowStart = -1
    let samples = []
    let strike = false

    const tick = (time) => {
      /* nada sai antes de os shaders estarem prontos (ver precompile) */
      if (!compiled) {
        if (!compiling) {
          compiling = true
          precompile(gl, scene, camera)
            .catch(() => {})
            .then(() => {
              compiled = true
            })
        }
        return
      }
      if (warmed && (!readyRef.current || isStageHidden() || document.hidden)) {
        graceUntil = time + GRACE
        windowStart = -1
        return
      }
      const interval = lowPower && !ScrollTrigger.isScrolling() ? IDLE_FRAME : FRAME
      if (time < next - 0.002) return
      next = time - next > interval ? time + interval : next + interval

      const elapsed = time - previous
      previous = time
      advance(time)

      if (!warmed) {
        warmed = true
        graceUntil = time + GRACE
        return
      }
      if (time < graceUntil) return
      if (windowStart < 0) {
        windowStart = time
        samples = []
        return
      }
      samples.push(elapsed / interval)
      if (time - windowStart < 1) return

      samples.sort((a, b) => a - b)
      const median = samples[samples.length >> 1]
      const last = lastRef.current
      const limit = last ? DROP : SLOW
      windowStart = -1
      if (!last && median > CRAWL) {
        strike = false
        graceUntil = time + GRACE
        onSlow(median > CRASH)
      } else if (median > limit && strike) {
        strike = false
        graceUntil = time + GRACE
        onSlow(false)
      } else {
        strike = median > limit
      }
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [advance, gl, scene, camera, lowPower, onSlow])

  return null
}

/**
 * Canvas global: fixo, cobre a tela inteira e fica ATRÁS do conteúdo (z-0; o conteúdo vive
 * num contexto z-[1] com seções sem fundo). Não recebe ponteiro.
 *
 * Duas camadas de opacidade para dois donos: `intro` faz a entrada depois do preloader e
 * `outro` é a saída no fim do final. Separadas, uma nunca desfaz a outra — nem quando a
 * página recarrega já no rodapé.
 */
export default function DiamondStage({ ready }) {
  const state = useMemo(createDiamondState, [])
  const intro = useRef(null)
  const outro = useRef(null)

  const device = useMemo(() => {
    const lowPower =
      window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4
    return {
      lowPower,
      samples: lowPower ? 6 : 10,
      /* Em tela de alta densidade (dpr ≥ 2) o serrilhado já é menor que o pixel físico: o
         MSAA do canvas vira só custo de memória e de banda. */
      antialias: window.devicePixelRatio < 2,
    }
  }, [])

  const [tier, setTier] = useState(() => (device.lowPower ? 1 : 0))
  const [gone, setGone] = useState(false)
  const onSlow = useCallback(
    (jump) => setTier((current) => (jump ? Math.max(current, OFF - 1) : Math.min(current + 1, OFF))),
    []
  )
  const quality = TIERS[Math.min(tier, OFF - 1)]

  /* Abaixo do último degrau o aparelho não sustenta o 3D: o palco sai com um fade e a
     página volta ao ritmo dela. Desmontar a cena desfaz a coreografia — o pin do final
     some e o rodapé volta a ser uma seção comum —, então os gatilhos são recalculados. É um
     trabalho único, mas pesado: espera a página parar, para cair na leitura, e não no meio
     do scroll. */
  useEffect(() => {
    if (tier < OFF) return
    let tween = null
    const leave = () => {
      if (ScrollTrigger.isScrolling()) return
      gsap.ticker.remove(leave)
      tween = gsap.to(intro.current, { autoAlpha: 0, duration: 0.6, onComplete: () => setGone(true) })
    }
    gsap.ticker.add(leave)
    return () => {
      gsap.ticker.remove(leave)
      tween?.kill()
    }
  }, [tier])

  useEffect(() => {
    if (!gone) return
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [gone])

  return (
    <div
      ref={intro}
      aria-hidden="true"
      data-stage-tier={tier}
      className="pointer-events-none invisible fixed inset-0 z-0 opacity-0"
    >
      <div ref={outro} className="absolute inset-0">
        <Canvas
          frameloop="never"
          dpr={[1, quality.dpr]}
          camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 50 }}
          gl={{ antialias: device.antialias, alpha: true, stencil: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping
            gl.toneMappingExposure = 1.1
            /* Em produção, sem a checagem síncrona de erros de shader: ela obriga o driver
               a terminar cada compilação na hora, travando o preloader. */
            gl.debug.checkShaderErrors = import.meta.env.DEV
          }}
          style={{ pointerEvents: 'none' }}
        >
          {/* Sem 3D (gone), sai a cena e fica o canvas, parado e invisível: desmontar o
              Canvas derrubaria o contexto WebGL, e isso obriga o navegador a esperar a GPU
              terminar tudo o que tem na fila — segundos, justamente no aparelho mais lento. */}
          {!gone && (
            <Suspense fallback={null}>
              <DarkStudio />
              <Diamond
                state={state}
                samples={device.samples}
                resolution={quality.resolution}
                backside={quality.backside}
              />
              {/* só depois do modelo e do HDR carregarem: a coreografia (e a máscara do
                  rodapé) nunca existe sem o diamante que ela anima, e o 1º quadro — o que
                  compila os shaders — já sai com a cena completa */}
              <Choreography state={state} intro={intro} outro={outro} ready={ready} />
              <RenderDriver ready={ready} lowPower={device.lowPower} last={tier >= OFF - 1} onSlow={onSlow} />
            </Suspense>
          )}
        </Canvas>
      </div>
    </div>
  )
}
