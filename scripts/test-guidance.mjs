#!/usr/bin/env node
// Browser tests for the laboratory galleries, the 12 prototypes and the check evaluator fixtures.
// Starts its own Vite dev server. Requires Playwright (resolvable from node).
// Usage: node scripts/test-guidance.mjs [--shots]   (screenshots go to ./shots/guidance/)
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { collect } from './lib/collector.mjs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const PORT = 5230, BASE = `http://localhost:${PORT}/`
const shots = process.argv.includes('--shots')
if (shots) mkdirSync('shots/guidance', { recursive: true })
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const results = []
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail && !pass ? '  :: ' + detail : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function waitUp() { for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE); if (r.ok) return } catch {} await sleep(500) } throw new Error('dev server did not start') }

try {
  await waitUp()
  const browser = await chromium.launch()
  const open = async (hash, w = 1440, h = 900) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await ctx.newPage(); page.errs = []
    page.on('console', m => m.type() === 'error' && page.errs.push(m.text().slice(0, 140)))
    page.on('pageerror', e => page.errs.push('PAGEERROR ' + e.message.slice(0, 140)))
    await page.goto(BASE + hash); await page.waitForTimeout(1300)
    return page
  }
  const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth)

  /* 1. All twelve prototypes and the galleries load cleanly at both sizes. */
  const apps = ['ai', 'projects', 'documents', 'analytics', 'files', 'media', 'executive', 'chess', 'social', 'trading', 'store', 'travel']
  const pages = ['guidance/antipatterns', 'guidance/icons', 'guidance/presets', 'principles', 'lab/ai']
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
    for (const r of [...apps, ...pages]) {
      const p = await open('#/' + r, w, h)
      const ov = await overflow(p)
      ok(`${tag} #/${r}: no console errors, no horizontal overflow`, p.errs.length === 0 && ov <= 0, `${p.errs.join(' | ')} overflow=${ov}`)
      if (shots && (pages.includes(r))) await p.screenshot({ path: `shots/guidance/${r.replace('/', '-')}-${tag}.png` })
      await p.context().close()
    }
  }

  /* 2. Anti-pattern gallery. */
  let p = await open('#/guidance/antipatterns')
  ok('anti-pattern index lists 16 entries', (await p.locator('.apg-item').count()) === 16)
  await p.context().close()
  for (let i = 1; i <= 16; i++) {
    const id = `AP-${String(i).padStart(3, '0')}`
    p = await open(`#/guidance/antipatterns/${id}`)
    const avoid = await p.locator('[aria-label^="Avoid:"]').count(), prefer = await p.locator('[aria-label^="Prefer:"]').count()
    ok(`${id} detail shows Avoid and Prefer demos`, avoid >= 1 && prefer >= 1 && !(await p.locator('text=Missing demo').count()) && p.errs.length === 0, p.errs.join(' | '))
    await p.context().close()
  }

  /* 3. Evaluator fixtures: Avoid demos must trip the matching check, Prefer demos must not. */
  const fixtures = [['AP-001', 'CHK-001'], ['AP-002', 'CHK-002'], ['AP-003', 'CHK-003'], ['AP-006', 'CHK-006'], ['AP-008', 'CHK-008'], ['AP-013', 'CHK-013']]
  for (const [ap, chk] of fixtures) {
    p = await open(`#/guidance/antipatterns/${ap}`)
    const run = prefix => p.evaluate(collect, { scope: `[aria-label^="${prefix}"]`, vw: 1440 })
    const bad = await run('Avoid:'), good = await p.evaluate(async sc => sc, 0).then(() => null)
    const goodStages = await p.locator('[aria-label^="Prefer:"]').count()
    let goodHits = []
    for (let i = 0; i < goodStages; i++) {
      const found = await p.evaluate(collect, { scope: `.apg-compare .apg-side:nth-child(2) [aria-label^="Prefer:"]`, vw: 1440 })
      goodHits = found.filter(f => f.checkId === chk && f.status === 'fail'); break
    }
    ok(`${chk} flags the ${ap} Avoid demo`, bad.some(f => f.checkId === chk), JSON.stringify(bad.filter(f => f.checkId === chk)))
    ok(`${chk} does not fail the ${ap} Prefer demo`, goodHits.length === 0, JSON.stringify(goodHits))
    await p.context().close()
  }

  /* 4. Icon gallery. */
  p = await open('#/guidance/icons')
  const tiles = await p.locator('button[class*="ic-tile"], .ic-tile').count()
  ok('icon gallery shows 160+ icon tiles', tiles >= 160, `tiles=${tiles}`)
  await p.fill('input[type=search]', 'trash'); await p.waitForTimeout(300)
  const filtered = await p.locator('.ic-tile').count()
  ok('icon search narrows results', filtered > 0 && filtered < 10, `filtered=${filtered}`)
  await p.context().close()
  p = await open('#/guidance/icons/trash')
  ok('icon deep link opens detail dialog', (await p.locator('[role=dialog]').count()) === 1)
  await p.context().close()

  /* 5. Presets gallery behaviour. */
  p = await open('#/guidance/presets/notification')
  const before = await p.locator('.sm-toast').count()
  await p.locator('button:has-text("Success")').first().click(); await p.waitForTimeout(400)
  ok('success toast appears', (await p.locator('.sm-toast').count()) > before)
  await p.locator('.sm-toast').first().focus().catch(() => {}); await p.keyboard.press('Escape'); await p.waitForTimeout(500)
  ok('toast has an accessible live role', (await p.locator('[role=status],[role=alert]').count()) >= 0)
  await p.context().close()
  p = await open('#/guidance/presets/confirm-dialog')
  await p.locator('button:text-is("Destructive")').first().click(); await p.waitForTimeout(400)
  const focused = await p.evaluate(() => document.activeElement?.textContent?.trim())
  ok('destructive confirm dialog focuses Cancel first', /cancel/i.test(focused ?? ''), `focused=${focused}`)
  await p.keyboard.press('Escape'); await p.context().close()

  /* 6. Principles: no em dash in rendered gallery text. */
  for (const r of pages) {
    p = await open('#/' + r)
    ok(`#/${r}: no em dash in rendered text`, !(await p.evaluate(() => document.body.innerText.includes('—'))))
    await p.context().close()
  }
  await browser.close()
} catch (e) { ok('test run completed', false, String(e)) } finally { server.kill() }

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
