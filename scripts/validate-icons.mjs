// Validates guidance/icons (catalog vs schema, svg files, uniqueness, coverage of src/ui/icons.tsx).
// Usage: node scripts/validate-icons.mjs   (npm run validate:icons). Exit code 1 on failure.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const err = m => errors.push(m)
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

const catalog = JSON.parse(read('guidance/icons/catalog.json'))
const schema = JSON.parse(read('guidance/schema/icons.schema.json'))

// Minimal JSON Schema checker covering the keywords used by icons.schema.json.
function check(value, sch, where) {
  if (sch.const !== undefined && value !== sch.const) err(`${where}: expected ${JSON.stringify(sch.const)}`)
  if (sch.type) {
    const t = Array.isArray(value) ? 'array' : value === null ? 'null' : Number.isInteger(value) ? 'integer' : typeof value
    const ok = sch.type === t || (sch.type === 'number' && (t === 'integer' || t === 'number'))
    if (!ok) { err(`${where}: expected ${sch.type}, got ${t}`); return }
  }
  if (sch.type === 'string' && sch.pattern && !new RegExp(sch.pattern).test(value)) err(`${where}: "${value}" does not match ${sch.pattern}`)
  if (sch.type === 'object') {
    for (const k of sch.required ?? []) if (!(k in value)) err(`${where}: missing required "${k}"`)
    for (const [k, v] of Object.entries(value)) {
      if (sch.properties?.[k]) check(v, sch.properties[k], `${where}.${k}`)
      else if (sch.additionalProperties === false) err(`${where}: unexpected property "${k}"`)
    }
  }
  if (sch.type === 'array') {
    if (sch.minItems && value.length < sch.minItems) err(`${where}: needs at least ${sch.minItems} items, has ${value.length}`)
    if (sch.items) value.forEach((v, i) => check(v, sch.items, `${where}[${i}]`))
  }
}
check(catalog, schema, 'catalog')

const names = new Set()
for (const icon of catalog.icons ?? []) {
  const id = icon.name
  if (names.has(id)) err(`duplicate name "${id}"`)
  names.add(id)
  if (!catalog.categories.includes(icon.category)) err(`${id}: unknown category "${icon.category}"`)
  const file = path.join(root, 'guidance', icon.file ?? '')
  if (icon.file !== `icons/svg/${id}.svg`) err(`${id}: file should be icons/svg/${id}.svg`)
  if (!fs.existsSync(file)) { err(`${id}: file missing ${icon.file}`); continue }
  const svg = fs.readFileSync(file, 'utf8')
  const m = svg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/)
  if (!m) { err(`${id}: not a single <svg> element`); continue }
  const attrs = Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]))
  const want = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': String(catalog.stroke.width), 'stroke-linecap': catalog.stroke.linecap, 'stroke-linejoin': catalog.stroke.linejoin, width: '24', height: '24' }
  for (const [k, v] of Object.entries(want)) if (attrs[k] !== v) err(`${id}: attribute ${k} should be "${v}", is "${attrs[k]}"`)
  if (/\bclass=/.test(svg)) err(`${id}: has class attribute`)
  if (/<!--/.test(svg)) err(`${id}: has a comment`)
  if (!/<(path|circle|rect|line|polyline|polygon|ellipse)\b/.test(m[2])) err(`${id}: no shapes`)
  if (/<(script|style|image|use|text)\b/i.test(m[2])) err(`${id}: forbidden element`)
}

// Every key of the generated ICONS record must be in the catalog (and vice versa).
const tsx = read('src/ui/icons.tsx')
const body = tsx.slice(tsx.indexOf('export const ICONS = {'), tsx.indexOf('} as const'))
const keys = [...body.matchAll(/^  '?([a-z0-9-]+)'?: `/gm)].map(x => x[1])
if (!keys.length) err('no ICONS keys found in src/ui/icons.tsx')
for (const k of keys) if (!names.has(k)) err(`ICONS key "${k}" is not in the catalog`)
for (const n of names) if (!keys.includes(n)) err(`catalog icon "${n}" is missing from src/ui/icons.tsx (run npm run icons:build)`)
if (!tsx.startsWith('// GENERATED FILE')) err('src/ui/icons.tsx must start with the GENERATED header')

if (errors.length) {
  console.error(`validate:icons failed (${errors.length}):\n` + errors.map(e => '  - ' + e).join('\n'))
  process.exit(1)
}
console.log(`validate:icons ok: ${names.size} icons, ${catalog.categories.length} categories`)
