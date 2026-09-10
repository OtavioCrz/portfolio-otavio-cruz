/**
 * Camada de grão sobre toda a página.
 * SVG inline em data-URI: sem requisição, sem canvas, sem custo de JS.
 * A animação desloca a textura em passos — dá a textura viva de filme.
 *
 * Os deslocamentos são em px e nunca passam da sobra da camada (128px em
 * cada lado; o maior deslocamento é 96px). Antes eram em %, relativos a
 * uma camada de 200% da tela: um passo de 35% andava 70% da tela — mais
 * que a sobra de 50% — e o topo ficava ~90ms sem grão a cada ciclo, uma
 * faixa mais escura piscando junto ao header. Em px a cobertura não
 * depende do tamanho da tela, e a camada deixa de ter 4x a área da tela.
 */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="200" height="200" filter="url(#n)" opacity="0.55"/>
    </svg>`
  )

export default function Grain() {
  return (
    <>
      <style>{`
        @keyframes grain-shift {
          0%   { transform: translate3d(0, 0, 0); }
          10%  { transform: translate3d(-48px, -64px, 0); }
          20%  { transform: translate3d(-96px, 24px, 0); }
          30%  { transform: translate3d(40px, -96px, 0); }
          40%  { transform: translate3d(-32px, 88px, 0); }
          50%  { transform: translate3d(-80px, 48px, 0); }
          60%  { transform: translate3d(96px, 0, 0); }
          70%  { transform: translate3d(0, 72px, 0); }
          80%  { transform: translate3d(24px, 96px, 0); }
          90%  { transform: translate3d(-64px, 40px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-grain] { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      >
        <div
          data-grain
          className="absolute -inset-[128px] opacity-[0.16] mix-blend-overlay"
          style={{
            backgroundImage: `url("${NOISE}")`,
            backgroundRepeat: 'repeat',
            animation: 'grain-shift 1.2s steps(4) infinite',
          }}
        />
      </div>
    </>
  )
}
