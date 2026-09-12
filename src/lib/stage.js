/**
 * Visibilidade do palco 3D.
 *
 * O canvas do diamante é fixo e fica ATRÁS do conteúdo. Quando algo opaco o cobre
 * por inteiro (a mídia do hero aberta, o menu mobile), ou quando o próprio palco
 * já sumiu (fim do final), renderizá-lo é trabalho de GPU que ninguém vê.
 *
 * Cada dono declara o próprio motivo e o palco só renderiza quando não sobra
 * nenhum. É um módulo mínimo e sem React de propósito: quem declara vive no
 * bundle principal, quem lê vive no chunk do three.js, e nenhum dos dois precisa
 * importar o outro. O palco consulta a cada quadro — é só o tamanho de um Set.
 */
const reasons = new Set()

export function setStageHidden(reason, hidden) {
  if (hidden) reasons.add(reason)
  else reasons.delete(reason)
}

export function isStageHidden() {
  return reasons.size > 0
}
