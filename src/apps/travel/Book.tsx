import { useEffect, useMemo, useState } from 'react'
import { Button, Dropdown, Icon, Switch, useMedia } from '../../ui'
import { breakdown, cheapestRoom, destById, fmtRange, guestsOf, hash, money, qToString, soldOut, stayById, type Query, type Stay } from './data'
import { Field, StayImage } from './parts'
import { Breakdown } from './Stay'
import { go, useTravel, type Trip } from './store'

type Details = { first: string; last: string; email: string; phone: string; arrival: string; requests: string }
type Pay = { number: string; name: string; exp: string; cvc: string; zip: string }
const STEPS = ['Traveller details', 'Payment', 'Review']
const ARRIVAL = ['I do not know yet', '12:00 to 14:00', '14:00 to 16:00', '16:00 to 18:00', '18:00 to 20:00', 'After 20:00'].map(v => ({ value: v, label: v }))

const digits = (s: string) => s.replace(/\D/g, '')
const fmtCard = (s: string) => { const d = digits(s); const amex = /^3[47]/.test(d); const m = amex ? d.slice(0, 15) : d.slice(0, 16); return amex ? [m.slice(0, 4), m.slice(4, 10), m.slice(10)].filter(Boolean).join(' ') : (m.match(/.{1,4}/g) ?? []).join(' ') }
const fmtExp = (s: string) => { const d = digits(s).slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d }
const brand = (n: string) => { const d = digits(n); return /^4/.test(d) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(d) ? 'Mastercard' : /^3[47]/.test(d) ? 'Amex' : '' }

function validateDetails(d: Details) {
  const e: Partial<Record<keyof Details, string>> = {}
  if (d.first.trim().length < 2) e.first = 'Enter your first name.'
  if (d.last.trim().length < 2) e.last = 'Enter your last name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Enter a valid email address.'
  if (d.phone.trim() && !/^[+\d][\d\s()-]{6,18}$/.test(d.phone.trim())) e.phone = 'Enter a valid phone number or leave it empty.'
  return e
}
function validatePay(p: Pay) {
  const e: Partial<Record<keyof Pay, string>> = {}
  const n = digits(p.number)
  if (n.length < 15 || n.length > 16) e.number = 'Enter a 15 or 16 digit card number.'
  if (p.name.trim().length < 3) e.name = 'Enter the name on the card.'
  const [mm, yy] = p.exp.split('/')
  const m = Number(mm), y = 2000 + Number(yy)
  if (!/^\d{2}\/\d{2}$/.test(p.exp) || m < 1 || m > 12) e.exp = 'Use the format MM/YY.'
  else if (y * 12 + m < 2026 * 12 + 10) e.exp = 'This card has expired.'
  if (!/^\d{3,4}$/.test(p.cvc)) e.cvc = 'Enter the 3 or 4 digit code.'
  if (p.zip.trim().length < 3) e.zip = 'Enter your billing postcode.'
  return e
}

function Summary({ s, roomName, q, b }: { s: Stay; roomName: string; q: Query; b: ReturnType<typeof breakdown> }) {
  const { cur, loc } = useTravel()
  const d = destById(s.dest)!
  return (
    <div className="tv-sum">
      <div className="tv-sum-head">
        <StayImage s={s} className="tv-sum-img" />
        <div><div className="tv-strong">{s.name}</div><div className="muted">{s.area}, {d.name}</div></div>
      </div>
      <dl className="tv-sum-meta">
        <div><dt className="muted">Dates</dt><dd className="num">{fmtRange(q.checkIn, q.checkOut, loc)}</dd></div>
        <div><dt className="muted">Guests</dt><dd className="num">{guestsOf(q)} {guestsOf(q) === 1 ? 'guest' : 'guests'}, {q.rooms} {q.rooms === 1 ? 'room' : 'rooms'}</dd></div>
        <div><dt className="muted">Room</dt><dd>{roomName}</dd></div>
        <div><dt className="muted">Cancellation</dt><dd>{s.cancel ? 'Free until 48 hours before check-in' : 'Non-refundable'}</dd></div>
      </dl>
      <Breakdown b={b} cur={cur} />
    </div>
  )
}

export function BookPage({ id, q, roomId }: { id: string; q: Query; roomId: string | null }) {
  const s = stayById(id)
  const { cur, trips, addTrip } = useTravel()
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Details>({ first: '', last: '', email: '', phone: '', arrival: ARRIVAL[0].value, requests: '' })
  const [p, setP] = useState<Pay>({ number: '', name: '', exp: '', cvc: '', zip: '' })
  const [de, setDe] = useState<Partial<Record<keyof Details, string>>>({})
  const [pe, setPe] = useState<Partial<Record<keyof Pay, string>>>({})
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [sumOpen, setSumOpen] = useState(false)
  const mobile = useMedia('(max-width: 900px)')
  useEffect(() => { document.querySelector('.tv-scroll')?.scrollTo({ top: 0 }) }, [step, trip])

  const room = useMemo(() => (s ? s.rooms.find(r => r.id === roomId) ?? cheapestRoom(s, q) : null), [s, roomId, q])
  if (!s || !room) return <div className="tv-page"><div className="tv-wrap tv-empty"><h1 className="tv-h3">Stay not found</h1><Button onClick={() => go('')}>Back to search</Button></div></div>
  const b = breakdown(s, room, q)
  const gone = soldOut(s, q)

  const setDet = (k: keyof Details) => (e: { target: { value: string } }) => { setD(x => ({ ...x, [k]: e.target.value })); if (de[k]) setDe(x => ({ ...x, [k]: '' })) }
  const setPy = (k: keyof Pay, f: (v: string) => string = v => v) => (e: { target: { value: string } }) => { setP(x => ({ ...x, [k]: f(e.target.value) })); if (pe[k]) setPe(x => ({ ...x, [k]: '' })) }

  const next = () => {
    if (step === 0) { const e = validateDetails(d); setDe(e); if (!Object.keys(e).length) setStep(1) }
    else if (step === 1) { const e = validatePay(p); setPe(e); if (!Object.keys(e).length) setStep(2) }
  }
  const confirm = () => {
    if (!agree || busy) return
    setBusy(true)
    setTimeout(() => {
      const ref = 'WF-' + hash(s.id + d.email + trips.length + Date.now()).toString(36).toUpperCase().padEnd(6, 'X').slice(0, 6)
      setTrip({ id: ref, ref, stayId: s.id, roomId: room.id, q, total: b.total, name: `${d.first.trim()} ${d.last.trim()}`, email: d.email.trim(), status: 'confirmed', booked: '2026-10-27' })
      setBusy(false)
    }, 1300)
  }

  if (trip) {
    return (
      <div className="tv-page">
        <div className="tv-wrap tv-confirm">
          <div className="tv-confirm-icon"><Icon name="circle-check" size={28} /></div>
          <h1 className="tv-h1s">Your stay is booked</h1>
          <p className="muted">A confirmation has been sent to {trip.email}.</p>
          <div className="tv-ref"><span className="eyebrow">Booking reference</span><span className="tv-ref-code num">{trip.ref}</span></div>
          <div className="tv-confirm-card"><Summary s={s} roomName={room.name} q={q} b={b} /></div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="primary" size="lg" onClick={() => { addTrip(trip); go('/trips') }}>Add to trips</Button>
            <Button size="lg" onClick={() => go('')}>Back to search</Button>
          </div>
        </div>
      </div>
    )
  }

  const summary = <Summary s={s} roomName={room.name} q={q} b={b} />

  return (
    <div className="tv-page">
      <div className="tv-wrap">
        <button type="button" className="tv-back" onClick={() => (step > 0 ? setStep(step - 1) : go(`/stay/${s.id}?${qToString(q, { room: room.id })}`))}><Icon name="chevron-left" size={16} /> {step > 0 ? 'Back' : `Back to ${s.name}`}</button>
        <ol className="tv-stepper" aria-label="Booking steps">
          {STEPS.map((t, i) => (
            <li key={t} aria-current={i === step ? 'step' : undefined} className={i < step ? 'done' : ''}>
              <button type="button" disabled={i >= step} onClick={() => setStep(i)}>
                <span className="tv-step-n">{i < step ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}</span><span className="tv-step-t">{t}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="tv-book-grid">
          <form className="tv-form" noValidate onSubmit={e => { e.preventDefault(); if (step < 2) next(); else confirm() }}>
            {mobile && (
              <div className="tv-sum-toggle">
                <button type="button" aria-expanded={sumOpen} onClick={() => setSumOpen(o => !o)}><span>Price details</span><span className="num tv-strong">{money(b.total, cur)}</span><Icon name={sumOpen ? 'chevron-up' : 'chevron-down'} size={15} /></button>
                {sumOpen && summary}
              </div>
            )}
            {gone && <div className="tv-banner" role="alert">This stay is no longer available for your dates. Go back and choose other dates.</div>}

            {step === 0 && (
              <>
                <h1 className="tv-h2s">Traveller details</h1>
                <div className="tv-two">
                  <Field label="First name" error={de.first}>{x => <input {...x} className="input" value={d.first} onChange={setDet('first')} autoComplete="given-name" data-autofocus />}</Field>
                  <Field label="Last name" error={de.last}>{x => <input {...x} className="input" value={d.last} onChange={setDet('last')} autoComplete="family-name" />}</Field>
                </div>
                <Field label="Email" error={de.email} hint="Your confirmation is sent here.">{x => <input {...x} className="input" type="email" value={d.email} onChange={setDet('email')} autoComplete="email" />}</Field>
                <Field label="Phone (optional)" error={de.phone}>{x => <input {...x} className="input" type="tel" value={d.phone} onChange={setDet('phone')} autoComplete="tel" />}</Field>
                <div className="tv-fld"><span className="tv-label" id="arr-l">Estimated arrival</span><Dropdown label="Estimated arrival" value={d.arrival} options={ARRIVAL} onChange={v => setD(x => ({ ...x, arrival: v }))} width="anchor" /></div>
                <Field label="Special requests (optional)">{x => <textarea {...x} className="input tv-area" rows={3} value={d.requests} onChange={setDet('requests')} />}</Field>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="tv-h2s">Payment</h1>
                <Field label="Card number" error={pe.number} hint={brand(p.number) || undefined}>{x => <input {...x} className="input" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={p.number} onChange={setPy('number', fmtCard)} data-autofocus />}</Field>
                <Field label="Name on card" error={pe.name}>{x => <input {...x} className="input" autoComplete="cc-name" value={p.name} onChange={setPy('name')} />}</Field>
                <div className="tv-three">
                  <Field label="Expiry" error={pe.exp}>{x => <input {...x} className="input" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={p.exp} onChange={setPy('exp', fmtExp)} />}</Field>
                  <Field label="Security code" error={pe.cvc}>{x => <input {...x} className="input" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={p.cvc} onChange={setPy('cvc', v => digits(v).slice(0, 4))} />}</Field>
                  <Field label="Billing postcode" error={pe.zip}>{x => <input {...x} className="input" autoComplete="postal-code" value={p.zip} onChange={setPy('zip')} />}</Field>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="tv-h2s">Review and confirm</h1>
                <dl className="tv-review">
                  <div><dt className="muted">Traveller</dt><dd>{d.first} {d.last}<br />{d.email}{d.phone ? <><br />{d.phone}</> : null}</dd></div>
                  <div><dt className="muted">Arrival</dt><dd>{d.arrival}</dd></div>
                  {d.requests.trim() && <div><dt className="muted">Requests</dt><dd>{d.requests}</dd></div>}
                  <div><dt className="muted">Payment</dt><dd className="num">{brand(p.number) || 'Card'} ending {digits(p.number).slice(-4)}</dd></div>
                </dl>
                <label className="tv-terms"><Switch checked={agree} onChange={setAgree} label="Agree to the booking terms and cancellation policy" /><span>I agree to the booking terms and the cancellation policy: {s.cancel ? 'free cancellation until 48 hours before check-in' : 'this rate is non-refundable'}.</span></label>
              </>
            )}

            <div className="tv-form-foot">
              {step < 2
                ? <Button type="submit" variant="primary" size="lg" disabled={gone}>{step === 0 ? 'Continue to payment' : 'Review booking'}</Button>
                : <Button type="submit" variant="primary" size="lg" disabled={!agree || busy || gone}>{busy ? <><span className="spinner" /> Processing</> : `Confirm and pay ${money(b.total, cur)}`}</Button>}
            </div>
          </form>

          {!mobile && <aside className="tv-sum-wrap" aria-label="Price summary">{summary}</aside>}
        </div>
      </div>
    </div>
  )
}
