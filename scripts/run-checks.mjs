#!/usr/bin/env node
// Reference evaluator for a subset of guidance/checks/rules.json, as a proof that the objective
// checks are implementable deterministically (the shape TestNetwork would implement).
// Usage: node scripts/run-checks.mjs <url> [--viewport 1440x900] [--json] [--scope "css selector"]
// Requires Playwright to be resolvable (node -e "require('playwright')").
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
import { collect } from './lib/collector.mjs'
import { measureHitAreas } from './lib/hit-area.mjs'

const args = process.argv.slice(2)
const url = args.find(a => !a.startsWith('--'))
const opt = n => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const [vw, vh] = (opt('viewport') ?? '1440x900').split('x').map(Number)
const scope = opt('scope') ?? 'body'
if (!url) { console.error('usage: run-checks.mjs <url> [--viewport WxH] [--scope selector] [--json]'); process.exit(2) }

const browser = await chromium.launch()
// Phone widths are evaluated as a touch device (touch screen, no hover), because CHK-020 is about touch targets.
const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, ...(vw <= 480 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) })).newPage()
await page.goto(url)
await page.waitForTimeout(1500)
const findings = (await page.evaluate(collect, { scope, vw })).filter(f => f.checkId !== 'CHK-020')
if (vw <= 480) for (const it of await page.evaluate(measureHitAreas, { min: 40, step: 4, scope })) if (!it.pass) findings.push({ checkId: 'CHK-020', status: 'fail', target: it.sel, evidence: `${it.w}x${it.h}, effective hit area ${it.effW}x${it.effH}${it.thief ? ', overlapped by ' + it.thief : ''}` })

/* CHK-018 / CHK-004 / CHK-022: tab through focusable elements and inspect the focus indicator. */
const focus = []
for (let i = 0; i < 40; i++) {
  await page.keyboard.press('Tab')
  await page.waitForTimeout(220)
  const f = await page.evaluate(({ scope }) => {
    const e = document.activeElement
    if (!e || e === document.body) return null
    const root = document.querySelector(scope) ?? document.body
    if (!root.contains(e)) return null
    const s = getComputedStyle(e); const r = e.getBoundingClientRect()
    const rgba = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); return a === 0 ? [0, 0, 0, 0] : [0, 1, 2].map(i => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a) }
    let bg = [0, 0, 0, 0]; for (let p = e.parentElement; p; p = p.parentElement) bg = over(bg, rgba(getComputedStyle(p).backgroundColor)); bg = over(bg, [20, 21, 21, 1])
    let ring = null, width = 0
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) { ring = rgba(s.outlineColor); width = parseFloat(s.outlineWidth) }
    else { const m = s.boxShadow.match(/(rgba?\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px/); if (m) { ring = rgba(m[1]); width = parseFloat(m[2]) } }
    const name = e.tagName.toLowerCase() + (e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : (e.textContent || '').trim() ? ` "${(e.textContent || '').trim().slice(0, 20)}"` : '')
    return { name, ring, width, bg, visible: r.width > 0 }
  }, { scope })
  if (f && f.visible) focus.push(f)
}
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) }
for (const f of focus) {
  if (!f.ring) { findings.push({ checkId: 'CHK-022', status: 'needs-human', target: f.name, evidence: 'no outline or ring detected on keyboard focus (may use a surface change)' }); continue }
  const eff = [0, 1, 2].map(i => f.ring[i] * f.ring[3] + f.bg[i] * (1 - f.ring[3]))
  const c = contrast(eff, f.bg)
  if (c < 3) findings.push({ checkId: 'CHK-018', status: 'fail', target: f.name, evidence: `focus ring contrast ${c.toFixed(2)}:1` })
  if (f.width > 2) findings.push({ checkId: 'CHK-018', status: 'fail', target: f.name, evidence: `focus ring ${f.width}px exceeds 2px (principle 17)`, severity: 'warning' })
  const [r, g, b] = f.ring; if (g > r * 1.4 && g > b * 1.15 && g > 120) findings.push({ checkId: 'CHK-004', status: 'fail', target: f.name, evidence: `focus ring is green (${f.ring.join(',')})` })
}
await browser.close()

const rank = { fail: 0, 'needs-human': 1, pass: 2 }
findings.sort((a, b) => rank[a.status] - rank[b.status] || a.checkId.localeCompare(b.checkId))
const summary = {}
for (const f of findings) { const k = `${f.checkId} ${f.status}`; summary[k] = (summary[k] ?? 0) + 1 }
if (args.includes('--json')) console.log(JSON.stringify({ url, viewport: `${vw}x${vh}`, focusStopsChecked: focus.length, summary, findings }, null, 2))
else {
  console.log(`${url} @ ${vw}x${vh}  focus stops checked: ${focus.length}`)
  console.log(Object.keys(summary).length ? Object.entries(summary).map(([k, v]) => `  ${k}: ${v}`).join('\n') : '  no findings')
  for (const f of findings.slice(0, 12)) console.log(`   - ${f.checkId} ${f.status}: ${f.target} | ${f.evidence}`)
}
process.exit(findings.some(f => f.status === 'fail' && f.severity !== 'warning') ? 1 : 0)
