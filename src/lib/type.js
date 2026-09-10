/**
 * Texto vazado (outline) — fonte única para o Manifesto e o letreiro da stack.
 *
 * Cada classe elimina uma causa do contorno "fatiado":
 *
 *   font-outline         instância ESTÁTICA da Clash Display. A variável
 *                        tem contornos sobrepostos dentro dos glifos e o
 *                        stroke desenha todos eles.
 *   tracking-[0.01em]    tracking levemente positivo. Herdando o -0.045em
 *                        de .type-brutal, letras vizinhas se sobrepunham
 *                        e o traço de uma cruzava a outra.
 *   text-transparent     o preenchimento some; quem desenha a letra é o traço.
 *   [-webkit-text-stroke:…]  espessura em `em` (acompanha o corpo), com
 *                        piso de 1px para não sumir em telas pequenas.
 *   [text-shadow:none]   a sombra de .type-onmedia não tem o que sombrear
 *                        num texto vazado e só sujava o miolo das letras.
 *
 * Não combinar com .type-brutal no MESMO elemento — aplique .type-brutal
 * no pai. As declarações daqui vencem a herança, não a classe irmã.
 */
export const TEXT_OUTLINE =
  'font-outline tracking-[0.01em] text-transparent [-webkit-text-stroke:max(1px,0.018em)_var(--color-bone)] [text-shadow:none]'
