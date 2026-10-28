import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Checkbox, Icon, Menu, Popover, Tag, useAnchored, type IconName, type MenuEntry, type Placement } from '../../ui'
import { MEMBERS, PRIORITIES, STATUSES, TODAY, fmtDue, memberName, type Label, type Priority, type Status, type Task } from './data'

/** Anchors a menu to any trigger element rendered by the caller. */
export function MenuTrigger({ items, render, placement = 'bottom-start', label }: {
  items: MenuEntry[]; render: (p: { ref: (n: HTMLElement | null) => void; open: boolean; toggle: () => void }) => ReactNode; placement?: Placement; label: string
}) {
  const a = useAnchored()
  return (
    <>
      {render({ ref: a.ref, open: a.open, toggle: a.toggle })}
      <Menu anchor={a.el} open={a.open} onClose={a.close} items={items} placement={placement} label={label} />
    </>
  )
}

export const statusMeta = (s: Status) => STATUSES.find(x => x.value === s)!
export function StatusIcon({ status, size = 16 }: { status: Status; size?: number }) {
  return <span className={`pm-st pm-st-${status}`}><Icon name={statusMeta(status).icon} size={size} /></span>
}

export const statusItems = (current: Status | null, pick: (s: Status) => void): MenuEntry[] =>
  STATUSES.map(s => ({ label: s.label, icon: s.icon, checked: s.value === current, onSelect: () => pick(s.value) }))
export const priorityItems = (current: Priority | null, pick: (p: Priority) => void): MenuEntry[] =>
  PRIORITIES.map(p => ({ label: p.label, icon: 'flag' as IconName, checked: p.value === current, onSelect: () => pick(p.value) }))
export const assigneeItems = (current: string | null, pick: (id: string | null) => void): MenuEntry[] => [
  ...MEMBERS.map(m => ({ label: m.name, icon: 'user' as IconName, checked: m.id === current, onSelect: () => pick(m.id) })),
  { type: 'sep' as const }, { label: 'Unassigned', icon: 'x' as IconName, checked: current === null, onSelect: () => pick(null) },
]

export function StatusButton({ task, onPick }: { task: Task; onPick: (s: Status) => void }) {
  return (
    <MenuTrigger label="Set status" items={statusItems(task.status, onPick)} render={({ ref, open, toggle }) => (
      <button ref={ref} type="button" className="pm-status-btn" aria-label={`Status: ${statusMeta(task.status).label}. Change status`} aria-haspopup="menu" aria-expanded={open}
        onClick={e => { e.stopPropagation(); toggle() }}>
        <StatusIcon status={task.status} />
      </button>
    )} />
  )
}

export function LabelTags({ ids, labels, max = 2 }: { ids: string[]; labels: Label[]; max?: number }) {
  const ls = ids.map(id => labels.find(l => l.id === id)).filter(Boolean) as Label[]
  if (!ls.length) return null
  return (
    <span className="pm-labels">
      {ls.slice(0, max).map(l => <Tag key={l.id} color={l.color}>{l.name}</Tag>)}
      {ls.length > max && <Tag>+{ls.length - max}</Tag>}
    </span>
  )
}

export function Due({ task }: { task: Task }) {
  if (!task.due) return <span className="pm-due" />
  const late = task.due < TODAY && task.status !== 'done'
  return <time className={`pm-due num ${late ? 'late' : ''}`} dateTime={task.due} title={late ? 'Overdue' : undefined}>{fmtDue(task.due)}</time>
}

type RowProps = {
  task: Task; labels: Label[]; selected: boolean; anySelected: boolean; cursor: boolean; active: boolean
  onOpen: () => void; onSelect: () => void; onStatus: (s: Status) => void
}
export function TaskRow({ task, labels, selected, anySelected, cursor, active, onOpen, onSelect, onStatus }: RowProps) {
  const timer = useRef(0)
  const lp = { onTouchStart: () => { timer.current = window.setTimeout(onSelect, 500) }, onTouchEnd: () => window.clearTimeout(timer.current), onTouchMove: () => window.clearTimeout(timer.current) }
  return (
    <div role="listitem" data-tid={task.id} className={`pm-row ${selected ? 'selected' : ''} ${cursor ? 'cursor' : ''} ${active ? 'active' : ''} ${anySelected ? 'selecting' : ''}`}
      aria-current={active ? 'true' : undefined} onClick={e => { if (e.currentTarget.contains(e.target as Node)) onOpen() }} {...lp}>
      <span className="pm-check"><Checkbox checked={selected} onChange={onSelect} label={`Select ${task.id}`} /></span>
      <StatusButton task={task} onPick={onStatus} />
      <span className="pm-id">{task.id}</span>
      <button type="button" className="pm-title truncate" onClick={e => { e.stopPropagation(); onOpen() }}>{task.title}</button>
      <LabelTags ids={task.labels} labels={labels} />
      <Due task={task} />
      <span className="pm-assignee truncate" title={task.assignee ? memberName(task.assignee) : undefined}>{task.assignee ? memberName(task.assignee).split(' ')[0] : null}</span>
    </div>
  )
}

export function TaskCard({ task, labels, selected, cursor, active, onOpen, onSelect, onStatus }: Omit<RowProps, 'anySelected'>) {
  return (
    <div role="listitem" data-tid={task.id} className={`pm-card ${selected ? 'selected' : ''} ${cursor ? 'cursor' : ''} ${active ? 'active' : ''}`} onClick={e => { if (e.currentTarget.contains(e.target as Node)) onOpen() }}>
      <div className="pm-card-top">
        <StatusButton task={task} onPick={onStatus} />
        <span className="pm-id">{task.id}</span>
        <span className="pm-check pm-card-check"><Checkbox checked={selected} onChange={onSelect} label={`Select ${task.id}`} /></span>
      </div>
      <button type="button" className="pm-card-title" onClick={e => { e.stopPropagation(); onOpen() }}>{task.title}</button>
      <div className="pm-card-foot">
        <LabelTags ids={task.labels} labels={labels} max={1} />
        <span className="grow" />
        <Due task={task} />
        {task.assignee && <span className="pm-assignee-t muted truncate" title={memberName(task.assignee)}>{memberName(task.assignee).split(' ')[0]}</span>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Filters */
export type Filters = { status: Status[]; label: string[]; assignee: string[]; priority: Priority[] }
export type FilterKey = keyof Filters
export const EMPTY_FILTERS: Filters = { status: [], label: [], assignee: [], priority: [] }
const CATS: { key: FilterKey; label: string; icon: IconName }[] = [
  { key: 'status', label: 'Status', icon: 'circle-half' },
  { key: 'label', label: 'Label', icon: 'tag' },
  { key: 'assignee', label: 'Assignee', icon: 'user' },
  { key: 'priority', label: 'Priority', icon: 'flag' },
]

export function filterOptions(key: FilterKey, labels: Label[]): { value: string; label: string; color?: string; icon?: IconName }[] {
  if (key === 'status') return STATUSES.map(s => ({ value: s.value, label: s.label, icon: s.icon }))
  if (key === 'priority') return PRIORITIES.map(p => ({ value: p.value, label: p.label, icon: 'flag' as IconName }))
  if (key === 'assignee') return [...MEMBERS.map(m => ({ value: m.id, label: m.name, icon: 'user' as IconName })), { value: 'none', label: 'Unassigned', icon: 'x' as IconName }]
  return labels.map(l => ({ value: l.id, label: l.name, color: l.color }))
}

export function FilterButton({ filters, labels, onChange }: { filters: Filters; labels: Label[]; onChange: (f: Filters) => void }) {
  const a = useAnchored()
  const [cat, setCat] = useState<FilterKey | null>(null)
  const [q, setQ] = useState('')
  const body = useRef<HTMLDivElement>(null)
  const close = () => { a.close(); setCat(null); setQ('') }
  useEffect(() => { body.current?.querySelector<HTMLElement>(cat && (cat === 'label' || cat === 'assignee') ? 'input' : '[data-item]')?.focus() }, [cat])
  const toggle = (key: FilterKey, v: string) => {
    const cur = filters[key] as string[]
    onChange({ ...filters, [key]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] } as Filters)
  }
  const opts = cat ? filterOptions(cat, labels).filter(o => o.label.toLowerCase().includes(q.trim().toLowerCase())) : []
  return (
    <>
      <button ref={a.ref} type="button" className="btn btn-ghost" aria-haspopup="menu" aria-expanded={a.open} aria-label="Filter" onClick={a.toggle}>
        <Icon name="filter" size={15} /><span className="pm-btn-text">Filter</span>
      </button>
      <Popover anchor={a.el} open={a.open} onClose={close} label="Add filter" width={240}>
        <div ref={body}>
          {!cat ? CATS.map(c => (
            <button key={c.key} type="button" role="menuitem" data-item className="menu-item" onClick={() => setCat(c.key)}>
              <Icon name={c.icon} size={15} /><span>{c.label}</span>
              {filters[c.key].length > 0 && <span className="shortcut num">{filters[c.key].length}</span>}
              <Icon name="chevron-right" size={14} className={filters[c.key].length ? '' : 'pm-push'} />
            </button>
          )) : (
            <>
              <button type="button" role="menuitem" data-item className="menu-item pm-back" onClick={() => { setCat(null); setQ('') }}>
                <Icon name="chevron-left" size={15} /><span className="eyebrow">{CATS.find(c => c.key === cat)!.label}</span>
              </button>
              {(cat === 'label' || cat === 'assignee') && (
                <div className="menu-search"><input className="input" placeholder="Search" aria-label={`Search ${cat}`} value={q} onChange={e => setQ(e.target.value)}
                  onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); body.current?.querySelectorAll<HTMLElement>('[data-item]')[1]?.focus() } }} /></div>
              )}
              <div className="menu-list">
                {opts.map(o => {
                  const on = (filters[cat] as string[]).includes(o.value)
                  return (
                    <button key={o.value} type="button" role="menuitemcheckbox" aria-checked={on} data-item className="menu-item" onClick={() => toggle(cat, o.value)}>
                      <span className="checkbox" aria-checked={on} aria-hidden="true"><Icon name="check" size={12} strokeWidth={3} /></span>
                      {o.color && <span className="pm-dot" style={{ background: o.color }} />}
                      {o.icon && <Icon name={o.icon} size={15} />}
                      <span className="truncate">{o.label}</span>
                    </button>
                  )
                })}
                {!opts.length && <div className="menu-empty">No matches</div>}
              </div>
            </>
          )}
        </div>
      </Popover>
    </>
  )
}

export function FilterChips({ filters, labels, onChange }: { filters: Filters; labels: Label[]; onChange: (f: Filters) => void }) {
  const chips = CATS.filter(c => filters[c.key].length)
  if (!chips.length) return null
  return (
    <div className="pm-chips" role="group" aria-label="Active filters">
      {chips.map(c => {
        const all = filterOptions(c.key, labels)
        const names = (filters[c.key] as string[]).map(v => all.find(o => o.value === v)?.label ?? v)
        return (
          <span key={c.key} className="pm-chip">
            <Icon name={c.icon} size={13} />
            <span className="muted">{c.label}</span>
            <span className="truncate">{names.length > 2 ? `${names.length} selected` : names.join(', ')}</span>
            <button type="button" aria-label={`Remove ${c.label} filter`} onClick={() => onChange({ ...filters, [c.key]: [] })}><Icon name="x" size={12} /></button>
          </span>
        )
      })}
      <button type="button" className="btn btn-ghost pm-clear" onClick={() => onChange(EMPTY_FILTERS)}>Clear</button>
    </div>
  )
}
