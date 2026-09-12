/**
 * Estado do diamante: um objeto simples que o GSAP anima e o R3F lê a cada quadro.
 * O GSAP nunca toca no three.js e o three.js nunca decide nada sobre o scroll — cada lado
 * tem um dono, e dá para inspecionar o estado inteiro num console.log.
 *
 * Jornada (escrita só pelos trechos de scroll), em unidades de tela:
 *   x, y       posição em frações do meio-viewport: -1 = borda esquerda/de baixo, +1 = direita/de cima
 *   scale      diâmetro da cintura em frações da MENOR dimensão do viewport (0.3 = 30%)
 *   rotX/Y/Z   radianos, ordem 'ZXY': Y gira a pedra no próprio eixo (mesa ↔ culeta), X inclina
 *              esse eixo (-π/2 aponta a culeta para a câmera), Z gira em torno da linha de visão
 *   float      amplitude da flutuação ociosa
 *
 * Final (escrito só pela timeline do rodapé), misturas de 0 a 1 que o Diamond compõe por
 * cima da jornada:
 *   center     leva a pedra ao centro e para a flutuação
 *   turn       aponta a culeta para a câmera, com uma volta inteira na linha de visão
 *   zoom       cresce até FINALE_SCALE
 *   reveal     abre a máscara do contato (o interior do diamante)
 *
 * Um dono por propriedade: nenhum refresh, salto pelo menu ou ordem de gatilhos consegue
 * fazer o final sobrescrever a jornada (ou o contrário) — no tempo 0 as misturas valem 0.
 */
export const KEYFRAMES = {
  /* abertura: flutua acima de "CRUZ", fora da fresta (que cobriria o centro dele) */
  hero: { x: 0.6, y: 0.4, scale: 0.28, rotX: 0.38, rotY: 0, rotZ: -0.12, float: 1 },
  /* jornada: gira devagar pelos cantos e bordas, longe das colunas de texto */
  perfil: { x: -0.6, y: -0.56, scale: 0.24, rotX: 0.55, rotY: Math.PI * 1.5, rotZ: 0.2, float: 1 }, // sob a foto
  servicos: { x: 0.8, y: 0.5, scale: 0.2, rotX: 0.25, rotY: Math.PI * 2.5, rotZ: -0.3, float: 1 },
  work: { x: -0.82, y: -0.42, scale: 0.22, rotX: 0.6, rotY: Math.PI * 3.5, rotZ: 0.25, float: 1 },
  depoimentos: { x: 0.8, y: -0.6, scale: 0.15, rotX: 0.4, rotY: Math.PI * 4.25, rotZ: -0.2, float: 1 },
  /* o final leva a pedra ao centro a partir daqui */
  faq: { x: -0.7, y: -0.5, scale: 0.24, rotX: 0.3, rotY: Math.PI * 5, rotZ: 0, float: 1 },
}

/* Em tela retrato (celular) a fresta do hero é uma faixa horizontal entre as palavras
   empilhadas: o diamante desce para o canto de baixo, ao lado do "scroll". */
const HERO_PORTRAIT = { x: 0.5, y: -0.6, scale: 0.34 }

export function heroKeyframe() {
  const portrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight
  return portrait ? { ...KEYFRAMES.hero, ...HERO_PORTRAIT } : KEYFRAMES.hero
}

/* escala final: o polígono da cintura passa da diagonal do viewport com folga */
export const FINALE_SCALE = 3.6

export function createDiamondState() {
  return { ...heroKeyframe(), center: 0, turn: 0, zoom: 0, reveal: 0, finaleScale: FINALE_SCALE }
}
