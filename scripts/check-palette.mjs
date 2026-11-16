#!/usr/bin/env node
// Design drift check for the Bear "Red Graphite" tokens (src/app/globals.css).
// Fails when UI code uses raw Tailwind palette colours, hex colours or heroicons instead of tokens/lucide.
//   node scripts/check-palette.mjs           report and exit 1 on findings
//   node scripts/check-palette.mjs --summary counts per file only
// Allow a line on purpose with a trailing comment: // palette-ok: <reason>
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')
// Files where literal colours are data, not styling (favicon colour conversion, chart palettes fed to canvas, email HTML).
const SKIP = [/src\/app\/api\//, /src\/app\/favicon\.ico\//, /src\/lib\/email/, /src\/db\//]

const PALETTE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|shadow|accent|caret|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
const HEX = /#[0-9a-fA-F]{3,8}\b/g
const CHECKS = [
  { name: 'palette class', re: PALETTE },
  { name: 'hex colour', re: HEX },
  { name: 'heroicons import', re: /@heroicons\/react/g },
  { name: 'hsl(var(--', re: /hsl\(var\(--/g },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx?|css)$/.test(name)) out.push(p)
  }
  return out
}

const summary = process.argv.includes('--summary')
const perFile = new Map()
let total = 0
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file)
  if (SKIP.some((re) => re.test(rel)) || rel.endsWith('globals.css')) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (line.includes('palette-ok')) return
    for (const { name, re } of CHECKS) {
      re.lastIndex = 0
      const hits = line.match(re)
      if (!hits) continue
      // Hex inside HTML entities or URLs fragments is not a colour.
      const real = name === 'hex colour' ? hits.filter((h) => !/&#|href=|url\(/.test(line)) : hits
      if (!real.length) continue
      total += real.length
      perFile.set(rel, (perFile.get(rel) || 0) + real.length)
      if (!summary) console.log(`${rel}:${i + 1}: ${name}: ${real.join(' ')}`)
    }
  })
}
if (summary) for (const [f, n] of [...perFile].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(4), f)
console.log(total ? `\n${total} off-token colour/icon uses in ${perFile.size} files.` : 'No off-token colours or heroicons.')
process.exit(total ? 1 : 0)
