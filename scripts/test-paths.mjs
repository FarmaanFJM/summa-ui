// Regression test for the Windows path defect: `new URL('..', import.meta.url).pathname` gives `/C:/...` on Windows,
// which becomes `C:\C:\...` once joined. Run: node --test scripts/test-paths.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repoRoot } from './lib/repo-root.mjs'

test('Windows file URLs become drive paths, not /C:/ paths', () => {
  const root = repoRoot('file:///C:/Users/Some%20One/summa-ui/scripts/feedback.mjs', { windows: true })
  assert.equal(root, ['C:', 'Users', 'Some One', 'summa-ui', ''].join(String.fromCharCode(92)))
  assert.ok(!/^[A-Za-z]:[^:]*[A-Za-z]:/.test(root), 'no doubled drive letter')
})

test('POSIX file URLs keep working, including percent-encoded names', () => {
  assert.equal(repoRoot('file:///home/me/my%20repo/scripts/feedback.mjs', { windows: false }), '/home/me/my repo/')
})

test('the real repository root exists and holds the feedback and guidance folders', () => {
  const root = repoRoot(import.meta.url)
  assert.ok(existsSync(join(root, 'feedback')) && existsSync(join(root, 'guidance')), root)
})

test('no script turns import.meta.url into a path with .pathname', () => {
  const dir = fileURLToPath(new URL('.', import.meta.url))
  const offenders = readdirSync(dir).filter(f => f.endsWith('.mjs') && f !== 'test-paths.mjs').filter(f => /import\.meta\.url\)\.pathname|new URL\([^)]*import\.meta\.url[^)]*\)\.pathname/.test(readFileSync(join(dir, f), 'utf8')))
  assert.deepEqual(offenders, [], 'use repoRoot() or fileURLToPath() (scripts/lib/repo-root.mjs)')
})
