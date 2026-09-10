/**
 * Gera os frames abstratos do slideshow do HERO.
 * São placeholders de alta fidelidade — troque por fotos reais em
 * src/assets/hero (qualquer nome; entram no loop em ordem alfabética).
 *
 *   npm run media
 *
 * Nota de composição: enquanto a fresta está fechada, o usuário só vê a
 * FAIXA CENTRAL da imagem (aprox. x de 600 a 800 num quadro de 1400).
 * Cada arquétipo abaixo foi desenhado para ter contraste forte nessa faixa
 * — é o que faz o loop stop-motion "piscar" de verdade — e ainda assim
 * fechar uma composição inteira quando a mídia toma a tela.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HERO_DIR = resolve(__dirname, '../src/assets/hero')
mkdirSync(HERO_DIR, { recursive: true })

const S = 1400
const CX = S / 2
const CY = S / 2

const BONE = '#F2F0EA'
const NEON = '#A855F7'
const VIOLET = '#5B21B6'
const GRAPE = '#2E0F52'

/* PRNG determinístico (mulberry32) */
const rng = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const grainFilter = (id, slope = 0.32, freq = 0.85) => `
    <filter id="grain-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${id}" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="${slope}"/></feComponentTransfer>
    </filter>`

/**
 * Detalhe de alta frequência na faixa central.
 * Sem isso, um arquétipo de área chapada vira um retângulo de cor sólida
 * dentro da fresta — e o loop stop-motion perde a leitura de movimento.
 */
function centerDetail(r, seed) {
  let out = ''
  let y = 24
  while (y < S - 24) {
    const h = 3 + r() * 20
    const roll = r()
    const fill = roll > 0.7 ? NEON : roll > 0.34 ? '#000000' : BONE
    /* Barras estreitas dominam (curva de potência): garantem textura
       dentro da fresta. As largas são raras e discretas, para a
       composição não virar ruído quando a mídia toma a tela. */
    const t = Math.pow(r(), 2.1)
    const w = 210 + t * 1150
    const op = (0.85 - t * 0.6).toFixed(2)
    out += `<rect x="${(CX - w / 2).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}" opacity="${op}"/>`
    y += h + 10 + r() * 40
  }
  /* alguns blocos sólidos junto ao eixo, para quebrar o ritmo */
  for (let i = 0; i < 4; i++) {
    const bw = 24 + r() * 64
    const bh = 24 + r() * 110
    out += `<rect x="${(CX - 150 + r() * (300 - bw)).toFixed(0)}" y="${(r() * (S - bh)).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${r() > 0.5 ? '#000000' : BONE}" opacity="${(0.45 + r() * 0.5).toFixed(2)}"/>`
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Arquétipos — recebem (r, seed) e devolvem { defs, body }            */
/* ------------------------------------------------------------------ */

const archetypes = [
  /* 01 — BARRA: coluna neon estreita + laje branca atravessando */
  (r, seed) => ({
    defs: `<linearGradient id="g${seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${VIOLET}"/>
      <stop offset="55%" stop-color="${NEON}"/>
      <stop offset="100%" stop-color="${GRAPE}"/>
    </linearGradient>`,
    body: `
      <rect x="${CX - 44}" y="0" width="88" height="${S}" fill="url(#g${seed})"/>
      <rect x="${CX + 92}" y="0" width="14" height="${S}" fill="${NEON}" opacity="0.5"/>
      <rect x="${CX - 118}" y="0" width="8" height="${S}" fill="${BONE}" opacity="0.35"/>
      <rect x="140" y="${CY - 46}" width="${S - 280}" height="92" fill="${BONE}"/>
      <rect x="140" y="${CY + 128}" width="${S - 500}" height="12" fill="${BONE}" opacity="0.45"/>`,
  }),

  /* 02 — ORBE: disco claro centralizado, anéis finos */
  (r, seed) => ({
    defs: `<radialGradient id="g${seed}" cx="42%" cy="34%" r="72%">
      <stop offset="0%" stop-color="${BONE}"/>
      <stop offset="46%" stop-color="${NEON}"/>
      <stop offset="72%" stop-color="${GRAPE}"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>`,
    body: `
      <circle cx="${CX}" cy="${CY}" r="470" fill="none" stroke="${NEON}" stroke-width="2" opacity="0.55"/>
      <circle cx="${CX}" cy="${CY}" r="330" fill="none" stroke="${BONE}" stroke-width="1" opacity="0.35"/>
      <circle cx="${CX}" cy="${CY}" r="248" fill="url(#g${seed})"/>
      <rect x="0" y="${CY - 3}" width="${S}" height="6" fill="${NEON}" opacity="0.8"/>`,
  }),

  /* 03 — HALFTONE: malha de pontos com gradiente de densidade */
  (r, seed) => {
    let dots = ''
    const step = 30
    for (let x = 40; x < S; x += step) {
      for (let y = 40; y < S; y += step) {
        const dx = (x - CX) / CX
        const dy = (y - CY) / CY
        const d = Math.sqrt(dx * dx + dy * dy)
        const rad = Math.max(0, (1.15 - d) * 11)
        if (rad > 0.8) {
          const fill = Math.abs(x - CX) < 110 ? BONE : NEON
          dots += `<circle cx="${x}" cy="${y}" r="${rad.toFixed(1)}" fill="${fill}" opacity="0.9"/>`
        }
      }
    }
    return { defs: '', body: dots }
  },

  /* 04 — CORTE: faixa branca diagonal cruzando o centro */
  (r, seed) => ({
    defs: '',
    body: `
      <g transform="rotate(-28 ${CX} ${CY})">
        <rect x="-400" y="${CY - 96}" width="${S + 800}" height="192" fill="${BONE}"/>
        <rect x="-400" y="${CY + 150}" width="${S + 800}" height="26" fill="${NEON}"/>
        <rect x="-400" y="${CY - 230}" width="${S + 800}" height="12" fill="${NEON}" opacity="0.6"/>
      </g>
      <rect x="${CX - 8}" y="0" width="16" height="${S}" fill="${GRAPE}" opacity="0.9"/>`,
  }),

  /* 05 — BANHO: lavagem roxa com blocos pretos recortados */
  (r, seed) => ({
    defs: `<radialGradient id="g${seed}" cx="50%" cy="45%" r="48%">
      <stop offset="0%" stop-color="${NEON}"/>
      <stop offset="38%" stop-color="${VIOLET}"/>
      <stop offset="72%" stop-color="${GRAPE}"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>`,
    body: `
      <rect width="${S}" height="${S}" fill="url(#g${seed})"/>
      <rect x="0" y="0" width="${S}" height="210" fill="#000000"/>
      <rect x="0" y="${S - 260}" width="${S}" height="260" fill="#000000"/>
      <rect x="${CX - 150}" y="330" width="86" height="${S - 660}" fill="#000000" opacity="0.85"/>
      <rect x="${CX + 64}" y="330" width="86" height="${S - 660}" fill="#000000" opacity="0.85"/>
      <rect x="${CX - 30}" y="330" width="60" height="${S - 660}" fill="${BONE}" opacity="0.95"/>`,
  }),

  /* 06 — SCANLINES: listras horizontais de espessura variável */
  (r, seed) => {
    let stripes = ''
    let y = 60
    while (y < S - 60) {
      const h = 6 + r() * 40
      const fill = r() > 0.72 ? NEON : BONE
      const w = 300 + r() * (S - 340)
      stripes += `<rect x="${(CX - w / 2).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`
      y += h + 14 + r() * 34
    }
    return { defs: '', body: stripes }
  },

  /* 07 — NUMERAL: dígito gigante cortado pelo quadro */
  (r, seed) => ({
    defs: '',
    body: `
      <rect x="${CX - 190}" y="0" width="380" height="${S}" fill="${GRAPE}"/>
      <text x="${CX}" y="${CY + 340}" text-anchor="middle"
        font-family="Arial Black, Helvetica, sans-serif" font-weight="900"
        font-size="980" fill="${BONE}">${seed}</text>
      <rect x="0" y="${CY - 340}" width="${S}" height="6" fill="${NEON}"/>
      <rect x="0" y="${CY + 386}" width="${S}" height="6" fill="${NEON}"/>`,
  }),

  /* 08 — ANÉIS: círculos concêntricos neon */
  (r, seed) => {
    let rings = ''
    for (let i = 1; i <= 14; i++) {
      const rad = i * 52
      rings += `<circle cx="${CX}" cy="${CY}" r="${rad}" fill="none" stroke="${i % 3 === 0 ? BONE : NEON}" stroke-width="${(1 + (i % 4) * 2).toFixed(0)}" opacity="${(0.95 - i * 0.045).toFixed(2)}"/>`
    }
    return {
      defs: '',
      body: `${rings}<circle cx="${CX}" cy="${CY}" r="34" fill="${BONE}"/>`,
    }
  },
]

function heroFrame(i) {
  const seed = i + 1
  const r = rng(seed * 977 + 13)
  const { defs, body } = archetypes[i % archetypes.length](r, seed)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="Frame ${seed}">
  <defs>
    ${defs}
    ${grainFilter(seed, 0.3, 0.85)}
  </defs>
  <rect width="${S}" height="${S}" fill="#000000"/>
  ${body}
  ${centerDetail(r, seed)}
  <text x="70" y="${S - 64}" font-family="Courier New, monospace" font-size="40" fill="${BONE}"
    opacity="0.5" letter-spacing="6">${String(seed).padStart(2, '0')} / 08</text>
  <rect width="${S}" height="${S}" filter="url(#grain-${seed})" opacity="0.5"/>
</svg>`
}

/* ------------------------------------------------------------------ */
for (let i = 0; i < 8; i++) {
  const name = `frame-${String(i + 1).padStart(2, '0')}.svg`
  writeFileSync(resolve(HERO_DIR, name), heroFrame(i))
}

console.log('OK — 8 frames em src/assets/hero')
