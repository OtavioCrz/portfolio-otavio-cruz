/**
 * Pré-renderiza o app React dentro do dist/index.html.
 *
 * Por quê: o site é um SPA. Sem isto, o HTML entregue é só
 * <div id="root"></div> e todo o texto nasce via JavaScript — e os robôs de
 * IA (GPTBot, ClaudeBot, PerplexityBot) não executam JS: liam uma página vazia.
 *
 * Como:
 *   1. Faz um build SSR de src/entry-server.jsx com a MESMA config do Vite,
 *      então as URLs de imagens saem com os mesmos hashes do build do cliente.
 *   2. Renderiza o <App/> com react-dom/server e injeta o HTML no #root.
 *      No navegador, o main.jsx usa hydrateRoot: o React adota esse HTML.
 *   3. Injeta no <head> o JSON-LD de Serviços e FAQ (src/seo/structured-data.js).
 *
 * Sem navegador headless: rápido no CI e com resultado idêntico a cada build.
 * Roda depois do `vite build` (ver "build" no package.json).
 */
import { build } from 'vite'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { styleText } from 'node:util'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
/* O build SSR vai para uma pasta temporária do sistema, fora do projeto.
   Motivo: no Windows, o fs.rmSync do Node 24 retorna sem erro e NÃO apaga
   caminhos com acento — e o projeto mora em "Área de Trabalho". A pasta do
   sistema tem caminho só ASCII, então a limpeza funciona; de quebra, nada de
   temporário no repositório nem sincronizando no OneDrive. */
const SSR_OUT = mkdtempSync(join(tmpdir(), 'portfolio-prerender-'))
const INDEX = join(DIST, 'index.html')

const ROOT_MARKER = '<div id="root"></div>'
const LD_MARKER = '<!-- app:structured-data -->'

const fail = (message) => {
  console.error(styleText('red', `✗ prerender: ${message}`))
  process.exit(1)
}

if (!existsSync(INDEX)) fail('dist/index.html não existe — este script roda depois do `vite build`.')

/* 1. build SSR (tudo embutido no bundle: nada de resolver pacotes em Node) */
await build({
  root: ROOT,
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: SSR_OUT,
    emptyOutDir: false, // pasta nova a cada execução
    copyPublicDir: false,
    minify: false,
  },
  ssr: { noExternal: true },
})

/* 2. renderiza */
const { render } = await import(pathToFileURL(join(SSR_OUT, 'entry-server.js')).href)
const { html, structuredData, warnings } = render()
rmSync(SSR_OUT, { recursive: true, force: true })

/* 3. injeta no index.html — replace com FUNÇÃO: com string, um "$" no HTML
   seria lido como padrão especial ($&, $1…) e corromperia a página */
let page = readFileSync(INDEX, 'utf8')
if (!page.includes(ROOT_MARKER)) fail(`marcador ${ROOT_MARKER} não encontrado no dist/index.html.`)
if (!page.includes(LD_MARKER)) fail(`marcador ${LD_MARKER} não encontrado no dist/index.html.`)

const json = JSON.stringify(structuredData).replace(/</g, '\\u003c')
page = page
  .replace(ROOT_MARKER, () => `<div id="root">${html}</div>`)
  .replace(LD_MARKER, () => `<script type="application/ld+json">${json}</script>`)

/* 3b. pré-carrega as fontes que o CSS usa. O preloader só libera a página quando elas
   chegam (document.fonts.ready); sem o preload, o navegador só as descobre depois de
   baixar e interpretar o CSS — uma ida e volta a mais com a cortina fechada. Lidas do
   CSS que o index.html referencia, e não da pasta: o dist/ pode guardar bundles antigos. */
const cssHref = page.match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"/)?.[1]
if (!cssHref) fail('folha de estilo não encontrada no dist/index.html.')
const css = readFileSync(join(DIST, cssHref), 'utf8')
const fonts = [...new Set([...css.matchAll(/url\(["']?(\/assets\/[^"')]+\.woff2)["']?\)/g)].map((m) => m[1]))]
const preloads = fonts.map((href) => `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`)
page = page.replace(/<link rel="stylesheet"/, () => `${preloads.join('\n    ')}\n    <link rel="stylesheet"`)

/* 4. toda imagem citada no HTML tem de existir no dist (mesmos hashes) */
const missing = [...html.matchAll(/\ssrc="(\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((src) => !existsSync(join(DIST, decodeURIComponent(src))))
if (missing.length) fail(`imagens citadas no HTML que não existem no dist/: ${missing.join(', ')}`)

writeFileSync(INDEX, page)

/* relatório */
const words = html
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .split(/\s+/)
  .filter(Boolean).length
console.log(
  `${styleText('green', '✓ prerender')}    dist/index.html  (${words} palavras de conteúdo · ` +
    `${(html.length / 1024).toFixed(0)} KB de HTML · JSON-LD de serviços e FAQ no <head> · ` +
    `${fonts.length} fontes pré-carregadas)`
)
for (const warning of warnings) console.warn(styleText('yellow', `⚠ ${warning}`))
