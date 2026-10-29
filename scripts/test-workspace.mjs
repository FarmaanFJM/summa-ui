#!/usr/bin/env node
// Tests the pure workspace geometry (src/ui/workspaceGeometry.ts), the reference for docs/WORKSPACE_PATTERN.md.
// Mirrors the CaissaTrainer suite after its phase 3 (hidden panels reserve nothing, the group is centered, the optional left panel yields to a
// drawer before the layout restacks, portrait stacking, default cap 720 and fill 0.92) (src/workspace/__tests__/workspaceGeometry.test.ts) with neutral names.
// No browser, no dependencies. Node 22 runs the erasable TypeScript directly:  node --test scripts/test-workspace.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COMFORT_MIN, DEFAULT_CAP, DEFAULT_FILL, DEFAULT_FLOOR, PRIMARY_MIN, PRIMARY_FLOOR, SIZE_SNAP, SIZE_STEP, STACK_BREAKPOINT,
  computeWorkspace, dragSize, stepSize, clamp, snap,
} from '../src/ui/workspaceGeometry.ts'

const PANEL = { preferred: 320, min: 240 }
const input = (over = {}) => ({
  width: 1376, height: 860, padding: 16, gap: 16, chromeY: 48,
  left: PANEL, right: PANEL, leftOpen: true, rightOpen: true, preferred: null, ...over,
})
// Wider panels, as a real application with an optional notes-like left panel and a session-like right panel uses.
const WIDE = { left: { preferred: 360, min: 300 }, right: { preferred: 380, min: 300 } }
const ok = assert.ok, eq = assert.equal

test('constants keep the documented values', () => {
  eq(PRIMARY_MIN, 280); eq(PRIMARY_FLOOR, 240); eq(DEFAULT_CAP, 720); eq(DEFAULT_FLOOR, 320); eq(DEFAULT_FILL, 0.92); eq(COMFORT_MIN, 400)
  eq(STACK_BREAKPOINT, 640); eq(SIZE_STEP, 40); eq(SIZE_SNAP, 8)
  eq(clamp(5, 1, 3), 3); eq(snap(483), 480)
})

test('default size is medium: well below the largest size that fits', () => {
  const g = computeWorkspace(input())
  eq(g.mode, 'wide'); eq(g.size, g.defaultSize)
  ok(g.size >= 320); ok(g.size < g.maxSize); eq(g.isDefault, true)
})
test('default size is never above the cap, even on a huge screen', () => {
  const g = computeWorkspace(input({ width: 3440, height: 1600 }))
  ok(g.defaultSize <= DEFAULT_CAP); ok(g.maxSize > DEFAULT_CAP)
  eq(g.defaultSize, DEFAULT_CAP) // a huge screen reaches the cap exactly (720, raised from 640 in phase 3)
})
test('default size scales with the available space', () => {
  ok(computeWorkspace(input({ width: 1800, height: 1000 })).defaultSize > computeWorkspace(input({ width: 1180, height: 700 })).defaultSize)
})
test('size is a whole number of snap steps', () => {
  for (let w = 700; w <= 2200; w += 53) for (const h of [560, 700, 900, 1100]) eq(computeWorkspace(input({ width: w, height: h })).size % SIZE_SNAP, 0)
})

test('docks both panels beside a medium region on a wide screen', () => {
  const g = computeWorkspace(input({ width: 1800, height: 1000 }))
  eq(g.leftDock, 'docked'); eq(g.rightDock, 'docked'); ok(g.leftWidth >= 240); ok(g.leftWidth <= 320)
})
test('the group (region, rail margin, panels, gaps) never exceeds the available width', () => {
  for (let w = 900; w <= 2400; w += 61) {
    const g = computeWorkspace(input({ width: w, height: 900, rail: 40 }))
    if (g.mode !== 'wide') continue
    const docked = [g.leftWidth, g.rightWidth].filter(n => n > 0)
    const used = g.size + 80 + docked.reduce((sum, n) => sum + n + g.gapX, 0)
    ok(used <= w - 32 + 0.001, String(w))
  }
})
test('a hidden panel reserves no width at all', () => {
  const g = computeWorkspace(input({ width: 1800, height: 1000, leftOpen: false }))
  eq(g.leftDock, 'hidden'); eq(g.leftWidth, 0); eq(g.rightDock, 'docked'); eq(g.reserve, 0)
})
test('hiding a panel gives its width to the region, not to an empty column', () => {
  const both = computeWorkspace(input({ width: 1200, height: 900, rail: 40 }))
  const one = computeWorkspace(input({ width: 1200, height: 900, rail: 40, leftOpen: false }))
  ok(one.defaultSize >= both.defaultSize); eq(one.leftWidth, 0)
})
test('with every panel hidden the region has the whole width and no column is held back', () => {
  const closed = computeWorkspace(input({ width: 1400, height: 900, rail: 40, leftOpen: false, rightOpen: false }))
  const open = computeWorkspace(input({ width: 1400, height: 900, rail: 40 }))
  eq(closed.leftWidth + closed.rightWidth, 0); ok(closed.defaultSize > open.defaultSize)
})
test('panels yield before the primary region on laptop widths', () => {
  const wide = computeWorkspace(input({ width: 1800, height: 900 }))
  const laptop = computeWorkspace(input({ width: 1180, height: 900 }))
  ok(laptop.rightWidth <= wide.rightWidth); ok(laptop.size >= PRIMARY_MIN)
})
test('a portrait tablet stacks the panels under the region instead of hiding them', () => {
  const g = computeWorkspace(input({ width: 820, height: 1000 }))
  eq(g.mode, 'stacked'); eq(g.leftDock, 'docked'); eq(g.rightDock, 'docked'); ok(g.size >= PRIMARY_MIN); ok(g.size <= 820 - 32)
})
test('a small laptop docks panels at their minimum next to a usable region', () => {
  const g = computeWorkspace(input({ width: 1000, height: 700 }))
  eq(g.mode, 'wide'); eq(g.leftDock, 'docked'); ok(g.size >= PRIMARY_MIN)
})
test('enlarging past the point panels fit turns them into drawers', () => {
  const g = computeWorkspace(input({ width: 1100, height: 700, preferred: 5000 }))
  eq(g.mode, 'wide'); eq(g.atMax, true); ok(g.size <= 1100 - 32); eq(g.leftDock, 'drawer'); eq(g.rightDock, 'drawer')
})
test('a height-limited maximum still leaves room, so panels shrink but stay docked', () => {
  const g = computeWorkspace(input({ width: 1376, preferred: 5000 }))
  ok(g.size <= 860 - 32 - 48); eq(g.leftDock, 'docked'); ok(g.leftWidth >= 240)
})
test('absent panels are reported as absent', () => { eq(computeWorkspace(input({ left: null })).leftDock, 'absent') })

test('the right panel docks wherever the region fits; the optional left panel docks too or yields to a drawer', () => {
  for (let w = 880; w <= 2000; w += 19) for (const h of [640, 800, 1000]) {
    const g = computeWorkspace(input({ ...WIDE, width: w, height: h }))
    if (g.mode === 'wide' && g.maxSize > g.defaultSize) {
      eq(g.rightDock, 'docked', `${w}x${h}`)
      ok(['docked', 'drawer'].includes(g.leftDock), `${w}x${h}`)
    }
  }
})
test('the optional left panel yields to a drawer before the layout restacks', () => {
  const g = computeWorkspace(input({ ...WIDE, width: 1180 - 224, height: 800, rail: 40 }))
  eq(g.mode, 'wide'); eq(g.rightDock, 'docked'); eq(g.leftDock, 'drawer'); ok(g.size >= PRIMARY_MIN)
})
test('a laptop with the application sidebar expanded keeps a comfortable region and the right panel docked', () => {
  const g = computeWorkspace(input({ ...WIDE, width: 1180 - 224, height: 800 }))
  eq(g.mode, 'wide'); eq(g.rightDock, 'docked'); eq(g.leftDock, 'drawer'); ok(g.size >= COMFORT_MIN)
})
test('the left panel docks beside a region of at least COMFORT_MIN when there is room', () => {
  const g = computeWorkspace(input({ ...WIDE, width: 1366, height: 900, rail: 40 }))
  eq(g.leftDock, 'docked'); ok(g.size >= COMFORT_MIN)
})
test('demotion to a drawer never applies to a narrow workspace that stacks instead', () => {
  const g = computeWorkspace(input({ ...WIDE, width: STACK_BREAKPOINT - 1, height: 900 }))
  eq(g.mode, 'stacked'); eq(g.leftDock, 'docked')
})
test('a portrait window stacks when that gives a much bigger region', () => {
  const g = computeWorkspace(input({ width: 820, height: 1180, rail: 40, left: null, right: { preferred: 380, min: 260 } }))
  eq(g.mode, 'stacked'); ok(g.size > 600)
})
test('a landscape window never stacks just because stacking would be bigger', () => {
  const g = computeWorkspace(input({ width: 1366, height: 768, rail: 40, left: null, right: { preferred: 380, min: 260 } }))
  eq(g.mode, 'wide')
})
test('a portrait window that gains little from stacking stays wide', () => {
  // Taller than wide, but the side-by-side region is still at least 70 percent of the stacked one.
  const g = computeWorkspace(input({ width: 1300, height: 1500, rail: 40, left: null, right: { preferred: 340, min: 260 } }))
  eq(g.mode, 'wide')
})

test('stacks on a phone and never overflows', () => {
  const g = computeWorkspace(input({ width: 390, height: 780, chromeY: 0, padding: 12 }))
  eq(g.mode, 'stacked'); ok(g.size <= 390 - 24); ok(g.size >= 240); eq(g.size, g.defaultSize)
})
test('a stacked region can still be shrunk and enlarged within the width', () => {
  const o = { width: 390, height: 780, chromeY: 0, padding: 12 }
  const small = computeWorkspace(input({ ...o, preferred: 100 })), big = computeWorkspace(input({ ...o, preferred: 900 }))
  eq(small.size, small.minSize); ok(big.size <= 390 - 24); ok(small.size < big.size)
})
test('closed panels free the width that open ones need', () => {
  eq(computeWorkspace(input({ width: 800, height: 900 })).mode, 'stacked')
  eq(computeWorkspace(input({ width: 800, height: 900, leftOpen: false, rightOpen: false })).mode, 'wide')
})
test('stacks just below the breakpoint and not at it', () => {
  const closed = { leftOpen: false, rightOpen: false }
  eq(computeWorkspace(input({ ...closed, width: STACK_BREAKPOINT - 1 })).mode, 'stacked')
  eq(computeWorkspace(input({ ...closed, width: STACK_BREAKPOINT })).mode, 'wide')
})

test('honours a chosen size inside the bounds', () => {
  const g = computeWorkspace(input({ preferred: 480 })); eq(g.size, 480); eq(g.isDefault, false)
})
test('clamps to the bounds without discarding the preference', () => {
  const small = computeWorkspace(input({ preferred: 100 })); eq(small.size, small.minSize); eq(small.atMin, true)
  const large = computeWorkspace(input({ preferred: 5000 })); eq(large.size, large.maxSize); eq(large.atMax, true)
})
test('a smaller window shrinks the effective size but the preference is just input', () => {
  const roomy = computeWorkspace(input({ width: 1800, height: 1000, preferred: 720 }))
  const cramped = computeWorkspace(input({ width: 1100, height: 700, preferred: 720 }))
  eq(roomy.size, 720); ok(cramped.size < 720)
  eq(computeWorkspace(input({ width: 1800, height: 1000, preferred: 720 })).size, 720)
})
test('never exceeds the real space, including the chrome', () => {
  for (let h = 500; h <= 1400; h += 71) ok(computeWorkspace(input({ height: h, preferred: 4000 })).size <= Math.max(240, h - 32 - 48))
})
test('the geometry is a pure function: same input, same output', () => {
  const i = input({ preferred: 512 }); assert.deepEqual(computeWorkspace(i), computeWorkspace({ ...i }))
})

test('keyboard and button steps stay in the bounds', () => {
  const b = { minSize: 280, maxSize: 800 }
  eq(stepSize(480, 1, b), 520); eq(stepSize(480, -1, b), 440); eq(stepSize(800, 1, b), 800); eq(stepSize(280, -1, b), 280)
})
test('drag grows symmetrically: horizontal pull counts double', () => {
  const b = { minSize: 280, maxSize: 800 }
  eq(dragSize(480, 40, 0, b), 560); eq(dragSize(480, 0, 40, b), 520); eq(dragSize(480, -1000, 0, b), 280); eq(dragSize(480, 1000, 0, b), 800)
})

test('the default is sized against the panels minimum, then panels grow into the rest', () => {
  const g = computeWorkspace(input({ ...WIDE, width: 1278 + 32, height: 900, rail: 40 }))
  const room = 1278 - 2 * (300 + 16) - 2 * 40
  eq(g.defaultSize, Math.floor((room * DEFAULT_FILL) / SIZE_SNAP) * SIZE_SNAP)
  ok(g.leftWidth > 300); ok(g.leftWidth <= 360)
})
test('the default gives a laptop region more room than sizing against preferred widths did', () => {
  const g = computeWorkspace(input({ ...WIDE, width: 1366 - 56, height: 900, rail: 40 }))
  const preferredBased = Math.floor(((1366 - 56 - 32 - 2 * (360 + 16) - 80) * DEFAULT_FILL) / SIZE_SNAP) * SIZE_SNAP
  ok(g.defaultSize > preferredBased)
})
test('a lone docked panel counts only once in the default (no phantom second column)', () => {
  const one = computeWorkspace(input({ ...WIDE, width: 1400, height: 1000, rail: 40, leftOpen: false }))
  const room = 1400 - 32 - (300 + 16) - 80
  eq(one.defaultSize, Math.min(DEFAULT_CAP, Math.floor((Math.min(1000 - 32 - 48, room) * DEFAULT_FILL) / SIZE_SNAP) * SIZE_SNAP))
})
test('the default never turns the right panel into a drawer by itself, and a left drawer is only the demotion', () => {
  for (let w = 700; w <= 2400; w += 37) for (const h of [560, 700, 860, 1100]) for (const rail of [0, 40]) {
    const g = computeWorkspace(input({ width: w, height: h, rail }))
    if (g.mode === 'wide' && g.maxSize > g.defaultSize) { ok(g.rightDock !== 'drawer', `right drawer at ${w}x${h} rail ${rail}`) }
  }
})
test('a default cannot be smaller than the narrowest region unless the space itself is smaller', () => {
  for (let w = 640; w <= 2000; w += 41) {
    const g = computeWorkspace(input({ width: w, height: 900, rail: 40 }))
    ok(g.defaultSize >= Math.min(PRIMARY_MIN, g.maxSize))
  }
})

test('rail: the rail margin is kept on both sides of the region and gapX stays the plain gap', () => {
  const base = { left: null, right: null, width: 700, height: 1000 }
  const without = computeWorkspace(input(base)), withRail = computeWorkspace(input({ ...base, rail: 40 }))
  eq(withRail.mode, 'wide'); ok(withRail.maxSize <= without.maxSize - 72); eq(withRail.gapX, without.gapX); eq(without.gapX, 16)
})
test('rail: panels never exceed what is left beside the region and its rail margin', () => {
  const plain = computeWorkspace(input({ width: 1600, height: 900 })), railed = computeWorkspace(input({ width: 1600, height: 900, rail: 40, preferred: plain.size }))
  const free = 1600 - 32 - railed.size - 80 - 2 * 16
  ok(railed.leftWidth + railed.rightWidth <= free + 0.001); ok(railed.leftWidth <= plain.leftWidth)
})
test('rail: a lone panel still leaves the region centered in its own column with the rail margin on both sides', () => {
  const g = computeWorkspace(input({ width: 1800, height: 1000, rail: 40, leftOpen: false }))
  eq(g.leftDock, 'hidden'); eq(g.rightDock, 'docked'); eq(g.reserve, 0)
})
test('rail: with no panels open the rail only narrows the maximum', () => {
  const closed = { leftOpen: false, rightOpen: false, width: 700, height: 1000 }
  const a = computeWorkspace(input({ ...closed })), b = computeWorkspace(input({ ...closed, rail: 40 }))
  eq(a.mode, b.mode); ok(b.maxSize <= a.maxSize)
})
test('rail: stacking accounts for the rail and a stacked layout reports the plain gap', () => {
  const wideRight = { left: null, right: { preferred: 560, min: 520 } }
  const withRail = computeWorkspace(input({ width: 900, height: 900, rail: 40, ...wideRight }))
  const without = computeWorkspace(input({ width: 900, height: 900, ...wideRight }))
  eq(without.mode, 'wide'); eq(withRail.mode, 'stacked')
  const stacked = computeWorkspace(input({ width: 390, height: 780, chromeY: 0, padding: 12, rail: 40 }))
  eq(stacked.mode, 'stacked'); eq(stacked.gapX, 16)
})
test('rail: absent rail input equals rail 0', () => {
  assert.deepEqual(computeWorkspace(input()), computeWorkspace(input({ rail: 0 })))
})

test('the candidate classic script in PR-0002 matches the TypeScript (no drift)', async () => {
  const { readFileSync } = await import('node:fs')
  const { runInNewContext } = await import('node:vm')
  const ctx = {}; ctx.globalThis = ctx
  runInNewContext(readFileSync(new URL('../feedback/proposals/PR-0002/candidate/js/workspace-geometry.js', import.meta.url), 'utf8'), ctx)
  const C = ctx.SummaWorkspace
  assert.ok(C, 'script exposes SummaWorkspace')
  for (const w of [390, 640, 820, 1000, 1180, 1376, 1800, 3000]) for (const h of [600, 860, 1180, 1400]) for (const pref of [null, 100, 480, 5000]) for (const open of [true, false]) for (const rail of [undefined, 0, 40]) for (const panels of [{}, WIDE, { left: null }]) {
    const i = input({ width: w, height: h, preferred: pref, leftOpen: open, rail, ...panels })
    assert.deepEqual(JSON.parse(JSON.stringify(C.computeWorkspace(i))), JSON.parse(JSON.stringify(computeWorkspace(i))))
  }
  eq(C.PRIMARY_MIN, PRIMARY_MIN); eq(C.COMFORT_MIN, COMFORT_MIN); eq(C.DEFAULT_CAP, DEFAULT_CAP); eq(C.DEFAULT_FILL, DEFAULT_FILL)
  eq(C.stepSize(480, 1, { minSize: 280, maxSize: 800 }), 520)
})

test('parity with CaissaTrainer workspaceLayout.ts when that file is present (source of truth)', async (t) => {
  const { existsSync } = await import('node:fs')
  const path = process.env.CAISSA_WORKSPACE_LAYOUT ?? '/home/user/CaissaTrainer/frontend/src/workspace/workspaceLayout.ts'
  if (!existsSync(path)) return t.skip('CaissaTrainer source not present')
  const src = await import(path)
  for (const w of [390, 640, 700, 820, 900, 1000, 1180, 1376, 1800, 3000]) for (const h of [600, 860, 1180, 1400]) for (const pref of [null, 480, 5000]) for (const lo of [true, false]) for (const ro of [true, false]) for (const rail of [0, 40]) for (const panels of [{}, WIDE, { left: null }]) {
    const i = input({ width: w, height: h, preferred: pref, leftOpen: lo, rightOpen: ro, rail, ...panels })
    assert.deepEqual(computeWorkspace(i), src.computeWorkspace(i), JSON.stringify(i))
  }
})
