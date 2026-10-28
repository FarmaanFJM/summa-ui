import { useState } from 'react'
import { Button, Dialog, Tag } from '../../ui'
import { destById, fmtRange, guestsOf, money, stayById } from './data'
import { StayImage } from './parts'
import { go, useTravel, type Trip } from './store'

export function TripsPage() {
  const { trips, cancelTrip, cur, loc } = useTravel()
  const [target, setTarget] = useState<Trip | null>(null)
  const sorted = [...trips].sort((a, b) => a.q.checkIn.localeCompare(b.q.checkIn))
  const stay = target ? stayById(target.stayId) : null

  return (
    <div className="tv-page">
      <div className="tv-wrap tv-trips">
        <h1 className="tv-h1s">Trips</h1>
        {sorted.length === 0 ? (
          <div className="tv-empty">
            <h2 className="tv-h3">No trips yet</h2>
            <p className="muted">Stays you book will appear here.</p>
            <Button variant="primary" onClick={() => go('')}>Find a stay</Button>
          </div>
        ) : (
          <ul className="tv-trip-list" aria-label="Your trips">
            {sorted.map(t => {
              const s = stayById(t.stayId)!
              const d = destById(s.dest)!
              const cancelled = t.status === 'cancelled'
              return (
                <li key={t.id} className={`tv-trip ${cancelled ? 'cancelled' : ''}`}>
                  <button type="button" className="tv-trip-open" onClick={() => go(`/stay/${s.id}?d=${s.dest}&in=${t.q.checkIn}&out=${t.q.checkOut}&a=${t.q.adults}&c=${t.q.children}&r=${t.q.rooms}`)} aria-label={`Open ${s.name}`}>
                    <StayImage s={s} className="tv-trip-img" />
                  </button>
                  <div className="tv-trip-info">
                    <div className="tv-trip-title"><span>{s.name}</span>{cancelled && <Tag>Cancelled</Tag>}</div>
                    <div className="muted">{s.area}, {d.name}</div>
                    <div className="num">{fmtRange(t.q.checkIn, t.q.checkOut, loc)}. {guestsOf(t.q)} {guestsOf(t.q) === 1 ? 'guest' : 'guests'}</div>
                    <div className="faint num">Reference {t.ref}</div>
                  </div>
                  <div className="tv-trip-side">
                    <div className="num tv-strong">{money(t.total, cur)}</div>
                    {!cancelled && <Button variant="secondary" onClick={() => setTarget(t)}>Cancel booking</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!target} onClose={() => setTarget(null)} title="Cancel this booking?" width={420}
        footer={<><Button variant="ghost" onClick={() => setTarget(null)}>Keep booking</Button><Button variant="danger" data-autofocus onClick={() => { if (target) cancelTrip(target.id); setTarget(null) }}>Cancel booking</Button></>}>
        {target && stay && (
          <p className="muted" style={{ margin: '4px 0 8px' }}>
            {stay.name}, {fmtRange(target.q.checkIn, target.q.checkOut, loc)}.{' '}
            {stay.cancel ? `You will be refunded ${money(target.total, cur)} in full.` : 'This rate is non-refundable, so no refund will be issued.'}
          </p>
        )}
      </Dialog>
    </div>
  )
}

