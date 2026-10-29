#!/usr/bin/env node
// Tests the pure workspace geometry (src/ui/workspaceGeometry.ts), the reference for docs/WORKSPACE_PATTERN.md.
// Mirrors the CaissaTrainer suite (src/workspace/__tests__/workspaceGeometry.test.ts) with neutral names.
// No browser, no dependencies. Node 22 runs the erasable TypeScript directly:  node --test scripts/test-workspace.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_CAP, PRIMARY_MIN, PRIMARY_FLOOR, SIZE_SNAP, SIZE_STEP, STACK_BREAKPOINT,
  computeWorkspace, dragSize, stepSize, clamp, snap,
} from '../src/ui/workspaceGeometry.ts'

const PANEL = { preferred: 320, min: 240 }
const input = (over = {}) => ({
  width: 1376, height: 860, padding: 16, gap: 16, chromeY: 48,
  left: PANEL, right: PANEL, leftOpen: true, rightOpen: true, preferred: null, ...over,
})
const ok = assert.ok, eq = assert.equal

test('constants keep the documented values', () => {
  eq(PRIMARY_MIN, 280); eq(PRIMARY_FLOOR, 240); eq(DEFAULT_CAP, 640); eq(STACK_BREAKPOINT, 640); eq(SIZE_STEP, 40); eq(SIZE_SNAP, 8)
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
test('keeps the region centered: docked columns never exceed the equal flank', () => {
  for (let w = 900; w <= 2400; w += 61) {
    const g = computeWorkspace(input({ width: w, height: 900 }))
    const flank = (w - 32 - g.size) / 2 - 16
    if (g.leftDock === 'docked') ok(g.leftWidth <= flank + 0.001)
    if (g.rightDock === 'docked') ok(g.rightWidth <= flank + 0.001)
    eq(g.reserve, Math.max(g.leftWidth, g.rightWidth))
  }
})
test('a lone panel still reserves the same width on both sides', () => {
  const g = computeWorkspace(input({ width: 1800, height: 1000, leftOpen: false }))
  eq(g.leftDock, 'hidden'); eq(g.rightDock, 'docked'); eq(g.reserve, g.rightWidth)
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
  const g = computeWorkspace(input({ width: 1100, height: 1400, preferred: 5000 }))
  eq(g.atMax, true); ok(g.size <= 1100 - 32); eq(g.leftDock, 'drawer'); eq(g.rightDock, 'drawer')
})
test('a height-limited maximum still leaves room, so panels shrink but stay docked', () => {
  const g = computeWorkspace(input({ width: 1376, preferred: 5000 }))
  ok(g.size <= 860 - 32 - 48); eq(g.leftDock, 'docked'); ok(g.leftWidth >= 240)
})
test('absent panels are reported as absent', () => { eq(computeWorkspace(input({ left: null })).leftDock, 'absent') })

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

test('the candidate classic script in PR-0002 matches the TypeScript (no drift)', async () => {
  const { readFileSync } = await import('node:fs')
  const { runInNewContext } = await import('node:vm')
  const ctx = {}; ctx.globalThis = ctx
  runInNewContext(readFileSync(new URL('../feedback/proposals/PR-0002/candidate/js/workspace-geometry.js', import.meta.url), 'utf8'), ctx)
  const C = ctx.SummaWorkspace
  assert.ok(C, 'script exposes SummaWorkspace')
  for (const w of [390, 640, 820, 1000, 1376, 1800, 3000]) for (const h of [600, 860, 1400]) for (const pref of [null, 100, 480, 5000]) for (const open of [true, false]) {
    const i = input({ width: w, height: h, preferred: pref, leftOpen: open })
    assert.deepEqual(JSON.parse(JSON.stringify(C.computeWorkspace(i))), JSON.parse(JSON.stringify(computeWorkspace(i))))
  }
  eq(C.PRIMARY_MIN, PRIMARY_MIN); eq(C.stepSize(480, 1, { minSize: 280, maxSize: 800 }), 520)
})
