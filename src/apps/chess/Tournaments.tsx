import { useState } from 'react'
import { Button, Dialog, Icon, Menu, Tabs, useAnchored } from '../../ui'
import { PAST, UPCOMING, fmtDate, gbp, type Tournament } from './data'
import { Band, BandHead, Field } from './parts'

const SORTED = [...UPCOMING].sort((a, b) => a.date.localeCompare(b.date))
export type Signups = Record<string, boolean>
export const spotsLeft = (t: Tournament, s: Signups) => Math.max(0, t.capacity - t.registered - (s[t.id] ? 1 : 0))

function DateBlock({ iso }: { iso: string }) {
  const [, m, d] = iso.split('-')
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]
  return <div className="cc-dateblock"><span className="num cc-dateblock-d">{Number(d)}</span><span className="eyebrow">{mon}</span></div>
}

function RegisteredButton({ onWithdraw }: { onWithdraw: () => void }) {
  const a = useAnchored()
  return (
    <>
      <Button ref={a.ref} icon="check" aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle}>Registered</Button>
      <Menu anchor={a.el} open={a.open} onClose={a.close} placement="bottom-end" label="Registration"
        items={[{ label: 'Withdraw', icon: 'x', danger: true, onSelect: onWithdraw }]} />
    </>
  )
}

export function Tournaments({ signups, setSignup }: { signups: Signups; setSignup: (id: string, v: boolean) => void }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [target, setTarget] = useState<Tournament | null>(null)

  return (
    <Band id="tournaments" tone="b">
      <BandHead title="Tournaments">
        <Tabs label="Tournament list" value={tab} onChange={setTab} items={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />
      </BandHead>

      {tab === 'upcoming' ? (
        <ul className="cc-list" aria-label="Upcoming tournaments">
          {SORTED.map(t => {
            const left = spotsLeft(t, signups)
            const mine = !!signups[t.id]
            return (
              <li key={t.id} className="cc-trow">
                <DateBlock iso={t.date} />
                <div className="cc-trow-main">
                  <div className="cc-trow-title">{t.name}</div>
                  <div className="muted cc-trow-meta">{fmtDate(t.date)} at {t.time}. {t.format}. {t.control}.</div>
                </div>
                <div className="cc-trow-entry num"><span className="faint cc-k">Entry</span>{gbp(t.entry)}</div>
                <div className={`cc-trow-spots num ${left <= 5 && left > 0 ? 'low' : ''}`}><span className="faint cc-k">Spots</span>{left === 0 ? 'Full' : `${left} left`}</div>
                <div className="cc-trow-act">
                  {mine ? <RegisteredButton onWithdraw={() => setSignup(t.id, false)} />
                    : <Button disabled={left === 0} onClick={() => setTarget(t)}>{left === 0 ? 'Full' : 'Register'}</Button>}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="cc-list" aria-label="Past tournaments">
          {PAST.map(t => (
            <li key={t.id} className="cc-trow past">
              <DateBlock iso={t.date} />
              <div className="cc-trow-main">
                <div className="cc-trow-title">{t.name}</div>
                <div className="muted cc-trow-meta">{t.format}. {t.control}.</div>
              </div>
              <div className="cc-trow-entry"><span className="faint cc-k">Winner</span>{t.winner}</div>
              <div className="cc-trow-spots num"><span className="faint cc-k">Players</span>{t.registered}</div>
            </li>
          ))}
        </ul>
      )}

      <RegisterDialog t={target} onClose={() => setTarget(null)} onDone={id => setSignup(id, true)} />
    </Band>
  )
}

function RegisterDialog({ t, onClose, onDone }: { t: Tournament | null; onClose: () => void; onDone: (id: string) => void }) {
  const [v, setV] = useState({ name: '', email: '', rating: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const close = () => { onClose(); setTimeout(() => { setDone(false); setErr({}) }, 150) }
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (v.name.trim().length < 2) er.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) er.email = 'Enter a valid email address.'
    if (v.rating.trim() && (!/^\d{3,4}$/.test(v.rating.trim()) || Number(v.rating) > 3000)) er.rating = 'Use a rating between 100 and 3000, or leave it empty.'
    setErr(er)
    if (Object.keys(er).length || !t) return
    onDone(t.id)
    setDone(true)
  }
  const set = (k: 'name' | 'email' | 'rating') => (e: React.ChangeEvent<HTMLInputElement>) => { setV(s => ({ ...s, [k]: e.target.value })); if (err[k]) setErr(x => ({ ...x, [k]: '' })) }

  return (
    <Dialog
      open={!!t} onClose={close} title={done ? 'You are registered' : t ? `Register for ${t.name}` : ''} width={440}
      footer={done
        ? <Button variant="primary" onClick={close} data-autofocus>Done</Button>
        : <><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" onClick={() => submit()}>Register</Button></>}
    >
      {t && done && (
        <div className="cc-success">
          <Icon name="circle-check" size={20} />
          <p className="muted">A confirmation has been sent to {v.email.trim()}. {t.name} is on {fmtDate(t.date)} at {t.time}. Pay the {gbp(t.entry)} entry fee at the door.</p>
        </div>
      )}
      {t && !done && (
        <form onSubmit={submit} noValidate className="cc-form">
          <p className="muted">{fmtDate(t.date)} at {t.time}. Entry {gbp(t.entry)}, paid at the door.</p>
          <Field label="Full name" error={err.name}>{p => <input {...p} className="input" value={v.name} onChange={set('name')} autoComplete="name" data-autofocus />}</Field>
          <Field label="Email" error={err.email}>{p => <input {...p} className="input" type="email" value={v.email} onChange={set('email')} autoComplete="email" />}</Field>
          <Field label="Rating (optional)" error={err.rating}>{p => <input {...p} className="input" inputMode="numeric" value={v.rating} onChange={set('rating')} placeholder="1500" />}</Field>
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Register</button>
        </form>
      )}
    </Dialog>
  )
}
