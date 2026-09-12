# Otávio Cruz — Portfólio

Portfólio pessoal brutalista em **Vite + React 19 + Tailwind CSS v4 + GSAP (ScrollTrigger)**.
Dark mode nativo, tipografia Clash Display e um hero com máscara dirigida por scroll.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ pré-renderizado + sitemap.xml e robots.txt
npm run preview    # serve o build
npm run media      # regenera os frames placeholder do hero
```

---

## O efeito do hero

A seção é pinada e **uma única timeline com scrub** controla toda a abertura:

1. `OTÁVIO` e `CRUZ` deslizam para fora do viewport
2. a fresta central se expande até cobrir 100% da tela
3. a mídia perde a escala de `1.45 → 1` (parallax de profundidade)
4. o véu escurece e o Manifesto sobe linha a linha

Dentro da fresta, uma sequência de imagens roda em loop **stop-motion** (~8 fps) que
desacelera conforme a mídia toma a tela.

Três decisões que sustentam a fluidez, todas em [HeroMask.jsx](src/components/HeroMask.jsx):

- **`clip-path` em vez de `width`/`height`.** A mídia fica sempre do tamanho do viewport;
  só a janela de recorte abre. Zero reflow por frame, zero reescala de imagem, e o
  enquadramento não "salta" no fim da animação.
- **O recorte é montado a partir de duas variáveis CSS** (`--clip-y` / `--clip-x`), não de
  uma string `inset(...)` inteira. O navegador colapsa `inset(a b a b)` para dois valores no
  computed style; ao recriar a timeline na troca de breakpoint, o GSAP casaria a estrutura
  antiga com a nova e produziria um recorte inválido.
- **`fromTo` com origem explícita, e nenhum `gsap.set` duplicando essas origens.** Com `to`,
  o `invalidateOnRefresh` relê os valores de partida e grava o estado *final* como origem —
  a fresta nasceria aberta. E um `gsap.set` repetindo a origem faz o StrictMode (que monta o
  efeito duas vezes em dev) aplicar a transformação em dobro.

O layout usa **duas metades `flex-1`** com um espaçador no meio. É o que trava a fresta no
centro geométrico do viewport independentemente da largura das palavras.

No mobile a fresta vira uma **faixa horizontal** entre as palavras empilhadas, com a timeline
reconstruída via `dependencies` do `useGSAP`.

---

## Texto vazado (outline)

O contorno de "Performance cirúrgica" e do letreiro da stack vem de uma única string de classes
Tailwind em [src/lib/type.js](src/lib/type.js). Quatro coisas "fatiavam" as letras:

| Causa | Correção |
| --- | --- |
| A fonte **variável** guarda contornos sobrepostos dentro dos glifos, e o `-webkit-text-stroke` desenha todos eles | `font-outline` usa a instância **estática** (Bold), com as sobreposições removidas |
| O tracking `-0.045em` de `.type-brutal` fazia letras vizinhas se sobreporem | `tracking-[0.01em]` |
| A sombra de 28px era recortada pela `.line-mask` e deixava uma borda dura | `[text-shadow:none]` no vazado; nas demais linhas a sombra passou a ser em `em` e cabe no padding da máscara |
| `leading-[0.94]` era ignorado — `.type-brutal` forçava `0.82` | ver *Camadas CSS* abaixo |

Não aplique `TEXT_OUTLINE` no mesmo elemento que `.type-brutal`: coloque `.type-brutal` no pai.

## Camadas CSS

As classes próprias (`.type-brutal`, `.line-mask`, `.type-eyebrow`, `.hero-mask`, `.photo-reveal`…)
ficam em `@layer components`. Assim qualquer utilitário do Tailwind no mesmo elemento vence —
`leading-*`, `mt-*` e `tracking-*` funcionam como escritos. Em `@layer utilities`, por virem
depois no arquivo, elas ganhavam o empate em silêncio.

---

## Diamante 3D (React Three Fiber)

Um diamante acompanha o scroll: flutua no hero, passeia devagar pelos cantos e, no fim, aponta
a culeta para a tela e cresce até o interior engolir a viewport — o contato aparece **dentro**
da silhueta dele.

- **O modelo** — [`src/assets/models/diamante.glb`](src/assets/models/diamante.glb), 13 KB,
  uma malha de 110 triângulos. É uma reconstrução procedural de `src/assets/diamante-3d.png`
  feita com a skill *img2threejs*: lapidação brilhante de 57 facetas planas (mesa octogonal,
  estrelas, coroa, cintura, pavilhão e culeta), com os ângulos medidos na silhueta da
  referência (coroa 41°, pavilhão 44,4°). É um sólido fechado, sem faces internas — elas
  apareceriam através da transmissão. A oficina da reconstrução (spec, fábrica, renders de
  revisão e o script que exporta o GLB) fica em `.img2threejs/`, fora do repositório.
- **Carregamento** — [`DiamondLayer.jsx`](src/components/DiamondLayer.jsx) só monta o palco no
  navegador, depois da hidratação, com WebGL de verdade (WebGL por software não conta) e sem
  movimento reduzido, e pede o chunk na primeira folga do navegador (`requestIdleCallback`).
  three + R3F + drei vão num chunk à parte (~290 KB gzip), mais o HDR (525 KB) e o modelo
  (13 KB): nada disso entra no HTML pré-renderizado, e as fontes — o que segura o preloader —
  já saíram antes, pré-carregadas no `<head>`. O preloader cobre o download e a compilação dos
  shaders.
- **Palco** — [`DiamondStage.jsx`](src/three/DiamondStage.jsx): `<Canvas>` fixo em `z-0`, atrás
  do conteúdo. As seções não têm fundo próprio e o conteúdo vive num contexto `z-[1]`, então o
  palco aparece por trás delas. O environment é o HDR do preset `city` do drei (Potsdamer
  Platz, Poly Haven, CC0), servido pelo próprio site e reduzido de 1024×512 para 512×256 — a
  0,1 de intensidade a diferença não aparece, e o arquivo caiu de 1,5 MB para 525 KB —, com
  `background={false}`, mais uma caixa de luz neon embaixo (`Lightformer`). O loop de render é
  do próprio palco: ver *Performance*, abaixo.
- **Material e luz: uma joia negra** — [`Diamond.jsx`](src/three/Diamond.jsx):
  `MeshTransmissionMaterial` escuro e nítido — `color #050505` (o shader tinge a transmissão com a
  cor, então ela sai quase preta), `roughness 0`, `transmission 1`, `ior 2.4` e `backside`. O
  environment entra a 0,1 via `environmentIntensity` do `<Environment>`: com environment de cena,
  o three (r163+) **ignora** o `envMapIntensity` do material. A pedra aparece pelo que reflete:
  - uma rim light neon (`#b026ff`) sempre exatamente abaixo dela, que acende o pavilhão e
    desenha a base contra o `#000` sem clarear a coroa;
  - uma direcional fraca e fria, de cima, para o ponto de brilho da coroa;
  - a caixa neon do environment, que completa o contorno por reflexo. Com `roughness 0`, uma luz
    pontual numa faceta plana é um ponto quase infinitesimal; um reflexo de área acende a faceta
    inteira.
- **Coreografia** — [`useDiamondChoreography.js`](src/three/useDiamondChoreography.js) e
  [`diamondState.js`](src/three/diamondState.js). O GSAP anima um objeto de estado; o R3F lê
  esse objeto a cada quadro. A jornada é um `fromTo` por seção, cada um partindo do quadro-chave
  anterior. No final, o rodapé fica fixo por 1,6 tela: a pedra vai ao centro, gira até a culeta
  apontar para a câmera, escala e abre a máscara. A máscara é o polígono dos **16 vértices da
  cintura projetados na tela**, aplicado como `clip-path` do rodapé — continua exata girando,
  escalando ou fora do centro.

Três regras que custaram bugs para aprender:

- **`scrub: true` nos gatilhos do diamante.** A suavidade já vem do Lenis. Com scrub numérico,
  cada gatilho persegue o scroll no próprio tempo, e um salto pelo menu (Perfil → Contato)
  deixava o trecho do FAQ terminar depois do final e jogar a pedra de volta para o canto.
- **Um dono por propriedade.** A jornada escreve `x`, `y`, `scale` e as rotações; o final escreve
  só as próprias misturas (`center`, `turn`, `zoom`, `reveal`, de 0 a 1), e o `Diamond` compõe as
  duas coisas. Um `fromTo` do final escrevendo `x` era renderizado no tempo 0 pelo refresh do
  ScrollTrigger e tirava a pedra do hero no carregamento.
- **Quem esconde o rodapé é o palco.** Sem WebGL ou com movimento reduzido nada é montado, e o
  contato fica visível como sempre.

---

## Performance

Medida num "aparelho modesto" — Chromium com WebGL por software (SwiftShader) e CPU
estrangulada pelo DevTools —, porque numa GPU dedicada o site roda a 180 fps antes e depois de
qualquer mudança e não mostra nada.

**Palco 3D** ([`DiamondStage.jsx`](src/three/DiamondStage.jsx))

- `frameloop="never"`: quem renderiza é o próprio palco, no ticker do GSAP. Um quadro só sai com
  o preloader fora, a aba visível e nada opaco cobrindo o canvas. Quem cobre avisa por
  [`lib/stage.js`](src/lib/stage.js): o hero com a fresta toda aberta, o menu mobile aberto e o
  fim do final. O primeiro quadro é a exceção — sai escondido, para compilar os shaders durante o
  preloader e não no meio da entrada.
- Teto de 60 fps (telas de 120/144 Hz renderizariam o dobro para nada); em aparelho fraco com a
  página parada, 30 fps.
- `dpr` limitado a 1,5 e `antialias` desligado em telas com `devicePixelRatio ≥ 2`.
- Degraus de qualidade (`TIERS`): dpr → resolução dos FBOs da transmissão → passada de trás. O
  palco mede o próprio ritmo pela mediana de janelas de 1 s e desce um degrau quando não
  sustenta ~43 fps — abaixo de ~10 fps, pula direto para o último; nenhum degrau recompila
  shader. Se nem o último segura ~30 fps, o 3D sai com um fade, com a página parada, e ela segue
  sem ele (a régua é mais dura aí porque a medida é o ritmo da página inteira). O degrau atual
  fica em `data-stage-tier`, no wrapper do canvas (4 = sem 3D).
- WebGL por software (SwiftShader, llvmpipe — GPU bloqueada pelo navegador, máquina virtual)
  nem monta o palco: não sustenta o material de transmissão nem no último degrau. O teste pede
  o contexto com `failIfMajorPerformanceCaveat` — aí o navegador devolve `null` sem criar
  contexto nenhum, porque derrubar um contexto por software trava a página por segundos.
- `checkShaderErrors` desligado em produção: a checagem síncrona obrigava o driver a terminar
  cada compilação na hora.

**Animações**

- Só `transform` e `opacity`. O que animava layout virou transform:
  - Serviços: a descrição ocupa o espaço dela sempre, esmaecida, e o hover só a acende e sobe.
    Antes ela abria por `grid-template-rows`, recalculando a página inteira a cada quadro — e
    mudando a altura da página embaixo dos pins do ScrollTrigger;
  - FAQ: FLIP — o layout muda uma vez por clique, o movimento é `translateY` e, no fim, o
    ScrollTrigger recalcula (a página mudou de altura).
- O que animava cor (título da vitrine, anel do cursor) virou uma cópia empilhada que cruza a
  opacidade.
- `will-change-transform` sob demanda ([`lib/gsap.js`](src/lib/gsap.js)): `reveal()` promove a
  camada quando a seção aparece e a devolve no `onComplete`; `whileActive()` faz o mesmo em
  trechos com pin ou scrub. Nenhuma camada de GPU fica para sempre.
- Loop infinito só na tela: o stop-motion e o pulso do hero, o letreiro (agora animação CSS, no
  compositor) e o halo do rodapé param fora dela.
- Halo do rodapé: gradiente radial no lugar de um `blur(120px)` refeito a cada quadro.

**Carregamento**

- Capas da vitrine em WebP de 1200px: 223 KB, contra 3,9 MB em PNG.
- Fontes pré-carregadas pelo `prerender.mjs` — o preloader espera por elas.
- Hero: só o 1º quadro com `fetchpriority="high"`, e todos com `decoding="async"` — com `sync`,
  a primeira pintura (a do preloader, que cobre o hero) esperava a rasterização do SVG. As
  outras imagens: `loading="lazy"` e `decoding="async"`.
- As seções (Vitrine, Depoimentos, FAQ) **não** são divididas em chunks: somam ~7 KB gzip, 6% do
  bundle principal, e cada chunk seria uma ida e volta a mais e uma hidratação atrasada — pior
  para os pins, que precisam existir na ordem da página. O que era pesado (three.js, ~290 KB)
  já é um chunk à parte.

---

## Estrutura

```
src/
├── components/
│   ├── HeroMask.jsx      # seção pinada + timeline mestre
│   ├── Manifesto.jsx     # texto de impacto (revelado pelo HeroMask)
│   ├── About.jsx         # perfil: foto + declaração + letreiro da stack
│   ├── Services.jsx      # serviços: lista vazada, hover preenche e acende a descrição
│   ├── Projects.jsx      # vitrine com hover reveal
│   ├── Testimonials.jsx  # depoimentos fixados (pin) com troca por scroll
│   ├── FAQ.jsx           # accordion acessível (FLIP: só transform)
│   ├── Footer.jsx        # CTA magnético + contato
│   ├── Marquee.jsx       # letreiro infinito (animação CSS, pausa fora da tela)
│   ├── MagneticButton.jsx
│   ├── Preloader.jsx
│   ├── Cursor.jsx
│   ├── Nav.jsx
│   ├── Grain.jsx
│   └── DiamondLayer.jsx  # monta o palco 3D só no cliente (WebGL, sem movimento reduzido)
├── three/                  # chunk à parte, carregado depois da hidratação
│   ├── DiamondStage.jsx    # <Canvas> global, environment e loop de render (travas de performance)
│   ├── Diamond.jsx         # GLB, material, luzes e máscara do contato
│   ├── useDiamondChoreography.js  # hook do GSAP: jornada + final
│   └── diamondState.js     # estado, quadros-chave e misturas do final
├── hooks/
│   ├── useSmoothScroll.js  # Lenis acoplado ao ticker do GSAP
│   └── useMediaQuery.js
├── lib/
│   ├── gsap.js             # registro de plugins, config global e camadas de GPU sob demanda
│   ├── stage.js            # quem está cobrindo o palco 3D (e o pausa)
│   └── type.js             # classes do texto vazado
├── data/
│   ├── projects.js         # projetos e contato
│   ├── profile.js          # foto, textos do perfil e stack
│   ├── services.js         # serviços e área de atendimento
│   ├── testimonials.js     # depoimentos
│   ├── faq.js              # perguntas frequentes
│   └── media.js            # frames do hero (glob automático)
├── seo/
│   └── structured-data.js  # JSON-LD de serviços e FAQ, gerado dos dados acima
├── entry-server.jsx        # entrada da pré-renderização (roda em Node no build)
├── assets/
│   ├── hero/               # frames do slideshow
│   ├── work/               # capas dos projetos (WebP; os PNGs originais ficam ao lado)
│   ├── otavio-cruz.jpeg    # foto do perfil
│   ├── models/diamante.glb # o diamante (reconstruído com img2threejs)
│   ├── env/                # HDR "city" do environment (Potsdamer Platz, CC0, 512×256)
│   └── fonts/
└── index.css               # tokens, fontes e classes de componente
```

---

## Trocando as imagens

**Hero.** Solte arquivos em `src/assets/hero/` (`jpg`, `png`, `webp`, `avif` ou `svg`).
Eles entram no loop automaticamente, em ordem alfabética — nenhum import a editar.
Formato ideal: quadrado ou retrato com o assunto centralizado, porque **a fresta mostra a
faixa vertical central da imagem**. Os `frame-*.svg` atuais são placeholders gerados por
[`scripts/generate-media.mjs`](scripts/generate-media.mjs); apague-os ao colocar fotos reais.

**Foto do perfil.** `src/assets/otavio-cruz.jpeg`, importada em [profile.js](src/data/profile.js).
O container é 4:5; fotos em outra proporção são aparadas pelo `object-cover`, e o enquadramento
se ajusta em `photoPosition` (também no `profile.js`). Fica em grayscale e ganha cor no hover;
em telas de toque, quando cruza o meio da tela.

**Projetos.** Screenshots em `src/assets/work/`, importadas em [projects.js](src/data/projects.js)
com as dimensões reais de cada arquivo (`coverWidth` / `coverHeight`). A caixa da prévia tem a
proporção das capas (~2:1) e medidas em pixel par, então a imagem para no lugar nítida e sem
distorção. As capas da prévia só são baixadas quando a vitrine chega perto da tela.

As capas publicadas são **WebP de 1200px de largura** (as três somam 223 KB); os PNGs originais
(3,9 MB) ficam na pasta, mas não são importados. 1200px cobrem a maior exibição — a capa do
celular em tela 3x. Para trocar uma capa, exporte o WebP nessa largura (qualidade ~85, no
[Squoosh](https://squoosh.app) ou com `cwebp -q 86 -resize 1200 0`) e atualize as dimensões no
`projects.js`.

---

## Editando o conteúdo

> Texto provisório nos depoimentos? Marque `TESTIMONIALS_ARE_PROVISIONAL = true` em
> `src/data/testimonials.js`: todo build passa a avisar até a flag voltar para `false`.

| O quê | Onde |
| --- | --- |
| Título, descrição e tags de compartilhamento | `index.html` |
| Domínio do site (URLs absolutas do SEO) | `.env` → `VITE_SITE_URL` |
| Projetos, links e contato | `src/data/projects.js` |
| Perfil: título, texto, princípios e stack | `src/data/profile.js` |
| Serviços e área de atendimento | `src/data/services.js` |
| Depoimentos | `src/data/testimonials.js` |
| Perguntas frequentes (e o JSON-LD `FAQPage`) | `src/data/faq.js` |
| Resumo para assistentes de IA | `public/llms.txt` |
| Texto do manifesto | `src/components/Manifesto.jsx` |
| Estilo do texto vazado | `src/lib/type.js` |
| Cores, fontes e métricas do hero | `src/index.css` (`@theme`) |
| Ritmo da animação do hero | `src/components/HeroMask.jsx` (timeline `master`) |
| Posição e escala do diamante em cada seção | `src/three/diamondState.js` (`KEYFRAMES`) |
| Material, luzes e máscara do diamante | `src/three/Diamond.jsx` |
| Ritmo do final (giro, zoom e revelação do contato) | `src/three/useDiamondChoreography.js` |
| Travas de performance do 3D (fps, dpr, degraus de qualidade) | `src/three/DiamondStage.jsx` |

---

## SEO

Tudo fica no `index.html` estático — e não num React Helmet — porque os robôs de preview do
WhatsApp, LinkedIn, Facebook e X **não executam JavaScript**: tag injetada via React não aparece
no card de compartilhamento.

- **Domínio.** `VITE_SITE_URL`, no arquivo `.env`, alimenta todas as URLs absolutas: canonical,
  `og:url`, `og:image`, `twitter:image`, o JSON-LD, o sitemap e o robots. **Troque antes do
  deploy** — é o único lugar.
- **Imagem de preview.** `public/og-image.jpg` (1200×630). A arte da fresta foi gerada na
  Higgsfield (GPT Image 2) e o nome foi composto por cima na Clash Display, a mesma fonte do site.
  Para trocar, substitua o arquivo mantendo o nome.
- **Dados estruturados.** Dois blocos JSON-LD no `<head>`, ligados por `@id`:
  - identidade — `Person`, `ProfessionalService` (Brasil e Portugal) e `WebSite` — escrita no
    `index.html`;
  - conteúdo — `OfferCatalog` (serviços) e `FAQPage` — **gerado no build** por
    [`src/seo/structured-data.js`](src/seo/structured-data.js) a partir dos mesmos dados que desenham
    as seções. O Google exige que o FAQ marcado seja igual ao FAQ visível; assim os dois nunca
    divergem.
- **llms.txt.** [`public/llms.txt`](public/llms.txt) resume perfil, serviços, atendimento e stack em
  Markdown para assistentes de IA. É uma convenção recente: custo zero, mas nenhuma IA grande
  confirmou que usa.
- **robots.txt e sitemap.xml.** Gerados em `dist/` ao fim de todo `npm run build` por
  [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs), só com módulos nativos do Node.
  O script resolve `VITE_SITE_URL` com a mesma precedência do Vite (variável de ambiente >
  `.env.production.local` > `.env.production` > `.env.local` > `.env`) e confere o resultado com
  o canonical do `dist/index.html` — `<head>`, sitemap e robots nunca divergem. O `<lastmod>` é a
  data do arquivo mais recente em `src/`, `public/` e `index.html`. Páginas novas entram na lista
  `ROUTES` do script.

  > `robots.txt` só é lido na **raiz do domínio**. Se o site for publicado em subpasta (GitHub
  > Pages de projeto, por exemplo), o script avisa — nesse caso, envie o sitemap direto no
  > Google Search Console.

Depois do deploy, valide nestas ferramentas:

- [Rich Results Test](https://search.google.com/test/rich-results) — lê o JSON-LD como o Google.
- [Sharing Debugger](https://developers.facebook.com/tools/debug/) — preview do Facebook e do
  WhatsApp. O WhatsApp guarda o card em cache; o botão *Scrape Again* força a atualização.
- [Post Inspector](https://www.linkedin.com/post-inspector/) — preview do LinkedIn.

---

## Pré-renderização (HTML para robôs de IA)

Os robôs de IA (GPTBot, ClaudeBot, PerplexityBot) não executam JavaScript. Num SPA puro eles
recebiam só `<div id="root"></div>` — **0 palavras**. Agora o build entrega a página inteira no
HTML (~590 palavras).

[`scripts/prerender.mjs`](scripts/prerender.mjs) roda depois do `vite build`:

1. faz um build SSR de [`src/entry-server.jsx`](src/entry-server.jsx) com a mesma config do Vite —
   as imagens saem com os mesmos hashes do build do cliente;
2. renderiza o `<App/>` com `react-dom/server` e injeta o HTML no `#root` do `dist/index.html`;
3. troca o comentário `<!-- app:structured-data -->` pelo JSON-LD de serviços e FAQ;
4. adiciona `<link rel="preload">` das fontes que o CSS usa — o preloader só libera a página
   quando elas chegam;
5. confere que toda imagem citada no HTML existe no `dist/`.

No navegador, [`main.jsx`](src/main.jsx) usa `hydrateRoot`: o React adota esse HTML em vez de
redesenhar. Os efeitos (GSAP) só rodam no navegador, então o HTML sai no estado inicial, sem
estilos de animação congelados. Sem navegador headless: rápido no CI e idêntico a cada build.

Regras para manter a hidratação limpa:

- nada de `window`/`document` durante o render — só em `useEffect`/`useGSAP` (o
  [`lib/gsap.js`](src/lib/gsap.js) já protege o que roda na importação);
- o primeiro render precisa ser igual no servidor e no cliente (o `useMediaQuery` responde
  `false` no servidor e só depois assume o valor real);
- o GSAP não reescreve DOM do React (as palavras dos depoimentos são `<span>` do próprio React).

---

## Acessibilidade

- `prefers-reduced-motion` desliga o pin, o scrub, o smooth scroll, o letreiro e a
  cortina/parallax da foto; a mídia do hero já aparece aberta e o manifesto visível.
- O `<h1>` carrega o nome completo e a função em texto legível por leitor de tela; as
  palavras gigantes são decorativas (`aria-hidden`). O letreiro também é decorativo, e a
  stack existe em texto para leitores de tela.
- Cursor customizado só em ponteiros finos (`hover: hover and pointer: fine`). Ele se esconde
  quando o mouse sai da janela e volta no primeiro movimento; o estado de hover é recalculado
  a cada movimento, então um elemento desmontado não o deixa preso.
- Foco visível preservado em todos os links.
- Menu mobile: botão com `aria-expanded`/`aria-controls`; aberto, foca o primeiro link, fecha com
  Esc e deixa o resto da página `inert` e sem rolagem; fechado, devolve o foco ao botão.
- Serviços: cada linha é um link focável; o foco pelo teclado tem o mesmo efeito do hover. As
  descrições estão sempre no layout (esmaecidas no desktop, acesas em telas de toque): nada
  some da leitura de quem não usa mouse.
- FAQ: padrão de accordion da WAI-ARIA (`button` + `aria-expanded`/`aria-controls`); resposta
  fechada fica `inert`, fora do foco e do leitor de tela.
- Depoimentos: com movimento reduzido não há pin — os depoimentos ficam empilhados.
- Diamante 3D: com movimento reduzido (ou sem WebGL) o palco não é montado e o contato fica
  visível como sempre; o canvas é `aria-hidden` e não recebe ponteiro.

---

## Deploy

Automático: todo push na `main` dispara [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
que roda `npm ci` + `npm run build` e publica o `dist/` no GitHub Pages em
**https://otaviocruz.com.br**. O andamento aparece na aba *Actions* do repositório.

- O Pages está com a fonte **GitHub Actions** (*Settings → Pages → Source*). O domínio fica
  configurado nessa tela; com deploy por Actions o GitHub ignora o `public/CNAME`, que existe
  só como registro do domínio.
- O `base` é `'/'` em [vite.config.js](vite.config.js): o site mora na raiz do domínio, e a
  pré-renderização precisa das mesmas URLs absolutas de assets que o build do cliente.
