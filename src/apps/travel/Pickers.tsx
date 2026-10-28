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
  const root = useRef<HTMLDivElement>(null)
  const first = loc === 'en-GB' ? 1 : 0

  const shift = (d: number) => setView(v => { const t = v.y * 12 + v.m + d; return { y: Math.floor(t / 12), m: t % 12 } })
  const canPrev = view.y * 12 + view.m > Number(TODAY.slice(0, 4)) * 12 + Number(TODAY.slice(5, 7)) - 1

  const click = (d: string) => {
    if (readOnly || !onPick) return
    if (!start || end) onPick(d, null)
    else if (d <= start) onPick(d, null)
    else onPick(start, d)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-iso]')
    if (!t) return
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (!delta) return
    e.preventDefault()
    const next = addDays(t.dataset.iso!, delta)
    if (next < TODAY) return
    const ny = Number(next.slice(0, 4)), nm = Number(next.slice(5, 7)) - 1
    const last = view.y * 12 + view.m + months - 1
    if (ny * 12 + nm > last) shift(1)
    else if (ny * 12 + nm < view.y * 12 + view.m) shift(-1)
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-iso="${next}"]`)?.focus())
  }

  const rangeEnd = end ?? (start && hover && hover > start ? hover : null)

  const month = (offset: number) => {
    const t = view.y * 12 + view.m + offset
    const y = Math.floor(t / 12), m = t % 12
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() - first + 7) % 7
    const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${y}-${pad(m + 1)}-${pad(i + 1)}`)]
    const order = first ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
    return (
      <div className="tv-month" key={offset}>
        <div className="tv-month-name">{monthLong(m)} {y}</div>
        <div className="tv-dow">{order.map(i => <span key={i}>{DOW[i].slice(0, 2)}</span>)}</div>
        <div className="tv-days" role="grid" aria-label={`${monthLong(m)} ${y}`}>
          {cells.map((d, i) => {
            if (!d) return <span key={i} />
            const past = d < TODAY
            const off = past || (unavailable?.(d) ?? false)
            const isS = d === start, isE = d === rangeEnd
            const inR = !!start && !!rangeEnd && d > start && d < rangeEnd
            const cls = ['tv-day', isS || isE ? 'end' : '', inR ? 'in' : '', isS && rangeEnd ? 'cap-s' : '', isE ? 'cap-e' : '', off ? 'off' : '', d === TODAY ? 'today' : ''].join(' ')
            return (
              <button key={i} type="button" role="gridcell" data-iso={d} className={cls} disabled={readOnly ? false : past} tabIndex={d === (start ?? TODAY) || (!start && d === TODAY) ? 0 : -1}
                aria-selected={isS || isE || inR} aria-label={`${fmtDay(d, loc, true)}${unavailable?.(d) ? ', unavailable' : ''}`} aria-disabled={readOnly || undefined}
                onClick={() => click(d)} onMouseEnter={() => setHover(d)} onFocus={() => setHover(d)}>
                {Number(d.slice(8))}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="tv-cal" ref={root} onKeyDown={onKey} onMouseLeave={() => setHover(null)}>
      <div className="tv-cal-nav">
        <IconButton icon="chevron-left" label="Previous month" size="sm" disabled={!canPrev} onClick={() => shift(-1)} />
        <IconButton icon="chevron-right" label="Next month" size="sm" onClick={() => shift(1)} />
      </div>
      <div className="tv-months">{Array.from({ length: months }, (_, i) => month(i))}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ Field shell */
function FieldButton({ label, value, icon, a, wide, error, onClick }: { label: string; value: string; icon: 'calendar' | 'users'; a: ReturnType<typeof useAnchored>; wide?: boolean; error?: boolean; onClick?: () => void }) {
  return (
    <button ref={a.ref} type="button" className={`tv-field ${wide ? 'wide' : ''}`} aria-haspopup="dialog" aria-expanded={a.open} aria-invalid={error || undefined} onClick={onClick ?? a.toggle}>
      <Icon name={icon} size={17} />
      <span className="tv-field-text"><span className="tv-field-label">{label}</span><span className="tv-field-value truncate">{value}</span></span>
    </button>
  )
}

export function DateRangeField({ q, onChange }: { q: Query; onChange: (checkIn: string, checkOut: string) => void }) {
  const { loc } = useTravel()
  const a = useAnchored()
  const [draft, setDraft] = useState<{ s: string | null; e: string | null }>({ s: q.checkIn, e: q.checkOut })
  const narrow = useMedia('(max-width: 720px)')
  useEffect(() => { if (a.open) setDraft({ s: q.checkIn, e: q.checkOut }) }, [a.open]) // eslint-disable-line react-hooks/exhaustive-deps
  const nights = nightsBetween(q.checkIn, q.checkOut)
  const pick = (s: string | null, e: string | null) => {
    setDraft({ s, e })
    if (s && e) { onChange(s, e); setTimeout(a.close, 160) }
  }
  const dn = draft.s && draft.e ? nightsBetween(draft.s, draft.e) : 0
  return (
    <>
      <FieldButton a={a} icon="calendar" label="Dates" wide value={`${fmtDay(q.checkIn, loc, true)} to ${fmtDay(q.checkOut, loc, true)}, ${nights} ${nights === 1 ? 'night' : 'nights'}`} />
      <Popover anchor={a.el} open={a.open} onClose={a.close} role="dialog" label="Choose dates" focusSelector="[data-iso]" className="tv-pop-cal" width={narrow ? Math.min(340, window.innerWidth - 16) : undefined}>
        <RangeCalendar start={draft.s} end={draft.e} onPick={pick} months={narrow ? 1 : 2} loc={loc} />
        <div className="tv-cal-foot">
          <span className="muted" role="status">{dn ? `${dn} ${dn === 1 ? 'night' : 'nights'}` : draft.s ? 'Choose a check-out date' : 'Choose a check-in date'}</span>
        </div>
      </Popover>
    </>
  )
}

function Stepper({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="tv-step">
      <div><div className="tv-step-l">{label}</div>{sub && <div className="faint tv-step-s">{sub}</div>}</div>
      <div className="row" style={{ gap: 4 }}>
        <IconButton icon="minus" label={`Fewer ${label.toLowerCase()}`} size="sm" disabled={value <= min} onClick={() => onChange(value - 1)} />
        <span className="num tv-step-v" aria-live="polite">{value}</span>
        <IconButton icon="plus" label={`More ${label.toLowerCase()}`} size="sm" disabled={value >= max} onClick={() => onChange(value + 1)} />
      </div>
    </div>
  )
}

export const guestText = (q: Query) => `${q.adults + q.children} ${q.adults + q.children === 1 ? 'guest' : 'guests'}, ${q.rooms} ${q.rooms === 1 ? 'room' : 'rooms'}`

export function GuestsField({ q, onChange }: { q: Query; onChange: (p: Partial<Query>) => void }) {
  const a = useAnchored()
  return (
    <>
      <FieldButton a={a} icon="users" label="Guests" value={guestText(q)} />
      <Popover anchor={a.el} open={a.open} onClose={a.close} role="dialog" label="Guests and rooms" focusSelector="button:not(:disabled)" width={290} className="tv-pop-guests">
        <Stepper label="Adults" sub="Age 18 or over" value={q.adults} min={1} max={8} onChange={n => onChange({ adults: n })} />
        <Stepper label="Children" sub="Ages 0 to 17" value={q.children} min={0} max={6} onChange={n => onChange({ children: n })} />
        <Stepper label="Rooms" value={q.rooms} min={1} max={4} onChange={n => onChange({ rooms: n })} />
        <div className="tv-pop-foot"><Button size="md" onClick={a.close}>Done</Button></div>
      </Popover>
    </>
  )
}

/* ------------------------------------------------------------------ Destination combobox */
export function DestinationField({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string }) {
  const { recents } = useTravel()
  const [text, setText] = useState(destById(value)?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const id = useId()
  useEffect(() => { setText(destById(value)?.name ?? '') }, [value])

  const q = text.trim().toLowerCase()
  const typed = !!q && destById(value)?.name.toLowerCase() !== q
  const items = useMemo(() => {
    if (typed) return DESTINATIONS.filter(d => (d.name + ' ' + d.country).toLowerCase().includes(q)).map(d => ({ d, group: '' }))
    const rec = recents.map(r => destById(r)).filter(Boolean).map(d => ({ d: d!, group: 'Recent searches' }))
    const rest = DESTINATIONS.filter(d => !recents.includes(d.id)).map(d => ({ d, group: 'Popular destinations' }))
    return [...rec, ...rest]
  }, [typed, q, recents])

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
            onFocus={e => { setOpen(true); e.currentTarget.select() }} onBlur={() => setOpen(false)} onKeyDown={onKey} />
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

