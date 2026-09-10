import coverMariaPitanga from '../assets/work/Maria-Pitanga-Oficial.png'
import coverUnimais from '../assets/work/UNIMAIS.png'
import coverMariaPitangaPT from '../assets/work/Maria-Pitanga-Portugal.png'

/* Capas: screenshots de ~1904x944 (≈ 2:1). `coverWidth`/`coverHeight` são
   as dimensões reais de cada arquivo — reservam o espaço antes do load. */
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
    coverWidth: 1905,
    coverHeight: 945,
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
    coverWidth: 1904,
    coverHeight: 943,
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
    coverWidth: 1903,
    coverHeight: 944,
  },
]

export const CONTACT = {
  whatsapp: 'https://wa.me/5585988528359',
  email: 'oms.otaviio@gmail.com',
  instagram: 'https://www.instagram.com/otavio.crz/',
  linkedin: 'https://www.linkedin.com/in/ot%C3%A1vio-cruz-6b330b319/',
  github: 'https://github.com/otaviocrz',
  phoneLabel: '+55 85 98852-8359',
}
