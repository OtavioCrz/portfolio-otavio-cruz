import { CONTACT } from './projects'
import { GA_ID } from '../lib/analytics'

/*
 * Política de Privacidade — texto-modelo para um portfólio freelancer, escrito a
 * partir do que o site realmente faz (GA4 só com consentimento, sem formulário,
 * sem anúncios). Não é parecer jurídico: revise antes de publicar e mantenha-o
 * igual ao comportamento do site.
 *
 * Ao mudar algo que envolva cookies, atualize a data e suba VERSION em
 * src/lib/analytics.js — o aviso volta a pedir a escolha de todo mundo.
 *
 * Blocos: { type: 'p', text } · { type: 'list', items: [{ lead?, text }] } ·
 *         { type: 'table', head, rows } · { type: 'contact', text } (+ e-mail)
 */
export const PRIVACY_UPDATED = '12 de setembro de 2026'

const GA_COOKIE = `_ga_${GA_ID.replace(/^G-/, '')}`

export const PRIVACY_SECTIONS = [
  {
    id: 'responsavel',
    title: 'Quem é o responsável',
    blocks: [
      {
        type: 'p',
        text: 'Este é o portfólio de Otávio Cruz, desenvolvedor front-end e web designer autônomo em Fortaleza (CE). Sou o controlador dos dados tratados neste site, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).',
      },
      { type: 'contact', text: 'Para qualquer assunto de privacidade, escreva para' },
    ],
  },
  {
    id: 'dados',
    title: 'O que é coletado',
    blocks: [
      {
        type: 'list',
        items: [
          {
            lead: 'Dados de navegação — só se você aceitar os cookies.',
            text: 'Páginas vistas, tempo de visita, origem do acesso (busca, link, rede social), tipo de dispositivo e navegador e região aproximada (cidade e país). O Google Analytics 4 não registra nem guarda o seu endereço IP.',
          },
          {
            lead: 'A sua escolha sobre cookies.',
            text: 'Fica no seu próprio navegador (localStorage) e não é enviada a ninguém.',
          },
          {
            lead: 'O que você mesmo envia.',
            text: 'Se você me chamar no WhatsApp ou por e-mail, os dados que decidir compartilhar: nome, telefone, e-mail e detalhes do projeto.',
          },
        ],
      },
      {
        type: 'p',
        text: 'Não há formulário, cadastro, login nem coleta de dados sensíveis. Nada disso é usado para identificar você.',
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    blocks: [
      {
        type: 'p',
        text: 'Os cookies de análise só são gravados depois do seu aceite. Se você recusar, o Google Analytics nem chega a ser carregado.',
      },
      {
        type: 'table',
        head: ['Nome', 'De quem', 'Para quê', 'Duração'],
        rows: [
          ['_ga', 'Google Analytics', 'Distinguir visitantes de forma anônima', '2 anos'],
          [GA_COOKIE, 'Google Analytics', 'Manter o estado da sessão de navegação', '2 anos'],
          ['oc-consent (localStorage)', 'Este site', 'Lembrar a sua escolha sobre cookies', '12 meses'],
        ],
      },
      { type: 'p', text: 'Não uso cookies de publicidade, de remarketing nem de redes sociais.' },
    ],
  },
  {
    id: 'finalidade',
    title: 'Para que — e com que base legal',
    blocks: [
      {
        type: 'list',
        items: [
          {
            lead: 'Melhorar o site.',
            text: 'Entender quais páginas e projetos interessam mais. Base legal: o seu consentimento (art. 7º, I, da LGPD).',
          },
          {
            lead: 'Responder contatos e preparar orçamentos.',
            text: 'Base legal: procedimentos preliminares de um contrato que você pediu (art. 7º, V).',
          },
        ],
      },
      { type: 'p', text: 'Os dados não são vendidos, alugados nem usados para publicidade.' },
    ],
  },
  {
    id: 'compartilhamento',
    title: 'Com quem são compartilhados',
    blocks: [
      {
        type: 'list',
        items: [
          {
            lead: 'Google (Google Analytics).',
            text: 'Processa os dados de navegação como operador, inclusive em servidores fora do Brasil, com as salvaguardas de transferência internacional previstas nos termos do Google (art. 33 da LGPD).',
          },
          {
            lead: 'GitHub.',
            text: 'Hospeda o site e mantém registros técnicos de acesso para a segurança e o funcionamento do serviço.',
          },
          {
            lead: 'WhatsApp (Meta).',
            text: 'Se você escolher esse canal para falar comigo, a conversa segue a política de privacidade do WhatsApp.',
          },
        ],
      },
      { type: 'p', text: 'Fora isso, só por obrigação legal ou ordem de autoridade competente.' },
    ],
  },
  {
    id: 'retencao',
    title: 'Por quanto tempo',
    blocks: [
      {
        type: 'list',
        items: [
          { lead: 'Dados de navegação:', text: 'pelo prazo de retenção configurado no Google Analytics — 2 meses.' },
          {
            lead: 'Mensagens de contato:',
            text: 'enquanto forem necessárias para a conversa ou o projeto e, depois, só pelo que a lei exigir.',
          },
          { lead: 'A sua escolha sobre cookies:', text: '12 meses. Depois disso, o aviso aparece de novo.' },
        ],
      },
    ],
  },
  {
    id: 'direitos',
    title: 'Seus direitos',
    blocks: [
      { type: 'p', text: 'Pela LGPD (art. 18), você pode, a qualquer momento:' },
      {
        type: 'list',
        items: [
          { text: 'confirmar se há tratamento dos seus dados e acessá-los;' },
          { text: 'corrigir dados incompletos, inexatos ou desatualizados;' },
          { text: 'pedir anonimização, bloqueio ou eliminação de dados desnecessários;' },
          { text: 'pedir a portabilidade dos dados;' },
          { text: 'saber com quem os dados foram compartilhados;' },
          { text: 'revogar o consentimento.' },
        ],
      },
      {
        type: 'p',
        text: 'Para revogar o consentimento dos cookies, use o link “Cookies” no rodapé. Para os outros pedidos, escreva para o e-mail abaixo — a resposta sai em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
      },
      { type: 'contact', text: 'E-mail:' },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    blocks: [
      {
        type: 'p',
        text: 'O site é estático, servido só por HTTPS, sem banco de dados nem área de login. O acesso às ferramentas de análise é restrito a mim.',
      },
    ],
  },
  {
    id: 'menores',
    title: 'Crianças e adolescentes',
    blocks: [
      {
        type: 'p',
        text: 'Este site é voltado a empresas e profissionais e não se destina a crianças e adolescentes. Não coleto intencionalmente dados deles.',
      },
    ],
  },
  {
    id: 'mudancas',
    title: 'Mudanças nesta política',
    blocks: [
      {
        type: 'p',
        text: 'Quando esta política mudar, a data no topo é atualizada. Se a mudança envolver cookies, o aviso volta a pedir a sua escolha.',
      },
    ],
  },
]

export { CONTACT }
