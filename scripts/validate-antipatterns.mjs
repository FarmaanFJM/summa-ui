#!/usr/bin/env node
// Hand-rolled validation of guidance/antipatterns/*.json. Run: node scripts/validate-antipatterns.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'guidance/antipatterns')
const errors = []
const err = (f, m) => errors.push(`${f}: ${m}`)

const ids = fs.readFileSync(path.join(root, 'guidance/IDS.md'), 'utf8')
const apLine = ids.split('\n').find(l => l.startsWith('AP-001')) ?? ''
const NAMES = {}
for (const m of apLine.matchAll(/(AP-\d{3}) (.+?)\.(?= AP-\d{3}|$)/g)) NAMES[m[1]] = m[2].trim()
const presetLine = ids.split('\n').find(l => l.startsWith('Presets:')) ?? ''
const PRESETS = new Set([...presetLine.matchAll(/preset\.[a-z-]+/g)].map(m => m[0]))
if (Object.keys(NAMES).length !== 16) err('IDS.md', `expected 16 anti-patterns, parsed ${Object.keys(NAMES).length}`)
if (!PRESETS.size) err('IDS.md', 'no presets parsed')

const reg = fs.readFileSync(path.join(root, 'src/lab/guidance/ap/registry.tsx'), 'utf8')
const DEMOS = new Set([...reg.matchAll(/^\s*'([a-z0-9-]+)'\s*:/gm)].map(m => m[1]))

const SEV = ['high', 'medium', 'low'], APP = ['always', 'default', 'contextual']
const str = v => typeof v === 'string' && v.trim().length > 0
const seen = {}

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8')
  if (raw.includes('\u2014')) err(file, 'contains an em dash')
  let d
  try { d = JSON.parse(raw) } catch (e) { err(file, 'invalid JSON: ' + e.message); continue }
  const allowed = new Set(['id', 'name', 'summary', 'problem', 'severity', 'applicability', 'principles', 'bad', 'good', 'why', 'exceptions', 'detection', 'relatedPresets', 'relatedAntiPatterns'])
  for (const k of Object.keys(d)) if (!allowed.has(k)) err(file, `unknown property ${k}`)
  for (const k of ['summary', 'problem', 'why']) if (!str(d[k])) err(file, `missing ${k}`)
  if (!/^AP-\d{3}$/.test(d.id ?? '')) err(file, 'bad id')
  else {
    seen[d.id] = (seen[d.id] ?? 0) + 1
    if (file !== d.id + '.json') err(file, `file name must be ${d.id}.json`)
    if (NAMES[d.id] !== d.name) err(file, `name "${d.name}" does not match IDS.md "${NAMES[d.id]}"`)
  }
  if (!str(d.name) || d.name.length < 3) err(file, 'bad name')
  if (!SEV.includes(d.severity)) err(file, 'bad severity')
  if (!APP.includes(d.applicability)) err(file, 'bad applicability')
  if (!Array.isArray(d.principles) || !d.principles.length) err(file, 'principles must be a non-empty array')
  else for (const p of d.principles) {
    const n = /^P(\d{2})$/.exec(p)
    if (!n || +n[1] < 1 || +n[1] > 22) err(file, `unknown principle ${p}`)
  }
  if (!d.bad || !str(d.bad.description) || !str(d.bad.demo)) err(file, 'bad needs description and demo')
  else if (!DEMOS.has(d.bad.demo)) err(file, `bad.demo "${d.bad.demo}" not in registry`)
  if (!Array.isArray(d.good) || !d.good.length) err(file, 'good must have at least one alternative')
  else {
    const gids = new Set()
    for (const g of d.good) {
      if (!/^[a-z0-9-]+$/.test(g.id ?? '')) err(file, `good id "${g.id}" invalid`)
      if (gids.has(g.id)) err(file, `duplicate good id ${g.id}`)
      gids.add(g.id)
      for (const k of ['title', 'description', 'demo']) if (!str(g[k])) err(file, `good ${g.id} missing ${k}`)
      if (str(g.demo) && !DEMOS.has(g.demo)) err(file, `good.demo "${g.demo}" not in registry`)
      if (g.preset !== undefined && !PRESETS.has(g.preset)) err(file, `unknown preset ${g.preset}`)
    }
  }
  for (const p of d.relatedPresets ?? []) if (!PRESETS.has(p)) err(file, `unknown relatedPreset ${p}`)
  for (const a of d.relatedAntiPatterns ?? []) if (!NAMES[a]) err(file, `unknown related anti-pattern ${a}`)
  if (!Array.isArray(d.exceptions)) err(file, 'exceptions must be an array')
  else if (d.applicability !== 'always' && !d.exceptions.length) err(file, 'exceptions may be empty only when applicability is always')
  if (!d.detection || !Array.isArray(d.detection.objective) || !Array.isArray(d.detection.humanReview)) err(file, 'detection needs objective[] and humanReview[]')
  else for (const c of d.detection.objective) if (!/^CHK-\d{3}$/.test(c)) err(file, `bad check id ${c}`)
}

for (const id of Object.keys(NAMES)) {
  if (seen[id] !== 1) err('set', `${id} present ${seen[id] ?? 0} times (expected exactly 1)`)
}
for (const [id, n] of Object.entries(seen)) if (!NAMES[id]) err('set', `${id} is not in IDS.md (${n}x)`)

for (const f of ['src/lab/guidance/AntiPatterns.tsx', 'src/lab/guidance/antipatterns.css', 'src/lab/guidance/ap/registry.tsx', 'src/lab/guidance/ap/bad.tsx', 'src/lab/guidance/ap/good.tsx']) {
  if (fs.readFileSync(path.join(root, f), 'utf8').includes('\u2014')) err(f, 'contains an em dash')
}

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s)`); process.exit(1) }
console.log(`antipatterns ok: ${Object.keys(seen).length} entries, ${DEMOS.size} demos registered`)
