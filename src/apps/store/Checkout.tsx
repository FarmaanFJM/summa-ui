import { useMemo, useState } from 'react'
import { Button, Dropdown } from '../../ui'
import { SI } from './icons'
import { LineRow, Promo } from './Cart'
import { MiniHeader } from './Header'
import { SHIPPING, addDays, fmtDate, money2 } from './data'
import { go, href } from './router'
import { keyOf, totals, useShop, type Order } from './state'

export const nav = { last: href.home }

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia']
type F = { email: string; name: string; address: string; city: string; postcode: string; country: string; ship: string; card: string; exp: string; cvc: string; holder: string }
const init: F = { email: '', name: '', address: '', city: '', postcode: '', country: 'United States', ship: 'standard', card: '', exp: '', cvc: '', holder: '' }

const luhn = (n: string) => { let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9 } s += d; alt = !alt } return s % 10 === 0 }
const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
const fmtExp = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }

function validate(f: F): Record<string, string> {
  const e: Record<string, string> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = 'Enter a valid email address'
  if (f.name.trim().split(/\s+/).length < 2) e.name = 'Enter your first and last name'
  if (f.address.trim().length < 4) e.address = 'Enter your street address'
  if (!f.city.trim()) e.city = 'Enter your city'
  if (f.postcode.trim().length < 3) e.postcode = 'Enter a postcode'
  const digits = f.card.replace(/\s/g, '')
  if (digits.length !== 16) e.card = 'Enter the 16 digits on your card'
  else if (!luhn(digits)) e.card = 'This card number is not valid'
  const m = /^(\d\d)\/(\d\d)$/.exec(f.exp)
  if (!m || +m[1] < 1 || +m[1] > 12) e.exp = 'Use the format MM/YY'
  else if (2000 + +m[2] < 2026 || (2000 + +m[2] === 2026 && +m[1] < 10)) e.exp = 'This card has expired'
  if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = 'Enter 3 or 4 digits'
  if (f.holder.trim().length < 2) e.holder = 'Enter the name on the card'
  return e
}
const STEP_FIELDS: string[][] = [['email', 'name'], ['address', 'city', 'postcode'], ['card', 'exp', 'cvc', 'holder'], []]
const STEPS = ['Contact', 'Delivery', 'Payment', 'Review']

function Field({ id, label, err, show, children }: { id: string; label: string; err?: string; show: boolean; children: React.ReactNode }) {
  return (
    <div className="st-field">
      <label htmlFor={id} className="st-label">{label}</label>
      {children}
      {show && err && <div className="st-err" id={id + '-e'} role="alert">{err}</div>}
    </div>
  )
}

export function Checkout() {
  const { lines, promo, openDrawer, place, clear, orders } = useShop()
  const [f, setF] = useState<F>(init)
  const [step, setStep] = useState(0)
  const [tried, setTried] = useState<Record<number, boolean>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [placing, setPlacing] = useState(false)
  const errs = useMemo(() => validate(f), [f])
  const t = totals(lines, promo, f.ship)
  const set = (k: keyof F) => (v: string) => setF(x => ({ ...x, [k]: v }))
  const show = (k: string, s: number) => !!touched[k] || !!tried[s]
  const inp = (k: keyof F, s: number, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`co-${k}`} className="input st-input" value={f[k]} aria-invalid={show(k, s) && !!errs[k]} aria-describedby={show(k, s) && errs[k] ? `co-${k}-e` : undefined}
      onChange={e => set(k)(extra.inputMode === 'numeric' && k === 'card' ? fmtCard(e.target.value) : k === 'exp' ? fmtExp(e.target.value) : k === 'cvc' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value)}
      onBlur={() => setTouched(x => ({ ...x, [k]: true }))} {...extra} />
  )
  const next = (s: number) => {
    setTried(x => ({ ...x, [s]: true }))
    if (STEP_FIELDS[s].some(k => errs[k])) return
    setStep(s + 1)
  }
  const placeOrder = () => {
    const bad = STEP_FIELDS.findIndex(fs => fs.some(k => errs[k]))
    if (bad >= 0) { setTried(x => ({ ...x, [bad]: true })); setStep(bad); return }
    setPlacing(true)
    window.setTimeout(() => {
      const ref = `OE-${48210 + orders.length * 17}`
      const o: Order = { ref, lines, promo, ship: f.ship, email: f.email, name: f.name, address: `${f.address}, ${f.city} ${f.postcode}, ${f.country}`, card: f.card.replace(/\s/g, '').slice(-4), subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total, placed: new Date('2026-10-27T12:00:00').toISOString() }
      place(o); clear(); go(href.order(ref))
    }, 1100)
  }

  const head = (i: number, summary?: React.ReactNode) => (
    <div className="st-step-head">
      <span className="st-step-n num" data-done={step > i}>{step > i ? <SI name="check" size={13} strokeWidth={2.6} /> : i + 1}</span>
      <h2 data-future={step < i}>{STEPS[i]}</h2>
      {step > i && <button type="button" className="st-linkbtn" onClick={() => setStep(i)}>Edit</button>}
      {step > i && summary && <div className="st-step-sum muted">{summary}</div>}
    </div>
  )

  if (lines.length === 0 && !placing) {
    return (
      <>
        <MiniHeader right={<a className="btn btn-ghost" href={href.cat('all')}>Continue shopping</a>} />
        <div className="st-page"><div className="st-empty"><SI name="bag" size={24} /><strong>Your bag is empty</strong><span className="muted">Add something to your bag to check out.</span><a className="btn btn-primary" href={href.cat('all')}>Browse the shop</a></div></div>
      </>
    )
  }
  return (
    <>
      <MiniHeader right={<Button variant="ghost" icon="chevron-left" onClick={() => { go(nav.last); openDrawer() }}>Back to bag</Button>} />
      <div className="st-co">
        <div className="st-co-form">
          <h1 className="sr-only">Checkout</h1>
          <section className="st-step" aria-label="Contact">
            {head(0, <>{f.name}, {f.email}</>)}
            {step === 0 && (
              <form className="st-step-body" noValidate onSubmit={e => { e.preventDefault(); next(0) }}>
                <Field id="co-email" label="Email" err={errs.email} show={show('email', 0)}>{inp('email', 0, { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}</Field>
                <Field id="co-name" label="Full name" err={errs.name} show={show('name', 0)}>{inp('name', 0, { autoComplete: 'name' })}</Field>
                <div><Button type="submit" variant="primary" size="lg">Continue to delivery</Button></div>
              </form>
            )}
          </section>
          <section className="st-step" aria-label="Delivery">
            {head(1, <>{f.address}, {f.city}, {SHIPPING.find(s => s.id === f.ship)?.label}</>)}
            {step === 1 && (
              <form className="st-step-body" noValidate onSubmit={e => { e.preventDefault(); next(1) }}>
                <Field id="co-address" label="Street address" err={errs.address} show={show('address', 1)}>{inp('address', 1, { autoComplete: 'street-address' })}</Field>
                <div className="st-two">
                  <Field id="co-city" label="City" err={errs.city} show={show('city', 1)}>{inp('city', 1, { autoComplete: 'address-level2' })}</Field>
                  <Field id="co-postcode" label="Postcode" err={errs.postcode} show={show('postcode', 1)}>{inp('postcode', 1, { autoComplete: 'postal-code' })}</Field>
                </div>
                <div className="st-field"><span className="st-label">Country</span><Dropdown label="Country" options={COUNTRIES.map(c => ({ value: c, label: c }))} value={f.country} onChange={set('country')} className="st-select" /></div>
                <div className="st-field">
                  <span className="st-label" id="co-ship-l">Delivery method</span>
                  <div className="st-methods" role="radiogroup" aria-labelledby="co-ship-l">
                    {SHIPPING.map(s => {
                      const price = totals(lines, promo, s.id).shipping
                      return (
                        <button key={s.id} type="button" role="radio" aria-checked={f.ship === s.id} className="st-method" onClick={() => set('ship')(s.id)}>
                          <span className="st-radio-dot" />
                          <span className="grow"><strong>{s.label}</strong><span className="muted st-sm" style={{ display: 'block' }}>{s.eta}, by {fmtDate(addDays(s.days))}</span></span>
                          <span className="num">{price === 0 ? 'Free' : money2(price)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div><Button type="submit" variant="primary" size="lg">Continue to payment</Button></div>
              </form>
            )}
          </section>
          <section className="st-step" aria-label="Payment">
            {head(2, <>Card ending {f.card.replace(/\s/g, '').slice(-4)}</>)}
            {step === 2 && (
              <form className="st-step-body" noValidate onSubmit={e => { e.preventDefault(); next(2) }}>
                <Field id="co-card" label="Card number" err={errs.card} show={show('card', 2)}>{inp('card', 2, { inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '4242 4242 4242 4242' })}</Field>
                <div className="st-two">
                  <Field id="co-exp" label="Expiry" err={errs.exp} show={show('exp', 2)}>{inp('exp', 2, { inputMode: 'numeric', autoComplete: 'cc-exp', placeholder: 'MM/YY' })}</Field>
                  <Field id="co-cvc" label="CVC" err={errs.cvc} show={show('cvc', 2)}>{inp('cvc', 2, { inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123' })}</Field>
                </div>
                <Field id="co-holder" label="Name on card" err={errs.holder} show={show('holder', 2)}>{inp('holder', 2, { autoComplete: 'cc-name' })}</Field>
                <div><Button type="submit" variant="primary" size="lg">Review order</Button></div>
              </form>
            )}
          </section>
          <section className="st-step" aria-label="Review">
            {head(3)}
            {step === 3 && (
              <div className="st-step-body">
                <dl className="st-review">
                  <div><dt className="eyebrow">Contact</dt><dd>{f.name}<br />{f.email}</dd></div>
                  <div><dt className="eyebrow">Deliver to</dt><dd>{f.address}<br />{f.city} {f.postcode}, {f.country}</dd></div>
                  <div><dt className="eyebrow">Delivery</dt><dd>{SHIPPING.find(s => s.id === f.ship)?.label}, by {fmtDate(addDays(SHIPPING.find(s => s.id === f.ship)!.days))}</dd></div>
                  <div><dt className="eyebrow">Payment</dt><dd>Card ending {f.card.replace(/\s/g, '').slice(-4)}</dd></div>
                </dl>
                <div><Button variant="primary" size="lg" disabled={placing} onClick={placeOrder}>{placing ? <><span className="spinner" /> Placing order</> : `Place order, ${money2(t.total)}`}</Button></div>
              </div>
            )}
          </section>
        </div>
        <aside className="st-co-sum" aria-label="Order summary">
          <h2 className="st-fh">Order summary</h2>
          <ul className="st-lines compact">{lines.map(l => <LineRow key={keyOf(l)} l={l} compact />)}</ul>
          <Promo />
          <dl className="st-totals">
            <div><dt className="muted">Subtotal</dt><dd className="num">{money2(t.subtotal)}</dd></div>
            {t.discount > 0 && <div><dt className="muted">Discount ({promo})</dt><dd className="num">-{money2(t.discount)}</dd></div>}
            <div><dt className="muted">Delivery</dt><dd className="num">{t.shipping === 0 ? 'Free' : money2(t.shipping)}</dd></div>
            <div className="st-total"><dt>Total</dt><dd className="num">{money2(t.total)}</dd></div>
          </dl>
        </aside>
      </div>
    </>
  )
}

export function OrderPage({ refId }: { refId: string }) {
  const { orders } = useShop()
  const o = orders.find(x => x.ref === refId)
  if (!o) {
    return (
      <>
        <MiniHeader />
        <div className="st-page"><div className="st-empty"><strong>We could not find that order</strong><span className="muted">It may have been placed in a different browser.</span><a className="btn btn-secondary" href={href.home}>Back to the shop</a></div></div>
      </>
    )
  }
  const m = SHIPPING.find(s => s.id === o.ship)!
  return (
    <>
      <MiniHeader right={<a className="btn btn-ghost" href={href.cat('all')}>Continue shopping</a>} />
      <div className="st-order">
        <div className="st-order-head">
          <span className="st-okmark"><SI name="check" size={22} strokeWidth={2.4} /></span>
          <h1>Thank you, {o.name.split(' ')[0]}</h1>
          <p className="muted">Your order is confirmed. A receipt has been sent to {o.email}.</p>
        </div>
        <dl className="st-order-meta">
          <div><dt className="eyebrow">Order reference</dt><dd className="num">{o.ref}</dd></div>
          <div><dt className="eyebrow">Arrives by</dt><dd>{fmtDate(addDays(m.days))}</dd></div>
          <div><dt className="eyebrow">Deliver to</dt><dd>{o.address}</dd></div>
          <div><dt className="eyebrow">Payment</dt><dd>Card ending {o.card}</dd></div>
        </dl>
        <h2 className="st-fh">Receipt</h2>
        <ul className="st-lines compact receipt">{o.lines.map(l => <LineRow key={keyOf(l)} l={l} compact />)}</ul>
        <dl className="st-totals">
          <div><dt className="muted">Subtotal</dt><dd className="num">{money2(o.subtotal)}</dd></div>
          {o.discount > 0 && <div><dt className="muted">Discount ({o.promo})</dt><dd className="num">-{money2(o.discount)}</dd></div>}
          <div><dt className="muted">Delivery ({m.label})</dt><dd className="num">{o.shipping === 0 ? 'Free' : money2(o.shipping)}</dd></div>
          <div className="st-total"><dt>Total paid</dt><dd className="num">{money2(o.total)}</dd></div>
        </dl>
        <div><a className="btn btn-primary btn-lg" href={href.cat('all')}>Continue shopping</a></div>
      </div>
    </>
  )
}
