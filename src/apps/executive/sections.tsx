import { useMemo } from 'react'
import { ActivityFeed, Card, Delta, DecisionList, IncidentList, KpiBand, LaneList, Legend, RolesTable, SortTable, StatTiles, type Col } from './cells'
import { ColumnChart, HBars, HeadcountChart, TrendChart } from './charts'
import {
  activityFor, ageing, cashFlow, costMix, financeKpis, funnel, incidentsFor, int, lanesFor, money, opsKpis, otdSeries, overviewKpis, people, peopleKpis, pct, pnl,
  regionRows, revSeries, sitesFor, unitRows, metric, type Decision, type PeriodId, type Unit,
} from './data'

export type Ctx = { units: Unit[]; ids: string[]; period: PeriodId; decisions: Decision[]; onAct: (d: Decision, kind: 'approve' | 'defer') => void }

const revFmt = (v: number) => money(v)
const revAxis = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`)

function RevenueCard({ c, span }: { c: Ctx; span: { c: number; m?: number; s?: number } }) {
  const s = useMemo(() => revSeries(c.units, c.period), [c.units, c.period])
  return (
    <Card title="Revenue vs plan" id="c-rev" span={span} actions={<Legend items={[{ label: 'Actual', kind: 'line' }, { label: 'Plan', kind: 'dash' }, { label: 'Forecast range', kind: 'band' }]} />}>
      <div className="ex-fill ex-h-chart"><TrendChart s={s} fmt={revFmt} axis={revAxis} label="Revenue against plan with forecast range" /></div>
    </Card>
  )
}

function RegionCard({ c, span }: { c: Ctx; span: { c: number; m?: number; s?: number } }) {
  const rows = useMemo(() => regionRows(c.units, c.period).sort((a, b) => b.act - a.act), [c.units, c.period])
  return (
    <Card title="Regional performance" id="c-reg" span={span} actions={<Legend items={[{ label: 'Actual', kind: 'bar' }, { label: 'Plan', kind: 'tick' }]} />}>
      <HBars rows={rows} fmt={revFmt} />
    </Card>
  )
}

function UnitTable({ c, span }: { c: Ctx; span: { c: number; m?: number; s?: number } }) {
  const rows = useMemo(() => unitRows(c.units, c.period), [c.units, c.period])
  const tot = useMemo(() => {
    const act = rows.reduce((s, r) => s + r.act, 0), plan = rows.reduce((s, r) => s + r.plan, 0)
    const m = rows.reduce((s, r) => s + r.margin * r.act, 0) / act
    return { act, plan, v: act - plan, p: ((act - plan) / plan) * 100, m }
  }, [rows])
  type R = (typeof rows)[number]
  const cols: Col<R>[] = [
    { key: 'name', label: 'Business unit', get: r => r.name, render: r => <span className="truncate">{r.name}</span> },
    { key: 'act', label: 'Revenue', align: 'right', get: r => r.act, render: r => money(r.act) },
    { key: 'plan', label: 'Plan', align: 'right', get: r => r.plan, render: r => <span className="muted">{money(r.plan)}</span>, hideSmall: true },
    { key: 'va', label: 'Variance', align: 'right', get: r => r.varAbs, render: r => <span className={r.varAbs >= 0 ? 'ex-up' : 'ex-down'}>{r.varAbs >= 0 ? '+' : '−'}{money(Math.abs(r.varAbs))}</span>, hideSmall: true },
    { key: 'vp', label: 'Var %', align: 'right', get: r => r.varPct, render: r => <Delta v={r.varPct} good={r.varPct >= 0} /> },
    { key: 'm', label: 'EBITDA margin', align: 'right', get: r => r.margin, render: r => pct(r.margin) },
  ]
  return (
    <Card title="Business units vs plan" id="c-bu" span={span}>
      <SortTable label="Business units versus plan" cols={cols} rows={rows} initial="act" rowKey={r => r.id}
        foot={rows.length > 1 ? (
          <tr>
            <td>Group</td><td className="r num">{money(tot.act)}</td><td className="r num hs muted">{money(tot.plan)}</td>
            <td className={`r num hs ${tot.v >= 0 ? 'ex-up' : 'ex-down'}`}>{tot.v >= 0 ? '+' : '−'}{money(Math.abs(tot.v))}</td>
            <td className="r num"><Delta v={tot.p} good={tot.p >= 0} /></td><td className="r num">{pct(tot.m)}</td>
          </tr>
        ) : undefined} />
    </Card>
  )
}

function OpsCard({ c, span }: { c: Ctx; span: { c: number; m?: number; s?: number } }) {
  const k = useMemo(() => opsKpis(c.units, c.period), [c.units, c.period])
  const inc = incidentsFor(c.ids)
  return (
    <Card title="Operations status" id="c-ops" span={span}>
      <StatTiles items={[k[0], k[1], k[4]]} />
      <div className="ex-sub">Open incidents</div>
      <IncidentList items={inc} max={[2, 2, 1]} />
    </Card>
  )
}

function HeadcountCard({ c, span }: { c: Ctx; span: { c: number; m?: number; s?: number } }) {
  const h = useMemo(() => people(c.units, c.period), [c.units, c.period])
  return (
    <Card title="Headcount and attrition" id="c-hc" span={span} actions={<Legend items={[{ label: 'Headcount', kind: 'line' }, { label: 'Attrition', kind: 'bar' }]} />}>
      <div className="ex-fill ex-h-chart"><HeadcountChart labels={h.labels} hc={h.hc} attr={h.attr} label="Headcount line with monthly attrition columns" /></div>
    </Card>
  )
}

/* ------------------------------------------------------------------ sections */
export function Overview({ c }: { c: Ctx }) {
  const kpis = useMemo(() => overviewKpis(c.units, c.period), [c.units, c.period])
  const mine = c.decisions.filter(d => !c.ids.length || c.ids.includes(d.unit))
  return (
    <>
      <KpiBand items={kpis} />
      <RevenueCard c={c} span={{ c: 8, m: 12 }} />
      <RegionCard c={c} span={{ c: 4, m: 12 }} />
      <UnitTable c={c} span={{ c: 7, m: 12 }} />
      <OpsCard c={c} span={{ c: 5, m: 12 }} />
      <Card title={`Needs your decision${mine.length ? ` (${mine.length})` : ''}`} id="c-dec" span={{ c: 5, m: 12 }}>
        <DecisionList items={mine} onAct={c.onAct} />
      </Card>
      <HeadcountCard c={c} span={{ c: 4, m: 7 }} />
      <Card title="Recent activity" id="c-act" span={{ c: 3, m: 5 }} className="ex-card-feed">
        <ActivityFeed items={activityFor(c.ids)} />
      </Card>
    </>
  )
}

export function Finance({ c }: { c: Ctx }) {
  const kpis = useMemo(() => financeKpis(c.units, c.period), [c.units, c.period])
  const rows = useMemo(() => pnl(c.units, c.period), [c.units, c.period])
  const mix = useMemo(() => costMix(c.units, c.period), [c.units, c.period])
  const cf = useMemo(() => cashFlow(c.units, c.period), [c.units, c.period])
  const ag = useMemo(() => ageing(c.units, c.period), [c.units, c.period])
  type R = (typeof rows)[number]
  const cols: Col<R>[] = [
    { key: 'l', label: 'Line', get: r => r.label, render: r => <span className={r.strong ? 'ex-strong' : 'muted'}>{r.label}</span> },
    { key: 'a', label: 'Actual', align: 'right', get: r => r.act, render: r => money(r.act) },
    { key: 'p', label: 'Plan', align: 'right', get: r => r.plan, render: r => <span className="muted">{money(r.plan)}</span>, hideSmall: true },
    { key: 'v', label: 'Variance', align: 'right', get: r => r.act - r.plan, render: r => { const v = r.act - r.plan, good = r.cost ? v <= 0 : v >= 0; return <span className={good ? 'ex-up' : 'ex-down'}>{v >= 0 ? '+' : '−'}{money(Math.abs(v))}</span> }, hideSmall: true },
    { key: 'vp', label: 'Var %', align: 'right', get: r => ((r.act - r.plan) / r.plan) * 100, render: r => { const v = ((r.act - r.plan) / r.plan) * 100; return <Delta v={v} good={r.cost ? v <= 0 : v >= 0} /> } },
  ]
  return (
    <>
      <KpiBand items={kpis} />
      <RevenueCard c={c} span={{ c: 8, m: 12 }} />
      <Card title="Cost structure" id="c-cost" span={{ c: 4, m: 12 }} actions={<Legend items={[{ label: 'Actual', kind: 'bar' }, { label: 'Plan', kind: 'tick' }]} />}>
        <HBars rows={mix} fmt={revFmt} costs />
      </Card>
      <Card title="Profit and loss" id="c-pnl" span={{ c: 7, m: 12 }}>
        <SortTable label="Profit and loss" cols={cols} rows={rows} initial="__none" rowKey={r => r.label} />
      </Card>
      <Card title="Net cash flow" id="c-cf" span={{ c: 5, m: 12 }}>
        <div className="ex-fill ex-h-chart"><ColumnChart data={cf} fmt={revFmt} axis={revAxis} label="Net cash flow by period" /></div>
      </Card>
      <Card title="Receivables ageing" id="c-ar" span={{ c: 6, m: 12 }}>
        <HBars rows={ag} fmt={revFmt} delta={false} />
      </Card>
      <Card title="Cash by business unit" id="c-cash" span={{ c: 6, m: 12 }}>
        <HBars rows={c.units.map(u => { const m = metric([u], c.period, 'cash', x => x.cash, { mode: 'sum', vol: 0.05, pg: 0.06 }); return { name: u.short, act: m.value, plan: m.plan } })} fmt={revFmt} />
      </Card>
    </>
  )
}

export function Operations({ c }: { c: Ctx }) {
  const kpis = useMemo(() => opsKpis(c.units, c.period), [c.units, c.period])
  const s = useMemo(() => otdSeries(c.units, c.period), [c.units, c.period])
  const sites = useMemo(() => sitesFor(c.ids, c.period).sort((a, b) => b.v - a.v), [c.ids, c.period])
  return (
    <>
      <KpiBand items={kpis} />
      <Card title="Delivery on time" id="c-otd" span={{ c: 8, m: 12 }} actions={<Legend items={[{ label: 'Actual', kind: 'line' }, { label: 'Target', kind: 'dash' }]} />}>
        <div className="ex-fill ex-h-chart"><TrendChart s={s} fmt={v => pct(v)} axis={v => `${v.toFixed(0)}%`} names={['Actual', 'Target']} label="Delivery on time against target" /></div>
      </Card>
      <Card title="Capacity by site" id="c-sites" span={{ c: 4, m: 12 }}>
        {sites.length ? <HBars rows={sites.map(x => ({ name: x.name, act: x.v }))} fmt={v => `${v.toFixed(0)}%`} delta={false} /> : null}
      </Card>
      <Card title="Open incidents" id="c-inc" span={{ c: 6, m: 12 }}>
        <IncidentList items={incidentsFor(c.ids)} />
      </Card>
      <Card title="Supply chain lanes" id="c-lanes" span={{ c: 6, m: 12 }}>
        <LaneList lanes={lanesFor(c.ids)} />
      </Card>
    </>
  )
}

export function People({ c }: { c: Ctx }) {
  const kpis = useMemo(() => peopleKpis(c.units, c.period), [c.units, c.period])
  const fn = useMemo(() => funnel(c.units, c.period), [c.units, c.period])
  const byUnit = c.units.map(u => ({ name: u.short, act: people([u], c.period).hc.slice(-1)[0] }))
  return (
    <>
      <KpiBand items={kpis} />
      <HeadcountCard c={c} span={{ c: 8, m: 12 }} />
      <Card title="Headcount by business unit" id="c-hcu" span={{ c: 4, m: 12 }}>
        <HBars rows={byUnit.sort((a, b) => b.act - a.act)} fmt={int} delta={false} />
      </Card>
      <Card title="Open roles" id="c-roles" span={{ c: 7, m: 12 }}>
        <RolesTable ids={c.ids} />
      </Card>
      <Card title="Hiring funnel" id="c-fun" span={{ c: 5, m: 12 }}>
        <HBars rows={fn} fmt={int} delta={false} />
      </Card>
    </>
  )
}
