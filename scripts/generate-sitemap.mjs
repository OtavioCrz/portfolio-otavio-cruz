/**
 * Gera dist/sitemap.xml e dist/robots.txt a partir de VITE_SITE_URL.
 *
 * Roda logo após o `vite build` (ver "build" no package.json) e resolve o
 * domínio com a MESMA precedência do Vite. Assim o sitemap, o robots e as
 * URLs que o Vite injetou no <head> apontam sempre para o mesmo endereço:
 *
 *   variável de ambiente do processo (ex.: definida no CI)   <- vence
 *   .env.[modo].local
 *   .env.[modo]
 *   .env.local
 *   .env                                                     <- base
 *
 * Só módulos nativos do Node. Modo padrão: production — se o build usar
 * `vite build --mode X`, rode este script com `--mode X` também.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'dist')

/* Páginas do site. Hoje é uma single page; rotas novas entram aqui.
   Âncoras (#perfil, #work) não vão no sitemap — não são URLs distintas.
   O Google ignora changefreq e priority; Bing e outros ainda leem. */
const ROUTES = [{ path: '/', changefreq: 'monthly', priority: '1.0' }]

/* O arquivo mais recente entre estes vira o <lastmod>: um rebuild sem
   mudança de conteúdo não anuncia uma atualização falsa ao buscador. */
const CONTENT_SOURCES = ['index.html', 'src', 'public']

const modeIndex = process.argv.indexOf('--mode')
const MODE = modeIndex === -1 ? 'production' : process.argv[modeIndex + 1]

const fail = (message) => {
  console.error(styleText('red', `✗ generate-sitemap: ${message}`))
  process.exit(1)
}
const warn = (message) => console.warn(styleText('yellow', `⚠ ${message}`))

/* Leitor mínimo de .env: KEY=valor, aspas opcionais, # comentário. */
function readEnvFile(name) {
  const file = join(ROOT, name)
  if (!existsSync(file)) return {}
  const vars = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    const quote = value[0]
    if (value.length > 1 && (quote === '"' || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1)
    } else {
      value = value.replace(/\s+#.*$/, '')
    }
    vars[match[1]] = value
  }
  return vars
}

function resolveSiteUrl() {
  const files = ['.env', '.env.local', `.env.${MODE}`, `.env.${MODE}.local`]
  const fromFiles = Object.assign({}, ...files.map(readEnvFile))
  const raw = process.env.VITE_SITE_URL ?? fromFiles.VITE_SITE_URL
  if (!raw) fail('VITE_SITE_URL não definido — configure no .env ou como variável de ambiente.')

  let url
  try {
    url = new URL(raw)
  } catch {
    fail(`VITE_SITE_URL não é uma URL válida: "${raw}"`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    fail(`VITE_SITE_URL precisa começar com https:// — recebido "${raw}"`)
  }
  /* origem + caminho, sem query/hash e sem barra no fim */
  return (url.origin + url.pathname).replace(/\/+$/, '')
}

function lastContentChange() {
  let latest = 0
  for (const entry of CONTENT_SOURCES) {
    const base = join(ROOT, entry)
    if (!existsSync(base)) continue
    const files = statSync(base).isDirectory()
      ? readdirSync(base, { recursive: true }).map((rel) => join(base, rel))
      : [base]
    for (const file of files) {
      const stat = statSync(file)
      if (stat.isFile() && stat.mtimeMs > latest) latest = stat.mtimeMs
    }
  }
  /* W3C Datetime com precisão de segundos: 2026-09-10T12:34:56Z */
  return new Date(latest || Date.now()).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

const escapeXml = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

/* ------------------------------------------------------------------ */

if (!existsSync(OUT_DIR)) fail('dist/ não existe — este script roda depois do `vite build`.')

const site = resolveSiteUrl()
const lastmod = lastContentChange()

const urls = ROUTES.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${escapeXml(site + path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const robots = `# Gerado por scripts/generate-sitemap.mjs a cada build — não edite em dist/.
User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`

writeFileSync(join(OUT_DIR, 'sitemap.xml'), sitemap)
writeFileSync(join(OUT_DIR, 'robots.txt'), robots)

const count = `${ROUTES.length} URL${ROUTES.length > 1 ? 's' : ''}`
console.log(`${styleText('green', '✓ sitemap.xml')}  ${site}/sitemap.xml  (${count} · lastmod ${lastmod})`)
console.log(`${styleText('green', '✓ robots.txt ')}  Allow: /  ·  Sitemap: ${site}/sitemap.xml`)

/* -- Avisos (não interrompem o build) ------------------------------- */
const { hostname, pathname } = new URL(site)

if (hostname.includes('seu-dominio')) {
  warn('VITE_SITE_URL ainda é o domínio provisório — troque no .env antes do deploy.')
}

if (pathname !== '/') {
  warn(
    `O site está numa subpasta (${pathname}). Buscadores só leem robots.txt na raiz do ` +
      'domínio: nesse caso, envie o sitemap direto no Google Search Console.'
  )
}

/* O <head> do build precisa apontar para o mesmo domínio do sitemap. */
const indexFile = join(OUT_DIR, 'index.html')
const canonical = existsSync(indexFile)
  ? readFileSync(indexFile, 'utf8').match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  : undefined
if (canonical && canonical !== `${site}/`) {
  warn(
    `O canonical do index.html (${canonical}) difere do sitemap (${site}/). ` +
      'O build rodou em outro modo? Passe o mesmo --mode para este script.'
  )
}
