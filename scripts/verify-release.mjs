#!/usr/bin/env node
// Verifies a Summa-UI guidance release tag from the git objects alone (no working tree, no network):
// the tag exists and is annotated; the bundle files at the tag hash to the manifest and to the recorded bundleDigest;
// the release record names an owner; the bundle is approved.
// Usage: node scripts/verify-release.mjs guidance-v0.1.0 [--expect-digest <sha256>] [--expect-commit <sha>]
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const root = new URL('..', import.meta.url).pathname
const tag = process.argv[2]
const opt = n => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined }
if (!tag) { console.error('usage: verify-release.mjs <tag> [--expect-digest sha] [--expect-commit sha]'); process.exit(2) }
const git = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 64 * 1024 * 1024 })
const show = path => git('show', `${tag}:${path}`)
const sha = b => createHash('sha256').update(b).digest('hex')
const errors = []
const err = m => errors.push(m)

let kind = ''
try { kind = git('cat-file', '-t', tag).toString().trim() } catch { console.error(`tag ${tag} does not exist`); process.exit(1) }
if (kind !== 'tag') err(`${tag} is a lightweight tag; release tags must be annotated`)
const commit = git('rev-parse', `${tag}^{commit}`).toString().trim()
if (opt('expect-commit') && opt('expect-commit') !== commit) err(`tag points to ${commit}, expected ${opt('expect-commit')}`)

const manifest = JSON.parse(show('guidance/manifest.json'))
for (const f of manifest.files) { let b; try { b = show(`guidance/${f.path}`) } catch { err(`missing at tag: ${f.path}`); continue } if (sha(b) !== f.sha256) err(`hash mismatch at tag: ${f.path}`) }
const digest = sha(manifest.files.map(f => `${f.path}:${f.sha256}`).join('\n'))
if (digest !== manifest.bundleDigest) err('manifest bundleDigest does not match its file list')
if (opt('expect-digest') && opt('expect-digest') !== digest) err(`digest ${digest} does not match expected ${opt('expect-digest')}`)
if (manifest.channel !== 'approved') err(`channel is ${manifest.channel}`)
const rec = JSON.parse(show(`docs/releases/guidance-v${manifest.version}.json`))
if (rec.bundleDigest !== digest) err('release record digest does not match the bundle at the tag')
if (tag !== rec.tag) err(`release record names tag ${rec.tag}, not ${tag}`)
const owners = JSON.parse(show('feedback/OWNERS.json')).owners
if (!owners.includes(rec.approvedBy)) err(`approvedBy ${rec.approvedBy} is not an owner`)
if (errors.length) { console.error('release verification FAILED'); errors.forEach(e => console.error(' - ' + e)); process.exit(1) }
console.log(`verified ${tag}: commit ${commit}\n  version ${manifest.version}, channel ${manifest.channel}, approved by ${rec.approvedBy} at ${rec.approvedAt}\n  bundleDigest ${digest}`)
