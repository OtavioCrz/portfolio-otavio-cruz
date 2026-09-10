import { SERVICES, SERVICE_AREA } from '../data/services'
import { FAQ } from '../data/faq'

/**
 * JSON-LD gerado dos MESMOS dados que desenham as seções de Serviços e FAQ.
 * O Google exige que o FAQPage bata com o FAQ visível; gerando daqui, os
 * dois nunca divergem. scripts/prerender.mjs injeta o resultado no <head>,
 * no lugar do comentário <!-- app:structured-data -->.
 *
 * Os nós de identidade (Person, ProfessionalService, WebSite) ficam escritos
 * no index.html e são referenciados aqui por @id.
 */
const SITE = String(import.meta.env.VITE_SITE_URL || '').replace(/\/+$/, '')
const ref = (fragment) => ({ '@id': `${SITE}/#${fragment}` })

export function buildStructuredData() {
  const areaServed = SERVICE_AREA.countries.map((name) => ({ '@type': 'Country', name }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OfferCatalog',
        '@id': `${SITE}/#servicos`,
        name: 'Serviços de desenvolvimento web e design',
        itemListElement: SERVICES.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name,
            serviceType: service.serviceType,
            description: service.description,
            areaServed,
            provider: ref('negocio'),
          },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE}/#faq`,
        mainEntity: FAQ.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  }
}
