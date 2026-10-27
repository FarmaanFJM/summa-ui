import { useState } from 'react'
import { Button, Dialog, Icon, useMedia } from '../../ui'
import { breakdown, cheapestRoom, destById, fmtRange, guestsOf, money, qToString, ratingWord, soldOut, stayById, unavailable, type Query, type Stay } from './data'
import { DateRangeField, GuestsField, RangeCalendar } from './Pickers'
import { Heart, Rating, StayImage, Stars } from './parts'
import { go, replace, useTravel } from './store'

export function StayPage({ id, q, room: roomParam }: { id: string; q: Query; room: string | null }) {
  const s = stayById(id)
  const { cur, loc } = useTravel()
  const [photos, setPhotos] = useState(false)
  const mobile = useMedia('(max-width: 900px)')
  const narrow = useMedia('(max-width: 720px)')
  if (!s) return <div className="tv-page"><div className="tv-wrap tv-empty"><h1 className="tv-h3">Stay not found</h1><Button onClick={() => go('')}>Back to search</Button></div></div>

  const d = destById(s.dest)!
  const fallback = cheapestRoom(s, q)
  const room = s.rooms.find(r => r.id === roomParam) ?? fallback
  const b = breakdown(s, room, q)
  const out = soldOut(s, q)
  const guests = guestsOf(q)
  const fits = room.sleeps * q.rooms >= guests

  const upd = (p: Partial<Query>, r = room.id) => replace(`/stay/${s.id}?${qToString({ ...q, ...p }, { room: r })}`)
  const reserve = () => go(`/book/${s.id}?${qToString(q, { room: room.id })}`)
  const reviewBars = (() => {
    const w = [5, 4, 3, 2, 1].map(n => Math.exp(-((n - s.rating / 2) ** 2) / 0.35))
    const t = w.reduce((x, y) => x + y, 0)
    return [5, 4, 3, 2, 1].map((n, i) => ({ n, pct: Math.max(2, Math.round((w[i] / t) * 100)) }))
  })()

  const Dates = (
    <div className="tv-pickers">
      <DateRangeField q={q} onChange={(checkIn, checkOut) => upd({ checkIn, checkOut })} />
      <GuestsField q={q} onChange={p => upd(p)} />
    </div>
  )

  return (
    <div className="tv-page tv-stay">
      <div className="tv-wrap">
        <button type="button" className="tv-back" onClick={() => go('/results?' + qToString({ ...q, dest: s.dest }))}><Icon name="chevron-left" size={16} /> Back to {d.name}</button>
        <div className="tv-stay-head">
          <div>
            <h1 className="tv-h1s">{s.name}</h1>
            <div className="tv-stay-sub"><Stars n={s.stars} /><span className="muted">{s.type} in {s.area}, {d.name}, {d.country}</span></div>
            <div className="tv-stay-rate"><Rating s={s} long /></div>
          </div>
          <Heart id={s.id} name={s.name} />
        </div>

        <div className="tv-gallery">
          {[0, 1, 2, 3, 4].map(i => <button key={i} type="button" className={`tv-g g${i}`} onClick={() => setPhotos(true)} aria-label={`Open photo ${i + 1} of 5`}><StayImage s={s} variant={i} className="tv-g-img" /></button>)}
          <Button className="tv-g-all" icon="image" onClick={() => setPhotos(true)}>Show all photos</Button>
        </div>

        <div className="tv-stay-grid">
          <div className="tv-stay-main">
            <section aria-labelledby="ov"><h2 id="ov" className="tv-h3">About this stay</h2><p className="muted tv-prose">{s.description}</p>
              <ul className="tv-hl">{s.highlights.map(h => <li key={h}><Icon name="check" size={15} />{h}</li>)}</ul></section>

            <section aria-labelledby="am"><h2 id="am" className="tv-h3">Amenities</h2>
              <ul className="tv-amen">{s.amenities.map(a => <li key={a}>{a}</li>)}</ul></section>

            <section aria-labelledby="rm">
              <h2 id="rm" className="tv-h3">Rooms</h2>
              {Dates}
              <ul className="tv-rooms">
                {s.rooms.map(r => {
                  const rb = breakdown(s, r, q)
                  const ok = r.sleeps * q.rooms >= guests
                  const sel = r.id === room.id
                  return (
                    <li key={r.id} className={`tv-room ${sel ? 'sel' : ''}`}>
                      <div className="tv-room-info">
                        <div className="tv-room-name">{r.name}</div>
                        <div className="muted">{r.beds}. Sleeps {r.sleeps}</div>
                        {r.left <= 2 && ok && !out && <div className="tv-strong tv-room-left">Only {r.left} left</div>}
                      </div>
                      <div className="tv-room-price num">
                        <div><span className="tv-strong">{money(rb.perNight, cur)}</span> <span className="muted">night</span></div>
                        <div className="muted">{money(rb.total, cur)} total</div>
                      </div>
                      <Button className="tv-room-btn" disabled={!ok} aria-pressed={sel} icon={sel ? 'check' : undefined} onClick={() => upd({}, r.id)}>{!ok ? `Sleeps ${r.sleeps}` : sel ? 'Selected' : 'Select'}</Button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section aria-labelledby="av">
              <h2 id="av" className="tv-h3">Availability</h2>
              <p className="muted tv-prose">Crossed-out dates are already booked.</p>
              <RangeCalendar start={q.checkIn} end={q.checkOut} readOnly loc={loc} months={narrow ? 1 : 2} unavailable={iso => unavailable(s, iso)} />
            </section>

            <section aria-labelledby="rv">
              <h2 id="rv" className="tv-h3">Guest reviews</h2>
              <div className="tv-rev-sum">
                <div><div className="tv-bigscore num">{s.rating.toFixed(1)}</div><div className="tv-strong">{ratingWord(s.rating)}</div><div className="muted num">{s.reviews.toLocaleString('en-GB')} reviews</div></div>
                <div className="tv-bars">{reviewBars.map(x => <div key={x.n} className="tv-bar-row"><span className="num muted">{x.n}</span><span className="tv-bar"><span style={{ width: `${Math.min(100, x.pct)}%` }} /></span></div>)}</div>
              </div>
              <ul className="tv-quotes">{s.quotes.map(rv => <li key={rv.by}><div className="row" style={{ justifyContent: 'space-between' }}><span className="tv-strong">{rv.by}</span><span className="faint">{rv.when}</span></div><p className="muted">{rv.text}</p></li>)}</ul>
            </section>
          </div>

          {!mobile && (
            <aside className="tv-resv" aria-label="Reservation">
              <div className="tv-resv-price"><span className="num tv-price">{money(b.perNight, cur)}</span><span className="muted"> night</span></div>
              {Dates}
              <div className="tv-resv-room muted">{room.name}{!fits && <span className="tv-warn"> (sleeps {room.sleeps}, choose another room)</span>}</div>
              <Breakdown b={b} cur={cur} />
              <Button variant="primary" size="lg" className="tv-resv-btn" disabled={out || !fits} onClick={reserve}>{out ? 'Not available' : 'Reserve'}</Button>
              {out && <p className="muted tv-resv-note">Booked on at least one night between {fmtRange(q.checkIn, q.checkOut, loc)}. Try other dates.</p>}
            </aside>
          )}
        </div>
      </div>

      {mobile && (
        <div className="tv-bottombar">
          <div><div className="num tv-strong">{out ? 'Unavailable' : money(b.total, cur)}</div><div className="muted num">{b.nights} {b.nights === 1 ? 'night' : 'nights'}, {guests} {guests === 1 ? 'guest' : 'guests'}</div></div>
          <Button variant="primary" size="lg" disabled={out || !fits} onClick={reserve}>Reserve</Button>
        </div>
      )}

      <Dialog open={photos} onClose={() => setPhotos(false)} title={`${s.name}, photos`} width={720} footer={<Button onClick={() => setPhotos(false)} data-autofocus>Close</Button>}>
        <div className="tv-photos">{[0, 1, 2, 3, 4].map(i => <StayImage key={i} s={s} variant={i} className="tv-photo" />)}</div>
      </Dialog>
    </div>
  )
}

export function Breakdown({ b, cur }: { b: ReturnType<typeof breakdown>; cur: 'GBP' | 'EUR' | 'USD' }) {
  return (
    <dl className="tv-break">
      <div><dt className="muted num">{money(b.nightly, cur)} x {b.nights} {b.nights === 1 ? 'night' : 'nights'}{b.rooms > 1 ? ` x ${b.rooms} rooms` : ''}</dt><dd className="num">{money(b.subtotal, cur)}</dd></div>
      {b.fees > 0 && <div><dt className="muted">Cleaning fee</dt><dd className="num">{money(b.fees, cur)}</dd></div>}
      <div><dt className="muted">Taxes</dt><dd className="num">{money(b.taxes, cur)}</dd></div>
      <div className="total"><dt>Total</dt><dd className="num">{money(b.total, cur)}</dd></div>
    </dl>
  )
}

export type { Stay }
