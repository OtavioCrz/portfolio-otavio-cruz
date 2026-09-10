/**
 * Camada de grão sobre toda a página.
 * SVG inline em data-URI: sem requisição, sem canvas, sem custo de JS.
 * A animação desloca o background em passos — dá a textura viva de filme.
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
          0%   { transform: translate(0, 0); }
          10%  { transform: translate(-5%, -10%); }
          20%  { transform: translate(-15%, 5%); }
          30%  { transform: translate(7%, -25%); }
          40%  { transform: translate(-5%, 25%); }
          50%  { transform: translate(-15%, 10%); }
          60%  { transform: translate(15%, 0); }
          70%  { transform: translate(0, 15%); }
          80%  { transform: translate(3%, 35%); }
          90%  { transform: translate(-10%, 10%); }
          100% { transform: translate(0, 0); }
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
          className="absolute -inset-[50%] opacity-[0.16] mix-blend-overlay"
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
