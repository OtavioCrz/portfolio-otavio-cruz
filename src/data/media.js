/**
 * Frames do slideshow do HERO.
 *
 * Basta soltar imagens em `src/assets/hero/` (jpg, png, webp, avif ou svg)
 * que elas entram no loop automaticamente, em ordem alfabética.
 * Formato ideal: quadrado ou retrato, assunto centralizado —
 * a "fresta" mostra a faixa vertical central da imagem.
 */
const modules = import.meta.glob('../assets/hero/*.{jpg,jpeg,png,webp,avif,svg}', {
  eager: true,
  import: 'default',
})

export const HERO_FRAMES = Object.keys(modules)
  .sort()
  .map((path, i, paths) => ({
    src: modules[path],
    id: path.split('/').pop().replace(/\.\w+$/, ''),
    /* Os quadros são decorativos (aria-hidden no HeroMask), mas o Bing conta
       alt="" como "alt ausente" — então cada um leva uma legenda neutra, que
       continua verdadeira se as imagens forem trocadas. */
    alt: `Quadro ${i + 1} de ${paths.length} da animação de abertura do portfólio`,
  }))

/* Duração de cada frame no loop stop-motion (segundos) */
export const FRAME_DURATION = 0.115
