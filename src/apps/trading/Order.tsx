import { useState } from 'react'
import { Button, Dialog, Icon, Tabs } from '../../ui'
import { FEE, availCash, availQty, bestAsk, bestBid, inst, roundTo, type State } from './engine'
import { num, usd } from './fmt'

export type Form = { side: 'buy' | 'sell'; type: 'market' | 'limit' | 'stop'; price: string; size: string }
export const emptyForm: Form = { side: 'buy', type: 'limit', price: '', size: '' }

export type Draft = { sym: string; side: 'buy' | 'sell'; type: 'market' | 'limit' | 'stop'; price: number; qty: number }

function parse(v: string) { const n = Number(v.replace(/,/g, '')); return v.trim() === '' || !isFinite(n) ? NaN : n }

export function OrderEntry({ s, sym, form, setForm, onSubmit, sizeId }: { s: State; sym: string; form: Form; setForm: (f: Form) => void; onSubmit: (d: Draft) => { ok: boolean; msg: string }; sizeId: string }) {
  const i = inst(sym), m = s.mk[sym]
  const [touched, setTouched] = useState({ price: false, size: false })
  const [review, setReview] = useState<Draft | null>(null)
  const [err, setErr] = useState('')
  const { side, type } = form
  const price = parse(form.price), size = parse(form.size)
  const ref = type === 'market' ? (side === 'buy' ? bestAsk(s, sym) : bestBid(s, sym)) : isNaN(price) ? m.price : price
  const notional = isNaN(size) ? 0 : size * ref
  const fee = notional * FEE[type]
  const total = side === 'buy' ? notional + fee : notional - fee
  const cash = availCash(s), held = availQty(s, sym)

  const errors: { price?: string; size?: string } = {}
  if (type !== 'market') {
    if (isNaN(price) || price <= 0) errors.price = 'Enter a price greater than zero'
    else if (type === 'stop' && side === 'buy' && price <= m.price) errors.price = `Buy stop must be above ${num(m.price, i.dec)}`
    else if (type === 'stop' && side === 'sell' && price >= m.price) errors.price = `Sell stop must be below ${num(m.price, i.dec)}`
    else if (type === 'limit' && Math.abs(price / m.price - 1) > 0.25) errors.price = 'Price is more than 25% from the last trade'
  }
  if (isNaN(size) || size <= 0) errors.size = 'Enter a size greater than zero'
  else if (roundTo(size, i.qdec) !== size) errors.size = i.qdec ? `Up to ${i.qdec} decimals` : 'Whole units only'
  else if (side === 'buy' && total > cash + 1e-6) errors.size = `Needs ${usd(total)}, available ${usd(cash)}`
  else if (side === 'sell' && size > held + 1e-9) errors.size = held > 0 ? `You can sell up to ${num(held, i.qdec)}` : `You hold no ${sym} to sell`

  const pctFill = (pct: number) => {
    const px = ref || m.price
    const q = side === 'buy' ? (cash * pct) / (px * (1 + FEE[type])) : held * pct
    const r = Math.floor(q * 10 ** i.qdec) / 10 ** i.qdec
    setForm({ ...form, size: r > 0 ? String(r) : '' }); setTouched(t => ({ ...t, size: true }))
  }
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setTouched({ price: true, size: true })
    if (errors.price || errors.size) return
    setReview({ sym, side, type, price: type === 'market' ? ref : price, qty: size })
  }
  const confirm = () => {
    if (!review) return
    const r = onSubmit(review)
    if (!r.ok) { setErr(r.msg); return }
    setReview(null); setErr(''); setTouched({ price: false, size: false }); setForm({ ...form, size: '' })
  }

  return (
    <form className="tr-oe" onSubmit={submit} noValidate aria-label="Order entry">
      <div className="tr-oe-side" role="group" aria-label="Side">
        {(['buy', 'sell'] as const).map(x => (
          <button key={x} type="button" aria-pressed={side === x} className={`tr-seg ${x}`} onClick={() => setForm({ ...form, side: x })}>{x === 'buy' ? 'Buy' : 'Sell'}</button>
        ))}
      </div>
      <Tabs label="Order type" items={[{ value: 'market', label: 'Market' }, { value: 'limit', label: 'Limit' }, { value: 'stop', label: 'Stop' }]} value={type} onChange={t => setForm({ ...form, type: t })} />
      <div className="tr-oe-fields">
        <label className="tr-field">
          <span className="tr-fl">{type === 'stop' ? 'Stop price' : 'Price'}<span className="faint">USD</span></span>
          {type === 'market'
            ? <input className="input num" value={`Market, about ${num(ref, i.dec)}`} disabled aria-label="Price" />
            : <input className="input num" inputMode="decimal" placeholder={num(m.price, i.dec)} value={form.price} aria-invalid={touched.price && !!errors.price} aria-describedby="tr-e-price"
                onBlur={() => setTouched(t => ({ ...t, price: true }))} onChange={e => setForm({ ...form, price: e.target.value })} />}
          {touched.price && errors.price && <span id="tr-e-price" className="tr-err" role="alert">{errors.price}</span>}
        </label>
        <label className="tr-field">
          <span className="tr-fl">Size<span className="faint">{sym.split('/')[0]}</span></span>
          <input id={sizeId} className="input num" inputMode="decimal" placeholder="0" value={form.size} aria-invalid={touched.size && !!errors.size} aria-describedby="tr-e-size"
            onBlur={() => setTouched(t => ({ ...t, size: true }))} onChange={e => setForm({ ...form, size: e.target.value })} />
          {touched.size && errors.size && <span id="tr-e-size" className="tr-err" role="alert">{errors.size}</span>}
        </label>
        <div className="tr-pct" role="group" aria-label="Percent of available balance">
          {[0.25, 0.5, 0.75, 1].map(p => <button key={p} type="button" className="tr-pct-b" onClick={() => pctFill(p)}>{p * 100}%</button>)}
        </div>
      </div>
      <dl className="tr-est num">
        <div><dt>Available</dt><dd>{side === 'buy' ? usd(cash) : `${num(held, i.qdec)} ${sym.split('/')[0]}`}</dd></div>
        <div><dt>Est. value</dt><dd>{usd(notional)}</dd></div>
        <div><dt>Fee ({(FEE[type] * 100).toFixed(2)}%)</dt><dd>{usd(fee)}</dd></div>
        <div className="tot"><dt>{side === 'buy' ? 'Est. cost' : 'Est. proceeds'}</dt><dd>{usd(total > 0 ? total : 0)}</dd></div>
      </dl>
      <button type="submit" className={`tr-submit ${side}`}>{side === 'buy' ? 'Buy' : 'Sell'} {sym.split('/')[0]}</button>

      <Dialog open={!!review} onClose={() => { setReview(null); setErr('') }} title="Review order"
        footer={<><Button variant="ghost" onClick={() => { setReview(null); setErr('') }}>Cancel</Button><Button variant="primary" data-autofocus onClick={confirm}>Confirm {review?.side}</Button></>}>
        {review && (
          <>
            <dl className="tr-rev num">
              <div><dt>Instrument</dt><dd>{review.sym}</dd></div>
              <div><dt>Side</dt><dd className={review.side === 'buy' ? 'tr-up' : 'tr-down'}>{review.side === 'buy' ? 'Buy' : 'Sell'}</dd></div>
              <div><dt>Type</dt><dd>{review.type[0].toUpperCase() + review.type.slice(1)}</dd></div>
              <div><dt>{review.type === 'market' ? 'Est. price' : review.type === 'stop' ? 'Stop price' : 'Limit price'}</dt><dd>{num(review.price, i.dec)}</dd></div>
              <div><dt>Size</dt><dd>{num(review.qty, i.qdec)}</dd></div>
              <div><dt>Est. value</dt><dd>{usd(review.price * review.qty)}</dd></div>
              <div><dt>Fee ({(FEE[review.type] * 100).toFixed(2)}%)</dt><dd>{usd(review.price * review.qty * FEE[review.type])}</dd></div>
              <div className="tot"><dt>{review.side === 'buy' ? 'Est. cost' : 'Est. proceeds'}</dt><dd>{usd(review.price * review.qty * (1 + (review.side === 'buy' ? 1 : -1) * FEE[review.type]))}</dd></div>
            </dl>
            <p className="tr-sim"><Icon name="info" size={14} /> Simulated order. No real funds.</p>
            {err && <p className="tr-err" role="alert">{err}</p>}
          </>
        )}
      </Dialog>
    </form>
  )
}
