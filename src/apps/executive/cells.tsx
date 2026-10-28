import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Icon } from '../../ui'
import { Sparkline } from './charts'
import { UNITS, rolesFor, sgn, type Activity, type Decision, type Incident, type Kpi, type Lane } from './data'

export type Span = { c: number; m?: number; s?: number }
const spanStyle = ({ c, m, s }: Span) => ({ '--c': c, '--m': m ?? c, '--s': s ?? 12 }) as CSSProperties

export function Card({ title, span, actions, children, className = '', id }: { title: string; span: Span; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={`ex-card ${className}`} style={spanStyle(span)} aria-labelledby={id}>
      <header className="ex-card-h">
        <h2 id={id} className="ex-card-t">{title}</h2>
        {actions && <div className="ex-card-a">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

export function Legend({ items }: { items: { label: string; kind: 'line' | 'dash' | 'band' | 'bar' | 'tick' }[] }) {
  return (
    <div className="ex-legend">
      {items.map(i => (
        <span key={i.label} className="row" style={{ gap: 6 }}>
          <svg width="16" height="8" aria-hidden="true">
            {i.kind === 'line' && <line x1="0" x2="16" y1="4" y2="4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />}
            {i.kind === 'dash' && <line x1="0" x2="16" y1="4" y2="4" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="3 3" />}
            {i.kind === 'band' && <rect width="16" height="8" rx="2" fill="var(--accent)" opacity="0.25" />}
            {i.kind === 'tick' && <rect x="7" width="2" height="8" rx="1" fill="var(--text)" />}
            {i.kind === 'bar' && <rect width="16" height="8" rx="2" fill="var(--accent)" />}
          </svg>
          {i.label}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ KPI band */
export function KpiBand({ items }: { items: Kpi[] }) {
  return (
    <>
      {items.map(k => (
        <div key={k.id} className="ex-card ex-kpi" style={spanStyle({ c: 2, m: 4, s: 6 })} role="group" aria-label={k.label}>
          <div className="ex-kpi-l">{k.label}</div>
          <div className="ex-kpi-v num">{k.value}</div>
          <div className="ex-kpi-f">
            <span className={`ex-delta ${k.tone}`}>
              <Icon name={k.delta === 0 || k.tone === 'flat' ? 'minus' : k.delta > 0 ? 'arrow-up' : 'arrow-down'} size={13} strokeWidth={2.2} />
              <span className="num">{k.deltaLabel}</span>
              <span className="ex-delta-s">vs plan</span>
            </span>
            <span className={`ex-spark-w ${k.tone}`}><Sparkline data={k.spark} /></span>
          </div>
        </div>
      ))}
    </>
  )
}

export function Delta({ v, good, d = 1, suffix = '%' }: { v: number; good: boolean; d?: number; suffix?: string }) {
  const flat = Math.abs(v) < 0.05
  return (
    <span className={`ex-dtxt num ${flat ? 'flat' : good ? 'up' : 'down'}`}>
      <Icon name={flat ? 'minus' : v > 0 ? 'arrow-up' : 'arrow-down'} size={11} strokeWidth={2.4} />
      {flat ? `${(0).toFixed(d)}${suffix}` : sgn(v, d, suffix)}
    </span>
  )
}

/* ------------------------------------------------------------------ Sortable table */
export type Col<T> = { key: string; label: string; align?: 'left' | 'right'; get: (r: T) => number | string; render: (r: T) => ReactNode; hideSmall?: boolean }
export function SortTable<T extends { id?: string; label?: string }>({ cols, rows, initial, foot, rowKey, label }: { cols: Col<T>[]; rows: T[]; initial: string; foot?: ReactNode; rowKey: (r: T) => string; label: string }) {
  const [sort, setSort] = useState({ key: initial, dir: -1 as 1 | -1 })
  const sorted = useMemo(() => {
    const c = cols.find(x => x.key === sort.key)
    if (!c) return rows
    return [...rows].sort((a, b) => {
      const x = c.get(a), y = c.get(b)
      return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * sort.dir
    })
  }, [rows, sort, cols])
  return (
    <div className="ex-table-w scroll">
      <table className="ex-table" aria-label={label}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} scope="col" className={`${c.align === 'right' ? 'r' : ''} ${c.hideSmall ? 'hs' : ''}`} aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`ex-th ${sort.key === c.key ? 'on' : ''}`} onClick={() => setSort(s => ({ key: c.key, dir: s.key === c.key ? (-s.dir as 1 | -1) : c.align === 'right' ? -1 : 1 }))}>
                  {c.label}
                  <Icon name={sort.key === c.key ? (sort.dir === 1 ? 'chevron-up' : 'chevron-down') : 'sort'} size={12} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={rowKey(r)}>
              {cols.map(c => <td key={c.key} className={`${c.align === 'right' ? 'r num' : ''} ${c.hideSmall ? 'hs' : ''}`}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
        {foot && <tfoot>{foot}</tfoot>}
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ Operations status */
const SEV_NAME = { 1: 'Severity 1', 2: 'Severity 2', 3: 'Severity 3' } as const
export function IncidentList({ items, max }: { items: Incident[]; max?: [number, number, number] }) {
  if (!items.length) return <EmptyState icon="circle-check" title="No open incidents" sub="Nothing is open for the selected business units." />
  return (
    <div className="ex-inc">
      {([1, 2, 3] as const).map(sev => {
        const list = items.filter(i => i.sev === sev)
        if (!list.length) return null
        const shown = max ? list.slice(0, max[sev - 1]) : list
        return (
          <div key={sev} className="ex-inc-g">
            <div className="ex-inc-h"><span className={`ex-sev s${sev}`} aria-hidden="true" />{SEV_NAME[sev]}<span className="faint num">{list.length}</span></div>
            <ul role="list">
              {shown.map(i => (
                <li key={i.id} className="ex-inc-r">
                  <span className="truncate">{i.title}</span>
                  <span className="faint num ex-inc-m">{UNITS.find(u => u.id === i.unit)!.short}, {i.age}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function StatTiles({ items }: { items: Kpi[] }) {
  return (
    <div className="ex-stats">
      {items.map(k => (
        <div key={k.id} className="ex-stat">
          <span className="ex-kpi-l">{k.label}</span>
          <span className="ex-stat-v num">{k.value}</span>
          <span className={`ex-delta ${k.tone}`}>
            <Icon name={k.tone === 'flat' ? 'minus' : k.delta > 0 ? 'arrow-up' : 'arrow-down'} size={12} strokeWidth={2.2} />
            <span className="num">{k.deltaLabel}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function LaneList({ lanes }: { lanes: Lane[] }) {
  if (!lanes.length) return <EmptyState icon="layers" title="No lanes to show" sub="No supply lanes for the selected units." />
  return (
    <ul role="list" className="ex-lanes">
      {lanes.map(l => (
        <li key={l.id} className="ex-lane">
          <span className={`ex-st ${l.status === 'Delayed' ? 'bad' : l.status === 'At risk' ? 'warn' : 'ok'}`}>
            <Icon name={l.status === 'On track' ? 'circle-check' : l.status === 'At risk' ? 'info' : 'circle-x'} size={14} />
            <span>{l.status}</span>
          </span>
          <span className="truncate">{l.name}</span>
          <span className="faint truncate ex-lane-n">{l.note}</span>
          <span className="num ex-lane-f">{l.fill.toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ Decisions */
export function DecisionList({ items, onAct }: { items: Decision[]; onAct: (d: Decision, kind: 'approve' | 'defer') => void }) {
  if (!items.length) return <EmptyState icon="circle-check" title="All caught up" sub="No decisions are waiting for you." />
  return (
    <ul role="list" className="ex-dec">
      {items.map(d => (
        <li key={d.id} className="ex-dec-r">
          <div className="ex-dec-b">
            <div className="ex-dec-t">{d.title}</div>
            <div className="ex-dec-d truncate">{d.detail}</div>
            <div className="ex-dec-m faint">{UNITS.find(u => u.id === d.unit)!.short}, {d.amount}, {d.by}, {d.due}</div>
          </div>
          <div className="ex-dec-a">
            <Button variant="ghost" onClick={() => onAct(d, 'defer')} aria-label={`Defer ${d.title}`}>Defer</Button>
            <Button variant="secondary" icon="check" onClick={() => onAct(d, 'approve')} aria-label={`Approve ${d.title}`}>Approve</Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ActivityFeed({ items }: { items: Activity[] }) {
  if (!items.length) return <EmptyState icon="clock" title="No recent activity" sub="Nothing has happened in the selected units." />
  return (
    <div className="ex-feed-w"><ul role="list" className="ex-feed scroll">
      {items.map(a => (
        <li key={a.id} className="ex-feed-r">
          <div className="grow">
            <div className="ex-feed-t"><b>{a.who}</b> {a.what} {a.target}</div>
            <div className="faint ex-feed-w2">{a.when}</div>
          </div>
        </li>
      ))}
    </ul></div>
  )
}

export function EmptyState({ icon, title, sub }: { icon: 'circle-check' | 'clock' | 'layers'; title: string; sub: string }) {
  return (
    <div className="ex-empty">
      <Icon name={icon} size={22} />
      <div className="ex-empty-t">{title}</div>
      <div className="faint">{sub}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ Open roles */
export function RolesTable({ ids }: { ids: string[] }) {
  const rows = rolesFor(ids)
  return (
    <SortTable
      label="Open roles" initial="days" rows={rows} rowKey={r => r.id}
      cols={[
        { key: 'title', label: 'Role', get: r => r.title, render: r => <span className="truncate">{r.title}</span> },
        { key: 'unit', label: 'Unit', get: r => r.unit, render: r => <span className="muted">{UNITS.find(u => u.id === r.unit)!.short}</span>, hideSmall: true },
        { key: 'loc', label: 'Location', get: r => r.location, render: r => <span className="muted">{r.location}</span>, hideSmall: true },
        { key: 'days', label: 'Days open', align: 'right', get: r => r.days, render: r => r.days },
        { key: 'cand', label: 'Candidates', align: 'right', get: r => r.candidates, render: r => r.candidates },
      ]}
    />
  )
}

