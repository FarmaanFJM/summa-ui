#!/usr/bin/env node
// Validates guidance/presets/*.json against guidance/schema/preset.schema.json (required fields,
// basic types and patterns), checks AP ids against guidance/IDS.md, checks referenced files exist,
// and rejects the em dash character anywhere in a preset file.
// Usage: node scripts/validate-presets.mjs   (package.json script name: validate:presets)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const guidance = join(root, 'guidance')
const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

const schema = JSON.parse(readFileSync(join(guidance, 'schema/preset.schema.json'), 'utf8'))
const idsText = readFileSync(join(guidance, 'IDS.md'), 'utf8')
const apIds = new Set(idsText.match(/AP-\d{3}/g) ?? [])
const presetIds = new Set((idsText.match(/preset\.[a-z-]+/g) ?? []))
const EM_DASH = '—'

function check(value, spec, path, file) {
  if (!spec) return
  const t = spec.type
  const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
  if (t && actual !== t) { fail(file, `${path} should be ${t}, got ${actual}`); return }
  if (t === 'string' && spec.pattern && !new RegExp(spec.pattern).test(value)) fail(file, `${path} "${value}" does not match ${spec.pattern}`)
  if (t === 'array') {
    if (spec.minItems && value.length < spec.minItems) fail(file, `${path} needs at least ${spec.minItems} item(s)`)
    value.forEach((v, i) => check(v, spec.items, `${path}[${i}]`, file))
  }
  if (t === 'object') {
    for (const k of spec.required ?? []) if (!(k in value)) fail(file, `${path}.${k} is required`)
    for (const k of Object.keys(value)) {
      if (spec.additionalProperties === false && !(spec.properties && k in spec.properties)) fail(file, `${path}.${k} is not allowed`)
      else check(value[k], spec.properties?.[k], `${path}.${k}`, file)
    }
  }
}

const dir = join(guidance, 'presets')
const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
if (!files.length) errors.push('no preset files found')

const seen = new Set()
for (const f of files) {
  const raw = readFileSync(join(dir, f), 'utf8')
  let data
  try { data = JSON.parse(raw) } catch (e) { fail(f, `invalid JSON: ${e.message}`); continue }
  if (raw.includes(EM_DASH)) fail(f, 'contains an em dash')
  check(data, schema, '$', f)
  if (data.id) {
    if (`${data.id.replace(/^preset\./, '')}.json` !== f) fail(f, `file name must be ${data.id.replace(/^preset\./, '')}.json`)
    if (!presetIds.has(data.id)) fail(f, `${data.id} is not listed in IDS.md`)
    seen.add(data.id)
  }
  for (const ap of data.avoids ?? []) if (!apIds.has(ap)) fail(f, `unknown anti-pattern ${ap} (not in IDS.md)`)
  const impl = data.implementations ?? {}
  for (const key of ['html', 'css']) if (impl[key] && !existsSync(join(guidance, impl[key]))) fail(f, `implementations.${key} not found: guidance/${impl[key]}`)
  if (impl.react && !existsSync(join(root, impl.react))) fail(f, `implementations.react not found: ${impl.react}`)
  if (impl.html && existsSync(join(guidance, impl.html)) && readFileSync(join(guidance, impl.html), 'utf8').includes(EM_DASH)) fail(f, `${impl.html} contains an em dash`)
}
for (const id of presetIds) if (!seen.has(id)) errors.push(`${id} is listed in IDS.md but has no preset file`)

if (errors.length) {
  console.error(`validate-presets: ${errors.length} problem(s)`)
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
console.log(`validate-presets: ${files.length} presets OK`)
