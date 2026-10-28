#!/usr/bin/env node
// Records (or compares) the layout of every visible element at desktop widths, to prove a change did not alter desktop.
// Usage: node scripts/layout-snapshot.mjs --out snap.json [--apps ai,files]      record
//        node scripts/layout-snapshot.mjs --compare snap.json [--apps ...]       compare (exit 1 on differences)
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d }
const ALL = ['ai', 'projects', 'documents', 'analytics', 'files', 'media', 'executive', 'chess', 'social', 'trading', 'store', 'travel']
const apps = (opt('apps') ?? ALL.join(',')).split(',')
const sizes = [[1440, 900], [1100, 800]]
let base = opt('base'), server
if (!base) { server = spawn('npx', ['vite', '--port', '5241', '--strictPort'], { stdio: 'ignore' }); base = 'http://localhost:5241/'; for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 500)) } }

function snap() {
  const out = {}
  const path = e => { const p = []; for (let n = e; n && n !== document.body; n = n.parentElement) p.unshift(n.tagName.toLowerCase() + ':' + [...n.parentElement.children].indexOf(n)); return p.join('>') }
  for (const e of document.body.querySelectorAll('*')) {
    const r = e.getBoundingClientRect(); const s = getComputedStyle(e)
    if (r.width === 0 || r.height === 0 || s.display === 'none' || /^(SCRIPT|STYLE|PATH|CIRCLE|RECT|LINE|G|POLYLINE|POLYGON|DEFS|STOP|LINEARGRADIENT)$/i.test(e.tagName)) continue
    out[path(e)] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
  }
  return out
}
const browser = await chromium.launch()
const result = {}
for (const app of apps) for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage()
  await page.goto(`${base}#/${app}`); await page.waitForTimeout(2600)
  result[`${app}@${w}`] = await page.evaluate(snap)
  await ctx.close()
}
await browser.close(); server?.kill()
if (opt('out')) { writeFileSync(opt('out'), JSON.stringify(result)); console.log('recorded', Object.keys(result).length, 'snapshots') }
if (opt('compare')) {
  const ref = JSON.parse(readFileSync(opt('compare'), 'utf8')); let bad = 0
  for (const k of Object.keys(result)) {
    if (!ref[k]) continue
    const a = ref[k], b = result[k]; const keys = new Set([...Object.keys(a), ...Object.keys(b)]); let diff = 0, first = []
    for (const p of keys) { const x = a[p], y = b[p]; if (!x || !y || x.some((v, i) => Math.abs(v - y[i]) > 1)) { diff++; if (first.length < 3) first.push(p.split('>').slice(-3).join('>')) } }
    console.log(`${k.padEnd(18)} elements ${String(keys.size).padStart(5)}  changed ${String(diff).padStart(4)}${diff ? '  e.g. ' + first.join(' | ') : ''}`)
    if (diff) bad++
  }
  process.exit(bad ? 1 : 0)
}
