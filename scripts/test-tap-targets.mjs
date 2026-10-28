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

/* Extra states: open menus, sheets, dialogs, detail pages. Each step is best effort; a scenario whose control
   cannot be found is reported as skipped (never silently passed). */
const tapText = async (page, re, opt = {}) => { const l = page.locator(opt.sel ?? 'button,[role=button],[role=tab],a', { hasText: re }).first(); await l.tap({ timeout: 2500 }); await page.waitForTimeout(450) }
const SCENARIOS = {
  ai: [
    { name: 'composer generating', steps: async p => { await p.locator('textarea').first().fill('Explain latency'); await p.keyboard.press('Enter'); await p.waitForTimeout(9000) } }, // wait for the streamed reply to finish so positions are stable
    { name: 'drawer conversation menu', steps: async p => { await p.locator('[aria-label="Open navigation"]').first().tap(); await p.waitForTimeout(400); await p.locator('[aria-label^="Actions for"]').first().tap(); await p.waitForTimeout(300) } },
  ],
  projects: [
    { name: 'filter menu', steps: p => tapText(p, /^Filter$/) },
    { name: 'task detail', steps: async p => { await p.locator('.pm-row .pm-title').first().tap(); await p.waitForTimeout(700) } },
    { name: 'new task dialog', steps: async p => { await p.keyboard.press('c'); await p.waitForTimeout(500) } },
  ],
  documents: [{ name: 'document menu', steps: async p => { await p.locator('[aria-label="Document actions"]').first().tap(); await p.waitForTimeout(300) } }],
  analytics: [{ name: 'range dropdown', steps: p => tapText(p, /Last 30 days/) }],
  files: [
    { name: 'new menu', steps: p => tapText(p, /^New$/) },
    { name: 'grid view', steps: async p => { await p.locator('[role=tab]').nth(1).tap(); await p.waitForTimeout(500) } },
  ],
  media: [
    { name: 'viewer', steps: async p => { await p.locator('main button').filter({ hasNot: p.locator('svg') }).first().tap({ timeout: 2500 }).catch(() => {}); await p.waitForTimeout(600) } },
    { name: 'player bar', steps: async p => { await tapText(p, /^Music$/); await p.locator('.md-tile button').first().tap(); await p.waitForTimeout(900) } },
  ],
  executive: [{ name: 'filter sheet', steps: async p => { await p.locator('[aria-label*="ilter" i]').first().tap(); await p.waitForTimeout(500) } }],
  chess: [
    { name: 'nav sheet', steps: async p => { await p.locator('[aria-label*="menu" i]').first().tap(); await p.waitForTimeout(500) } },
    { name: 'register dialog', steps: async p => { await p.goto(`${base}#/chess`); await p.waitForTimeout(600); await tapText(p, /Register/) } },
  ],
  social: [
    { name: 'notifications', hash: 'social/notifications' },
    { name: 'profile', hash: 'social/u/me' },
    { name: 'compose dialog', steps: async p => { await p.keyboard.press('n'); await p.waitForTimeout(500) } },
    { name: 'compose with attachment', steps: async p => { await p.keyboard.press('n'); await p.waitForTimeout(500); await p.locator('.dialog [aria-label="Attach image"]').first().tap(); await p.waitForTimeout(400) } },
  ],
  trading: [
    { name: 'instrument sheet', steps: async p => { await p.locator('[aria-label*="nstrument" i]').first().tap(); await p.waitForTimeout(500) } },
    { name: 'order sheet', steps: p => tapText(p, /^Buy/) },
  ],
  store: [
    { name: 'category and filters', hash: 'store/c/all', steps: p => tapText(p, /Filters/) },
    { name: 'product page', steps: async p => { await p.goto(`${base}#/store/c/all`); await p.waitForTimeout(900); await p.locator('a[href*="/p/"]').first().tap(); await p.waitForTimeout(900) } },
    { name: 'cart drawer', steps: async p => { await p.goto(`${base}#/store/c/all`); await p.waitForTimeout(900); await p.locator('a[href*="/p/"]').first().tap(); await p.waitForTimeout(700); await tapText(p, /Add to bag/) } },
    { name: 'checkout', steps: async p => { await p.goto(`${base}#/store/c/all`); await p.waitForTimeout(900); await p.locator('a[href*="/p/"]').first().tap(); await p.waitForTimeout(700); await tapText(p, /Add to bag/); await tapText(p, /^Checkout$/) } },
  ],
  travel: [
    { name: 'results', hash: 'travel/results?d=lisbon&in=2026-11-20&out=2026-11-24&a=2&c=0&r=1' },
    { name: 'stay', steps: async p => { await p.goto(`${base}#/travel/results?d=lisbon&in=2026-11-20&out=2026-11-24&a=2&c=0&r=1`); await p.waitForTimeout(1400); await tapText(p, /Casa do Largo/, { sel: 'a,button,h2,h3,article' }) } },
    { name: 'dates popover', steps: p => tapText(p, /Dates/) },
  ],
}
const SKIP_RANGE = true

const ctxOpts = (w, h) => ({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
async function measureAndTap(page, all, label, scope = 'body') {
  const items = await page.evaluate(measureHitAreas, { min: 40, step: 4, scope })
  await page.evaluate(() => { window.__tap = null; window.addEventListener('click', e => { window.__tap = e.target; e.preventDefault(); e.stopImmediatePropagation() }, true) })
  const tapBad = []
  for (const it of items) {
    if (it.isRange) continue // a touch tap on a range input moves the thumb and never fires click; its size is still checked above
    if (!it.bbox) { tapBad.push({ ...it, reason: 'no owned area' }); continue }
    // Earlier taps can move the page (focus scrolling, keyboards): shift the measured area by how far the element has moved.
    const now = await page.evaluate(i => { const el = document.querySelector(`[data-hit-i="${i}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)] }, it.i)
    if (!now) { tapBad.push({ ...it, reason: 'element disappeared after an earlier tap' }); continue }
    const [dx, dy] = [now[0] - it.at[0], now[1] - it.at[1]]
    const [x0, y0, x1, y1] = [it.bbox[0] + dx, it.bbox[1] + dy, it.bbox[2] + dx, it.bbox[3] + dy]
    // Probes are sample points the browser's hit testing assigned to this element: its centre-most point and the points nearest each corner of its effective area.
    const pts = it.probes.map(([x, y]) => [x + dx, y + dy])
    let bad = null
    const attempt = async (points) => {
      for (const [x, y] of points) {
        const layers = () => page.evaluate(() => document.querySelectorAll('.popover,[role=listbox],[role=dialog],[role=menu]').length)
        const n0 = await layers()
        await page.evaluate(() => { window.__tap = null })
        await page.touchscreen.tap(x, y)
        const [ok, landed] = await page.evaluate(i => { const el = document.querySelector(`[data-hit-i="${i}"]`); const t = window.__tap; const lab = e => e ? e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') : 'nothing'; return [!!(el && t && (el === t || el.contains(t) || (t.tagName === 'LABEL' && t.contains(el)))), lab(t)] }, it.i)
        // Close only what this tap opened (popover, suggestion list) so later elements are tested in the state they were measured in.
        if ((await layers()) > n0) { await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement?.blur?.()); await page.waitForTimeout(40) }
        if (!ok) return { ...it, reason: `tap at ${Math.round(x)},${Math.round(y)} landed on ${landed}` }
      }
      return null
    }
    bad = await attempt(pts)
    if (bad) {
      // Layout may have moved while earlier taps ran (animations, focus scrolling). Re-measure this element once and retry; a real fault persists.
      await page.waitForTimeout(250)
      const re = await page.evaluate(measureHitAreas, { min: 40, step: 4, scope: 'body', only: it.i })
      if (re[0]?.bbox && re[0].pass) {
        bad = await attempt(re[0].probes)
      }
    }
    if (bad) tapBad.push(bad)
  }
  all.tested += items.length
  all.failing.push(...items.filter(x => !x.pass).map(x => ({ pass: label, sel: x.sel, size: `${x.w}x${x.h}`, effective: `${x.effW}x${x.effH}`, thief: x.thief })))
  all.tapBad.push(...tapBad.map(x => ({ pass: label, sel: x.sel, reason: x.reason })))
}

for (const app of apps) {
  const all = { tested: 0, failing: [], tapBad: [], errs: [], skipped: [] }
  for (const pass of PASSES) {
    const ctx = await browser.newContext(ctxOpts(pass.w, pass.h))
    const page = await ctx.newPage()
    page.on('pageerror', e => all.errs.push(e.message))
    await page.goto(`${base}#/${app}`); await page.waitForTimeout(1800)
    if (pass.drawer) { const t = page.locator('[aria-label="Open navigation"]').first(); if (!(await t.count())) { await ctx.close(); continue } await t.tap(); await page.waitForTimeout(500) }
    await measureAndTap(page, all, pass.name)
    await ctx.close()
  }
  if (!args.includes('--no-scenarios')) for (const sc of SCENARIOS[app] ?? []) {
    const ctx = await browser.newContext(ctxOpts(vw, vh)); const page = await ctx.newPage()
    page.on('pageerror', e => all.errs.push(e.message))
    try {
      await page.goto(`${base}#/${sc.hash ?? app}`); await page.waitForTimeout(1600)
      if (sc.steps) await sc.steps(page)
      // When the state opened a popover, sheet or dialog, test that layer (the page behind it is covered and is tested by the passes above).
      const layer = await page.evaluate(() => document.querySelectorAll('.popover,[role=dialog]').length)
      await measureAndTap(page, all, `state: ${sc.name}`, layer ? '.popover,[role=dialog]' : 'body')
    } catch (e) { all.skipped.push(`${sc.name}: ${String(e.message).split('\n')[0].slice(0, 90)}`) }
    await ctx.close()
  }
  const uniq = (arr, k) => [...new Map(arr.map(x => [k(x), x])).values()]
  const failing = uniq(all.failing, x => x.sel + x.size), tapBad = uniq(all.tapBad, x => x.sel + x.reason)
  report.apps[app] = { tested: all.tested, undersized: failing.length, tapMismatch: tapBad.length, pageErrors: all.errs, skippedScenarios: all.skipped, failing, tapBad }
  totalFail += failing.length; totalTap += tapBad.length; totalTested += all.tested
  console.log(`${app.padEnd(10)} tested ${String(all.tested).padStart(3)}  undersized ${String(failing.length).padStart(3)}  tap mismatches ${String(tapBad.length).padStart(3)}${all.errs.length ? '  PAGE ERRORS ' + all.errs.length : ''}${all.skipped.length ? '  skipped states ' + all.skipped.length : ''}`)
  if (verbose) { for (const f of failing.slice(0, 25)) console.log(`     [${f.pass}] ${f.sel}  ${f.size} -> ${f.effective}${f.thief ? '  stolen by ' + f.thief : ''}`); for (const t of tapBad.slice(0, 10)) console.log(`     [${t.pass}] TAP ${t.sel}: ${t.reason}`); for (const k of all.skipped) console.log(`     skipped: ${k}`) }
}
await browser.close(); server?.kill()
report.totals = { tested: totalTested, undersized: totalFail, tapMismatch: totalTap }
console.log(`TOTAL tested ${totalTested}  undersized ${totalFail}  tap mismatches ${totalTap}`)
if (opt('json')) writeFileSync(opt('json'), JSON.stringify(report, null, 2) + '\n')
process.exit(totalFail || totalTap ? 1 : 0)
