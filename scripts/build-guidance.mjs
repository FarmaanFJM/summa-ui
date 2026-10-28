#!/usr/bin/env node
// Builds the derived parts of the guidance bundle, deterministically:
//   guidance/tokens.json        from src/styles/tokens.css + role metadata below
//   guidance/css/tokens.css     verbatim copy of src/styles/tokens.css
//   guidance/principles.json    antipatterns[] back-references derived from antipattern files
//   guidance/prompt-pack.md     compact text for Executor agents
//   guidance/manifest.json      file list with sha256, digest, counts
// Run: node scripts/build-guidance.mjs
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const G = join(root, 'guidance')
const read = p => readFileSync(p, 'utf8')
const readJson = p => JSON.parse(read(p))
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')
const sha = buf => createHash('sha256').update(buf).digest('hex')

/* ---------------------------------------------------------------- tokens */
const ROLES = {
  s0: ['surface', 'Page background. Darkest layer.'], s1: ['surface', 'Main panels and cards on the page.'], s2: ['surface', 'Inputs, hovered rows, nested cards on a panel.'],
  s3: ['surface', 'Raised controls, selected rows (neutral), dialogs.'], s4: ['surface', 'Menus, popovers, toasts, pressed states.'],
  line: ['border', 'The only divider and hairline color.'], 'line-strong': ['border', 'Single outline on floating overlays.'],
  text: ['text', 'Primary text.'], 'text-2': ['text', 'Secondary text, headings that are muted.'], 'text-3': ['text', 'Tertiary text, placeholders, disabled.'],
  accent: ['accent', 'Brand and the single primary action of a view. Not for focus or selection.'], 'accent-hover': ['accent', 'Hover of the primary action.'],
  'accent-ink': ['accent', 'Text on accent fills.'], 'accent-soft': ['accent', 'Meaningful state tint only (never ordinary selection).'], 'accent-text': ['accent', 'Accent colored text for meaningful state (for example positive delta).'],
  focus: ['state', 'Keyboard focus ring and input outline. Neutral, 1px to 1.5px, at least 3:1 contrast.'], select: ['state', 'Selected row, card or item. Quiet neutral fill.'], 'select-strong': ['state', 'Stronger neutral fill for pressed or range selection.'],
  danger: ['semantic', 'Danger text and icons, destructive menu items, negative movement.'], 'danger-soft': ['semantic', 'Subtle danger surface for non-button banners. Never for buttons.'],
  'danger-solid': ['semantic', 'Destructive button background (solid).'], 'danger-solid-hover': ['semantic', 'Destructive button hover.'], 'danger-ink': ['semantic', 'Text on destructive solid fills.'],
  warn: ['semantic', 'Warning icons and amber data series.'],
}
const css = read(join(root, 'src/styles/tokens.css'))
const decl = [...css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => ({ name: m[1], value: m[2].trim() }))
const groupOf = n => (/^--s\d$|^--line/.test(n) ? 'surfaces' : /^--text/.test(n) ? 'text' : /^--accent/.test(n) ? 'accent' : /^--(focus|select)/.test(n) ? 'interaction' : /^--(danger|warn)/.test(n) ? 'semantic' : /^--(r|r-)/.test(n) ? 'radius' : /^--sp-/.test(n) ? 'spacing' : /^--(font|mono|fs)/.test(n) ? 'typography' : 'motion-and-misc')
const groups = {}
for (const d of decl) {
  const key = d.name.slice(2)
  const [role, usage] = ROLES[key] ?? [null, null]
  ;(groups[groupOf(d.name)] ??= []).push({ name: d.name, value: d.value, ...(role ? { role, usage } : {}) })
}
writeJson(join(G, 'tokens.json'), {
  schemaVersion: 1, source: 'src/styles/tokens.css', format: 'css-custom-properties',
  rules: [
    'Reference tokens, never raw hex values, in UI chrome.',
    'Surfaces step from --s0 (darkest) to --s4 (lightest). Child surfaces are lighter than their parent in dark themes.',
    'Only --accent family tokens carry the brand emerald. They are not used for focus, selection or input outlines.',
    'Use --focus for keyboard focus and --select for selection. They are neutral.',
    'Use --danger-solid with --danger-ink for destructive buttons.',
  ],
  groups: Object.entries(groups).map(([name, tokens]) => ({ name, tokens })),
})
writeFileSync(join(G, 'css/tokens.css'), css)

/* ------------------------------------------------- principles back-links */
const pr = readJson(join(G, 'principles.json'))
const apDir = join(G, 'antipatterns')
const aps = existsSync(apDir) ? readdirSync(apDir).filter(f => /^AP-\d{3}\.json$/.test(f)).sort().map(f => readJson(join(apDir, f))) : []
if (aps.length) {
  for (const p of pr.principles) p.antipatterns = aps.filter(a => a.principles.includes(p.id)).map(a => a.id)
  writeJson(join(G, 'principles.json'), pr)
}
const presets = existsSync(join(G, 'presets')) ? readdirSync(join(G, 'presets')).filter(f => f.endsWith('.json')).sort().map(f => readJson(join(G, 'presets', f))) : []
const checks = readJson(join(G, 'checks/rules.json'))
const icons = existsSync(join(G, 'icons/catalog.json')) ? readJson(join(G, 'icons/catalog.json')) : null
const cfg = readJson(join(G, 'bundle.config.json'))

/* --------------------------------------------------------- prompt pack */
const L = []
L.push(`# Summa-UI design guidance (pack v${cfg.version})`, '', 'Follow these rules when producing or changing any user interface. They are defaults: break one only for a concrete usability reason and state the reason. Do not require any particular framework or library; the CSS tokens and class presets work with plain HTML.', '')
L.push('## Principles', '')
for (const p of pr.principles) {
  L.push(`### ${p.id} ${p.title}`, p.summary)
  for (const r of p.rules) L.push(`- ${r}`)
  if (p.exceptions.length) L.push(`- Exceptions: ${p.exceptions.join(' ')}`)
  L.push('')
}
if (aps.length) {
  L.push('## Anti-patterns to avoid', '')
  for (const a of aps) {
    L.push(`### ${a.id} ${a.name} [${a.severity}, ${a.applicability}]`, a.summary, `- Problem: ${a.problem}`)
    L.push(`- Instead: ${a.good.map(g => g.title).join('; ')}`)
    if (a.exceptions.length) L.push(`- Allowed when: ${a.exceptions.join('; ')}`)
    L.push(`- Principles: ${a.principles.join(', ')}`, '')
  }
}
L.push('## Tokens', '', 'Use CSS custom properties from tokens.css. Roles:', '')
for (const g of groups.surfaces ? Object.values(groups) : []) for (const t of g) if (t.role) L.push(`- ${t.name} (${t.role}): ${t.usage}`)
L.push('')
if (presets.length) {
  L.push('## Presets', '')
  for (const p of presets) { L.push(`### ${p.id} ${p.name}`, p.purpose, `- Use when: ${p.whenToUse.join('; ')}`, `- Do not use when: ${p.whenNotToUse.join('; ')}`, `- Variants: ${p.variants.map(v => v.id).join(', ')}`, `- Avoids: ${p.avoids.join(', ')}`, '') }
}
if (icons) {
  L.push('## Icons', '', `Use only the curated ${icons.icons.length} icons (Lucide ${icons.source.version}, ${icons.source.license}), ${icons.grid}px grid, stroke ${icons.stroke.width}. Rules:`, '')
  for (const u of icons.usage) L.push(`- ${u}`)
  L.push('', `Names: ${icons.icons.map(i => i.name).join(', ')}`, '')
}
L.push('## Checks', '', 'Objective checks an evaluator can run (see checks/rules.json):', '')
for (const c of checks.checks) L.push(`- ${c.id} [${c.automation}, ${c.severity}] ${c.title} (${c.principles.join(', ')})`)
L.push('', 'Needs human judgment:', '')
for (const h of checks.humanJudgment) L.push(`- ${h.id} ${h.question}`)
L.push('')
writeFileSync(join(G, 'prompt-pack.md'), L.join('\n'))

/* ------------------------------------------------------------ manifest */
const SKIP = new Set(['manifest.json', 'node_modules', 'dist', '.DS_Store'])
const roleOf = rel => (rel.startsWith('antipatterns/') ? 'antipatterns' : rel.startsWith('presets/') ? 'presets' : rel.startsWith('icons/') ? 'icons' : rel.startsWith('checks/') ? 'checks' : rel.startsWith('examples/') ? 'examples' : rel.startsWith('schema/') ? 'schema' : rel.startsWith('css/') ? 'css' : rel === 'principles.json' || rel === 'prompt-pack.md' ? 'principles' : rel === 'tokens.json' ? 'tokens' : 'docs')
const walk = d => readdirSync(d).sort().flatMap(n => (SKIP.has(n) ? [] : statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]))
const files = walk(G).map(abs => {
  const rel = relative(G, abs).split('\\').join('/')
  const buf = readFileSync(abs)
  return { path: rel, sha256: sha(buf), bytes: buf.length, role: roleOf(rel) }
})
const digest = sha(files.map(f => `${f.path}:${f.sha256}`).join('\n'))
writeJson(join(G, 'manifest.json'), {
  schemaVersion: 1, name: cfg.name, version: cfg.version, channel: cfg.channel,
  reviewedBy: cfg.reviewedBy ?? null, approvedAt: cfg.approvedAt ?? null, description: cfg.description,
  entrypoints: { principles: 'principles.json', antipatterns: 'antipatterns/', presets: 'presets/', tokens: 'tokens.json', icons: 'icons/catalog.json', checks: 'checks/rules.json' },
  counts: { principles: pr.principles.length, antipatterns: aps.length, presets: presets.length, checks: checks.checks.length, humanJudgment: checks.humanJudgment.length, icons: icons ? icons.icons.length : 0, tokens: decl.length, files: files.length },
  compat: { frameworkAgnostic: true, optionalReference: ['src/presets (React)', 'src/ui (React)', 'src/lab (gallery)'] },
  bundleDigest: digest, files,
})
console.log(`guidance ${cfg.version} (${cfg.channel}) digest ${digest.slice(0, 12)}  files=${files.length} aps=${aps.length} presets=${presets.length} icons=${icons ? icons.icons.length : 0}`)
