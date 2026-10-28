import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './executive.css'
import { Button, Dropdown, Icon, IconButton, Menu, Tabs, useAnchored, useMedia, type MenuEntry } from '../../ui'
import { DECISIONS, PERIODS, UNITS, selUnits, type Decision, type PeriodId } from './data'
import { Finance, Operations, Overview, People, type Ctx } from './sections'

type Tab = 'overview' | 'finance' | 'operations' | 'people'
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' }, { value: 'finance', label: 'Finance' }, { value: 'operations', label: 'Operations' }, { value: 'people', label: 'People' },
]
const readTab = (): Tab => {
  const t = location.hash.replace(/^#\/?/, '').split('/')[1] as Tab | undefined
  return TABS.some(x => x.value === t) ? (t as Tab) : 'overview'
}

type Toast = { id: number; msg: string; undo?: () => void }

export default function Executive() {
  const [tab, setTab] = useState<Tab>(readTab)
  const [period, setPeriod] = useState<PeriodId>('quarter')
  const [ids, setIds] = useState<string[]>([])
  const [decisions, setDecisions] = useState<Decision[]>(DECISIONS)
  const [dismissed, setDismissed] = useState<Decision[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobile = useMedia('(max-width: 820px)')
  const timer = useRef(0)

  useEffect(() => { const t = window.setTimeout(() => setLoading(false), 550); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const f = () => setTab(readTab())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  useEffect(() => { if (!mobile) setSheet(false) }, [mobile])

  const go = (t: Tab) => { location.hash = `#/executive/${t}` }
  const say = useCallback((msg: string, undo?: () => void) => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), msg, undo })
    timer.current = window.setTimeout(() => setToast(null), 6000)
  }, [])

  const onAct = useCallback((d: Decision, kind: 'approve' | 'defer') => {
    const index = decisions.findIndex(x => x.id === d.id)
    setDecisions(list => list.filter(x => x.id !== d.id))
    setDismissed(list => [...list, d])
    say(kind === 'approve' ? `Approved: ${d.title}` : `Deferred: ${d.title}`, () => {
      setDecisions(list => { const n = [...list]; n.splice(Math.min(index, n.length), 0, d); return n })
      setDismissed(list => list.filter(x => x.id !== d.id))
      setToast(null)
    })
  }, [decisions, say])

  const restore = () => { setDecisions(DECISIONS); setDismissed([]); say('Decisions restored') }
  const units = useMemo(() => selUnits(ids), [ids])
  const ctx: Ctx = { units, ids, period, decisions, onAct }

  const menu: MenuEntry[] = [
    { type: 'heading', label: 'Amara Whitfield, Group CEO' },
    { label: 'Export board pack', icon: 'download', onSelect: () => say('Board pack export queued') },
    { label: 'Restore dismissed decisions', icon: 'refresh', disabled: !dismissed.length, onSelect: restore },
    { label: 'Reset filters', icon: 'filter', disabled: period === 'quarter' && !ids.length, onSelect: () => { setPeriod('quarter'); setIds([]) } },
  ]
  const um = useAnchored()

  // number keys switch sections when not typing
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || document.querySelector('.popover,.backdrop')) return
      const i = Number(e.key) - 1
      if (i >= 0 && i < TABS.length) go(TABS[i].value)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  const unitOpts = UNITS.map(u => ({ value: u.id, label: u.name }))
  const filtersOn = (period !== 'quarter' ? 1 : 0) + (ids.length ? 1 : 0)
  const periodMeta = PERIODS.find(p => p.value === period)!
  const unitLabel = !ids.length ? 'All business units' : units.map(u => u.short).join(', ')

  const body = loading ? <Skeleton /> : tab === 'overview' ? <Overview c={ctx} /> : tab === 'finance' ? <Finance c={ctx} /> : tab === 'operations' ? <Operations c={ctx} /> : <People c={ctx} />

  const filters = (
    <>
      <Dropdown label="Period" value={period} options={PERIODS.map(p => ({ value: p.value, label: p.label }))} onChange={setPeriod} />
      <Dropdown multiple label="Business units" value={ids} options={unitOpts} onChange={setIds}
        renderValue={sel => <><Icon name="layers" size={15} /><span className="truncate">{sel.length === 0 ? 'All units' : sel.length === 1 ? sel[0].label : `${sel.length} units`}</span></>} />
    </>
  )

  return (
    <div className="ex-root scroll" onScroll={e => setScrolled((e.currentTarget as HTMLElement).scrollTop > 4)}>
      <header className={`ex-top ${scrolled ? 'scrolled' : ''}`}>
        <div className="ex-top-in">
          <div className="ex-brand"><span className="brand-mark"><Icon name="layers" size={13} strokeWidth={2.4} /></span><span>Halcyon Group</span></div>
          {!mobile && <nav className="ex-tabs" aria-label="Sections"><Tabs label="Sections" flat items={TABS} value={tab} onChange={go} /></nav>}
          <div className="grow" />
          {!mobile && <div className="ex-filters">{filters}</div>}
          {mobile && (
            <button type="button" className="icon-btn ex-filter-btn" aria-label="Filters" onClick={() => setSheet(true)}>
              <Icon name="sliders" size={17} />{filtersOn > 0 && <span className="ex-badge num">{filtersOn}</span>}
            </button>
          )}
          <IconButton ref={um.ref} icon="user" label="Account menu" className="ex-user" aria-haspopup="menu" aria-expanded={um.open} onClick={um.toggle} />
          <Menu anchor={um.el} open={um.open} onClose={um.close} items={menu} placement="bottom-end" label="Account" width={248} />
        </div>
        {mobile && (
          <div className="ex-tabrow scroll"><Tabs label="Sections" flat items={TABS} value={tab} onChange={go} /></div>
        )}
      </header>

      <main className="ex-main">
        <div className="ex-title">
          <h1>{TABS.find(t => t.value === tab)!.label}</h1>
          <span className="muted">{periodMeta.long}, {unitLabel}</span>
        </div>
        <div className="ex-wrap">
          <div className="ex-grid" role="tabpanel" aria-label={tab}>{body}</div>
        </div>
      </main>

      {sheet && <FilterSheet period={period} setPeriod={setPeriod} ids={ids} setIds={setIds} onClose={() => setSheet(false)} />}
      {toast && (
        <div className="ex-toast" role="status" key={toast.id}>
          <span className="truncate">{toast.msg}</span>
          {toast.undo && <Button variant="ghost" onClick={toast.undo}>Undo</Button>}
          <IconButton icon="x" label="Dismiss" size="sm" onClick={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  const spans: [number, number][] = [[2, 6], [2, 6], [2, 6], [2, 6], [2, 6], [2, 6], [8, 12], [4, 12], [7, 12], [5, 12]]
  return (
    <>
      {spans.map(([c, s], i) => (
        <div key={i} className="ex-card ex-skel" style={{ '--c': c, '--m': c >= 7 ? 12 : c === 2 ? 4 : c, '--s': s } as React.CSSProperties} aria-hidden="true">
          <div className="skeleton" style={{ height: 12, width: 110 }} />
          <div className="skeleton" style={{ height: c === 2 ? 26 : 140, width: c === 2 ? 90 : '100%', marginTop: 14 }} />
        </div>
      ))}
    </>
  )
}

function FilterSheet({ period, setPeriod, ids, setIds, onClose }: { period: PeriodId; setPeriod: (p: PeriodId) => void; ids: string[]; setIds: (v: string[]) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('keydown', k); prev?.focus() }
  }, [onClose])
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  return (
    <div className="ex-sheet-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className="ex-sheet" role="dialog" aria-modal="true" aria-label="Filters">
        <div className="ex-sheet-grab" aria-hidden="true" />
        <div className="eyebrow ex-sheet-h">Period</div>
        <div className="ex-sheet-seg">
          <Tabs label="Period" items={PERIODS.map(p => ({ value: p.value, label: p.label }))} value={period} onChange={setPeriod} />
        </div>
        <div className="eyebrow ex-sheet-h">Business units</div>
        <div className="ex-sheet-list">
          <button type="button" className="menu-item ex-sheet-it" data-autofocus aria-pressed={!ids.length} onClick={() => setIds([])}>
            <span className="truncate">All units</span>{!ids.length && <Icon name="check" size={15} className="check" />}
          </button>
          {UNITS.map(u => (
            <button key={u.id} type="button" className="menu-item ex-sheet-it" aria-pressed={ids.includes(u.id)} onClick={() => toggle(u.id)}>
              <span className="truncate">{u.name}</span>{ids.includes(u.id) && <Icon name="check" size={15} className="check" />}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="lg" className="ex-sheet-done" onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}
