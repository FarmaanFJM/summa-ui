#!/usr/bin/env node
// Validates the guidance bundle: schemas, cross references, consistency with PRINCIPLES.md,
// tokens used by CSS, em dash rule, manifest hashes. Exit code 1 on any error.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { validate } from './lib/mini-schema.mjs'

const root = new URL('..', import.meta.url).pathname
const G = join(root, 'guidance')
const read = p => readFileSync(p, 'utf8')
const json = p => JSON.parse(read(p))
const errors = [], warnings = []
const err = m => errors.push(m)
const sch = n => json(join(G, 'schema', n))
const check = (schemaName, data, label) => validate(sch(schemaName), data).forEach(e => err(`${label}: ${e}`))
const sha = b => createHash('sha256').update(b).digest('hex')

/* principles */
const pr = json(join(G, 'principles.json')); check('principles.schema.json', pr, 'principles.json')
const pids = new Set(pr.principles.map(p => p.id))
const md = read(join(root, 'PRINCIPLES.md'))
const headings = [...md.matchAll(/^## (?:\d+\. |Meta-Principle: )?(.+)$/gm)].map(m => m[1].trim())
for (const p of pr.principles) if (!headings.some(h => h.toLowerCase() === p.title.toLowerCase())) err(`principles.json ${p.id} "${p.title}" has no matching heading in PRINCIPLES.md`)
const numbered = [...md.matchAll(/^## (\d+)\. /gm)].length
if (numbered !== 20) err(`PRINCIPLES.md numbered sections = ${numbered}, expected 20`)
if (new Set(pr.principles.map(p => p.id)).size !== pr.principles.length) err('principles.json duplicate ids')

/* checks */
const ck = json(join(G, 'checks/rules.json')); check('checks.schema.json', ck, 'checks/rules.json')
const cids = new Set(ck.checks.map(c => c.id))
if (cids.size !== ck.checks.length) err('checks: duplicate ids')
for (const c of ck.checks) {
  c.principles.forEach(p => pids.has(p) || err(`${c.id}: unknown principle ${p}`))
  for (const pat of c.patterns ?? []) { try { new RegExp(pat) } catch (e) { err(`${c.id}: invalid regex ${pat}`) } }
}
ck.humanJudgment.forEach(h => h.principles.forEach(p => pids.has(p) || err(`${h.id}: unknown principle ${p}`)))

/* ids list */
const ids = read(join(G, 'IDS.md'))
const idAps = [...ids.matchAll(/(AP-\d{3}) ([^.]+)\./g)].map(m => ({ id: m[1], name: m[2].trim() }))
const idPresets = [...ids.matchAll(/preset\.[a-z-]+/g)].map(m => m[0])

/* anti-patterns */
const apDir = join(G, 'antipatterns')
const apFiles = existsSync(apDir) ? readdirSync(apDir).filter(f => f.endsWith('.json')).sort() : []
const aps = apFiles.map(f => ({ f, d: json(join(apDir, f)) }))
const apIds = new Set()
for (const { f, d } of aps) {
  check('antipattern.schema.json', d, `antipatterns/${f}`)
  if (`${d.id}.json` !== f) err(`${f}: file name must match id ${d.id}`)
  apIds.add(d.id)
  d.principles?.forEach(p => pids.has(p) || err(`${d.id}: unknown principle ${p}`))
  d.detection?.objective?.forEach(c => cids.has(c) || err(`${d.id}: unknown check ${c}`))
  d.good?.forEach(g => g.preset && !idPresets.includes(g.preset) && err(`${d.id}: unknown preset ${g.preset}`))
  d.relatedPresets?.forEach(p => idPresets.includes(p) || err(`${d.id}: unknown related preset ${p}`))
  d.relatedAntiPatterns?.forEach(a => /^AP-\d{3}$/.test(a) || err(`${d.id}: bad related ${a}`))
  if (d.applicability !== 'always' && d.exceptions?.length === 0) err(`${d.id}: applicability ${d.applicability} requires at least one explicit exception`)
}
if (idAps.length !== 16) err(`IDS.md lists ${idAps.length} anti-patterns, expected 16`)
for (const a of idAps) {
  const hit = aps.find(x => x.d.id === a.id)
  if (!hit) err(`missing anti-pattern file for ${a.id} ${a.name}`)
}
for (const { d } of aps) d.relatedAntiPatterns?.forEach(a => apIds.has(a) || err(`${d.id}: unknown related ${a}`))
for (const c of ck.checks) if (c.antipattern && !apIds.has(c.antipattern)) err(`${c.id}: unknown anti-pattern ${c.antipattern}`)
for (const p of pr.principles) {
  for (const a of p.antipatterns) apIds.has(a) || err(`${p.id}: unknown anti-pattern ${a}`)
  for (const { d } of aps) if (d.principles.includes(p.id) && !p.antipatterns.includes(d.id)) err(`${p.id} back-reference to ${d.id} missing (run scripts/build-guidance.mjs)`)
}

/* tokens */
const tokens = json(join(G, 'tokens.json'))
const tokenNames = new Set(tokens.groups.flatMap(g => g.tokens.map(t => t.name)))
if (read(join(G, 'css/tokens.css')) !== read(join(root, 'src/styles/tokens.css'))) err('guidance/css/tokens.css is out of date with src/styles/tokens.css (run build)')
const cssFiles = existsSync(join(G, 'css')) ? readdirSync(join(G, 'css')).filter(f => f.endsWith('.css')) : []
for (const f of cssFiles) {
  const src = read(join(G, 'css', f))
  const defined = new Set([...src.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]))
  // var(--x, fallback) is allowed for component-local custom properties; var(--x) must be a known token.
  for (const m of src.matchAll(/var\((--[a-z0-9-]+)\s*\)/g)) if (!tokenNames.has(m[1]) && !defined.has(m[1])) err(`css/${f}: unknown custom property ${m[1]}`)
}
/* presets */
const pDir = join(G, 'presets')
const pFiles = existsSync(pDir) ? readdirSync(pDir).filter(f => f.endsWith('.json')).sort() : []
const presetIds = []
for (const f of pFiles) {
  const d = json(join(pDir, f)); check('preset.schema.json', d, `presets/${f}`); presetIds.push(d.id)
  if (`${d.id.replace('preset.', '')}.json` !== f) err(`presets/${f}: file name must match id ${d.id}`)
  d.avoids.forEach(a => apIds.has(a) || err(`${d.id}: unknown anti-pattern ${a}`))
  d.principles?.forEach(p => pids.has(p) || err(`${d.id}: unknown principle ${p}`))
  d.tokens.forEach(t => tokenNames.has(t.startsWith('--') ? t : `--${t}`) || err(`${d.id}: unknown token ${t}`))
  for (const k of ['html', 'css']) if (d.implementations[k] && !existsSync(join(G, d.implementations[k]))) err(`${d.id}: implementation ${k} file missing ${d.implementations[k]}`)
  if (d.implementations.react && !existsSync(join(root, d.implementations.react))) err(`${d.id}: react reference missing ${d.implementations.react}`)
}
for (const id of idPresets) presetIds.includes(id) || err(`missing preset ${id}`)
/* icons */
if (existsSync(join(G, 'icons/catalog.json'))) {
  const cat = json(join(G, 'icons/catalog.json')); check('icons.schema.json', cat, 'icons/catalog.json')
  const names = new Set()
  for (const i of cat.icons) {
    if (names.has(i.name)) err(`icons: duplicate ${i.name}`); names.add(i.name)
    if (!existsSync(join(G, i.file))) err(`icons: missing file ${i.file}`)
    if (!cat.categories.includes(i.category)) err(`icons: ${i.name} unknown category ${i.category}`)
  }
}
/* em dash and ascii hygiene */
const EM = '\u2014'
const walk = d => readdirSync(d).flatMap(n => (n === 'node_modules' || n === 'dist' ? [] : statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]))
for (const abs of [...walk(G), join(root, 'PRINCIPLES.md'), ...walk(join(root, 'docs')).filter(f => /\.md$/.test(f))]) {
  if (!/\.(json|md|css|html|svg|mjs)$/.test(abs)) continue
  if (read(abs).includes(EM)) err(`em dash found in ${relative(root, abs)}`)
}
/* manifest */
if (existsSync(join(G, 'manifest.json'))) {
  const m = json(join(G, 'manifest.json')); check('manifest.schema.json', m, 'manifest.json')
  const listed = new Set(m.files.map(f => f.path))
  for (const f of m.files) {
    const p = join(G, f.path)
    if (!existsSync(p)) { err(`manifest lists missing file ${f.path}`); continue }
    if (sha(readFileSync(p)) !== f.sha256) err(`manifest hash stale for ${f.path} (run scripts/build-guidance.mjs)`)
  }
  for (const abs of walk(G)) { const rel = relative(G, abs).split('\\').join('/'); if (rel !== 'manifest.json' && !listed.has(rel)) err(`file not in manifest: ${rel}`) }
  const digest = sha(m.files.map(f => `${f.path}:${f.sha256}`).join('\n'))
  if (digest !== m.bundleDigest) err('bundleDigest mismatch')
  if (m.channel === 'approved') {
    if (!m.reviewedBy) err('approved bundle must name reviewedBy')
    if (!m.approvedAt) err('approved bundle must record approvedAt')
    const owners = existsSync(join(root, 'feedback/OWNERS.json')) ? json(join(root, 'feedback/OWNERS.json')).owners : []
    if (!owners.includes(m.reviewedBy)) err(`reviewedBy "${m.reviewedBy}" is not listed in feedback/OWNERS.json`)
    const recPath = join(root, `docs/releases/guidance-v${m.version}.json`)
    if (!existsSync(recPath)) err(`approved bundle needs a release record at docs/releases/guidance-v${m.version}.json`)
    else {
      const rec = json(recPath)
      if (rec.bundleDigest !== m.bundleDigest) err(`release record digest ${rec.bundleDigest} does not match manifest digest ${m.bundleDigest}`)
      if (rec.approvedBy !== m.reviewedBy) err('release record approvedBy does not match manifest reviewedBy')
      if (rec.version !== m.version) err('release record version does not match manifest version')
    }
  }
  // Provisional presets must be declared in the manifest, and declared ones must exist.
  const provisionalPresets = pFiles.map(f => json(join(pDir, f))).filter(d => d.status === 'provisional').map(d => d.id).sort()
  const declared = [...(m.provisional ?? [])].sort()
  if (JSON.stringify(provisionalPresets) !== JSON.stringify(declared)) err(`manifest.provisional ${JSON.stringify(declared)} does not match provisional presets ${JSON.stringify(provisionalPresets)}`)
}
for (const w of warnings) console.warn('warn ', w)
if (errors.length) { console.error(`guidance validation FAILED (${errors.length})`); errors.forEach(e => console.error(' - ' + e)); process.exit(1) }
console.log(`guidance validation passed: ${pr.principles.length} principles, ${aps.length} anti-patterns, ${pFiles.length} presets, ${ck.checks.length} checks`)
