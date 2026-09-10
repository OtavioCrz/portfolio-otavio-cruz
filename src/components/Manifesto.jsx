import { TEXT_OUTLINE } from '../lib/type'

/**
 * Manifesto — camada de texto que emerge sobre a mídia
 * assim que a fresta preenche 100% da tela.
 *
 * Componente puramente apresentacional: cada `[data-line]` é
 * revelado pela timeline mestre do HeroMask (translate Y dentro
 * de uma máscara com overflow hidden).
 */

const LINES = [
  { text: 'Estética implacável.', tone: 'bone' },
  { text: 'Performance cirúrgica.', tone: 'outline' },
  { text: 'Onde o Web Design', tone: 'bone' },
  { text: 'encontra a Engenharia.', tone: 'neon' },
]

const TONE = {
  bone: 'text-bone',
  neon: 'text-neon',
  outline: TEXT_OUTLINE,
}

export default function Manifesto() {
  return (
    <div
      data-manifesto
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6 py-[14vh] md:px-[6vw] md:py-[12vh]"
    >
      <div className="w-full max-w-[1500px]">
        <div className="line-mask mb-5 md:mb-[4vh]">
          <span data-line className="type-eyebrow block text-neon">
            Manifesto — 001
          </span>
        </div>

        {/* Mobile: corpo fluido (~30px → 60px) e cada frase quebra em duas
            linhas equilibradas (text-balance). 10.2vw, e não mais:
            "PERFORMANCE" vazado mede ~8.2em, e esse é o teto em que a
            palavra ainda cabe inteira nos 272px úteis de uma tela de 320px.
            A partir de md: uma frase por linha, sem quebra, em 5.8vw — o
            tracking positivo do vazado alarga a linha 2 e nessa escala
            ela ainda cabe com folga. */}
        <h2 className="type-brutal type-onmedia text-[clamp(1.9rem,10.2vw,3.75rem)] leading-[0.94] md:text-[min(5.8vw,5.2rem)]">
          {LINES.map((line) => (
            <span key={line.text} className="line-mask">
              <span data-line className={`block text-balance md:whitespace-nowrap ${TONE[line.tone]}`}>
                {line.text}
              </span>
            </span>
          ))}
        </h2>
      </div>
    </div>
  )
}
