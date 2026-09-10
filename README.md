# Otávio Cruz — Portfólio

Portfólio pessoal brutalista em **Vite + React 19 + Tailwind CSS v4 + GSAP (ScrollTrigger)**.
Dark mode nativo, tipografia Clash Display e um hero com máscara dirigida por scroll.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ + sitemap.xml e robots.txt
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

## Estrutura

```
src/
├── components/
│   ├── HeroMask.jsx      # seção pinada + timeline mestre
│   ├── Manifesto.jsx     # texto de impacto (revelado pelo HeroMask)
│   ├── About.jsx         # perfil: foto + declaração + letreiro da stack
│   ├── Projects.jsx      # vitrine com hover reveal
│   ├── Footer.jsx        # CTA magnético + contato
│   ├── Marquee.jsx       # letreiro infinito
│   ├── MagneticButton.jsx
│   ├── Preloader.jsx
│   ├── Cursor.jsx
│   ├── Nav.jsx
│   └── Grain.jsx
├── hooks/
│   ├── useSmoothScroll.js  # Lenis acoplado ao ticker do GSAP
│   └── useMediaQuery.js
├── lib/
│   ├── gsap.js             # registro de plugins e config global
│   └── type.js             # classes do texto vazado
├── data/
│   ├── projects.js         # projetos e contato
│   ├── profile.js          # foto, textos do perfil e stack
│   └── media.js            # frames do hero (glob automático)
├── assets/
│   ├── hero/               # frames do slideshow
│   ├── work/               # capas dos projetos
│   ├── otavio-cruz.jpeg    # foto do perfil
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

> **Peso.** As três capas em PNG somam ~3,7 MB (só a da Maria Pitanga tem 2,2 MB) e são
> exibidas bem abaixo da resolução original. Convertê-las para WebP/AVIF em ~1400px de largura
> deve reduzir isso a uma fração — é hoje o maior custo de carregamento do site.

---

## Editando o conteúdo

| O quê | Onde |
| --- | --- |
| Título, descrição e tags de compartilhamento | `index.html` |
| Domínio do site (URLs absolutas do SEO) | `.env` → `VITE_SITE_URL` |
| Projetos, links e contato | `src/data/projects.js` |
| Perfil: título, texto, princípios e stack | `src/data/profile.js` |
| Texto do manifesto | `src/components/Manifesto.jsx` |
| Estilo do texto vazado | `src/lib/type.js` |
| Cores, fontes e métricas do hero | `src/index.css` (`@theme`) |
| Ritmo da animação do hero | `src/components/HeroMask.jsx` (timeline `master`) |

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
- **Dados estruturados.** JSON-LD com `Person` (nome, cargo, cidade, WhatsApp e GitHub) e
  `WebSite`, ligados por `@id`.
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

---

## Deploy

Automático: todo push na `main` dispara [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
que roda `npm ci` + `npm run build` e publica o `dist/` no GitHub Pages em
**https://otaviocruz.com.br**. O andamento aparece na aba *Actions* do repositório.

- O Pages está com a fonte **GitHub Actions** (*Settings → Pages → Source*). O domínio fica
  configurado nessa tela; com deploy por Actions o GitHub ignora o `public/CNAME`, que existe
  só como registro do domínio.
- O `base` está como `'./'` em [vite.config.js](vite.config.js), então o `dist/` funciona na raiz
  do domínio e também em subpasta.
