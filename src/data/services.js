import { CONTACT } from './projects'

export const SERVICE_AREA = {
  countries: ['Brasil', 'Portugal'],
  summary: 'Brasil e Portugal · qualquer nicho',
}

const whatsapp = (text) => `${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`

/* `name` é o nome completo (JSON-LD, leitores de tela); `display` e
   `qualifier` são a divisão visual: palavra gigante + complemento menor. */
export const SERVICES = [
  {
    id: 'landing-pages',
    index: '01',
    name: 'Landing Pages de Alta Conversão',
    display: 'Landing Pages',
    qualifier: 'de alta conversão',
    serviceType: 'Criação de landing page',
    description:
      'Páginas de venda e captação com um único objetivo: transformar visita em contato. Copy com hierarquia, carregamento instantâneo e chamadas para ação no ponto certo — prontas para tráfego pago.',
    cta: whatsapp('Olá, Otávio! Quero um orçamento de landing page.'),
  },
  {
    id: 'sites-institucionais',
    index: '02',
    name: 'Sites Institucionais Premium',
    display: 'Sites Institucionais',
    qualifier: 'premium',
    serviceType: 'Criação de site institucional',
    description:
      'O site oficial da sua marca, com design exclusivo e animações fluidas. Presença digital à altura de quem quer ser lembrado, do primeiro acesso ao pedido de orçamento.',
    cta: whatsapp('Olá, Otávio! Quero um orçamento de site institucional.'),
  },
  {
    id: 'sistemas-crm',
    index: '03',
    name: 'Sistemas Internos e CRM sob Medida',
    display: 'Sistemas & CRM',
    qualifier: 'sob medida, do dado à decisão',
    serviceType: 'Desenvolvimento de sistema web sob medida',
    description:
      'O painel que a sua equipe abre todo dia: dados de várias fontes num lugar só, acesso por perfil, relatórios que fecham com a realidade e integrações que tiram trabalho manual da frente — de WhatsApp oficial a importação de planilhas.',
    cta: whatsapp('Olá, Otávio! Quero um orçamento de sistema ou CRM sob medida.'),
  },
  {
    id: 'aplicativos',
    index: '04',
    name: 'Aplicativos iOS e Android',
    display: 'Aplicativos',
    qualifier: 'iOS e Android',
    serviceType: 'Desenvolvimento de aplicativo mobile',
    description:
      'Aplicativo com a cara da sua marca, feito para o trabalho de campo: dados em tempo real, mapa, notificações e permissão por perfil. Da primeira tela à publicação nas lojas — e ao acompanhamento depois do lançamento.',
    cta: whatsapp('Olá, Otávio! Quero um orçamento de aplicativo.'),
  },
  {
    id: 'performance-seo',
    index: '05',
    name: 'Otimização de Performance e SEO',
    display: 'Performance & SEO',
    qualifier: 'otimização técnica',
    serviceType: 'Otimização de performance e SEO técnico',
    description:
      'Sites que carregam rápido e aparecem nas buscas: Core Web Vitals, HTML pré-renderizado, dados estruturados e SEO técnico — para o Google e para as IAs que recomendam empresas.',
    cta: whatsapp('Olá, Otávio! Quero otimizar a performance e o SEO do meu site.'),
  },
]
