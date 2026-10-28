import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button, Icon, IconButton, Popover, useAnchored, useMedia } from '../../ui'
import { DESTINATIONS, DOW, TODAY, addDays, destById, fmtDay, monthLong, nightsBetween, qToString, type Locale, type Query } from './data'
import { go, useTravel } from './store'

/* ------------------------------------------------------------------ Range calendar */
type CalProps = {
  start: string | null; end: string | null; onPick?: (s: string | null, e: string | null) => void
  months?: 1 | 2; loc: Locale; unavailable?: (iso: string) => boolean; readOnly?: boolean
}
const pad = (n: number) => String(n).padStart(2, '0')

export function RangeCalendar({ start, end, onPick, months = 2, loc, unavailable, readOnly }: CalProps) {
  const base = start ?? TODAY
  const [view, setView] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 })
  const [hover, setHover] = useState<string | null>(null)
  const choose = (did: string) => { onChange(did); setText(destById(did)!.name); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(items.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && open && items[active]) { e.preventDefault(); choose(items[active].d.id) }
    else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false) }
  }

  return (
    <div className="tv-dest">
      <div className={`tv-field input-field ${error ? 'bad' : ''}`}>
        <Icon name="search" size={17} />
        <span className="tv-field-text">
          <label className="tv-field-label" htmlFor={id}>Destination</label>
          <input id={id} className="tv-input" role="combobox" aria-expanded={open} aria-controls={id + '-list'} aria-autocomplete="list" aria-activedescendant={open && items[active] ? `${id}-o${active}` : undefined}
            aria-invalid={!!error} placeholder="Where to?" autoComplete="off" value={text}
            onChange={e => { setText(e.target.value); setOpen(true); setActive(0); if (value) onChange('') }}
            onFocus={e => { if (!narrow) setOpen(true); e.currentTarget.select() }} onBlur={() => setOpen(false)} onKeyDown={onKey} />
        </span>
      </div>
      {error && <div className="tv-err" role="alert">{error}</div>}
      {open && (
        <ul className="popover tv-listbox" id={id + '-list'} role="listbox" aria-label="Destinations" onMouseDown={e => e.preventDefault()}>
          {items.map((it, i) => (
            <li key={it.d.id}>
              {(i === 0 || items[i - 1].group !== it.group) && it.group && <div className="menu-heading eyebrow">{it.group}</div>}
              <div id={`${id}-o${i}`} role="option" aria-selected={i === active} className={`menu-item ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => choose(it.d.id)}>
                <Icon name={it.group === 'Recent searches' ? 'clock' : 'flag'} size={15} />
                <span className="truncate">{it.d.name}</span><span className="shortcut">{it.d.country}</span>
              </div>
            </li>
          ))}
          {!items.length && <li className="menu-empty">No destinations match “{text.trim()}”.</li>}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Search bar */
export function SearchBar({ initial, compact }: { initial: Query; compact?: boolean }) {
  const { addRecent, setLastQ } = useTravel()
  const [q, setQ] = useState(initial)
  const [err, setErr] = useState('')
  useEffect(() => setQ(initial), [initial])
  const patch = (p: Partial<Query>) => setQ(s => ({ ...s, ...p }))
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!q.dest) { setErr('Choose a destination to search.'); return }
    setErr(''); addRecent(q.dest); setLastQ(q)
    go('/results?' + qToString(q))
  }
  return (
    <form className={`tv-search ${compact ? 'compact' : ''}`} onSubmit={submit} role="search" aria-label="Search stays" noValidate>
      <DestinationField value={q.dest} onChange={d => { patch({ dest: d }); if (d) setErr('') }} error={err} />
      <DateRangeField q={q} onChange={(checkIn, checkOut) => patch({ checkIn, checkOut })} />
      <GuestsField q={q} onChange={patch} />
      <Button type="submit" variant="primary" size="lg" icon="search" className="tv-search-btn">Search</Button>
    </form>
  )
}

