#!/usr/bin/env node
// Vendors the guidance bundle into another repository (for example Summa) and writes a digest-pinned lock file.
// The source bundle is verified first. Only an `approved` bundle can be vendored unless --allow-draft is given.
// Usage: node scripts/vendor-guidance.mjs <targetDir> [--lock <file>] [--allow-draft] [--expect-digest <sha256>]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const src = join(root, 'guidance')
const args = process.argv.slice(2)
const opt = n => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const target = args.find(a => !a.startsWith('--') && a !== opt('lock') && a !== opt('expect-digest'))
if (!target) { console.error('usage: vendor-guidance.mjs <targetDir> [--lock file] [--allow-draft] [--expect-digest sha]'); process.exit(2) }
const sha = b => createHash('sha256').update(b).digest('hex')
const fail = m => { console.error('vendor-guidance: ' + m); process.exit(1) }

const manifest = JSON.parse(readFileSync(join(src, 'manifest.json'), 'utf8'))
for (const f of manifest.files) { if (sha(readFileSync(join(src, f.path))) !== f.sha256) fail(`source file changed since the manifest was built: ${f.path} (run npm run guidance:build)`) }
const digest = sha(manifest.files.map(f => `${f.path}:${f.sha256}`).join('\n'))
if (digest !== manifest.bundleDigest) fail('manifest bundleDigest does not match its file list')
if (opt('expect-digest') && opt('expect-digest') !== digest) fail(`digest ${digest} does not match expected ${opt('expect-digest')}`)
if (manifest.channel !== 'approved' && !args.includes('--allow-draft')) fail(`bundle channel is "${manifest.channel}"; only approved bundles may be vendored (use --allow-draft for local trials)`)
if (manifest.channel === 'approved' && !manifest.reviewedBy) fail('approved bundle has no reviewedBy')

const dest = resolve(target)
if (existsSync(dest)) rmSync(dest, { recursive: true })
for (const f of [...manifest.files, { path: 'manifest.json' }]) {
  const out = join(dest, f.path); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, readFileSync(join(src, f.path)))
}
let commit = null
try { commit = execSync('git rev-parse HEAD', { cwd: root }).toString().trim() } catch {}
const lockPath = resolve(opt('lock') ?? join(dest, '..', 'summa-ui.lock.json'))
writeFileSync(lockPath, JSON.stringify({
  bundle: manifest.name, version: manifest.version, channel: manifest.channel,
  repo: 'FarmaanFJM/summa-ui', commit, bundleDigest: digest,
  approvedBy: manifest.reviewedBy ?? null, vendoredPath: dest.replace(dirname(lockPath) + '/', ''),
}, null, 2) + '\n')
console.log(`vendored ${manifest.name}@${manifest.version} (${manifest.channel}) -> ${dest}\nlock: ${lockPath}\ndigest: ${digest}`)
