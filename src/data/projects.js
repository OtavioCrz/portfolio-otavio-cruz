import coverMariaPitanga from '../assets/work/Maria-Pitanga-Oficial.webp'
import coverUnimais from '../assets/work/UNIMAIS.webp'
import coverMariaPitangaPT from '../assets/work/Maria-Pitanga-Portugal.webp'

/* Capas: WebP de 1200px de largura (≈ 2:1), gerados a partir dos PNGs de ~1904px
   que ficam na mesma pasta como originais. 1200px cobrem a maior exibição — a capa
   do celular a 3x de densidade — e as três pesam 223 KB, contra 3,9 MB em PNG.
   `coverWidth`/`coverHeight` são as dimensões reais de cada arquivo — reservam o
   espaço antes do load. */
export const PROJECTS = [
  {
    id: 'maria-pitanga',
    index: '01',
    title: 'Maria Pitanga',
    role: 'Site Institucional',
    year: '2025',
    stack: ['HTML', 'CSS', 'JavaScript'],
    href: 'https://otaviocrz.github.io/Site-Maria-Pitanga/',
    cover: coverMariaPitanga,
    coverWidth: 1200,
    coverHeight: 595,
  },
  {
    id: 'unimais',
    index: '02',
    title: 'Unimais',
    role: 'Landing Page de Alta Conversão',
    year: '2025',
    stack: ['Landing Page', 'CRO', 'Responsivo'],
    href: 'https://otaviocrz.github.io/Landing-Page-Unimais/',
    cover: coverUnimais,
    coverWidth: 1200,
    coverHeight: 594,
  },
  {
    id: 'maria-pitanga-pt',
    index: '03',
    title: 'Maria Pitanga Portugal',
    role: 'Expansão Internacional',
    year: '2026',
    stack: ['Web Design', 'i18n', 'Performance'],
    href: 'https://mariapitangaacaiteria.pt/',
    cover: coverMariaPitangaPT,
    coverWidth: 1200,
    coverHeight: 595,
  },
]

export const CONTACT = {
  whatsapp: 'https://wa.me/5585988528359',
  email: 'oms.otaviio@gmail.com',
  instagram: 'https://www.instagram.com/otavio.crz/',
  linkedin: 'https://www.linkedin.com/in/otaviocruzdev/',
  github: 'https://github.com/otaviocrz',
  phoneLabel: '+55 85 98852-8359',
}
