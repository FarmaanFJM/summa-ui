#!/usr/bin/env node
// Validates the design feedback workflow records: registry, usage records, issues, proposals, and the owner-only approval rule.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { validate } from './lib/mini-schema.mjs'

const root = new URL('..', import.meta.url).pathname
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const errors = []
const err = m => errors.push(m)
const check = (schema, data, label) => validate(json(join(root, 'feedback/schema', schema)), data).forEach(e => err(`${label}: ${e}`))
const owners = json(join(root, 'feedback/OWNERS.json')).owners
const versions = new Set(readdirSync(join(root, 'docs/releases')).filter(f => /^guidance-v.+\.json$/.test(f)).map(f => json(join(root, 'docs/releases', f)).version))
const digests = Object.fromEntries(readdirSync(join(root, 'docs/releases')).filter(f => /^guidance-v.+\.json$/.test(f)).map(f => { const r = json(join(root, 'docs/releases', f)); return [r.version, r.bundleDigest] }))
const principles = new Set(json(join(root, 'guidance/principles.json')).principles.map(p => p.id))
const aps = new Set(readdirSync(join(root, 'guidance/antipatterns')).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')))

/* application registry */
const reg = json(join(root, 'feedback/applications.json')); check('applications.schema.json', reg, 'applications.json')
const ids = new Set()
for (const a of reg.applications) {
  if (ids.has(a.id)) err(`applications.json: duplicate ${a.id}`); ids.add(a.id)
  if (!versions.has(a.guidanceVersion)) err(`applications.json ${a.id}: guidance version ${a.guidanceVersion} has no release record`)
  else if (a.bundleDigest && a.bundleDigest !== digests[a.guidanceVersion]) err(`applications.json ${a.id}: bundleDigest does not match the release record for ${a.guidanceVersion}`)
  if (!existsSync(join(root, a.path))) err(`applications.json ${a.id}: path ${a.path} does not exist`)
}

/* issues */
const issueDir = join(root, 'feedback/issues')
const issues = new Map()
for (const d of existsSync(issueDir) ? readdirSync(issueDir).filter(f => /^FB-\d{4}$/.test(f)).sort() : []) {
  const p = join(issueDir, d, 'issue.json'); if (!existsSync(p)) { err(`${d}: issue.json missing`); continue }
  const i = json(p); check('issue.schema.json', i, `${d}/issue.json`)
  if (i.id !== d) err(`${d}: id ${i.id} does not match folder`)
  issues.set(i.id, i)
  if (!ids.has(i.application?.id)) err(`${d}: unknown application ${i.application?.id}`)
  if (!versions.has(i.guidanceVersion)) err(`${d}: guidance version ${i.guidanceVersion} has no release record`)
  for (const s of i.screenshots ?? []) if (!existsSync(join(issueDir, d, s.file))) err(`${d}: screenshot ${s.file} is missing (screenshots must be preserved with the issue)`)
  for (const k of i.relatedPrinciples ?? []) if (!principles.has(k)) err(`${d}: unknown principle ${k}`)
  for (const k of i.relatedAntiPatterns ?? []) if (!aps.has(k)) err(`${d}: unknown anti-pattern ${k}`)
  const c = i.classification
  if (c?.status === 'confirmed') { if (!owners.includes(c.confirmedBy)) err(`${d}: a confirmed classification must be confirmed by an owner (${owners.join(', ')})`); if (!c.confirmedAt) err(`${d}: confirmedAt missing`) }
  if (c?.status !== 'unclassified' && !c?.kind) err(`${d}: classification kind missing`)
  if (c?.status === 'unclassified' && c?.kind) err(`${d}: an unclassified issue cannot have a kind`)
}

/* proposals */
const propDir = join(root, 'feedback/proposals')
const proposals = new Map()
for (const d of existsSync(propDir) ? readdirSync(propDir).filter(f => /^PR-\d{4}$/.test(f)).sort() : []) {
  const p = join(propDir, d, 'proposal.json'); if (!existsSync(p)) { err(`${d}: proposal.json missing`); continue }
  const r = json(p); check('proposal.schema.json', r, `${d}/proposal.json`)
  if (r.id !== d) err(`${d}: id ${r.id} does not match folder`)
  proposals.set(r.id, r)
  for (const f of r.issues ?? []) { if (!issues.has(f)) err(`${d}: unknown issue ${f}`); else if (issues.get(f).proposal !== r.id) err(`${d}: issue ${f} does not point back to this proposal`) }
  const needsExamples = !['clarification', 'token-change'].includes(r.kind)
  if (needsExamples && (!r.examples?.positive?.length || !r.examples?.negative?.length) && r.status !== 'draft') err(`${d}: a ${r.kind} proposal needs at least one positive and one negative example before it is submitted`)
  if (['submitted', 'approved', 'released'].includes(r.status) && r.validation?.result === 'pending') err(`${d}: a submitted proposal must have a finished regression validation`)
  if (['submitted', 'approved', 'released'].includes(r.status) && r.change?.files?.length === 0) err(`${d}: a submitted proposal must list the files it changes`)
  for (const k of r.change?.conflictsWithApprovedRules ?? []) if (!readFileSync(join(root, 'docs/DECISIONS.md'), 'utf8').includes(k)) err(`${d}: conflict with ${k} has no decision recorded in docs/DECISIONS.md`)
  // Only the owner decides. An approved, rejected or released proposal must carry the owner's decision.
  if (['approved', 'rejected', 'released'].includes(r.status)) {
    if (!r.ownerDecision) err(`${d}: status ${r.status} requires an ownerDecision`)
    else {
      if (!owners.includes(r.ownerDecision.by)) err(`${d}: ownerDecision.by "${r.ownerDecision.by}" is not an owner (${owners.join(', ')}); automated agents cannot approve design rules`)
      const expect = r.status === 'rejected' ? 'rejected' : 'approved'
      if (r.ownerDecision.decision !== expect) err(`${d}: status ${r.status} does not match ownerDecision ${r.ownerDecision.decision}`)
    }
  } else if (r.ownerDecision && r.ownerDecision.decision === 'approved') err(`${d}: has an approving ownerDecision but status is ${r.status}`)
  if (r.status === 'released' && !versions.has(r.releasedIn)) err(`${d}: releasedIn ${r.releasedIn} has no release record`)
  if (r.status !== 'released' && r.releasedIn) err(`${d}: releasedIn is set but status is ${r.status}`)
}
for (const [id, i] of issues) if (i.proposal && !proposals.has(i.proposal)) err(`${id}: unknown proposal ${i.proposal}`)

/* usage record examples */
const exDir = join(root, 'feedback/examples')
if (existsSync(exDir)) for (const f of readdirSync(exDir).filter(f => f.endsWith('.usage.json'))) {
  const u = json(join(exDir, f)); check('usage.schema.json', u, `examples/${f}`)
  if (!versions.has(u.guidance?.version)) err(`examples/${f}: guidance version has no release record`)
  else if (u.guidance.bundleDigest !== digests[u.guidance.version]) err(`examples/${f}: bundleDigest does not match the release record`)
}

if (errors.length) { console.error(`feedback validation FAILED (${errors.length})`); errors.forEach(e => console.error(' - ' + e)); process.exit(1) }
console.log(`feedback validation passed: ${reg.applications.length} applications, ${issues.size} issues, ${proposals.size} proposals`)
