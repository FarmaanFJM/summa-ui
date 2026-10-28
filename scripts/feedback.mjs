#!/usr/bin/env node
// Design feedback workflow helper. Records issues, suggested classifications and proposal drafts as plain files.
// It cannot approve anything: owner approvals are made by the owner editing the record and merging a reviewed pull request.
//   node scripts/feedback.mjs new --app <id> --component "<name>" --screenshot <file> [--screenshot <file>] --text "<explanation>" [--by <name>] [--route <route>] [--guidance <version>]
//   node scripts/feedback.mjs classify FB-0001 --kind guidance-gap|guidance-ambiguity|guidance-incorrect|application-specific|not-a-problem --rationale "<why>" --by <name> [--principles P17,P19] [--antipatterns AP-003]
//   node scripts/feedback.mjs propose FB-0001 --title "<title>" --kind <proposal kind> --impact patch|minor|major --by <name>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const args = process.argv.slice(2)
const cmd = args[0]
const all = n => args.flatMap((a, i) => (a === `--${n}` ? [args[i + 1]] : []))
const one = (n, d) => all(n)[0] ?? d
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const write = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')
const die = m => { console.error('feedback: ' + m); process.exit(1) }
const next = (dir, prefix) => { const n = existsSync(dir) ? readdirSync(dir).filter(f => new RegExp(`^${prefix}-\\d{4}$`).test(f)).map(f => +f.slice(3)) : []; return `${prefix}-${String(Math.max(0, ...n) + 1).padStart(4, '0')}` }
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const currentVersion = () => json(join(root, 'guidance/manifest.json')).version

if (cmd === 'new') {
  const app = one('app'), component = one('component'), text = one('text'), shots = all('screenshot')
  if (!app || !component || !text || !shots.length) die('new needs --app, --component, --text and at least one --screenshot')
  const registry = json(join(root, 'feedback/applications.json')).applications
  const entry = registry.find(a => a.id === app)
  const id = next(join(root, 'feedback/issues'), 'FB')
  const dir = join(root, 'feedback/issues', id); mkdirSync(dir, { recursive: true })
  const files = shots.map(s => { if (!existsSync(s)) die(`screenshot not found: ${s}`); const name = basename(s); copyFileSync(s, join(dir, name)); return { file: name } })
  write(join(dir, 'issue.json'), {
    id, createdAt: now(), reportedBy: one('by', 'owner'),
    application: { id: app, ...(one('route') || entry?.route ? { route: one('route') ?? entry.route } : {}) },
    guidanceVersion: one('guidance') ?? entry?.guidanceVersion ?? currentVersion(),
    component, screenshots: files, explanation: text,
    classification: { status: 'unclassified', kind: null }, relatedPrinciples: [], relatedAntiPatterns: [], status: 'open', proposal: null,
  })
  console.log(`created feedback/issues/${id}`)
} else if (cmd === 'classify') {
  const id = args[1]; const p = join(root, 'feedback/issues', id, 'issue.json')
  if (!existsSync(p)) die(`unknown issue ${id}`)
  const kind = one('kind'), by = one('by'), why = one('rationale')
  if (!kind || !by || !why) die('classify needs --kind, --rationale and --by')
  const issue = json(p)
  // A classification made through this tool is always a suggestion. The owner confirms it by editing confirmedBy and confirmedAt in review.
  issue.classification = { status: 'proposed', kind, rationale: why, proposedBy: by }
  if (one('principles')) issue.relatedPrinciples = one('principles').split(',')
  if (one('antipatterns')) issue.relatedAntiPatterns = one('antipatterns').split(',')
  issue.status = 'triaged'
  write(p, issue); console.log(`${id} classified as ${kind} (proposed, awaiting owner confirmation)`)
} else if (cmd === 'propose') {
  const id = args[1]; const ip = join(root, 'feedback/issues', id, 'issue.json')
  if (!existsSync(ip)) die(`unknown issue ${id}`)
  const issue = json(ip)
  if (!['guidance-gap', 'guidance-ambiguity', 'guidance-incorrect'].includes(issue.classification.kind)) die('only a guidance-gap, guidance-ambiguity or guidance-incorrect issue can have a proposal; classify it first')
  const pid = next(join(root, 'feedback/proposals'), 'PR'); const dir = join(root, 'feedback/proposals', pid); mkdirSync(dir, { recursive: true })
  write(join(dir, 'proposal.json'), {
    id: pid, title: one('title', 'TODO title'), issues: [id], kind: one('kind', 'clarification'), status: 'draft', authoredBy: one('by', 'unknown'), authoredAt: now(),
    summary: 'TODO: describe the rule change in one or two sentences and why it generalizes beyond the affected application.',
    change: { files: [], principleIds: issue.relatedPrinciples, antiPatternIds: issue.relatedAntiPatterns, checkIds: [], presetIds: [] },
    examples: { negative: [], positive: [] },
    validation: { result: 'pending', regressionReport: null, baseline: `feedback/baselines/guidance-v${currentVersion()}.json` },
    versionImpact: one('impact', 'minor'), existingApplications: { policy: 'unchanged-until-owner-updates' }, ownerDecision: null, releasedIn: null,
  })
  issue.proposal = pid; issue.status = 'proposal-drafted'; write(ip, issue)
  console.log(`created feedback/proposals/${pid} (draft). Add examples, run: npm run regression -- --out feedback/proposals/${pid}/regression.json`)
} else die('usage: new | classify | propose (see the header of this file)')
