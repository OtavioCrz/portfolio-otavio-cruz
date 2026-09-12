import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei'
import { Vector3 } from 'three'
import diamondUrl from '../assets/models/diamante.glb?url'

/* quantos vértices tem a cintura (16) e quanto do anel vira janela (o resto fica de aro) */
const GIRDLE_SEGMENTS = 16
const REVEAL_INSET = 0.9
const HIDDEN = 'polygon(50% 50%, 50% 50%, 50% 50%)'
/* rim light neon: intensidade por unidade² do diâmetro — luz física decai com a distância
   ao quadrado, e ela acompanha a pedra de perto em qualquer escala */
const RIM_COLOR = '#b026ff'
const RIM_INTENSITY = 90

const mix = (from, to, t) => from + (to - from) * t

/**
 * O diamante (modelo gerado pelo img2threejs a partir de src/assets/diamante-3d.png):
 * uma joia negra que só aparece pelo que reflete.
 *
 * Material — vidro escuro e nítido: cor #050505 (o shader do MeshTransmissionMaterial tinge a
 * transmissão com a cor, então ela sai quase preta), roughness 0, transmission 1, ior 2.4.
 * A força do environment fica no <Environment environmentIntensity> do DiamondStage: com
 * environment de cena, o three ignora o envMapIntensity do material (desde o r163).
 * Luz — rim light neon exatamente embaixo, que acende o pavilhão e desenha a base contra o
 * #000 sem tocar na coroa; e uma direcional fraca e fria, de cima, para o ponto de brilho da
 * coroa. (O anel neon do environment completa o contorno por reflexo.)
 * Qualidade — amostras, resolução dos FBOs e passada de trás vêm do DiamondStage, que as
 * ajusta ao aparelho e ao desempenho medido.
 *
 * A cada quadro:
 *   1. compõe a jornada com as misturas do final e aplica ao pivô;
 *   2. soma a flutuação ociosa num grupo interno — assim ela não briga com o scroll;
 *   3. leva a rim light para baixo da pedra, onde quer que ela esteja;
 *   4. durante o final, projeta os 16 vértices reais da cintura na tela e usa esse polígono
 *      como clip-path do rodapé: a máscara que revela o contato É a silhueta do diamante.
 */
export default function Diamond({ state, samples, resolution, backside }) {
  const { nodes } = useGLTF(diamondUrl, false) // sem Draco: nada de decoder vindo de CDN
  const mesh = nodes.diamond
  const girdleY = mesh.userData.girdleY ?? 0
  const pivot = useRef(null)
  const stone = useRef(null)
  const rim = useRef(null)
  const lastClip = useRef('')
  const lastApplied = useRef('')

  const ring = useMemo(
    () =>
      Array.from({ length: GIRDLE_SEGMENTS }, (_, j) => {
        const phi = (j / GIRDLE_SEGMENTS) * Math.PI * 2
        return new Vector3(0.5 * Math.sin(phi), girdleY, 0.5 * Math.cos(phi))
      }),
    [girdleY]
  )
  const scratch = useMemo(() => ({ point: new Vector3(), centre: new Vector3() }), [])
  const footer = useMemo(() => document.getElementById('contato'), [])

  useFrame(({ camera, clock, viewport, size }) => {
    const vp = viewport.getCurrentViewport(camera, [0, 0, 0])
    const group = pivot.current

    /* jornada (state.x, rotX, scale…) composta com as misturas do final (0..1) */
    const x = mix(state.x, 0, state.center)
    const y = mix(state.y, 0, state.center)
    const rotX = mix(state.rotX, -Math.PI / 2, state.turn)
    const rotZ = mix(state.rotZ, Math.PI * 2, state.turn)
    const diameter = mix(state.scale, state.finaleScale, state.zoom) * Math.min(vp.width, vp.height)
    group.position.set((x * vp.width) / 2, (y * vp.height) / 2, 0)
    group.rotation.set(rotX, state.rotY, rotZ, 'ZXY')
    group.scale.setScalar(diameter)

    const time = clock.elapsedTime
    stone.current.position.y = Math.sin(time * 0.9) * 0.06 * state.float * (1 - state.center)
    stone.current.rotation.y = time * 0.12

    /* rim light: exatamente embaixo da pedra, na altura do plano dela */
    rim.current.position.set(group.position.x, group.position.y - diameter * 1.4, 0)
    rim.current.intensity = RIM_INTENSITY * diameter * diameter

    if (!footer) return
    let clip = ''
    if (state.reveal <= 0.0001) {
      clip = HIDDEN
    } else if (state.reveal < 0.9999) {
      stone.current.updateWorldMatrix(true, false)
      const matrix = stone.current.matrixWorld
      const rect = footer.getBoundingClientRect()
      const toPx = (v) => {
        v.applyMatrix4(matrix).project(camera)
        return [((v.x + 1) / 2) * size.width - rect.left, ((1 - v.y) / 2) * size.height - rect.top]
      }
      const [cx, cy] = toPx(scratch.centre.set(0, girdleY, 0))
      const k = REVEAL_INSET * state.reveal
      const points = ring.map((q) => {
        const [px, py] = toPx(scratch.point.copy(q))
        return `${(cx + (px - cx) * k).toFixed(1)}px ${(cy + (py - cy) * k).toFixed(1)}px`
      })
      clip = `polygon(${points.join(', ')})`
    }
    /* Escreve quando o alvo muda OU quando alguém mexeu no estilo por fora (a limpeza do
       useGSAP, o fim do final). Comparar só com o último valor próprio deixava o rodapé
       destravado depois de uma escrita externa. */
    if (clip !== lastClip.current || footer.style.clipPath !== lastApplied.current) {
      footer.style.clipPath = clip
      lastClip.current = clip
      lastApplied.current = footer.style.clipPath // valor normalizado pelo navegador
    }
  })

  return (
    <>
      {/* topo: direcional fraca e fria, levemente angulada — o ponto de brilho da coroa */}
      <directionalLight position={[2.5, 6, 4]} intensity={1.2} color="#E6F0FF" />
      {/* rim light neon exatamente embaixo: acende só o pavilhão e desenha a base */}
      <pointLight ref={rim} color={RIM_COLOR} decay={2} distance={0} />

      <group ref={pivot}>
        <group ref={stone}>
          <mesh geometry={mesh.geometry}>
            <MeshTransmissionMaterial
              color="#050505"
              transmission={1}
              roughness={0}
              ior={2.4}
              thickness={1.2}
              backside={backside}
              backsideThickness={0.6}
              chromaticAberration={0.8}
              samples={samples}
              resolution={resolution}
              anisotropicBlur={0}
              distortion={0}
              temporalDistortion={0}
            />
          </mesh>
        </group>
      </group>
    </>
  )
}
