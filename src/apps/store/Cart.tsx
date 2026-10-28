import { useState } from 'react'
import { Button, IconButton } from '../../ui'
import { SI } from './icons'
import { Art, Overlay, Stepper } from './parts'
import { PROMOS, byId, money2, priceOf } from './data'
import { go, href } from './router'
import { keyOf, totals, useShop, type Line } from './state'

export function LineRow({ l, compact }: { l: Line; compact?: boolean }) {
  const { setQty, remove } = useShop()
  const p = byId(l.pid)!
  return (
    <li className="st-line">
      <a className="st-line-img" href={href.product(p.id)} aria-label={p.name}><Art p={p} color={l.color} /></a>
      <div className="st-line-main">
        <a className="st-line-name" href={href.product(p.id)}>{p.name}</a>
        <span className="muted st-sm">{l.color}{l.size ? `, ${l.size}` : ''}</span>
        {!compact && <div className="row" style={{ marginTop: 6 }}><Stepper value={l.qty} onChange={n => setQty(keyOf(l), n)} label={`Quantity of ${p.name}`} /></div>}
      </div>
      <div className="st-line-side">
        <span className="num">{money2(priceOf(p, l.size) * l.qty)}</span>
        {!compact && <IconButton icon="trash" label={`Remove ${p.name}`} size="sm" onClick={() => remove(keyOf(l))} />}
        {compact && <span className="muted st-sm">Qty {l.qty}</span>}
      </div>
    </li>
  )
}

export function Promo() {
  const { promo, applyPromo, clearPromo } = useShop()
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  if (promo) {
    return <div className="st-promo-on row"><SI name="tag" size={15} /><span className="grow"><strong>{promo}</strong> <span className="muted">{PROMOS[promo].label}</span></span><button type="button" className="st-linkbtn" onClick={clearPromo}>Remove</button></div>
  }
  return (
    <form className="st-promo" onSubmit={e => { e.preventDefault(); const r = applyPromo(code); setErr(r); if (!r) setCode('') }} noValidate>
      <div className="row" style={{ gap: 8 }}>
        <input className="input" placeholder="Promo code" aria-label="Promo code" aria-invalid={!!err} aria-describedby={err ? 'st-promo-err' : undefined} value={code} onChange={e => { setCode(e.target.value); setErr(null) }} />
        <Button type="submit" variant="secondary">Apply</Button>
      </div>
      {err && <div id="st-promo-err" className="st-err" role="alert">{err}</div>}
    </form>
  )
}

export function Totals({ ship = 'standard', note }: { ship?: string; note?: string }) {
  const { lines, promo } = useShop()
  const t = totals(lines, promo, ship)
  return (
    <dl className="st-totals">
      <div><dt className="muted">Subtotal</dt><dd className="num">{money2(t.subtotal)}</dd></div>
      {t.discount > 0 && <div><dt className="muted">Discount ({promo})</dt><dd className="num">-{money2(t.discount)}</dd></div>}
      <div><dt className="muted">Delivery</dt><dd className="num">{t.shipping === 0 ? 'Free' : money2(t.shipping)}</dd></div>
      <div className="st-total"><dt>Total</dt><dd className="num">{money2(t.total)}</dd></div>
      {note && <div className="muted st-sm" style={{ display: 'block' }}>{note}</div>}
    </dl>
  )
}

export function CartDrawer() {
  const { lines, drawer, closeDrawer } = useShop()
  return (
    <Overlay open={drawer} onClose={closeDrawer} side="right" label="Shopping bag">
      <div className="st-sheet-head"><h2 className="st-fh">Bag{lines.length > 0 && <span className="muted num"> ({lines.reduce((s, l) => s + l.qty, 0)})</span>}</h2><IconButton icon="x" label="Close bag" onClick={closeDrawer} /></div>
      {lines.length === 0 ? (
        <div className="st-sheet-body st-empty" style={{ flex: 1 }}>
          <SI name="bag" size={24} /><strong>Your bag is empty</strong><span className="muted">Add something you love and it will wait here.</span>
          <Button variant="secondary" data-autofocus onClick={() => { closeDrawer(); go(href.cat('all')) }}>Continue shopping</Button>
        </div>
      ) : (
        <>
          <div className="st-sheet-body"><ul className="st-lines">{lines.map(l => <LineRow key={keyOf(l)} l={l} />)}</ul></div>
          <div className="st-sheet-foot col" style={{ gap: 14, alignItems: 'stretch' }}>
            <Promo />
            <Totals />
            <Button variant="primary" size="lg" onClick={() => { closeDrawer(); go(href.checkout) }}>Checkout</Button>
          </div>
        </>
      )}
    </Overlay>
  )
}
