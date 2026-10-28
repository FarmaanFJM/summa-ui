#!/usr/bin/env node
// CHK-020 verification with real browser hit testing and real touch taps.
// For each visible interactive element: (1) measure the effective hit area with elementFromPoint,
// (2) tap the centre and four inset corners of that area with a touch screen and confirm the click lands on the
// element (clicks are intercepted in the capture phase so app state is not changed by the taps).
// Usage: node scripts/test-tap-targets.mjs [--base http://localhost:5173/] [--apps ai,files] [--viewport 390x844] [--json out.json] [--verbose]
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { measureHitAreas } from './lib/hit-area.mjs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d }
const ALL = ['ai', 'projects', 'documents', 'analytics', 'files', 'media', 'executive', 'chess', 'social', 'trading', 'store', 'travel']
const apps = (opt('apps') ?? ALL.join(',')).split(',')
const [vw, vh] = (opt('viewport', '390x844')).split('x').map(Number)
const verbose = args.includes('--verbose')
let base = opt('base'); let server
if (!base) { server = spawn('npx', ['vite', '--port', '5240', '--strictPort'], { stdio: 'ignore' }); base = 'http://localhost:5240/'; for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) } }

const browser = await chromium.launch()
const report = { viewport: `${vw}x${vh}`, apps: {} }
let totalFail = 0, totalTap = 0, totalTested = 0
const PASSES = [
  { name: 'first screen', w: vw, h: vh },
  { name: 'full height', w: vw, h: 2400 },
  { name: 'drawer open', w: vw, h: vh, drawer: true },
]
for (const app of apps) {
  const all = { tested: 0, failing: [], tapBad: [], errs: [] }
  for (const pass of PASSES) {
    const ctx = await browser.newContext({ viewport: { width: pass.w, height: pass.h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    page.on('pageerror', e => all.errs.push(e.message))
    await page.goto(`${base}#/${app}`); await page.waitForTimeout(1800)
    if (pass.drawer) { const t = page.locator('[aria-label="Open navigation"]').first(); if (!(await t.count())) { await ctx.close(); continue } await t.tap(); await page.waitForTimeout(500) }
    const items = await page.evaluate(measureHitAreas, { min: 40, step: 4, scope: 'body' })
    await page.evaluate(() => { window.__tap = null; window.addEventListener('click', e => { window.__tap = e.target; e.preventDefault(); e.stopImmediatePropagation() }, true) })
    const tapBad = []
    for (const it of items) {
      if (!it.bbox) { tapBad.push({ ...it, reason: 'no owned area' }); continue }
      const [x0, y0, x1, y1] = it.bbox
      const pts = [[(x0 + x1) / 2, (y0 + y1) / 2], [x0 + 3, y0 + 3], [x1 - 3, y0 + 3], [x0 + 3, y1 - 3], [x1 - 3, y1 - 3]]
      for (const [x, y] of pts) {
        await page.evaluate(() => { window.__tap = null })
        await page.touchscreen.tap(x, y)
        const ok = await page.evaluate(i => { const el = document.querySelector(`[data-hit-i="${i}"]`); const t = window.__tap; return !!(el && t && (el === t || el.contains(t) || (t.tagName === 'LABEL' && t.contains(el)))) }, it.i)
        if (!ok) { tapBad.push({ ...it, reason: `tap at ${Math.round(x)},${Math.round(y)} did not reach the element` }); break }
      }
    }
    all.tested += items.length
    all.failing.push(...items.filter(x => !x.pass).map(x => ({ pass: pass.name, sel: x.sel, size: `${x.w}x${x.h}`, effective: `${x.effW}x${x.effH}`, thief: x.thief })))
    all.tapBad.push(...tapBad.map(x => ({ pass: pass.name, sel: x.sel, reason: x.reason })))
    await ctx.close()
  }
  const uniq = (arr, k) => [...new Map(arr.map(x => [k(x), x])).values()]
  const failing = uniq(all.failing, x => x.sel + x.size), tapBad = uniq(all.tapBad, x => x.sel + x.reason)
  report.apps[app] = { tested: all.tested, undersized: failing.length, tapMismatch: tapBad.length, pageErrors: all.errs, failing, tapBad }
  totalFail += failing.length; totalTap += tapBad.length; totalTested += all.tested
  console.log(`${app.padEnd(10)} tested ${String(all.tested).padStart(3)}  undersized ${String(failing.length).padStart(3)}  tap mismatches ${String(tapBad.length).padStart(3)}${all.errs.length ? '  PAGE ERRORS ' + all.errs.length : ''}`)
  if (verbose) for (const f of failing.slice(0, 25)) console.log(`     [${f.pass}] ${f.sel}  ${f.size} -> ${f.effective}${f.thief ? '  stolen by ' + f.thief : ''}`)
}
await browser.close(); server?.kill()
report.totals = { tested: totalTested, undersized: totalFail, tapMismatch: totalTap }
console.log(`TOTAL tested ${totalTested}  undersized ${totalFail}  tap mismatches ${totalTap}`)
if (opt('json')) writeFileSync(opt('json'), JSON.stringify(report, null, 2) + '\n')
process.exit(totalFail || totalTap ? 1 : 0)
