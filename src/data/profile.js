import photo from '../assets/otavio-cruz.jpeg'

export const PROFILE = {
  photo,
  photoAlt: 'Retrato de Otávio Cruz, Desenvolvedor Front-End e Web Designer',
  /* dimensões reais do arquivo — reservam o espaço antes do carregamento */
  photoWidth: 900,
  photoHeight: 1600,
  /* A foto é 9:16 e o container 4:5: o object-cover apara ~30% da altura.
     80% no eixo Y desce o recorte, tira o teto do quadro e deixa os olhos
     perto de 42% da altura. Ajuste ao trocar de foto. */
  photoPosition: '50% 80%',

  role: 'Desenvolvedor Front-End & Web Designer',
  location: 'Fortaleza, BR',

  headline: [
    { text: 'Obcecado', tone: 'bone' },
    { text: 'por cada', tone: 'bone' },
    { text: 'milissegundo,', tone: 'bone' },
    { text: 'cada frame', tone: 'bone' },
    { text: 'e cada pixel.', tone: 'neon' },
  ],

  statement:
    'Site lento é site quebrado. Animação que engasga é bug. Interface genérica é oportunidade jogada fora. Eu corto kilobyte, persigo 60 quadros por segundo e redesenho cada tela até não sobrar nada para tirar.',

  principles: [
    'Performance é design.',
    'Movimento com propósito — nunca enfeite.',
    'Pixel fora do lugar é bug.',
  ],
}

export const STACK = ['React', 'Vite', 'GSAP', 'Tailwind', 'Supabase']
