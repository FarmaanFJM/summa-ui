/* Deterministic, seeded demo data for "Meridian". Everything derives from a day index so ranges overlap consistently. */
export const DAY = 86400000
export const TODAY = Math.floor(Date.UTC(2026, 9, 27) / DAY)
export type Range = { from: number; to: number } // inclusive day indices
export const len = (r: Range) => r.to - r.from + 1
export const prevOf = (r: Range): Range => ({ from: r.from - len(r), to: r.from - 1 })
export type PresetId = '7' | '30' | '90' | 'ytd' | 'custom'

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dt = (d: number) => new Date(d * DAY)
export const dayStr = (d: number) => { const x = dt(d); return `${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}` }
export const dayFull = (d: number) => `${dayStr(d)}, ${dt(d).getUTCFullYear()}`
export const isoOf = (d: number) => dt(d).toISOString().slice(0, 10)
export const dayOfIso = (s: string) => Math.floor(Date.parse(s + 'T00:00:00Z') / DAY)
export const rangeText = (r: Range) => len(r) === 1 ? dayFull(r.to) : `${dayStr(r.from)} – ${dayStr(r.to)}, ${dt(r.to).getUTCFullYear()}`
export const rangeShort = (r: Range) => `${dayStr(r.from)} – ${dayStr(r.to)}`
export const MIN_DAY = dayOfIso('2025-01-01')

export function rangeOf(p: PresetId, custom?: Range): Range {
  if (p === 'custom' && custom) return custom
  if (p === 'ytd') return { from: Math.floor(Date.UTC(2026, 0, 1) / DAY), to: TODAY }
  const n = p === '7' ? 7 : p === '90' ? 90 : 30
  return { from: TODAY - n + 1, to: TODAY }
}

export function hash(a: number, b: number) {
  let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/* ------------------------------------------------------------------ formatting */
export type Fmt = (n: number, compact?: boolean) => string
const group = (n: number) => Math.round(n).toLocaleString('en-US')
const comp = (n: number, pre = '') => {
  const a = Math.abs(n)
  if (a >= 1e6) return pre + (n / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'
  if (a >= 1e5) return pre + Math.round(n / 1e3) + 'k'
  if (a >= 1e3) return pre + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  return pre + Math.round(n)
}
export const money: Fmt = (n, c) => c ? comp(n, '$') : '$' + group(n)
export const money2: Fmt = (n, c) => c ? comp(n, '$') : '$' + n.toFixed(2)
export const int: Fmt = (n, c) => c ? comp(n) : group(n)
export const pct: Fmt = (n, c) => (c && Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1)) + '%'
export const dur: Fmt = n => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0').replace(/^60$/, '59')}`

/* ------------------------------------------------------------------ metrics */
export type Metric = {
  id: string; label: string; kind: 'sum' | 'avg' | 'last'; base: number; trend: number; noise: number; weekend: number; seed: number
  good: 'up' | 'down'; fmt: Fmt
}
const M = (id: string, label: string, kind: Metric['kind'], base: number, fmt: Fmt, o: Partial<Metric> = {}): Metric =>
  ({ id, label, kind, base, fmt, trend: 0.0006, noise: 0.07, weekend: 0.1, seed: id.length * 7 + id.charCodeAt(0), good: 'up', ...o })

export function dayValue(m: Metric, d: number) {
  const dow = (((d % 7) + 7) + 4) % 7
  const wk = dow === 0 || dow === 6 ? 1 - m.weekend : 1 + m.weekend * 0.25
  const wave = 1 + 0.045 * Math.sin(d / 17 + m.seed) + 0.03 * Math.sin(d / 5.5 + m.seed * 2)
  return m.base * (1 + m.trend * (d - TODAY)) * wk * wave * (1 + m.noise * (hash(m.seed, d) * 2 - 1))
}
export function aggregate(m: Metric, r: Range) {
  if (m.kind === 'last') return dayValue(m, r.to)
  let s = 0
  for (let d = r.from; d <= r.to; d++) s += dayValue(m, d)
  return m.kind === 'sum' ? s : s / len(r)
}
export type Pt = { v: number; from: number; to: number }
export function series(m: Metric, r: Range, bin: number): Pt[] {
  const out: Pt[] = []
  for (let a = r.from; a <= r.to; a += bin) {
    const b = Math.min(r.to, a + bin - 1)
    let s = 0
    for (let d = a; d <= b; d++) s += dayValue(m, d)
    out.push({ from: a, to: b, v: m.kind === 'sum' ? s : m.kind === 'last' ? dayValue(m, b) : s / (b - a + 1) })
  }
  return out
}
export const mainBin = (n: number) => n <= 120 ? 1 : n <= 630 ? 7 : Math.ceil(n / 90 / 7) * 7
export const sparkBin = (n: number) => Math.max(1, Math.ceil(n / 24))

/* ------------------------------------------------------------------ categories */
export type Dim = { id: string; label: string; cats: [string, number][] }
export const PLAN_DIM: Dim = { id: 'plan', label: 'Plan', cats: [['Starter', 0.14], ['Growth', 0.33], ['Scale', 0.31], ['Enterprise', 0.22]] }
export const CHANNEL_DIM: Dim = { id: 'channel', label: 'Channel', cats: [['Direct', 0.27], ['Organic', 0.24], ['Paid', 0.19], ['Partners', 0.17], ['Referral', 0.13]] }
export const DEVICE_DIM: Dim = { id: 'device', label: 'Device', cats: [['Desktop', 0.58], ['Mobile', 0.33], ['Tablet', 0.09]] }
export const COUNTRIES: [string, number][] = [['United States', 0.34], ['United Kingdom', 0.11], ['Germany', 0.09], ['France', 0.065], ['Canada', 0.06], ['Australia', 0.05], ['India', 0.045], ['Netherlands', 0.04], ['Brazil', 0.035], ['Spain', 0.03]]

export function catValue(m: Metric, total: number, weight: number, n: number, key: number, r: Range) {
  const w = 1 + 0.08 * (hash(key, r.from * 31 + r.to) * 2 - 1)
  if (m.kind !== 'avg') return total * weight * w
  return total * (1 + 0.2 * (hash(key * 3 + 1, r.to) * 2 - 1)) * (0.9 + 0.2 * (weight * n > 1 ? 1 : 0.6))
}

/* ------------------------------------------------------------------ tables */
export type Row = Record<string, string | number | null>
export type Col = { key: string; label: string; align?: 'right'; fmt?: (v: never) => string }
export type TableDef = {
  title: string; search: string; filter?: { label: string; key: string; options: string[] }
  cols: Col[]; build: (r: Range) => Row[]; defaultSort: { key: string; dir: 'asc' | 'desc' }; csvName: string
}
const sumF = (base: number, seed: number, r: Range) => { let s = 0; for (let d = r.from; d <= r.to; d++) s += base * (1 + 0.0006 * (d - TODAY)) * (0.82 + 0.36 * hash(seed, d)); return s }
const wob = (seed: number, r: Range, amp = 0.08) => 1 + amp * (hash(seed, r.from * 7 + r.to) * 2 - 1)

const PAGES_ROWS: [string, string, number, number, number, number][] = [
  ['/', 'Marketing', 5200, 52, 0.46, 1.9], ['/pricing', 'Marketing', 3100, 118, 0.38, 6.2], ['/features/dashboards', 'Product', 1900, 96, 0.34, 3.1],
  ['/features/funnels', 'Product', 1400, 88, 0.36, 2.8], ['/features/integrations', 'Product', 1100, 74, 0.41, 2.2], ['/blog/cohort-analysis-guide', 'Blog', 980, 205, 0.58, 0.9],
  ['/blog/reducing-churn', 'Blog', 760, 188, 0.61, 0.8], ['/docs/getting-started', 'Docs', 1500, 262, 0.29, 1.4], ['/docs/api/events', 'Docs', 1050, 301, 0.33, 0.7],
  ['/signup', 'Account', 1250, 74, 0.31, 21.4], ['/login', 'Account', 2100, 31, 0.12, 0.4], ['/customers/northwind', 'Marketing', 320, 142, 0.44, 4.6],
  ['/changelog', 'Product', 410, 87, 0.52, 0.6], ['/about', 'Marketing', 290, 63, 0.64, 0.5],
]
const CAMPAIGNS: [string, string, number, number, number][] = [
  ['Search – brand terms', 'Paid search', 3400, 5.1, 38], ['Search – competitor terms', 'Paid search', 2100, 2.3, 211], ['LinkedIn – account based', 'Paid social', 1600, 1.9, 264],
  ['Product Hunt launch', 'Referral', 900, 4.4, 0], ['Weekly newsletter', 'Email', 2300, 3.2, 12], ['Webinar – Funnels 101', 'Events', 700, 6.8, 96],
  ['Partner – Stackwise', 'Partners', 1300, 3.9, 74], ['Retargeting – pricing page', 'Paid social', 1800, 2.7, 129], ['Podcast – Metrics Hour', 'Partners', 620, 2.1, 188],
  ['Reddit – r/analytics', 'Referral', 540, 2.5, 0], ['Affiliate – Growth Dojo', 'Partners', 760, 3.3, 83], ['Organic – docs search', 'Organic', 4100, 2.4, 0],
]
const CUSTOMERS: [string, string, number, number, string][] = [
  ['Northwind Traders', 'Enterprise', 18400, 240, '2024-02-12'], ['Halvorsen Group', 'Enterprise', 14950, 180, '2023-11-03'], ['Pinecrest Labs', 'Scale', 8200, 95, '2024-06-19'],
  ['Lumen Analytics', 'Scale', 7600, 80, '2024-08-27'], ['Orbit Logistics', 'Enterprise', 12300, 150, '2023-07-15'], ['Kestrel Health', 'Scale', 6900, 70, '2025-01-09'],
  ['Blue Harbor Co.', 'Growth', 3100, 32, '2025-03-22'], ['Tandem Robotics', 'Growth', 2850, 28, '2025-05-14'], ['Quill & Company', 'Growth', 2400, 24, '2025-04-02'],
  ['Verity Bank', 'Enterprise', 21500, 310, '2023-04-28'], ['Fernhill Studio', 'Starter', 790, 8, '2025-08-30'], ['Marlow Energy', 'Scale', 9400, 110, '2024-10-11'],
  ['Juniper Retail', 'Growth', 3650, 41, '2025-02-17'], ['Cobalt & Finch', 'Starter', 540, 5, '2025-09-12'],
]
const REPORTS: [string, string, string, number, number][] = [
  ['Weekly executive summary', 'Priya Nair', 'Weekly', 1, 42], ['Monthly revenue close', 'Daniel Okoye', 'Monthly', 3, 1280], ['Acquisition by channel', 'Mara Lindqvist', 'Weekly', 2, 318],
  ['Cohort retention matrix', 'Priya Nair', 'Monthly', 9, 26], ['Churn risk accounts', 'Tomás Rivera', 'Daily', 0, 74], ['Trial to paid funnel', 'Mara Lindqvist', 'Weekly', 4, 12],
  ['Top customers by MRR', 'Daniel Okoye', 'Monthly', 6, 150], ['Feature adoption', 'Elena Petrov', 'Weekly', 5, 88], ['Support volume vs. NPS', 'Tomás Rivera', 'Monthly', 12, 36],
  ['Geographic revenue split', 'Daniel Okoye', 'Quarterly', 18, 64], ['Pricing page experiments', 'Elena Petrov', 'On demand', 7, 22], ['Board metrics pack', 'Priya Nair', 'Quarterly', 24, 58],
]

const pageTable: TableDef = {
  title: 'Top pages', search: 'Search pages', filter: { label: 'Section', key: 'section', options: ['Marketing', 'Product', 'Blog', 'Docs', 'Account'] },
  cols: [
    { key: 'page', label: 'Page' }, { key: 'section', label: 'Section' },
    { key: 'views', label: 'Views', align: 'right', fmt: int as never }, { key: 'visitors', label: 'Visitors', align: 'right', fmt: int as never },
    { key: 'time', label: 'Avg. time', align: 'right', fmt: dur as never }, { key: 'bounce', label: 'Bounce', align: 'right', fmt: pct as never }, { key: 'conv', label: 'Conv.', align: 'right', fmt: pct as never },
  ],
  defaultSort: { key: 'views', dir: 'desc' }, csvName: 'top-pages',
  build: r => PAGES_ROWS.map(([page, section, base, time, bounce, conv], i) => {
    const views = sumF(base, i + 11, r)
    return { page, section, views, visitors: views * (0.6 + 0.12 * hash(i, 3)), time: time * wob(i + 40, r), bounce: bounce * 100 * wob(i + 50, r, 0.05), conv: conv * wob(i + 60, r, 0.1) }
  }),
}
const campaignTable: TableDef = {
  title: 'Campaigns', search: 'Search campaigns', filter: { label: 'Channel', key: 'channel', options: ['Paid search', 'Paid social', 'Organic', 'Email', 'Events', 'Partners', 'Referral'] },
  cols: [
    { key: 'name', label: 'Campaign' }, { key: 'channel', label: 'Channel' },
    { key: 'visitors', label: 'Visitors', align: 'right', fmt: int as never }, { key: 'signups', label: 'Signups', align: 'right', fmt: int as never },
    { key: 'rate', label: 'Signup rate', align: 'right', fmt: pct as never }, { key: 'cac', label: 'CAC', align: 'right', fmt: ((v: number | null) => v ? '$' + Math.round(v) : '–') as never },
  ],
  defaultSort: { key: 'visitors', dir: 'desc' }, csvName: 'campaigns',
  build: r => CAMPAIGNS.map(([name, channel, base, rate, cac], i) => {
    const visitors = sumF(base / 10, i + 21, r) * 10 / 10
    const rr = rate * wob(i + 70, r, 0.1)
    return { name, channel, visitors, signups: visitors * rr / 100, rate: rr, cac: cac ? cac * wob(i + 80, r, 0.1) : null }
  }),
}
const cohortTable: TableDef = {
  title: 'Weekly cohorts', search: 'Search cohorts',
  cols: [
    { key: 'cohort', label: 'Cohort' }, { key: 'users', label: 'Users', align: 'right', fmt: int as never },
    ...(['d1', 'd7', 'd14', 'd30'] as const).map(k => ({ key: k, label: k.toUpperCase().replace('D', 'Day '), align: 'right' as const, fmt: ((v: number | null) => v === null ? '–' : pct(v)) as never })),
  ],
  defaultSort: { key: 'start', dir: 'desc' }, csvName: 'cohorts',
  build: r => Array.from({ length: 14 }, (_, i) => {
    const start = r.to - ((r.to + 3) % 7) - 7 * (i + 1)
    const age = TODAY - (start + 6)
    const f = (base: number, need: number) => age >= need ? base * (1 + 0.05 * (hash(i, need) * 2 - 1)) + (14 - i) * 0.08 : null
    return { cohort: 'Week of ' + dayStr(start), start, users: 820 + hash(i, 5) * 360 + (14 - i) * 6, d1: f(63, 1), d7: f(41, 7), d14: f(31, 14), d30: f(24, 30) }
  }),
}
const customerTable: TableDef = {
  title: 'Top customers', search: 'Search customers', filter: { label: 'Plan', key: 'plan', options: ['Starter', 'Growth', 'Scale', 'Enterprise'] },
  cols: [
    { key: 'name', label: 'Customer' }, { key: 'plan', label: 'Plan' },
    { key: 'mrr', label: 'MRR', align: 'right', fmt: money as never }, { key: 'seats', label: 'Seats', align: 'right', fmt: int as never },
    { key: 'growth', label: 'Change', align: 'right', fmt: ((v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%') as never },
    { key: 'since', label: 'Customer since', align: 'right', fmt: ((v: string) => dayFull(dayOfIso(v))) as never },
  ],
  defaultSort: { key: 'mrr', dir: 'desc' }, csvName: 'top-customers',
  build: r => CUSTOMERS.map(([name, plan, mrr, seats, since], i) => ({
    name, plan, mrr: mrr * wob(i + 90, r, 0.04), seats, since, growth: (hash(i + 5, len(r)) * 2 - 0.55) * 9,
  })),
}
const reportTable: TableDef = {
  title: 'Saved reports', search: 'Search reports', filter: { label: 'Schedule', key: 'schedule', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'On demand'] },
  cols: [
    { key: 'name', label: 'Report' }, { key: 'owner', label: 'Owner' }, { key: 'schedule', label: 'Schedule' },
    { key: 'last', label: 'Last run', align: 'right', fmt: ((v: number) => dayFull(v)) as never }, { key: 'rows', label: 'Rows', align: 'right', fmt: int as never },
  ],
  defaultSort: { key: 'last', dir: 'desc' }, csvName: 'reports',
  build: () => REPORTS.map(([name, owner, schedule, ago, rows]) => ({ name, owner, schedule, last: TODAY - ago, rows })),
}

/* ------------------------------------------------------------------ pages */
export type PageId = 'overview' | 'acquisition' | 'retention' | 'revenue' | 'reports'
export type PageDef = {
  title: string; metrics: Metric[]; dims: Dim[]; barMetric: string; geoMetric: string; geoTitle: string; table: TableDef
}
const flat = { weekend: 0.03, noise: 0.02 }
export const PAGES: Record<PageId, PageDef> = {
  overview: {
    title: 'Overview', dims: [PLAN_DIM, CHANNEL_DIM], barMetric: 'revenue', geoMetric: 'revenue', geoTitle: 'Top countries', table: pageTable,
    metrics: [
      M('revenue', 'Revenue', 'sum', 9380, money, { trend: 0.0009 }),
      M('users', 'Active users', 'avg', 18420, int, { weekend: 0.22, trend: 0.0008 }),
      M('conversion', 'Conversion', 'avg', 3.42, pct, { trend: 0.0004, noise: 0.05 }),
      M('churn', 'Churn', 'avg', 2.08, pct, { trend: -0.0004, good: 'down', noise: 0.05, weekend: 0.02 }),
      M('session', 'Avg. session', 'avg', 252, dur, { trend: 0.0003, noise: 0.04, weekend: 0.08 }),
    ],
  },
  acquisition: {
    title: 'Acquisition', dims: [CHANNEL_DIM, DEVICE_DIM], barMetric: 'signups', geoMetric: 'visitors', geoTitle: 'Visitors by country', table: campaignTable,
    metrics: [
      M('visitors', 'Visitors', 'sum', 41200, int, { weekend: 0.28, trend: 0.0007 }),
      M('signups', 'Signups', 'sum', 1380, int, { weekend: 0.2, trend: 0.0009 }),
      M('trials', 'Trials started', 'sum', 612, int, { weekend: 0.24 }),
      M('signuprate', 'Signup rate', 'avg', 3.35, pct, { trend: 0.0003, noise: 0.05 }),
      M('cac', 'CAC', 'avg', 142, money, { good: 'down', trend: -0.0003, noise: 0.05, weekend: 0.02 }),
    ],
  },
  retention: {
    title: 'Retention', dims: [PLAN_DIM, CHANNEL_DIM], barMetric: 'd30', geoMetric: 'd30', geoTitle: 'Day 30 retention by country', table: cohortTable,
    metrics: [
      M('d1', 'Day 1 retention', 'avg', 63.4, pct, { ...flat, trend: 0.0002 }),
      M('d7', 'Day 7 retention', 'avg', 41.2, pct, { ...flat, trend: 0.0003 }),
      M('d30', 'Day 30 retention', 'avg', 24.6, pct, { ...flat, trend: 0.0004 }),
      M('churn2', 'Churn', 'avg', 2.08, pct, { trend: -0.0004, good: 'down', noise: 0.05, weekend: 0.02 }),
      M('react', 'Reactivated users', 'sum', 224, int, { weekend: 0.12, noise: 0.1 }),
    ],
  },
  revenue: {
    title: 'Revenue', dims: [PLAN_DIM, CHANNEL_DIM], barMetric: 'newmrr', geoMetric: 'mrr', geoTitle: 'MRR by country', table: customerTable,
    metrics: [
      M('mrr', 'MRR', 'last', 212400, money, { trend: 0.0011, noise: 0.004, weekend: 0, seed: 4 }),
      M('arpu', 'ARPU', 'avg', 48.2, money2, { trend: 0.0005, noise: 0.02, weekend: 0.01 }),
      M('newmrr', 'New MRR', 'sum', 3120, money, { weekend: 0.35, trend: 0.0008, noise: 0.12 }),
      M('expansion', 'Expansion MRR', 'sum', 1160, money, { weekend: 0.3, noise: 0.16 }),
      M('refunds', 'Refunds', 'sum', 238, money, { good: 'down', weekend: 0.25, noise: 0.3, trend: -0.0003 }),
    ],
  },
  reports: { title: 'Reports', dims: [], metrics: [], barMetric: '', geoMetric: '', geoTitle: '', table: reportTable },
}
export const NAV: { id: PageId; label: string; icon: 'grid' | 'users' | 'repeat' | 'trending-up' | 'file-text' }[] = [
  { id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'acquisition', label: 'Acquisition', icon: 'users' },
  { id: 'retention', label: 'Retention', icon: 'repeat' }, { id: 'revenue', label: 'Revenue', icon: 'trending-up' }, { id: 'reports', label: 'Reports', icon: 'file-text' },
]

export function csvOf(cols: { key: string; label: string }[], rows: Row[]) {
  const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  return [cols.map(c => esc(c.label)).join(','), ...rows.map(r => cols.map(c => esc(r[c.key])).join(','))].join('\n')
}
export function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
