/* Halcyon Group: deterministic seeded demo data. Fixed "today" is 2026-10-27. */

export type PeriodId = 'quarter' | 'ytd' | '12m'
export type Unit = { id: string; name: string; short: string; rev: number; margin: number; gm: number; hc: number; nps: number; pipe: number; cash: number; bias: number; regions: number[] }

export const UNITS: Unit[] = [
  { id: 'energy', name: 'Halcyon Energy', short: 'Energy', rev: 1840, margin: 0.236, gm: 0.41, hc: 5420, nps: 31, pipe: 690, cash: 480, bias: 0.018, regions: [0.32, 0.30, 0.16, 0.12, 0.10] },
  { id: 'logistics', name: 'Halcyon Logistics', short: 'Logistics', rev: 1320, margin: 0.148, gm: 0.29, hc: 7180, nps: 38, pipe: 410, cash: 290, bias: -0.012, regions: [0.28, 0.34, 0.22, 0.08, 0.08] },
  { id: 'health', name: 'Halcyon Health', short: 'Health', rev: 980, margin: 0.272, gm: 0.58, hc: 3260, nps: 52, pipe: 520, cash: 360, bias: 0.034, regions: [0.44, 0.30, 0.14, 0.06, 0.06] },
  { id: 'digital', name: 'Halcyon Digital', short: 'Digital', rev: 760, margin: 0.214, gm: 0.66, hc: 2450, nps: 47, pipe: 810, cash: 270, bias: 0.052, regions: [0.41, 0.27, 0.22, 0.05, 0.05] },
  { id: 'retail', name: 'Halcyon Retail', short: 'Retail', rev: 640, margin: 0.092, gm: 0.34, hc: 4880, nps: 29, pipe: 160, cash: 170, bias: -0.031, regions: [0.30, 0.38, 0.12, 0.14, 0.06] },
]
export const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East and Africa']

export const PERIODS: { value: PeriodId; label: string; long: string; f: number }[] = [
  { value: 'quarter', label: 'Quarter', long: 'Q4 2026, quarter to date', f: 4 / 13 * 0.25 },
  { value: 'ytd', label: 'Year to date', long: 'Year to date, to 27 Oct 2026', f: 10 / 12 },
  { value: '12m', label: '12 months', long: 'Last 12 months, Nov 2025 to Oct 2026', f: 1 },
]

/* ---------------------------------------------------------------- seeded random */
function seed(str: string) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
export function rng(key: string) {
  let a = seed(key)
  const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  for (let i = 0; i < 4; i++) next()
  return next
}
const j = (key: string) => rng(key)() * 2 - 1

export const selUnits = (ids: string[]) => (ids.length ? UNITS.filter(u => ids.includes(u.id)) : UNITS)

/* ---------------------------------------------------------------- formatting */
export const money = (m: number, d = 1) => (Math.abs(m) >= 1000 ? `$${(m / 1000).toFixed(2)}B` : `$${m.toFixed(Math.abs(m) >= 100 ? 0 : d)}M`)
export const pct = (v: number, d = 1) => `${v.toFixed(d)}%`
export const sgn = (v: number, d = 1, suffix = '') => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}${suffix}`
export const int = (v: number) => Math.round(v).toLocaleString('en-US')

/* ---------------------------------------------------------------- revenue series */
const SEAS = [0.92, 0.9, 0.98, 1, 1.02, 1.05, 1, 0.99, 1.04, 1.06, 1.08, 1.12]
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export type Series = { labels: string[]; full: string[]; actual: number[]; plan: number[]; fc: (number | null)[]; lo: (number | null)[]; hi: (number | null)[]; nA: number }

function points(p: PeriodId) {
  const out: { label: string; full: string; m: number; share: number; part: number; actual: boolean; k: number }[] = []
  if (p === 'quarter') {
    for (let i = 0; i < 13; i++) {
      const d = new Date(Date.UTC(2026, 9, 1 + 7 * i)); const m = d.getUTCMonth()
      out.push({ label: `${MON[m]} ${d.getUTCDate()}`, full: `Week of ${MON[m]} ${d.getUTCDate()}`, m, share: 7 / 30.4, part: 1, actual: i < 4, k: i })
    }
  } else if (p === 'ytd') {
    for (let i = 0; i < 12; i++) out.push({ label: MON[i], full: `${MON[i]} 2026`, m: i, share: 1, part: 1, actual: i < 10, k: 10 + i })
  } else {
    for (let i = 0; i < 15; i++) {
      const m = (10 + i) % 12, y = 2025 + Math.floor((10 + i) / 12)
      out.push({ label: m === 0 ? `Jan ${String(y).slice(2)}` : MON[m], full: `${MON[m]} ${y}`, m, share: 1, part: 1, actual: i < 12, k: i })
    }
  }
  return out
}

export function revSeries(units: Unit[], p: PeriodId): Series {
  const pts = points(p)
  const n = pts.length, nA = pts.filter(x => x.actual).length
  const actual = new Array(nA).fill(0), plan = new Array(n).fill(0), fc: (number | null)[] = new Array(n).fill(null), lo: (number | null)[] = new Array(n).fill(null), hi: (number | null)[] = new Array(n).fill(null)
  const fcv = new Array(n).fill(0)
  for (const u of units) {
    const r = rng(u.id + p + 'rev')
    pts.forEach((x, i) => {
      const trend = 1 + 0.003 * (p === 'quarter' ? 9 + i * 0.23 : x.k)
      const pl = (u.rev / 12) * SEAS[x.m] * x.share * trend
      plan[i] += pl * (x.actual ? x.part : 1)
      const noise = (r() * 2 - 1) * 0.026
      if (x.actual) actual[i] += pl * x.part * (1 + u.bias + noise)
      else fcv[i] += pl * (1 + u.bias * 0.8)
    })
  }
  fc[nA - 1] = actual[nA - 1]; lo[nA - 1] = actual[nA - 1]; hi[nA - 1] = actual[nA - 1]
  for (let i = nA; i < n; i++) { const k = i - nA + 1; fc[i] = fcv[i]; lo[i] = fcv[i] * (1 - 0.014 - 0.007 * k); hi[i] = fcv[i] * (1 + 0.014 + 0.007 * k) }
  return { labels: pts.map(x => x.label), full: pts.map(x => x.full), actual, plan, fc, lo, hi, nA }
}
export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)
export function revTotals(units: Unit[], p: PeriodId) {
  const s = revSeries(units, p)
  return { act: sum(s.actual), plan: sum(s.plan.slice(0, s.nA)) }
}

/* ---------------------------------------------------------------- generic metric */
type MetricOpts = { mode: 'sum' | 'avg'; flow?: boolean; vol?: number; pg?: number; lean?: number }
export function metric(units: Unit[], p: PeriodId, name: string, base: (u: Unit) => number, o: MetricOpts) {
  const f = PERIODS.find(x => x.value === p)!.f
  let v = 0, pl = 0, w = 0
  for (const u of units) {
    const b = base(u) * (o.flow ? f : 1)
    const wt = o.mode === 'avg' ? u.rev : 1
    v += b * (1 + (o.vol ?? 0.025) * j(u.id + name + p)) * wt
    pl += b * (1 - (o.lean ?? 0.012) + (o.pg ?? 0.035) * j(u.id + name + 'plan')) * wt
    w += wt
  }
  return o.mode === 'avg' ? { value: v / w, plan: pl / w } : { value: v, plan: pl }
}

export function walk(key: string, n: number, end: number, vol = 0.03, drift = 0.01) {
  const r = rng(key)
  const a = new Array(n).fill(end)
  for (let i = n - 2; i >= 0; i--) a[i] = a[i + 1] * (1 - drift + (r() * 2 - 1) * vol)
  return a as number[]
}

/* ---------------------------------------------------------------- KPIs */
export type Kpi = { id: string; label: string; value: string; delta: number; deltaLabel: string; tone: 'up' | 'down' | 'flat'; spark: number[] }
function kpi(id: string, label: string, v: number, plan: number, fmt: (x: number) => string, kind: 'pct' | 'pts' | 'abs', higherBetter: boolean, spark: number[], absFmt?: (x: number) => string): Kpi {
  const delta = kind === 'pct' ? ((v - plan) / plan) * 100 : v - plan
  const flat = Math.abs(delta) < (kind === 'pct' ? 0.3 : kind === 'pts' ? 0.15 : 0.5)
  const tone: Kpi['tone'] = flat ? 'flat' : (delta > 0) === higherBetter ? 'up' : 'down'
  const deltaLabel = flat ? (kind === 'pct' ? '0.0%' : kind === 'pts' ? '0.0 pts' : '0') : kind === 'pct' ? sgn(delta, 1, '%') : kind === 'pts' ? sgn(delta, 1, ' pts') : absFmt ? absFmt(delta) : sgn(delta, 0)
  return { id, label, value: fmt(v), delta, deltaLabel, tone, spark }
}

export function overviewKpis(units: Unit[], p: PeriodId): Kpi[] {
  const key = units.map(u => u.id).join() + p
  const rev = revTotals(units, p), rs = revSeries(units, p)
  const marg = metric(units, p, 'margin', u => u.margin * 100, { mode: 'avg', vol: 0.05, pg: 0.04 })
  const cash = metric(units, p, 'cash', u => u.cash, { mode: 'sum', vol: 0.05, pg: 0.06 })
  const hc = people(units, p)
  const nps = metric(units, p, 'nps', u => u.nps, { mode: 'avg', vol: 0.06, pg: 0.07 })
  const pipe = metric(units, p, 'pipe', u => u.pipe, { mode: 'sum', vol: 0.06, pg: 0.07 })
  return [
    kpi('rev', 'Revenue', rev.act, rev.plan, x => money(x), 'pct', true, rs.actual.length > 1 ? rs.actual.slice(-12) : walk(key + 'r', 8, rev.act)),
    kpi('margin', 'EBITDA margin', marg.value, marg.plan, x => pct(x), 'pts', true, walk(key + 'm', 12, marg.value, 0.02, 0.004)),
    kpi('cash', 'Cash position', cash.value, cash.plan, x => money(x), 'pct', true, walk(key + 'c', 12, cash.value, 0.035, 0.006)),
    kpi('hc', 'Headcount', hc.hc[hc.hc.length - 1], hc.plan, int, 'pct', true, hc.hc),
    kpi('nps', 'NPS', nps.value, nps.plan, x => x.toFixed(0), 'abs', true, walk(key + 'n', 12, nps.value, 0.04, 0.003), x => sgn(x, 0)),
    kpi('pipe', 'Qualified pipeline', pipe.value, pipe.plan, x => money(x), 'pct', true, walk(key + 'p', 12, pipe.value, 0.05, 0.01)),
  ]
}

export function financeKpis(units: Unit[], p: PeriodId): Kpi[] {
  const key = units.map(u => u.id).join() + p + 'fin'
  const rev = revTotals(units, p)
  const gm = metric(units, p, 'gm', u => u.gm * 100, { mode: 'avg', vol: 0.03, pg: 0.03 })
  const eb = metric(units, p, 'ebitda', u => u.rev * u.margin, { mode: 'sum', flow: true, vol: 0.05, pg: 0.05 })
  const ocf = metric(units, p, 'ocf', u => u.rev * u.margin * 0.82, { mode: 'sum', flow: true, vol: 0.07, pg: 0.06 })
  const debt = metric(units, p, 'debt', u => u.rev * 0.38, { mode: 'sum', vol: 0.03, pg: 0.04 })
  const dso = metric(units, p, 'dso', u => 38 + (u.id.length * 7) % 19, { mode: 'avg', vol: 0.05, pg: 0.05 })
  return [
    kpi('rev', 'Revenue', rev.act, rev.plan, x => money(x), 'pct', true, walk(key + 'r', 12, rev.act, 0.04, 0.012)),
    kpi('gm', 'Gross margin', gm.value, gm.plan, x => pct(x), 'pts', true, walk(key + 'g', 12, gm.value, 0.012, 0.002)),
    kpi('eb', 'EBITDA', eb.value, eb.plan, x => money(x), 'pct', true, walk(key + 'e', 12, eb.value, 0.05, 0.012)),
    kpi('ocf', 'Operating cash flow', ocf.value, ocf.plan, x => money(x), 'pct', true, walk(key + 'o', 12, ocf.value, 0.07, 0.01)),
    kpi('debt', 'Net debt', debt.value, debt.plan, x => money(x), 'pct', false, walk(key + 'd', 12, debt.value, 0.02, -0.004)),
    kpi('dso', 'Days sales outstanding', dso.value, dso.plan, x => `${x.toFixed(0)} days`, 'abs', false, walk(key + 's', 12, dso.value, 0.03, 0), x => sgn(x, 0, ' d')),
  ]
}

export function opsKpis(units: Unit[], p: PeriodId): Kpi[] {
  const key = units.map(u => u.id).join() + p + 'ops'
  const otd = metric(units, p, 'otd', u => 90 + (u.id.length * 3) % 6, { mode: 'avg', vol: 0.015, pg: 0.012 })
  const sla = metric(units, p, 'sla', u => 98.9 + (u.id.length % 4) * 0.2, { mode: 'avg', vol: 0.003, pg: 0.002 })
  const inc = incidentsFor(units.map(u => u.id))
  const mttr = metric(units, p, 'mttr', u => 3.2 + (u.id.length % 5) * 0.5, { mode: 'avg', vol: 0.12, pg: 0.08 })
  const fill = metric(units, p, 'fill', u => 93 + (u.id.length * 5) % 5, { mode: 'avg', vol: 0.012, pg: 0.01 })
  const util = metric(units, p, 'util', u => 74 + (u.id.length * 11) % 13, { mode: 'avg', vol: 0.04, pg: 0.04 })
  return [
    kpi('otd', 'Delivery on time', otd.value, otd.plan, x => pct(x), 'pts', true, walk(key + 'a', 12, otd.value, 0.01, 0.001)),
    kpi('sla', 'SLA attainment', sla.value, sla.plan, x => pct(x, 2), 'pts', true, walk(key + 'b', 12, sla.value, 0.002, 0)),
    kpi('inc', 'Open incidents', inc.length, Math.max(2, Math.round(inc.length * 0.8)), x => String(x), 'abs', false, walk(key + 'c', 12, inc.length, 0.2, 0), x => sgn(x, 0)),
    kpi('mttr', 'Mean time to resolve', mttr.value, mttr.plan, x => `${x.toFixed(1)} h`, 'pct', false, walk(key + 'd', 12, mttr.value, 0.1, 0)),
    kpi('fill', 'Supply fill rate', fill.value, fill.plan, x => pct(x), 'pts', true, walk(key + 'e', 12, fill.value, 0.012, 0.001)),
    kpi('util', 'Capacity utilisation', util.value, util.plan, x => pct(x, 0), 'pts', true, walk(key + 'f', 12, util.value, 0.03, 0.002)),
  ]
}

export function peopleKpis(units: Unit[], p: PeriodId): Kpi[] {
  const key = units.map(u => u.id).join() + p + 'ppl'
  const h = people(units, p)
  const roles = rolesFor(units.map(u => u.id))
  const tth = metric(units, p, 'tth', u => 41 + (u.id.length * 5) % 9, { mode: 'avg', vol: 0.06, pg: 0.06 })
  const eng = metric(units, p, 'eng', u => 72 + (u.id.length * 3) % 9, { mode: 'avg', vol: 0.03, pg: 0.03 })
  const acc = metric(units, p, 'acc', u => 84 + (u.id.length * 7) % 8, { mode: 'avg', vol: 0.02, pg: 0.02 })
  return [
    kpi('hc', 'Headcount', h.hc[h.hc.length - 1], h.plan, int, 'pct', true, h.hc),
    kpi('attr', 'Attrition, annualised', h.attr[h.attr.length - 1], h.attrPlan, x => pct(x), 'pts', false, h.attr),
    kpi('roles', 'Open roles', roles.length * 6, roles.length * 6 + 8, x => String(x), 'abs', false, walk(key + 'r', 12, roles.length * 6, 0.07, 0.0), x => sgn(x, 0)),
    kpi('tth', 'Time to hire', tth.value, tth.plan, x => `${x.toFixed(0)} days`, 'pct', false, walk(key + 't', 12, tth.value, 0.04, 0)),
    kpi('eng', 'Engagement', eng.value, eng.plan, x => x.toFixed(0), 'abs', true, walk(key + 'e', 12, eng.value, 0.02, 0.002), x => sgn(x, 0)),
    kpi('acc', 'Offer acceptance', acc.value, acc.plan, x => pct(x, 0), 'pts', true, walk(key + 'a', 12, acc.value, 0.015, 0.0)),
  ]
}

/* ---------------------------------------------------------------- people series */
export function people(units: Unit[], p: PeriodId) {
  const n = p === 'quarter' ? 6 : p === 'ytd' ? 10 : 12
  const end = 9 // October
  const labels = Array.from({ length: n }, (_, i) => MON[(end - (n - 1 - i) + 12) % 12])
  const hc = new Array(n).fill(0), attrW = new Array(n).fill(0)
  let plan = 0, attrPlanW = 0, w = 0
  for (const u of units) {
    const w1 = walk(u.id + 'hc' + p, n, u.hc * (1 + 0.02 * j(u.id + 'hcend')), 0.004, 0.003)
    const r = rng(u.id + 'attr' + p)
    const base = 8 + (u.id.length * 3) % 7
    w1.forEach((x, i) => { hc[i] += x; attrW[i] += (base + (r() * 2 - 1) * 2.2) * u.hc })
    plan += w1[n - 1] * (1.012 + 0.025 * j(u.id + 'hcplan' + p))
    attrPlanW += (base - 0.6) * u.hc
    w += u.hc
  }
  const attr = attrW.map(x => x / w)
  return { labels, hc, attr, plan, attrPlan: attrPlanW / w }
}

/* ---------------------------------------------------------------- regions, unit rows */
export function regionRows(units: Unit[], p: PeriodId) {
  const out = REGIONS.map(name => ({ name, act: 0, plan: 0 }))
  for (const u of units) {
    const t = revTotals([u], p)
    const raw = u.regions.map((w, i) => w * (1 + 0.05 * j(u.id + 'rg' + i + p)))
    const raws = sum(raw)
    const rawP = u.regions.map((w, i) => w * (1 + 0.025 * j(u.id + 'rgp' + i)))
    const rawPs = sum(rawP)
    out.forEach((r, i) => { r.act += (t.act * raw[i]) / raws; r.plan += (t.plan * rawP[i]) / rawPs })
  }
  return out
}

export function unitRows(units: Unit[], p: PeriodId) {
  return units.map(u => {
    const t = revTotals([u], p)
    const m = metric([u], p, 'margin', x => x.margin * 100, { mode: 'avg', vol: 0.05, pg: 0.04 })
    return { id: u.id, name: u.name, act: t.act, plan: t.plan, varAbs: t.act - t.plan, varPct: ((t.act - t.plan) / t.plan) * 100, margin: m.value }
  })
}

/* ---------------------------------------------------------------- finance extras */
export function pnl(units: Unit[], p: PeriodId) {
  const rev = revTotals(units, p)
  const gm = metric(units, p, 'gm', u => u.gm * 100, { mode: 'avg', vol: 0.03, pg: 0.03 })
  const eb = metric(units, p, 'margin', u => u.margin * 100, { mode: 'avg', vol: 0.05, pg: 0.04 })
  const da = metric(units, p, 'da', u => 4 + (u.id.length % 3), { mode: 'avg', vol: 0.03, pg: 0.02 })
  const ga = (r: number, g: number) => r * (g / 100)
  const rows = [
    { label: 'Revenue', act: rev.act, plan: rev.plan, cost: false, strong: true },
    { label: 'Cost of sales', act: rev.act - ga(rev.act, gm.value), plan: rev.plan - ga(rev.plan, gm.plan), cost: true, strong: false },
    { label: 'Gross profit', act: ga(rev.act, gm.value), plan: ga(rev.plan, gm.plan), cost: false, strong: true },
    { label: 'Operating expenses', act: ga(rev.act, gm.value) - ga(rev.act, eb.value), plan: ga(rev.plan, gm.plan) - ga(rev.plan, eb.plan), cost: true, strong: false },
    { label: 'EBITDA', act: ga(rev.act, eb.value), plan: ga(rev.plan, eb.plan), cost: false, strong: true },
    { label: 'Depreciation and amortisation', act: ga(rev.act, da.value), plan: ga(rev.plan, da.plan), cost: true, strong: false },
    { label: 'Operating profit', act: ga(rev.act, eb.value - da.value), plan: ga(rev.plan, eb.plan - da.plan), cost: false, strong: true },
  ]
  return rows
}

export function costMix(units: Unit[], p: PeriodId) {
  const rev = revTotals(units, p)
  const gm = metric(units, p, 'gm', u => u.gm * 100, { mode: 'avg', vol: 0.03, pg: 0.03 })
  const eb = metric(units, p, 'margin', u => u.margin * 100, { mode: 'avg', vol: 0.05, pg: 0.04 })
  const cost = rev.act * (1 - eb.value / 100)
  const shares: [string, number][] = [['Materials and energy', 0.33], ['Personnel', 0.31], ['Logistics', 0.15], ['Technology', 0.09], ['Facilities', 0.07], ['Marketing', 0.05]]
  void gm
  return shares.map(([name, s]) => ({ name, act: cost * s * (1 + 0.04 * j(name + p + units.length)), plan: cost * s * (1 + 0.03 * j(name + 'plan')) }))
}

export function cashFlow(units: Unit[], p: PeriodId) {
  const s = revSeries(units, p)
  const ebm = metric(units, p, 'margin', u => u.margin * 100, { mode: 'avg', vol: 0.05, pg: 0.04 }).value / 100
  const r = rng(units.map(u => u.id).join() + p + 'cf')
  return s.actual.map((v, i) => ({ label: s.labels[i], full: s.full[i], v: v * (ebm * 0.8 - 0.06 + (r() * 2 - 1) * 0.11) }))
}

export function ageing(units: Unit[], p: PeriodId) {
  const rev = revTotals(units, p).act
  const ar = rev * 0.11
  const sh = [0.58, 0.22, 0.11, 0.06, 0.03]
  return ['Current', '1 to 30 days', '31 to 60 days', '61 to 90 days', 'Over 90 days'].map((name, i) => ({ name, act: ar * sh[i] * (1 + 0.04 * j(name + p + units.length)) }))
}

/* ---------------------------------------------------------------- operations */
export type Incident = { id: string; title: string; unit: string; sev: 1 | 2 | 3; age: string; owner: string }
export const INCIDENTS: Incident[] = [
  { id: 'INC-4412', title: 'Pipeline telemetry gap, Permian cluster', unit: 'energy', sev: 1, age: '3h', owner: 'Dara Okafor' },
  { id: 'INC-4409', title: 'Port of Rotterdam customs system outage', unit: 'logistics', sev: 1, age: '5h', owner: 'Mats Lindqvist' },
  { id: 'INC-4398', title: 'Claims platform latency above threshold', unit: 'health', sev: 2, age: '1d', owner: 'Priya Raman' },
  { id: 'INC-4391', title: 'Cold chain sensor drift, Lyon hub', unit: 'logistics', sev: 2, age: '1d', owner: 'Camille Ferrand' },
  { id: 'INC-4387', title: 'Payment gateway retries in Brazil', unit: 'retail', sev: 2, age: '2d', owner: 'Tiago Moreira' },
  { id: 'INC-4380', title: 'API error rate on Atlas data platform', unit: 'digital', sev: 2, age: '2d', owner: 'Hannah Voss' },
  { id: 'INC-4366', title: 'Substation firmware rollout paused', unit: 'energy', sev: 3, age: '4d', owner: 'Samir Haddad' },
  { id: 'INC-4361', title: 'Label printer fleet offline, Osaka DC', unit: 'logistics', sev: 3, age: '4d', owner: 'Keiko Tanabe' },
  { id: 'INC-4350', title: 'Loyalty app crash on Android 15', unit: 'retail', sev: 3, age: '6d', owner: 'Jonas Weber' },
  { id: 'INC-4344', title: 'Patient portal SSO misconfiguration', unit: 'health', sev: 3, age: '6d', owner: 'Elena Costa' },
  { id: 'INC-4339', title: 'Build pipeline queue backlog', unit: 'digital', sev: 3, age: '7d', owner: 'Owen Mercer' },
]
export const incidentsFor = (ids: string[]) => INCIDENTS.filter(i => !ids.length || ids.includes(i.unit))

export type Lane = { id: string; name: string; unit: string; status: 'On track' | 'At risk' | 'Delayed'; fill: number; note: string }
export const LANES: Lane[] = [
  { id: 'l1', name: 'Rotterdam to Chicago, containers', unit: 'logistics', status: 'Delayed', fill: 88.4, note: 'Customs hold, ETA +2d' },
  { id: 'l2', name: 'Shenzhen to Los Angeles, electronics', unit: 'retail', status: 'At risk', fill: 91.2, note: 'Port congestion' },
  { id: 'l3', name: 'Singapore to Hamburg, chemicals', unit: 'energy', status: 'On track', fill: 97.1, note: 'On schedule' },
  { id: 'l4', name: 'Lyon cold chain, pharma', unit: 'health', status: 'At risk', fill: 93.5, note: 'Sensor recalibration' },
  { id: 'l5', name: 'Monterrey to Dallas, components', unit: 'logistics', status: 'On track', fill: 96.3, note: 'On schedule' },
  { id: 'l6', name: 'Mumbai to Dubai, equipment', unit: 'digital', status: 'On track', fill: 98.0, note: 'On schedule' },
]
export const lanesFor = (ids: string[]) => LANES.filter(l => !ids.length || ids.includes(l.unit))

export const SITES = [
  { name: 'Rotterdam terminal', unit: 'logistics', v: 91 }, { name: 'Houston refinery', unit: 'energy', v: 86 }, { name: 'Osaka distribution centre', unit: 'logistics', v: 82 },
  { name: 'Lyon pharma hub', unit: 'health', v: 79 }, { name: 'Dublin data centre', unit: 'digital', v: 74 }, { name: 'Leeds fulfilment', unit: 'retail', v: 68 },
  { name: 'Tampa clinics network', unit: 'health', v: 66 },
]
export const sitesFor = (ids: string[], p: PeriodId) => SITES.filter(s => !ids.length || ids.includes(s.unit)).map(s => ({ ...s, v: Math.max(40, Math.min(98, s.v + 3 * j(s.name + p))) }))

export function otdSeries(units: Unit[], p: PeriodId): Series {
  const base = metric(units, p, 'otd', u => 90 + (u.id.length * 3) % 6, { mode: 'avg', vol: 0.015, pg: 0.012 }).value
  const n = p === 'quarter' ? 13 : 12
  const nA = p === 'quarter' ? 4 : p === 'ytd' ? 10 : 12
  const act = walk(units.map(u => u.id).join() + p + 'otdw', nA, base, 0.008, 0.0005).map(x => Math.min(99.4, x))
  const labels = p === 'quarter' ? points(p).map(x => x.label) : p === 'ytd' ? MON.slice(0) : points(p).slice(0, 12).map(x => x.label)
  const full = p === 'quarter' ? points(p).map(x => x.full) : p === 'ytd' ? MON.map(m => `${m} 2026`) : points(p).slice(0, 12).map(x => x.full)
  const target = Array.from({ length: n }, () => 94)
  return { labels, full, actual: act, plan: target, fc: new Array(n).fill(null), lo: new Array(n).fill(null), hi: new Array(n).fill(null), nA: act.length }
}

/* ---------------------------------------------------------------- people lists */
export type Role = { id: string; title: string; unit: string; location: string; days: number; candidates: number }
export const ROLES: Role[] = [
  { id: 'r1', title: 'Senior reservoir engineer', unit: 'energy', location: 'Houston', days: 62, candidates: 14 },
  { id: 'r2', title: 'Grid operations lead', unit: 'energy', location: 'Aberdeen', days: 38, candidates: 9 },
  { id: 'r3', title: 'Regional fleet director', unit: 'logistics', location: 'Rotterdam', days: 71, candidates: 6 },
  { id: 'r4', title: 'Warehouse automation manager', unit: 'logistics', location: 'Osaka', days: 29, candidates: 11 },
  { id: 'r5', title: 'Clinical data scientist', unit: 'health', location: 'Boston', days: 54, candidates: 17 },
  { id: 'r6', title: 'Head of payer partnerships', unit: 'health', location: 'Chicago', days: 45, candidates: 8 },
  { id: 'r7', title: 'Staff platform engineer', unit: 'digital', location: 'Dublin', days: 33, candidates: 26 },
  { id: 'r8', title: 'Principal product designer', unit: 'digital', location: 'Remote, Europe', days: 21, candidates: 31 },
  { id: 'r9', title: 'Category director, home', unit: 'retail', location: 'Leeds', days: 58, candidates: 5 },
]
export const rolesFor = (ids: string[]) => ROLES.filter(r => !ids.length || ids.includes(r.unit))

export function funnel(units: Unit[], p: PeriodId) {
  const k = sum(units.map(u => u.hc)) / 22000
  const f = PERIODS.find(x => x.value === p)!.f
  const applied = 9200 * k * f * (1 + 0.04 * j(p + 'fa'))
  return [['Applied', 1], ['Screened', 0.34], ['Interviewed', 0.13], ['Offered', 0.032], ['Hired', 0.027]].map(([name, s]) => ({ name: name as string, act: Math.round(applied * (s as number)) }))
}

/* ---------------------------------------------------------------- decisions and activity */
export type Decision = { id: string; title: string; detail: string; unit: string; amount: string; by: string; due: string }
export const DECISIONS: Decision[] = [
  { id: 'd1', title: 'Rotterdam terminal expansion, phase 2', detail: 'Adds 38% container throughput; payback 5.4 years.', unit: 'logistics', amount: '$48M capex', by: 'Mats Lindqvist', due: 'Due Fri' },
  { id: 'd2', title: 'Acquire Northwind Diagnostics', detail: 'Cleared legal review. 14 clinics across the Midwest.', unit: 'health', amount: '$212M', by: 'Elena Costa', due: 'Due Mon' },
  { id: 'd3', title: 'Renew Permian midstream contract', detail: 'Seven-year term, indexed to Henry Hub with a floor.', unit: 'energy', amount: '$74M per year', by: 'Dara Okafor', due: 'Due Wed' },
  { id: 'd4', title: 'Open 22 engineering roles in Dublin', detail: 'Funded from the Atlas platform plan reserve.', unit: 'digital', amount: '$5.1M per year', by: 'Hannah Voss', due: 'Due Fri' },
  { id: 'd5', title: 'Close three underperforming Leeds stores', detail: 'Margin under 2% for six quarters. 118 roles affected.', unit: 'retail', amount: '$9.4M charge', by: 'Jonas Weber', due: 'Due Nov 5' },
  { id: 'd6', title: 'Switch fuel hedging to quarterly cadence', detail: 'Reduces mark-to-market volatility in reported EBITDA.', unit: 'logistics', amount: 'No spend', by: 'Priya Raman', due: 'Due Nov 9' },
]
export const decisionsFor = (all: Decision[], ids: string[]) => all.filter(d => !ids.length || ids.includes(d.unit))

export type Activity = { id: string; who: string; what: string; target: string; unit: string; when: string }
export const ACTIVITY: Activity[] = [
  { id: 'a1', who: 'Dara Okafor', what: 'escalated', target: 'INC-4412 to severity 1', unit: 'energy', when: '12 min ago' },
  { id: 'a2', who: 'Elena Costa', what: 'submitted', target: 'Northwind Diagnostics for approval', unit: 'health', when: '48 min ago' },
  { id: 'a3', who: 'Finance', what: 'closed', target: 'September books for Halcyon Retail', unit: 'retail', when: '2 h ago' },
  { id: 'a4', who: 'Hannah Voss', what: 'published', target: 'Atlas platform Q4 forecast', unit: 'digital', when: '3 h ago' },
  { id: 'a5', who: 'Mats Lindqvist', what: 'requested', target: 'Rotterdam terminal phase 2 funding', unit: 'logistics', when: '5 h ago' },
  { id: 'a6', who: 'Priya Raman', what: 'resolved', target: 'INC-4398 claims latency', unit: 'health', when: 'Yesterday' },
  { id: 'a7', who: 'Jonas Weber', what: 'updated', target: 'Leeds store review deck', unit: 'retail', when: 'Yesterday' },
  { id: 'a8', who: 'Samir Haddad', what: 'completed', target: 'substation firmware wave 2', unit: 'energy', when: 'Yesterday' },
  { id: 'a9', who: 'Keiko Tanabe', what: 'opened', target: 'INC-4361 label printers offline', unit: 'logistics', when: '2 days ago' },
  { id: 'a10', who: 'Owen Mercer', what: 'merged', target: 'build pipeline capacity change', unit: 'digital', when: '2 days ago' },
]
export const activityFor = (ids: string[]) => ACTIVITY.filter(a => !ids.length || ids.includes(a.unit))
