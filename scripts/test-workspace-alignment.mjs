#!/usr/bin/env node
// Measured alignment test for the workspace control rail (FB-0042), in a real browser on the reference route #/workspace.
// Every number is measured from the primary region's box (.ws-primary-box), never from page coordinates:
//   wide:    the rail is exactly as tall as the region, 8px from its right edge, 32px wide on a surface; the options control sits on
//            the region's top edge, the resize control on its bottom edge, and both share one x (one horizontal alignment).
//   stacked: the rail is a compact row under the region (after any region footer), aligned to the region's right edge, with 40px targets.
// Usage: node scripts/test-workspace-alignment.mjs [--base http://localhost:5173/] [--shots out/dir]
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d }
const shots = opt('shots')
if (shots) mkdirSync(shots, { recursive: true })
let base = opt('base'), server
if (!base) { server = spawn('npx', ['vite', '--port', '5241', '--strictPort'], { stdio: 'ignore' }); base = 'http://localhost:5241/'; for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) } }

let pass = 0, fail = 0
const check = (ok, name, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`) }
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol
const rect = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom } }, sel)
const fmt = r => `${Math.round(r.y)}-${Math.round(r.bottom)}`

const browser = await chromium.launch()
try {
  /* ---- wide: 1440x900 and 1100x700 (the geometry differs, the relationship must not) ---- */
  for (const [w, h] of [[1440, 900], [1100, 700]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage()
    await page.goto(`${base}#/workspace`); await page.waitForTimeout(1500)
    console.log(`\n=== wide ${w}x${h}`)
    const box = await rect(page, '.ws-primary-box'), rail = await rect(page, '[data-ws-rail]')
    const gear = await rect(page, '[data-ws="options"]'), handle = await rect(page, '[data-ws="resize"]')
    check(box && rail && near(rail.y, box.y) && near(rail.bottom, box.bottom), 'rail top and bottom equal the region top and bottom', `${fmt(rail)} vs ${fmt(box)}`)
    check(near(rail.x - box.right, 8), 'rail sits 8px from the region right edge', `${Math.round(rail.x - box.right)}px`)
    check(near(rail.w, 32), 'rail is the 32px column', `${Math.round(rail.w)}px`)
    check(near(gear.y, box.y), 'options control sits on the region top edge', `${Math.round(gear.y)} vs ${Math.round(box.y)}`)
    check(near(handle.bottom, box.bottom), 'resize control sits on the region bottom edge', `${Math.round(handle.bottom)} vs ${Math.round(box.bottom)}`)
    check(near(gear.x, handle.x) && near(gear.w, handle.w), 'both controls share one horizontal alignment', `x ${Math.round(gear.x)} and ${Math.round(handle.x)}`)
    check(gear.x >= rail.x - 0.5 && gear.right <= rail.right + 0.5 && handle.x >= rail.x - 0.5 && handle.right <= rail.right + 0.5, 'controls sit inside the rail column')
    const surface = await page.evaluate(() => { const r = document.querySelector('[data-ws-rail]'), p = document.querySelector('.ws-body'); const bg = e => getComputedStyle(e).backgroundColor; return { rail: bg(r), body: bg(p), border: getComputedStyle(r).borderTopWidth } })
    check(surface.rail !== 'rgba(0, 0, 0, 0)' && surface.border === '0px', 'rail is a surface without a border', `${surface.rail}`)
    // The relationship follows the region when it is resized (measured again after a smaller size).
    await page.locator('[data-ws="options"]').first().click(); await page.locator('[role="menuitem"][data-ws="shrink"]').click(); await page.waitForTimeout(400)
    const box2 = await rect(page, '.ws-primary-box'), rail2 = await rect(page, '[data-ws-rail]')
    check(box2.h < box.h && near(rail2.y, box2.y) && near(rail2.bottom, box2.bottom), 'after a smaller size the rail still spans the region exactly', `${fmt(rail2)} vs ${fmt(box2)}`)
    if (w === 1440 && shots) await page.screenshot({ path: `${shots}/workspace-rail-1440.png` })
    // The menu opens beside the rail and stays on screen.
    await page.locator('[data-ws="options"]').first().click(); await page.waitForTimeout(250)
    const menu = await rect(page, '.ws-rail-menu')
    check(menu && menu.x >= rail2.right && menu.right <= w && menu.bottom <= h, 'options menu opens beside the rail and stays on screen', menu ? `x ${Math.round(menu.x)}-${Math.round(menu.right)}` : 'none')
    await ctx.close()
  }

  /* ---- stacked: 390x844 with touch ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const page = await ctx.newPage()
    await page.goto(`${base}#/workspace`); await page.waitForTimeout(1500)
    console.log('\n=== stacked 390x844')
    const box = await rect(page, '.ws-primary-box'), rail = await rect(page, '[data-ws-rail]')
    const gear = await rect(page, '[data-ws="options"]'), handle = await rect(page, '[data-ws="resize"]')
    // The rail follows the region's own column, after any region header or footer (same order as the CaissaTrainer source of truth).
    check(rail.y >= box.bottom - 0.5 && rail.x >= box.x - 0.5 && rail.right <= box.right + 0.5, 'rail is a row under the region, inside the region column', `${Math.round(rail.y - box.bottom)}px below`)
    check(near(rail.right, box.right) || near(handle.right, box.right), 'the row is aligned to the region right edge', `${Math.round(handle.right)} vs ${Math.round(box.right)}`)
    check(near(gear.y, handle.y) && near(gear.h, handle.h), 'both controls share one row')
    check(gear.w >= 40 && gear.h >= 40 && handle.w >= 40 && handle.h >= 40, 'targets are at least 40px', `${Math.round(gear.w)}x${Math.round(gear.h)}`)
    if (shots) await page.screenshot({ path: `${shots}/workspace-rail-390.png` })
    await ctx.close()
  }
} finally {
  await browser.close()
  server?.kill()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
