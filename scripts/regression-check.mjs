#!/usr/bin/env node
// Runs the reference check evaluator over every registered approved interface and compares against a baseline.
// A guidance change must not make an approved interface worse unless the owner accepts the regression.
// Usage: node scripts/regression-check.mjs [--out report.json] [--baseline feedback/baselines/guidance-v0.1.0.json] [--apps ai,files] [--with-tap] [--with-layout]
// Exit code 1 when a check fails that the baseline did not (a regression), or a with-* suite fails.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d }
const registry = JSON.parse(readFileSync(join(root, 'feedback/applications.json'), 'utf8')).applications.filter(a => a.status !== 'retired' && a.regression !== false)
const apps = (opt('apps') ?? registry.map(a => a.id).join(',')).split(',')
const PORT = 5250, base = `http://localhost:${PORT}/`
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' })
for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) }

const jobs = apps.flatMap(a => ['1440x900', '390x844'].map(vp => ({ app: a, vp })))
const runOne = ({ app, vp }) => new Promise(resolve => {
  const route = registry.find(a => a.id === app)?.route ?? `#/${app}`
  const p = spawn('node', ['scripts/run-checks.mjs', `${base}${route}`, '--viewport', vp, '--json'], { cwd: root })
  let out = ''; p.stdout.on('data', d => (out += d)); p.on('close', () => { try { resolve({ app, vp, ...JSON.parse(out) }) } catch { resolve({ app, vp, error: 'evaluator produced no report' }) } })
})
const results = []
const queue = [...jobs]
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) { const j = queue.shift(); results.push(await runOne(j)) } }))

// Collapse to counts per app, viewport, check and status.
const counts = {}
for (const r of results) {
  const key = `${r.app}@${r.vp}`
  counts[key] = r.error ? { error: r.error } : Object.fromEntries(Object.entries(r.summary ?? {}))
}
const report = { guidanceVersion: JSON.parse(readFileSync(join(root, 'guidance/manifest.json'), 'utf8')).version, generator: 'scripts/regression-check.mjs', counts }
const regressions = [], improvements = []
if (opt('baseline') && existsSync(opt('baseline'))) {
  const base0 = JSON.parse(readFileSync(opt('baseline'), 'utf8')).counts
  for (const [key, now] of Object.entries(counts)) {
    const was = base0[key] ?? {}
    for (const [k, n] of Object.entries(now)) { if (k.endsWith(' fail') && n > (was[k] ?? 0)) regressions.push(`${key} ${k}: ${was[k] ?? 0} -> ${n}`) }
    for (const [k, n] of Object.entries(was)) { if (k.endsWith(' fail') && (now[k] ?? 0) < n) improvements.push(`${key} ${k}: ${n} -> ${now[k] ?? 0}`) }
    if (now.error) regressions.push(`${key}: ${now.error}`)
  }
}
report.regressions = regressions; report.improvements = improvements
report.result = regressions.length ? 'regressions-found' : 'no-regressions'
let failed = regressions.length > 0
if (args.includes('--with-tap')) { const r = spawnSync('node', ['scripts/test-tap-targets.mjs'], { cwd: root, stdio: 'inherit' }); report.tap = r.status === 0 ? 'pass' : 'fail'; failed ||= r.status !== 0 }
if (args.includes('--with-layout')) { const r = spawnSync('node', ['scripts/layout-snapshot.mjs', '--compare', 'docs/reports/desktop-layout-before.json'], { cwd: root, stdio: 'inherit' }); report.desktopLayout = r.status === 0 ? 'unchanged' : 'changed'; failed ||= r.status !== 0 }
server.kill()
if (opt('out')) writeFileSync(opt('out'), JSON.stringify(report, null, 2) + '\n')
console.log(`regression check over ${apps.length} applications: ${report.result}${improvements.length ? `, ${improvements.length} improvements` : ''}`)
for (const r of regressions) console.log('  REGRESSION ' + r)
process.exit(failed ? 1 : 0)
