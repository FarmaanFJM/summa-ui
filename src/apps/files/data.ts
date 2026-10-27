import type { IconName } from '../../ui'

export type Kind = 'folder' | 'image' | 'pdf' | 'doc' | 'sheet' | 'slides' | 'code' | 'text' | 'video' | 'audio' | 'archive' | 'design'

export type Item = {
  id: string
  name: string
  parent: string // folder id; 'root' is My Drive
  kind: Kind
  size: number // bytes; 0 for folders
  modified: number
  starred?: boolean
  shared?: string[]
  trashed?: number // deletion time (set only on the item that was trashed directly)
}

/** The prototype's fixed "today": 27 Oct 2026, 10:30. */
export const NOW = new Date(2026, 9, 27, 10, 30).getTime()
export const DAY = 24 * 3600e3
export const QUOTA = 15 * 1024 ** 3

export const PEOPLE = ['Priya Raman', 'Marcus Hale', 'Elena Voss', 'Tomás Ibarra', 'Amara Okafor', 'Jonas Weber']

/* ------------------------------------------------------------ type metadata */
const EXT: Record<string, { kind: Kind; label: string }> = {
  png: { kind: 'image', label: 'PNG image' }, jpg: { kind: 'image', label: 'JPEG image' }, heic: { kind: 'image', label: 'HEIC image' }, svg: { kind: 'image', label: 'SVG image' },
  pdf: { kind: 'pdf', label: 'PDF document' },
  docx: { kind: 'doc', label: 'Word document' }, md: { kind: 'text', label: 'Markdown' }, txt: { kind: 'text', label: 'Plain text' },
  xlsx: { kind: 'sheet', label: 'Spreadsheet' }, csv: { kind: 'sheet', label: 'CSV file' },
  pptx: { kind: 'slides', label: 'Presentation' }, key: { kind: 'slides', label: 'Keynote' },
  ts: { kind: 'code', label: 'TypeScript' }, tsx: { kind: 'code', label: 'TypeScript React' }, json: { kind: 'code', label: 'JSON' }, css: { kind: 'code', label: 'Stylesheet' }, py: { kind: 'code', label: 'Python script' }, sql: { kind: 'code', label: 'SQL script' },
  mp4: { kind: 'video', label: 'MP4 video' }, mov: { kind: 'video', label: 'QuickTime movie' },
  mp3: { kind: 'audio', label: 'MP3 audio' }, wav: { kind: 'audio', label: 'WAV audio' },
  zip: { kind: 'archive', label: 'ZIP archive' },
  fig: { kind: 'design', label: 'Figma file' },
}

export const ICON: Record<Kind, IconName> = {
  folder: 'folder', image: 'image', pdf: 'file-text', doc: 'file-text', sheet: 'table', slides: 'layers', code: 'code', text: 'file-text', video: 'film', audio: 'music', archive: 'archive', design: 'sparkle',
}

export const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '')
export const kindLabel = (it: Item) => (it.kind === 'folder' ? 'Folder' : EXT[extOf(it.name)]?.label ?? 'File')
export const kindFor = (name: string): Kind => EXT[extOf(name)]?.kind ?? 'text'

/* ------------------------------------------------------------ formatting */
export function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${Math.round(b / 1024)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(b < 10 * 1024 ** 2 ? 1 : 0)} MB`
  return `${(b / 1024 ** 3).toFixed(1)} GB`
}

export function fmtDate(t: number, long = false): string {
  const d = new Date(t), n = new Date(NOW)
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(n) - day(d)) / DAY)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diff === 0) return `Today, ${time}`
  if (diff === 1) return `Yesterday, ${time}`
  const date = d.toLocaleDateString('en-US', d.getFullYear() === n.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
  return long ? `${date}, ${time}` : date
}

/* ------------------------------------------------------------ deterministic generation */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const MB = 1024 ** 2, KB = 1024
const RANGE: Record<string, [number, number]> = {
  png: [0.8 * MB, 6 * MB], jpg: [2 * MB, 9 * MB], heic: [1.5 * MB, 4 * MB], svg: [4 * KB, 90 * KB], pdf: [120 * KB, 6 * MB], docx: [40 * KB, 900 * KB], md: [2 * KB, 40 * KB], txt: [1 * KB, 20 * KB],
  xlsx: [30 * KB, 600 * KB], csv: [20 * KB, 4 * MB], pptx: [2 * MB, 40 * MB], key: [8 * MB, 60 * MB], ts: [1 * KB, 30 * KB], tsx: [1 * KB, 30 * KB], json: [1 * KB, 200 * KB], css: [2 * KB, 40 * KB],
  py: [1 * KB, 20 * KB], sql: [1 * KB, 60 * KB], mp4: [80 * MB, 900 * MB], mov: [200 * MB, 1.4 * 1024 * MB], mp3: [3 * MB, 9 * MB], wav: [20 * MB, 60 * MB], zip: [5 * MB, 400 * MB], fig: [8 * MB, 60 * MB],
}

type FolderSpec = [id: string, parent: string, name: string, daysAgo: number, shared?: string[], starred?: boolean]
type FileSpec = [name: string, parent: string, daysAgo: number, shared?: string[], starred?: boolean, size?: number]

const FOLDERS: FolderSpec[] = [
  ['work', 'root', 'Work', 0.2, ['Priya Raman', 'Marcus Hale', 'Elena Voss']],
  ['projects', 'work', 'Projects', 0.2],
  ['atlas', 'projects', 'Atlas redesign', 0.1, ['Priya Raman', 'Elena Voss'], true],
  ['research', 'atlas', 'Research', 3],
  ['interviews', 'research', 'Interviews', 6],
  ['surveys', 'research', 'Surveys', 19],
  ['design', 'atlas', 'Design', 1],
  ['exports', 'design', 'Exports', 1.2],
  ['specs', 'atlas', 'Specs', 2.3, ['Marcus Hale']],
  ['billing', 'projects', 'Billing migration', 9, ['Marcus Hale', 'Jonas Weber']],
  ['finance', 'work', 'Finance', 12, ['Amara Okafor'], true],
  ['fin26', 'finance', '2026', 12],
  ['fin25', 'finance', '2025', 301],
  ['meetings', 'work', 'Meetings', 5],
  ['personal', 'root', 'Personal', 2],
  ['travel', 'personal', 'Travel', 14],
  ['lisbon', 'travel', 'Lisbon, September', 40],
  ['home', 'personal', 'Home', 60],
  ['photos', 'root', 'Photos', 8, undefined, true],
  ['p26', 'photos', '2026', 8],
  ['hike', 'p26', 'Autumn hike', 8],
  ['p25', 'photos', '2025', 330],
  ['archive', 'root', 'Archive', 410],
]

const FILES: FileSpec[] = [
  // root
  ['Welcome to Drive.pdf', 'root', 420, undefined, false, 1.2 * MB],
  ['Passport scan.jpg', 'root', 190],
  ['Reading list.md', 'root', 4],
  ['2026 goals.docx', 'root', 33, undefined, true],
  // work
  ['Team handbook.pdf', 'work', 26, ['Priya Raman', 'Marcus Hale', 'Elena Voss', 'Tomás Ibarra']],
  ['Org chart.png', 'work', 71],
  ['Quarterly OKRs.xlsx', 'work', 7, ['Priya Raman', 'Amara Okafor'], true],
  // atlas
  ['Atlas kickoff.pptx', 'atlas', 21, ['Priya Raman', 'Elena Voss']],
  ['Project brief.docx', 'atlas', 28, ['Priya Raman']],
  ['Roadmap Q4.xlsx', 'atlas', 0.3, ['Priya Raman', 'Marcus Hale'], true],
  ['Stakeholder map.png', 'atlas', 15],
  // research
  ['Synthesis notes.md', 'research', 3.1],
  ['Competitive audit.pdf', 'research', 11],
  ['Usability findings.pptx', 'research', 4, ['Elena Voss']],
  // interviews
  ['Interview 01 — Hana.mp3', 'interviews', 6.2],
  ['Interview 02 — Diego.mp3', 'interviews', 6.1],
  ['Interview 03 — Marta.mp3', 'interviews', 5.9],
  ['Interview 04 — Sam.mp3', 'interviews', 5.8],
  ['Transcript 01.txt', 'interviews', 5.7],
  ['Transcript 02.txt', 'interviews', 5.7],
  ['Interview guide.docx', 'interviews', 9],
  // surveys
  ['Pulse survey results.csv', 'surveys', 19],
  ['Survey questions.md', 'surveys', 24],
  // design
  ['Atlas design system.fig', 'design', 1, ['Elena Voss', 'Priya Raman'], true],
  ['Navigation explorations.fig', 'design', 2.6, ['Elena Voss']],
  ['Brand colours.png', 'design', 17],
  ['tokens.json', 'design', 1.4],
  ['theme.css', 'design', 1.4],
  // exports
  ['Home — desktop.png', 'exports', 1.2],
  ['Home — mobile.png', 'exports', 1.2],
  ['Settings — desktop.png', 'exports', 1.3],
  ['Onboarding flow.mp4', 'exports', 1.5, ['Priya Raman']],
  ['Icons.svg', 'exports', 3],
  // specs
  ['Offline mode spec.md', 'specs', 0.08, ['Marcus Hale', 'Priya Raman'], true],
  ['Sync protocol.pdf', 'specs', 4, ['Marcus Hale']],
  ['API contract.json', 'specs', 2.3],
  ['sync-queue.ts', 'specs', 2.4],
  // billing
  ['Migration plan.docx', 'billing', 9, ['Marcus Hale', 'Jonas Weber']],
  ['Schema diff.sql', 'billing', 10],
  ['Invoice backfill.py', 'billing', 12],
  ['Cutover checklist.xlsx', 'billing', 9.5, ['Jonas Weber']],
  // finance
  ['Budget 2026.xlsx', 'fin26', 12, ['Amara Okafor'], true],
  ['Q3 expense report.pdf', 'fin26', 29],
  ['Vendor contracts.zip', 'fin26', 52],
  ['Payroll summary.csv', 'fin26', 33],
  ['Budget 2025.xlsx', 'fin25', 301],
  ['Annual report 2025.pdf', 'fin25', 255, ['Amara Okafor', 'Priya Raman']],
  ['Tax filing.pdf', 'fin25', 190],
  // meetings
  ['Product sync, 22 Oct.md', 'meetings', 5],
  ['Product sync, 15 Oct.md', 'meetings', 12],
  ['All hands recording.mp4', 'meetings', 18, ['Priya Raman', 'Marcus Hale', 'Elena Voss', 'Tomás Ibarra', 'Amara Okafor']],
  ['Board update.pptx', 'meetings', 36, ['Priya Raman']],
  // personal
  ['Lease agreement.pdf', 'home', 140],
  ['Insurance.pdf', 'home', 88],
  ['Home inventory.xlsx', 'home', 60],
  ['Flight confirmation.pdf', 'travel', 45],
  ['Lisbon itinerary.docx', 'lisbon', 44, ['Amara Okafor']],
  ['Hotel booking.pdf', 'lisbon', 52],
  ['Fado night.mov', 'lisbon', 41],
  ['Packing list.md', 'travel', 47],
  // photos
  ['IMG_2041.heic', 'hike', 8.1],
  ['IMG_2042.heic', 'hike', 8.1],
  ['IMG_2043.heic', 'hike', 8.1],
  ['Summit.jpg', 'hike', 8],
  ['Ridge at dusk.jpg', 'hike', 8],
  ['Trail map.png', 'hike', 9],
  ['Harbour, Lisbon.jpg', 'p26', 41, ['Amara Okafor']],
  ['Tram 28.jpg', 'p26', 41],
  ['Family portrait.jpg', 'p25', 210, ['Amara Okafor']],
  ['Summer 2025.zip', 'p25', 280],
  // archive
  ['Old portfolio.zip', 'archive', 410],
  ['Thesis draft v3.docx', 'archive', 560],
  ['Demo reel.mov', 'archive', 450],
  ['Mixdown — Early Light.wav', 'archive', 520],
]

export function buildItems(): Item[] {
  const items: Item[] = []
  FOLDERS.forEach(([id, parent, name, d, shared, starred]) => items.push({ id, parent, name, kind: 'folder', size: 0, modified: NOW - d * DAY, shared, starred }))
  FILES.forEach(([name, parent, d, shared, starred, size], i) => {
    const ext = extOf(name)
    const [lo, hi] = RANGE[ext] ?? [KB, 10 * KB]
    const r = rng(name)()
    items.push({ id: `f${i + 1}`, parent, name, kind: kindFor(name), size: Math.round(size ?? lo + r * (hi - lo)), modified: NOW - d * DAY, shared, starred })
  })
  return items
}

export const QUICK_ACCESS = ['work', 'atlas', 'finance', 'personal', 'photos', 'travel']

/** Fake excerpts for the preview dialog. */
export function excerptFor(it: Item): string {
  const ext = extOf(it.name)
  if (ext === 'json') return `{\n  "name": "${it.name.replace('.json', '')}",\n  "version": "2.4.0",\n  "colors": {\n    "surface": "#1b1c1c",\n    "accent": "#10b981",\n    "text": "#ececeb"\n  },\n  "radius": { "sm": 6, "md": 8, "lg": 12 }\n}`
  if (ext === 'css') return `:root {\n  --surface: #1b1c1c;\n  --accent: #10b981;\n  --radius: 8px;\n}\n\n.card {\n  background: var(--surface);\n  border-radius: var(--radius);\n  padding: 16px;\n}`
  if (ext === 'ts' || ext === 'tsx') return `import { openDB } from './store'\n\nexport async function flush(queue: Queue) {\n  for (const op of queue.pending()) {\n    await send(op)\n    queue.ack(op.id)\n  }\n}\n\nexport const retryDelay = (n: number) => Math.min(1000 * 2 ** n, 30_000)`
  if (ext === 'py') return `import csv\nfrom datetime import date\n\ndef backfill(rows):\n    for row in rows:\n        yield {\n            "invoice": row["id"],\n            "issued": date.fromisoformat(row["issued"]),\n        }`
  if (ext === 'sql') return `ALTER TABLE invoices\n  ADD COLUMN currency char(3) NOT NULL DEFAULT 'EUR';\n\nCREATE INDEX idx_invoices_customer\n  ON invoices (customer_id, issued_at DESC);`
  if (ext === 'csv') return `region,respondents,score,delta\nEMEA,412,4.2,+0.3\nAMER,538,4.0,+0.1\nAPAC,296,3.8,-0.1\nLATAM,141,4.1,+0.4`
  if (ext === 'md' || ext === 'txt') return `# ${it.name.replace(/\.(md|txt)$/, '')}\n\nThe main thread from this session is that people trust the product most when it stays out of the way. A few patterns recur across the notes:\n\n- Quiet states beat loud ones\n- Defaults should be right for most people\n- Anything destructive needs a way back\n\nNext steps are tracked in the roadmap.`
  return ''
}
