import coverCrm from '../assets/work/Maria-Pitanga-CRM.webp'
import coverRastreamento from '../assets/work/Rastreamento-MP.webp'
import coverMariaPitangaPT from '../assets/work/Maria-Pitanga-Portugal.webp'
import coverMariaPitanga from '../assets/work/Maria-Pitanga-Oficial.webp'
import coverUnimais from '../assets/work/UNIMAIS.webp'

export const CONTACT = {
  whatsapp: 'https://wa.me/5585988528359',
  email: 'oms.otaviio@gmail.com',
  instagram: 'https://www.instagram.com/otavio.crz/',
  linkedin: 'https://www.linkedin.com/in/otaviocruzdev/',
  github: 'https://github.com/otaviocrz',
  phoneLabel: '+55 85 98852-8359',
}

/* Capas: WebP de 1200px de largura (≈ 2:1), gerados a partir dos PNGs de ~1904px
   que ficam na mesma pasta como originais. 1200px cobrem a maior exibição — a capa
   do celular a 3x de densidade — e as cinco pesam 313 KB, contra 5,1 MB em PNG.
   `coverWidth`/`coverHeight` são as dimensões reais de cada arquivo — reservam o
   espaço antes do load.

   `access` é opcional: aparece como etiqueta ao lado da função e diz o que esperar antes
   do clique — um sistema interno abre a tela de entrada, um app abre a ficha na loja.
   Projeto com site aberto não usa o campo. */
export const PROJECTS = [
  {
    id: 'maria-pitanga-crm',
    index: '01',
    title: 'Maria Pitanga CRM',
    role: 'CRM e dashboards para rede de franquias',
    access: 'Acesso restrito',
    year: '2026',
    stack: ['React', 'TypeScript', 'Supabase', 'WhatsApp API'],
    href: 'https://crm.mariapitangaacaiteria.com.br',
    cover: coverCrm,
    coverWidth: 1200,
    coverHeight: 595,
  },
  {
    id: 'rastreamento-mp',
    index: '02',
    title: 'Rastreador MP',
    role: 'App de rastreamento de entregas em tempo real',
    access: 'Disponível na Google Play',
    year: '2026',
    stack: ['React Native', 'Expo', 'Firebase', 'Mapas'],
    href: 'https://play.google.com/store/apps/details?id=com.mariapitanga.rastreadormp',
    cover: coverRastreamento,
    coverWidth: 1200,
    coverHeight: 595,
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
  {
    id: 'maria-pitanga',
    index: '04',
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
    index: '05',
    title: 'Unimais',
    role: 'Landing Page de Alta Conversão',
    year: '2025',
    stack: ['Landing Page', 'CRO', 'Responsivo'],
    href: 'https://otaviocrz.github.io/Landing-Page-Unimais/',
    cover: coverUnimais,
    coverWidth: 1200,
    coverHeight: 594,
  },
]
