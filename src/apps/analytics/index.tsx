import './analytics.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppShell, Brand, Button, Dialog, Dropdown, DrawerToggle, Icon, Menu, NavItem, Switch, useAnchored } from '../../ui'
import {
  COUNTRIES, MIN_DAY, NAV, PAGES, TODAY, aggregate, catValue, csvOf, dayFull, dayOfIso, download, isoOf, len, mainBin, prevOf, rangeOf, rangeShort, rangeText,
  series, sparkBin, type Col, type PageId, type PresetId, type Range, type Row,
} from './data'
import { BarChart, HBars, LineChart, Sparkline } from './charts'
import { DataTable } from './Table'

const PRESETS = [
  { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' }, { value: 'custom', label: 'Custom range…', icon: 'calendar' as const },
]

function RangeDialog({ open, onClose, initial, onApply }: { open: boolean; onClose: () => void; initial: Range; onApply: (r: Range) => void }) {
  const [from, setFrom] = useState(isoOf(initial.from)), [to, setTo] = useState(isoOf(initial.to))
  const f = dayOfIso(from), t = dayOfIso(to)
  const bad = !from || !to || Number.isNaN(f) || Number.isNaN(t) ? 'Choose both dates' : f > t ? 'Start date must be on or before the end date' : t > TODAY || f < MIN_DAY ? `Dates must be between ${dayFull(MIN_DAY)} and ${dayFull(TODAY)}` : ''
  const apply = () => { if (!bad) { onApply({ from: f, to: t }); onClose() } }
  return (
    <Dialog open={open} onClose={onClose} title="Custom range" width={380}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!!bad} onClick={apply}>Apply</Button></>}>
      <form className="an-range-form" onSubmit={e => { e.preventDefault(); apply() }}>
        <label><span className="muted">From</span><input className="input" type="date" value={from} min={isoOf(MIN_DAY)} max={isoOf(TODAY)} onChange={e => setFrom(e.target.value)} /></label>
        <label><span className="muted">To</span><input className="input" type="date" value={to} min={isoOf(MIN_DAY)} max={isoOf(TODAY)} onChange={e => setTo(e.target.value)} /></label>
        <p className="an-err" role="alert">{bad}</p>
      </form>
    </Dialog>
  )
}

export default function Analytics() {
  const [page, setPage] = useState<PageId>('overview')
  const [preset, setPreset] = useState<PresetId>('30')
  const [custom, setCustom] = useState<Range>({ from: TODAY - 13, to: TODAY })
  const [dlg, setDlg] = useState(false)
  const [compare, setCompare] = useState(true)
  const [sel, setSel] = useState<Record<string, string>>({})
  const [dimSel, setDimSel] = useState<Record<string, string>>({})
  const exp = useAnchored()
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }) }, [page])
  const viewRef = useRef<{ cols: Col[]; rows: Row[]; name: string } | null>(null)

  const def = PAGES[page]
  const range = useMemo(() => rangeOf(preset, custom), [preset, custom])
  const prev = useMemo(() => prevOf(range), [range])
  const metricId = sel[page] ?? def.metrics[0]?.id
  const metric = def.metrics.find(m => m.id === metricId)

  const kpis = useMemo(() => def.metrics.map(m => {
    const v = aggregate(m, range), p = aggregate(m, prev)
    return { m, v, p, d: ((v - p) / p) * 100, spark: series(m, range, sparkBin(len(range))).map(x => x.v) }
  }), [def, range, prev])

  const main = useMemo(() => {
    if (!metric) return null
    const bin = mainBin(len(range))
    return { cur: series(metric, range, bin), prev: series(metric, prev, bin) }
  }, [metric, range, prev])

  const dim = def.dims.find(d => d.id === dimSel[page]) ?? def.dims[0]
  const bar = useMemo(() => {
    const m = def.metrics.find(x => x.id === def.barMetric)
    if (!m || !dim) return null
    const tc = aggregate(m, range), tp = aggregate(m, prev)
    const key = dim.id.charCodeAt(0) * 13
    return { m, cats: dim.cats.map(c => c[0]), cur: dim.cats.map((c, i) => catValue(m, tc, c[1], dim.cats.length, key + i, range)), prev: dim.cats.map((c, i) => catValue(m, tp, c[1], dim.cats.length, key + i, prev)) }
  }, [def, dim, range, prev])

  const geo = useMemo(() => {
    const m = def.metrics.find(x => x.id === def.geoMetric)
    if (!m) return null
    const tc = aggregate(m, range), sumW = COUNTRIES.reduce((a, c) => a + c[1], 0)
    const rows = COUNTRIES.map(([name, w], i) => ({ name, v: catValue(m, tc, w / sumW, COUNTRIES.length, 900 + i, range) })).sort((a, b) => b.v - a.v)
    return { m, rows }
  }, [def, range])

  const tableRows = useMemo(() => def.table.build(range), [def, range])

  const exportTable = () => { const v = viewRef.current; if (v) download(`${v.name}-${isoOf(range.from)}_${isoOf(range.to)}.csv`, csvOf(v.cols, v.rows)) }
  const exportChart = () => {
    if (!main || !metric) return
    const rows: Row[] = main.cur.map((p, i) => ({ start: isoOf(p.from), end: isoOf(p.to), current: Math.round(p.v * 100) / 100, previous: Math.round(main.prev[i].v * 100) / 100 }))
    download(`${metric.id}-${isoOf(range.from)}_${isoOf(range.to)}.csv`, csvOf([{ key: 'start', label: 'Start' }, { key: 'end', label: 'End' }, { key: 'current', label: metric.label }, { key: 'previous', label: `${metric.label} (previous period)` }], rows))
  }
  const rangeLabel = preset === 'custom' ? rangeShort(range) : PRESETS.find(p => p.value === preset)!.label

  return (
    <AppShell
      sideWidth={232}
      sidebar={
        <div className="an-side">
          <Brand name="Meridian" />
          <div className="eyebrow an-eyebrow">Analytics</div>
          <nav className="an-nav" aria-label="Sections">
            {NAV.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} current={page === n.id} onClick={() => setPage(n.id)} />)}
          </nav>
          <span className="grow" />
          <div className="an-user"><span className="truncate grow">Meridian Inc.</span></div>
        </div>
      }
    >
      <div className="an-main">
        <header className="topbar an-top">
          <DrawerToggle />
          <h1 className="an-title grow truncate">{def.title}</h1>
          {page !== 'reports' ? <div className="an-controls">
            <Dropdown label="Date range" value={preset} width={200} options={PRESETS}
              onChange={v => { if (v === 'custom') setDlg(true); else setPreset(v as PresetId) }}
              renderValue={() => <><Icon name="calendar" size={15} /><span className="truncate">{rangeLabel}</span></>} />
            <label className="an-compare">
                <Switch checked={compare} onChange={setCompare} label="Compare to previous period" />
                <span className="muted"><span className="an-long">Compare to previous period</span><span className="an-short">Compare</span></span>
            </label>
          </div> : <span className="grow" />}
          <Button ref={exp.ref} variant="secondary" icon="download" className="an-export" aria-haspopup="menu" aria-expanded={exp.open} aria-label="Export" onClick={exp.toggle}><span className="an-export-t">Export</span></Button>
          <Menu anchor={exp.el} open={exp.open} onClose={exp.close} placement="bottom-end" label="Export" width={220} items={[
            { label: 'Table as CSV', icon: 'file-text', onSelect: exportTable },
            ...(main ? [{ label: 'Chart data as CSV', icon: 'trending-up' as const, onSelect: exportChart }] : []),
          ]} />
        </header>

        <div className="an-scroll scroll" ref={scrollRef}>
          <div className={`an-grid ${page === 'reports' ? 'only-table' : ''}`} key={page}>
            {def.metrics.length > 0 && (
              <div className="an-kpis" role="group" aria-label="Key metrics">
                {kpis.map(({ m, v, d, spark }) => {
                  const good = (d >= 0) === (m.good === 'up')
                  const on = m.id === metricId
                  return (
                    <button key={m.id} type="button" className="an-kpi" aria-pressed={on} onClick={() => setSel(s => ({ ...s, [page]: m.id }))}>
                      <span className="an-kpi-l">{m.label}</span>
                      <span className="an-kpi-v num">{m.fmt(v, v >= 1e6)}</span>
                      <span className="an-kpi-f">
                        {compare ? (
                          <span className={`an-delta ${good ? 'good' : 'bad'} num`}>
                            <Icon name={d >= 0 ? 'trending-up' : 'trending-down'} size={14} />
                            {d >= 0 ? '+' : '−'}{Math.abs(d).toFixed(1)}%
                          </span>
                        ) : <span />}
                        <Sparkline pts={spark} active={on} />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {main && metric && (
              <section className="an-panel an-main-chart" aria-label={`${metric.label} over time`}>
                <header className="an-ph">
                  <h2>{metric.label}</h2>
                  <span className="grow" />
                  {compare && (
                    <div className="an-legend">
                      <span><i className="solid" />{rangeShort(range)}</span>
                      <span><i className="dash" />{rangeShort(prev)}</span>
                    </div>
                  )}
                </header>
                <LineChart cur={main.cur} prev={compare ? main.prev : undefined} fmt={metric.fmt} label={metric.label} labelPrev="Previous period" />
              </section>
            )}

            {bar && dim && (
              <section className="an-panel an-bar" aria-label={`${bar.m.label} by ${dim.label}`}>
                <header className="an-ph">
                  <h2>{bar.m.label} by</h2>
                  <Dropdown quiet label="Group by" value={dim.id} width={160} onChange={v => setDimSel(s => ({ ...s, [page]: v }))}
                    options={def.dims.map(d => ({ value: d.id, label: d.label }))} />
                  <span className="grow" />
                  {compare && <div className="an-legend"><span><i className="solid" />Current</span><span><i className="prev" />Previous</span></div>}
                </header>
                <BarChart cats={bar.cats} cur={bar.cur} prev={compare ? bar.prev : undefined} fmt={bar.m.fmt} label={`${bar.m.label} by ${dim.label}`} />
              </section>
            )}

            {geo && (
              <section className="an-panel an-geo" aria-label={def.geoTitle}>
                <header className="an-ph"><h2>{def.geoTitle}</h2></header>
                <HBars rows={geo.rows} fmt={geo.m.fmt} label={def.geoTitle} />
              </section>
            )}

            <DataTable key={page} def={def.table} rows={tableRows} viewRef={viewRef} />
          </div>
          <p className="sr-only" aria-live="polite">Showing {rangeText(range)}</p>
        </div>
      </div>
      <RangeDialog key={String(dlg)} open={dlg} onClose={() => setDlg(false)} initial={range} onApply={r => { setCustom(r); setPreset('custom') }} />
    </AppShell>
  )
}
