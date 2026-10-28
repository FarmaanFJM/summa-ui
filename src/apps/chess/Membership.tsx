import { useState } from 'react'
import { Button, Dialog, Icon, Tabs, useMedia } from '../../ui'
import { FEATURES, TIERS, gbp, type Tier } from './data'
import { Band, BandHead, Field } from './parts'

export type Billing = 'monthly' | 'yearly'
export type Joined = { tier: string; billing: Billing; name: string; number: string }

const price = (t: Tier, b: Billing) => (b === 'monthly' ? t.monthly : t.yearly)
const per = (b: Billing) => (b === 'monthly' ? 'per month' : 'per year')

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Icon name="check" size={16} aria-label="Included" role="img" />
  if (v === false) return <span className="sr-only">Not included</span>
  return <span>{v}</span>
}

export function Membership({ joined, openJoin }: { joined: Joined | null; openJoin: (tier?: string) => void }) {
  const [billing, setBilling] = useState<Billing>('yearly')
  const narrow = useMedia('(max-width: 860px)')

  const action = (t: Tier) => joined?.tier === t.id
    ? <Button disabled icon="check">Your plan</Button>
    : <Button onClick={() => openJoin(t.id)}>{joined ? 'Switch' : 'Join'} {t.name}</Button>

  return (
    <Band id="membership" tone="a">
      <BandHead title="Membership" sub={billing === 'yearly' ? 'Yearly billing includes two months free.' : undefined}>
        <Tabs label="Billing period" value={billing} onChange={setBilling} items={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />
      </BandHead>

      {!narrow ? (
        <table className="cc-compare">
          <caption className="sr-only">Membership tiers compared</caption>
          <thead>
            <tr>
              <td />
              {TIERS.map(t => (
                <th key={t.id} scope="col" className={t.id === 'member' ? 'feat' : ''}>
                  <div className="cc-tier-name">{t.name}</div>
                  <div className="cc-tier-price num"><span>{gbp(price(t, billing))}</span><span className="muted cc-per">{per(billing)}</span></div>
                  <div className="muted cc-tier-blurb">{t.blurb}</div>
                  {action(t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(f => (
              <tr key={f.label}>
                <th scope="row" className="cc-feat-label muted">{f.label}</th>
                {f.values.map((v, i) => <td key={i} className={TIERS[i].id === 'member' ? 'feat' : ''}><Cell v={v} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="cc-tier-cards">
          {TIERS.map((t, ti) => (
            <article key={t.id} className={`cc-tier-card ${t.id === 'member' ? 'feat' : ''}`}>
              <div className="cc-tier-name">{t.name}</div>
              <div className="cc-tier-price num"><span>{gbp(price(t, billing))}</span><span className="muted cc-per">{per(billing)}</span></div>
              <div className="muted cc-tier-blurb">{t.blurb}</div>
              <ul className="cc-tier-list">
                {FEATURES.filter(f => f.values[ti] !== false).map(f => (
                  <li key={f.label}><Icon name="check" size={15} /><span>{f.label}{typeof f.values[ti] === 'string' ? `: ${f.values[ti]}` : ''}</span></li>
                ))}
              </ul>
              {action(t)}
            </article>
          ))}
        </div>
      )}
    </Band>
  )
}

export function JoinDialog({ open, tierId, onClose, onJoin, count }: { open: boolean; tierId: string; onClose: () => void; onJoin: (j: Joined) => void; count: number }) {
  const [tier, setTier] = useState(tierId)
  const [billing, setBilling] = useState<Billing>('yearly')
  const [v, setV] = useState({ name: '', email: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [done, setDone] = useState<Joined | null>(null)
  const [lastOpen, setLastOpen] = useState(false)

  // Re-sync the preselected tier each time the dialog opens
  if (open !== lastOpen) { setLastOpen(open); if (open) { setTier(tierId); setDone(null); setErr({}) } }

  const t = TIERS.find(x => x.id === tier)!
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const er: Record<string, string> = {}
    if (v.name.trim().length < 2) er.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) er.email = 'Enter a valid email address.'
    setErr(er)
    if (Object.keys(er).length) return
    const j = { tier, billing, name: v.name.trim(), number: `NCC-${1040 + count}` }
    setDone(j); onJoin(j)
  }

  return (
    <Dialog
      open={open} onClose={onClose} title={done ? `Welcome to Northgate, ${done.name.split(' ')[0]}` : 'Join the club'} width={460}
      footer={done ? <Button variant="primary" data-autofocus onClick={onClose}>Done</Button> : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => submit()}>Join the club</Button></>}
    >
      {done ? (
        <div className="cc-success">
          <Icon name="circle-check" size={20} />
          <div className="col" style={{ gap: 6 }}>
            <p className="muted">Your {TIERS.find(x => x.id === done.tier)!.name} plan is active. Membership number <span className="num">{done.number}</span>.</p>
            <p className="muted">Pay {gbp(price(TIERS.find(x => x.id === done.tier)!, done.billing))} {per(done.billing)} at the club on your first visit. Nothing is charged online.</p>
          </div>
        </div>
      ) : (
        <form className="cc-form" noValidate onSubmit={submit}>
          <Tabs label="Plan" value={tier} onChange={setTier} items={TIERS.map(x => ({ value: x.id, label: x.name }))} />
          <Tabs label="Billing period" value={billing} onChange={setBilling} items={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />
          <p className="muted num">{t.name}: {gbp(price(t, billing))} {per(billing)}. Pay at the club, no card needed.</p>
          <Field label="Full name" error={err.name}>{p => <input {...p} className="input" value={v.name} onChange={e => { setV(s => ({ ...s, name: e.target.value })); setErr(x => ({ ...x, name: '' })) }} autoComplete="name" data-autofocus />}</Field>
          <Field label="Email" error={err.email}>{p => <input {...p} className="input" type="email" value={v.email} onChange={e => { setV(s => ({ ...s, email: e.target.value })); setErr(x => ({ ...x, email: '' })) }} autoComplete="email" />}</Field>
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Join</button>
        </form>
      )}
    </Dialog>
  )
}
