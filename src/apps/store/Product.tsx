import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../ui'
import { SI } from './icons'
import { Art, Stars, Stepper, Swatch } from './parts'
import { ProductCard } from './Catalog'
import { PRODUCTS, addDays, breakdown, byId, catOf, fmtDate, kindLabel, money, priceOf, reviewsFor } from './data'
import { href } from './router'
import { useShop } from './state'

function Disclosure({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="st-disc" open={open}>
      <summary><span>{title}</span><SI name="chevron-down" size={16} /></summary>
      <div className="st-disc-body">{children}</div>
    </details>
  )
}

export function ProductPage({ id }: { id: string }) {
  const p = byId(id)
  const { add, wish, toggleWish, say } = useShop()
  const [color, setColor] = useState(p?.colors[0] ?? '')
  const [size, setSize] = useState(p?.sizes?.[0]?.label)
  const [qty, setQty] = useState(1)
  const [view, setView] = useState(0)
  const [star, setStar] = useState(0)
  const [shown, setShown] = useState(4)
  const reviewsRef = useRef<HTMLElement>(null)
  useEffect(() => { setColor(p?.colors[0] ?? ''); setSize(p?.sizes?.[0]?.label); setQty(1); setView(0); setStar(0); setShown(4) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const reviews = useMemo(() => (p ? reviewsFor(p) : []), [p])
  const more = useMemo(() => (p ? PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).concat(PRODUCTS.filter(x => x.cat !== p.cat)).slice(0, 4) : []), [p])
  if (!p) return <div className="st-page"><div className="st-empty"><strong>We could not find that product</strong><a className="btn btn-secondary" href={href.cat('all')}>Shop all</a></div></div>
  const cat = catOf(p.cat)!
  const price = priceOf(p, size)
  const free = price * qty >= 120
  const eta = fmtDate(addDays(free ? 5 : 5))
  const w = wish.includes(p.id)
  const bd = breakdown(p)
  const list = reviews.filter(r => !star || r.stars === star)
  return (
    <div className="st-page">
      <nav className="st-crumbs muted" aria-label="Breadcrumb">
        <a href={href.home}>Home</a><SI name="chevron-right" size={12} /><a href={href.cat(cat.id)}>{cat.name}</a><SI name="chevron-right" size={12} /><span aria-current="page">{p.name}</span>
      </nav>
      <div className="st-pdp">
        <div className="st-gallery">
          <div className="st-thumbs" role="group" aria-label="Product images">
            {[0, 1, 2, 3].map(v => (
              <button key={v} type="button" className="st-thumb" aria-pressed={view === v} aria-label={`Image ${v + 1}`} onClick={() => setView(v)}><Art p={p} color={color} view={v} /></button>
            ))}
          </div>
          <div className="st-main"><Art p={p} color={color} view={view} /></div>
        </div>
        <div className="st-info">
          <div>
            <h1>{p.name}</h1>
            <div className="st-price-line num">{money(price)}</div>
          </div>
          <button type="button" className="st-ratingrow" onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <Stars value={p.rating} /><span className="muted">{p.rating.toFixed(1)} ({p.reviews} reviews)</span>
          </button>
          <p className="muted st-desc">{p.desc}</p>

          <div className="st-opt">
            <div className="st-opt-label"><span className="eyebrow">Colour</span><span>{color}</span></div>
            <div className="st-sw-row" role="radiogroup" aria-label="Colour">{p.colors.map(c => <Swatch key={c} name={c} size={34} on={c === color} onClick={() => { setColor(c); setView(0) }} />)}</div>
          </div>
          {p.sizes && (
            <div className="st-opt">
              <div className="st-opt-label"><span className="eyebrow">{p.kind === 'plant' ? 'Pot size' : 'Size'}</span><span>{size}</span></div>
              <div className="st-seg" role="radiogroup" aria-label="Size">
                {p.sizes.map(s => <button key={s.label} type="button" role="radio" aria-checked={size === s.label} onClick={() => setSize(s.label)}>{s.label}{s.delta > 0 && <span className="faint"> +{money(s.delta)}</span>}</button>)}
              </div>
            </div>
          )}
          <div className="st-buy">
            <Stepper value={qty} onChange={setQty} label="Quantity" />
            <Button variant="primary" size="lg" className="grow" disabled={!p.stock} onClick={() => add(p, color, size, qty)}>{p.stock ? `Add to bag, ${money(price * qty)}` : 'Sold out'}</Button>
            <button type="button" className="icon-btn st-wishbtn" aria-pressed={w} aria-label={w ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => { toggleWish(p.id); say(w ? 'Removed from wishlist' : 'Saved to wishlist') }}><SI name="heart" size={19} fill={w} /></button>
          </div>
          <ul className="st-facts">
            <li><SI name="truck" size={17} /><span>{free ? 'Free delivery' : 'Delivery from $8'}, arrives by <strong>{eta}</strong></span></li>
            <li><SI name="refresh" size={17} /><span>Free returns within 30 days</span></li>
          </ul>
          <div className="st-discs">
            <Disclosure title="Details" open><ul>{p.details.map(d => <li key={d}>{d}</li>)}<li>{kindLabel(p.kind)} in {p.colors.join(', ')}</li></ul></Disclosure>
            <Disclosure title="Materials"><p>{p.materials}</p></Disclosure>
            <Disclosure title="Shipping"><p>Standard delivery takes 3 to 5 business days and is free on orders over $120. Express and next day options are available at checkout. Returns are free within 30 days in original condition.</p></Disclosure>
          </div>
        </div>
      </div>

      <section className="st-reviews" ref={reviewsRef} id="reviews" aria-labelledby="st-rev-h">
        <h2 id="st-rev-h">Reviews</h2>
        <div className="st-rev-grid">
          <div className="st-rev-sum">
            <div className="st-big num">{p.rating.toFixed(1)}</div>
            <Stars value={p.rating} size={16} />
            <div className="muted">{p.reviews} reviews</div>
            <div className="st-bars" role="group" aria-label="Filter reviews by rating">
              {[5, 4, 3, 2, 1].map((s, i) => (
                <button key={s} type="button" aria-pressed={star === s} className="st-rbar" onClick={() => { setStar(star === s ? 0 : s); setShown(4) }}>
                  <span className="num">{s}</span><SI name="star" size={11} fill />
                  <span className="st-bar-track"><span style={{ width: `${(bd[i] / p.reviews) * 100}%` }} /></span>
                  <span className="muted num">{bd[i]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="st-rev-list">
            {list.slice(0, shown).map(r => (
              <article key={r.id} className="st-rev">
                <div className="row" style={{ gap: 10 }}><Stars value={r.stars} /><strong>{r.title}</strong></div>
                <p>{r.body}</p>
                <div className="muted st-sm">{r.name}, bought in {r.variant} · {r.days} days ago</div>
              </article>
            ))}
            {list.length === 0 && <div className="muted">No {star}-star reviews yet.</div>}
            {list.length > shown && <Button variant="secondary" onClick={() => setShown(s => s + 4)}>Show more reviews</Button>}
          </div>
        </div>
      </section>

      <section className="st-more" aria-labelledby="st-more-h">
        <h2 id="st-more-h">You may also like</h2>
        <div className="st-row">{more.map(m => <div key={m.id} className="st-row-item"><ProductCard p={m} /></div>)}</div>
      </section>
    </div>
  )
}
