import { useMemo, useRef, useState } from 'react'
import { Button, IconButton, Tabs } from '../../ui'
import { EVENTS, TODAY, dayName, download, fmtDate, monthName, toICS, type ClubEvent, type EventType } from './data'
import { Band, BandHead } from './parts'

const MONTHS = [9, 10, 11] // Oct, Nov, Dec 2026
type Filter = 'all' | EventType
const TYPE_LABEL: Record<EventType, string> = { club: 'Club night', lesson: 'Lesson', simul: 'Simul' }

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export function Events() {
  const [mi, setMi] = useState(1)
  const [filter, setFilter] = useState<Filter>('all')
  const [rsvp, setRsvp] = useState<Record<string, boolean>>({})
  const [day, setDay] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const month = MONTHS[mi]

  const inMonth = useMemo(() => EVENTS.filter(e => Number(e.date.slice(5, 7)) - 1 === month && (filter === 'all' || e.type === filter)), [month, filter])
  const byDay = useMemo(() => {
    const m = new Map<string, ClubEvent[]>()
    for (const e of inMonth) m.set(e.date, [...(m.get(e.date) ?? []), e])
    return m
  }, [inMonth])

  // Monday-first grid
  const first = new Date(Date.UTC(2026, month, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(2026, month + 1, 0)).getUTCDate()
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(2026, month, i + 1))]
  while (cells.length % 7) cells.push(null)

  const pick = (d: string) => {
    setDay(d)
    const el = listRef.current?.querySelector<HTMLElement>(`[data-date="${d}"]`)
    if (el && listRef.current) listRef.current.scrollTo({ top: el.offsetTop - listRef.current.offsetTop - 4, behavior: 'smooth' })
  }

  const going = (e: ClubEvent) => e.going + (rsvp[e.id] ? 1 : 0)
  const dates = [...byDay.keys()]

  return (
    <Band id="events" tone="b">
      <BandHead title="Events">
        <Tabs label="Event type" value={filter} onChange={setFilter} items={[{ value: 'all', label: 'All' }, { value: 'club', label: 'Club nights' }, { value: 'lesson', label: 'Lessons' }, { value: 'simul', label: 'Simuls' }]} />
        <Button variant="ghost" icon="download" disabled={!inMonth.length} onClick={() => download(`northgate-${monthName(month).toLowerCase()}-2026.ics`, toICS(inMonth))}>Add month to calendar</Button>
      </BandHead>

      <div className="cc-events">
        <div className="cc-cal" aria-label="Calendar">
          <div className="cc-cal-head">
            <h3 className="cc-h3">{monthName(month)} 2026</h3>
            <div className="row">
              <IconButton icon="chevron-left" label="Previous month" disabled={mi === 0} onClick={() => { setMi(mi - 1); setDay(null) }} />
              <IconButton icon="chevron-right" label="Next month" disabled={mi === MONTHS.length - 1} onClick={() => { setMi(mi + 1); setDay(null) }} />
            </div>
          </div>
          <div className="cc-cal-grid" role="grid" aria-label={`${monthName(month)} 2026`}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} role="columnheader" className="cc-cal-dow eyebrow">{d}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="cc-cal-cell empty" role="gridcell" />
              const evs = byDay.get(c) ?? []
              const past = c < TODAY
              return (
                <button key={i} type="button" role="gridcell" className={`cc-cal-cell ${c === TODAY ? 'today' : ''} ${day === c ? 'sel' : ''} ${past ? 'past' : ''}`} disabled={!evs.length}
                  aria-label={`${dayName(c)} ${Number(c.slice(8))} ${monthName(month)}${evs.length ? `, ${evs.length} event${evs.length > 1 ? 's' : ''}` : ''}`} aria-current={c === TODAY ? 'date' : undefined}
                  onClick={() => pick(c)}>
                  <span className="num cc-cal-n">{Number(c.slice(8))}</span>
                  <span className="cc-cal-dots">{evs.slice(0, 3).map(e => <i key={e.id} className={`${e.type} ${rsvp[e.id] ? 'going' : ''}`} />)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="cc-agenda scroll" ref={listRef}>
          {dates.length === 0 && <div className="cc-empty"><p>No events match this filter in {monthName(month)}.</p><Button variant="ghost" onClick={() => setFilter('all')}>Show all events</Button></div>}
          {dates.map(d => (
            <div key={d} data-date={d} className={`cc-agenda-day ${day === d ? 'sel' : ''}`}>
              <div className="eyebrow cc-agenda-date">{dayName(d)} {fmtDate(d, false)}</div>
              {byDay.get(d)!.map(e => {
                const on = !!rsvp[e.id]
                const full = e.cap !== null && going(e) >= e.cap && !on
                return (
                  <div key={e.id} className="cc-ev">
                    <div className="cc-ev-time num">{e.start}</div>
                    <div className="cc-ev-main">
                      <div className="cc-ev-title">{e.title}</div>
                      <div className="muted cc-ev-meta">{TYPE_LABEL[e.type]}. {e.host}. {e.room}, until {e.end}.</div>
                      {e.note && <div className="faint cc-ev-meta">{e.note}</div>}
                    </div>
                    <div className="cc-ev-go num faint">{going(e)}{e.cap ? ` of ${e.cap}` : ''} going</div>
                    <div className="cc-ev-act">
                      <Button className={on ? 'cc-going' : ''} icon={on ? 'check' : undefined} aria-pressed={on} disabled={full} onClick={() => setRsvp(r => ({ ...r, [e.id]: !on }))}>{on ? 'Going' : full ? 'Full' : 'RSVP'}</Button>
                      <IconButton icon="calendar" label={`Add ${e.title} on ${fmtDate(e.date)} to calendar`} onClick={() => download(`${e.id}.ics`, toICS([e]))} />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Band>
  )
}

