import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Dropdown, Switch } from '../../ui'
import { SI } from './icons'
import { Art, Overlay, Stars, Swatch } from './parts'
import { CATS, COLOR_NAMES, MATERIALS, PRODUCTS, family, kindLabel, money, catOf, type Product } from './data'
import { href } from './router'
import { matches } from './Header'
import { useShop } from './state'

/* ---------------------------------------------------------------- card */
export function ProductCard({ p }: { p: Product }) {
  const { wish, toggleWish, add } = useShop()
  const [color, setColor] = useState(p.colors[0])
  const w = wish.includes(p.id)
  return (
    <article className="st-card">
      <div className="st-card-img">
        <a href={href.product(p.id)} aria-label={`${p.name}, ${money(p.price)}`} tabIndex={-1}><Art p={p} color={color} /></a>
        <button type="button" className="st-heart" aria-pressed={w} aria-label={w ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`} onClick={() => toggleWish(p.id)}><SI name="heart" size={17} fill={w} /></button>
        {p.stock
          ? <button type="button" className="st-quick" aria-label={`Quick add ${p.name} to bag`} onClick={() => add(p, color, p.sizes?.[0]?.label, 1)}><SI name="plus" size={15} /><span>Quick add</span></button>
          : <span className="st-soldout">Sold out</span>}
      </div>
      <div className="st-card-info">
        <a className="st-card-name" href={href.product(p.id)}>{p.name}</a>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="num">{p.sizes && p.sizes.length > 1 ? 'From ' : ''}{money(p.price)}</span>
          <span className="muted st-card-rate"><SI name="star" size={12} fill />{p.rating.toFixed(1)}<span className="faint">({p.reviews})</span></span>
        </div>
        {p.colors.length > 1 && (
          <div className="st-card-sw" role="radiogroup" aria-label={`${p.name} colours`}>
            {p.colors.slice(0, 5).map(c => <Swatch key={c} name={c} size={16} on={c === color} onClick={() => setColor(c)} />)}
          </div>
        )}
      </div>
    </article>
  )
}
export const SkeletonCard = () => (
  <div className="st-card" aria-hidden="true"><div className="skeleton st-card-img" style={{ borderRadius: 14 }} /><div className="st-card-info"><span className="skeleton" style={{ height: 14, width: '70%' }} /><span className="skeleton" style={{ height: 12, width: '40%' }} /></div></div>
)

/* ---------------------------------------------------------------- filters */
export type Filters = { min: number; max: number; colors: string[]; materials: string[]; types: string[]; rating: number; inStock: boolean }
const MIN = 10, MAX = 430
export const emptyFilters = (types: string[] = []): Filters => ({ min: MIN, max: MAX, colors: [], materials: [], types, rating: 0, inStock: false })
const activeCount = (f: Filters, baseTypes: string[]) => (f.min > MIN || f.max < MAX ? 1 : 0) + f.colors.length + f.materials.length + (f.types.length && f.types.join() !== baseTypes.join() ? f.types.length : 0) + (f.rating ? 1 : 0) + (f.inStock ? 1 : 0)
const toggle = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter(x => x !== v) : [...a, v])

export function applyFilters(list: Product[], f: Filters) {
  return list.filter(p =>
    p.price >= f.min && p.price <= f.max && (!f.colors.length || p.colors.some(c => f.colors.includes(c))) && (!f.materials.length || f.materials.includes(family(p))) &&
    (!f.types.length || f.types.includes(p.kind)) && p.rating >= f.rating && (!f.inStock || p.stock))
}

function FilterGroups({ f, set, kinds }: { f: Filters; set: (f: Filters) => void; kinds: string[] }) {
  return (
    <div className="st-fgroups">
      <section>
        <h3 className="eyebrow">Price</h3>
        <div className="st-price">
          <div className="st-price-vals num"><span>{money(f.min)}</span><span>{f.max >= MAX ? `${money(MAX)}+` : money(f.max)}</span></div>
          <input type="range" min={MIN} max={MAX} step={10} value={f.min} aria-label="Minimum price" onChange={e => set({ ...f, min: Math.min(+e.target.value, f.max - 10) })} />
          <input type="range" min={MIN} max={MAX} step={10} value={f.max} aria-label="Maximum price" onChange={e => set({ ...f, max: Math.max(+e.target.value, f.min + 10) })} />
        </div>
      </section>
      <section>
        <h3 className="eyebrow">Colour</h3>
        <div className="st-sw-grid" role="group" aria-label="Colour">
          {COLOR_NAMES.map(c => <Swatch key={c} name={c} size={30} on={f.colors.includes(c)} onClick={() => set({ ...f, colors: toggle(f.colors, c) })} />)}
        </div>
      </section>
      {kinds.length > 1 && (
        <section>
          <h3 className="eyebrow">Type</h3>
          {kinds.map(k => <label key={k} className="st-check"><Checkbox checked={f.types.includes(k)} onChange={() => set({ ...f, types: toggle(f.types, k) })} label={kindLabel(k as never)} /><span>{kindLabel(k as never)}</span></label>)}
        </section>
      )}
      <section>
        <h3 className="eyebrow">Material</h3>
        {MATERIALS.map(m => <label key={m} className="st-check"><Checkbox checked={f.materials.includes(m)} onChange={() => set({ ...f, materials: toggle(f.materials, m) })} label={m} /><span>{m}</span></label>)}
      </section>
      <section>
        <h3 className="eyebrow">Rating</h3>
        <div role="radiogroup" aria-label="Minimum rating">
          {[4.5, 4, 0].map(r => (
            <button key={r} type="button" role="radio" aria-checked={f.rating === r} className="st-radio" onClick={() => set({ ...f, rating: r })}>
              <span className="st-radio-dot" />{r ? <><Stars value={r} size={12} /><span>{r} and up</span></> : <span>Any rating</span>}
            </button>
          ))}
        </div>
      </section>
      <section className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="eyebrow" id="st-stock">In stock only</h3>
        <Switch checked={f.inStock} onChange={v => set({ ...f, inStock: v })} label="In stock only" />
      </section>
    </div>
  )
}

/* ---------------------------------------------------------------- listing */
type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
const SORTS = [{ value: 'featured', label: 'Featured' }, { value: 'price-asc', label: 'Price: low to high' }, { value: 'price-desc', label: 'Price: high to low' }, { value: 'rating', label: 'Top rated' }, { value: 'newest', label: 'Newest' }] as const

export function Listing({ title, blurb, base, crumbs, baseTypes = [], empty }: { title: string; blurb?: string; base: Product[]; crumbs: { label: string; to?: string }[]; baseTypes?: string[]; empty?: React.ReactNode }) {
  const [f, setF] = useState<Filters>(emptyFilters(baseTypes))
  const [sort, setSort] = useState<Sort>('featured')
  const [sheet, setSheet] = useState(false)
  const [loading, setLoading] = useState(true)
  const kinds = useMemo(() => Array.from(new Set(base.map(p => p.kind))), [base])
  const typesKey = baseTypes.join()
  useEffect(() => { setF(emptyFilters(baseTypes)) }, [typesKey, title]) // eslint-disable-line react-hooks/exhaustive-deps
  const key = JSON.stringify([f, sort, title])
  useEffect(() => { setLoading(true); const t = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(t) }, [key])
  const items = useMemo(() => {
    const l = applyFilters(base, f)
    const s = [...l]
    if (sort === 'price-asc') s.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') s.sort((a, b) => b.price - a.price)
    if (sort === 'rating') s.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    if (sort === 'newest') s.sort((a, b) => b.order - a.order)
    return s
  }, [base, f, sort])
  const n = activeCount(f, baseTypes)
  const clear = () => setF(emptyFilters())

  return (
    <div className="st-page">
      <nav className="st-crumbs muted" aria-label="Breadcrumb">
        {crumbs.map((c, i) => <span key={i}>{c.to ? <a href={c.to}>{c.label}</a> : <span aria-current="page">{c.label}</span>}{i < crumbs.length - 1 && <SI name="chevron-right" size={12} />}</span>)}
      </nav>
      <div className="st-listhead">
        <div>
          <h1>{title}</h1>
          {blurb && <p className="muted">{blurb}</p>}
        </div>
      </div>
      <div className="st-list">
        <aside className="st-filters" aria-label="Filters">
          <div className="row" style={{ justifyContent: 'space-between', minHeight: 32 }}>
            <h2 className="st-fh">Filters</h2>
            {n > 0 && <button type="button" className="st-linkbtn" onClick={clear}>Clear all</button>}
          </div>
          <FilterGroups f={f} set={setF} kinds={kinds} />
        </aside>
        <div className="st-results">
          <div className="st-toolbar">
            <Button variant="secondary" icon="sliders" className="st-only-m" onClick={() => setSheet(true)}>Filters{n > 0 ? ` (${n})` : ''}</Button>
            <span className="muted num" role="status" aria-live="polite">{loading ? 'Loading' : `${items.length} ${items.length === 1 ? 'product' : 'products'}`}</span>
            <span className="grow" />
            <span className="muted st-sortlabel">Sort</span>
            <Dropdown label="Sort" options={SORTS.map(s => ({ ...s }))} value={sort} onChange={v => setSort(v as Sort)} width={200} />
          </div>
          {loading ? (
            <div className="st-grid">{Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}</div>
          ) : items.length ? (
            <div className="st-grid">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="st-empty">
              <SI name="search" size={22} />
              <strong>{base.length ? 'No products match these filters' : 'Nothing here yet'}</strong>
              <span className="muted">{base.length ? 'Try widening the price range or removing a colour.' : 'Check back soon.'}</span>
              {n > 0 ? <Button variant="secondary" onClick={clear}>Clear all filters</Button> : empty}
            </div>
          )}
        </div>
      </div>
      <Overlay open={sheet} onClose={() => setSheet(false)} side="bottom" label="Filters">
        <div className="st-sheet-head"><h2 className="st-fh">Filters</h2><button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setSheet(false)}><SI name="x" size={17} /></button></div>
        <div className="st-sheet-body"><FilterGroups f={f} set={setF} kinds={kinds} /></div>
        <div className="st-sheet-foot"><Button variant="ghost" onClick={clear} disabled={n === 0}>Clear all</Button><Button variant="primary" size="lg" className="grow" onClick={() => setSheet(false)}>Show {items.length} {items.length === 1 ? 'product' : 'products'}</Button></div>
      </Overlay>
    </div>
  )
}

export function CategoryPage({ id, type }: { id: string; type: string }) {
  const cat = catOf(id)
  const base = useMemo(() => PRODUCTS.filter(p => id === 'all' || p.cat === id), [id])
  if (id !== 'all' && !cat) return <div className="st-page"><div className="st-empty"><strong>We could not find that category</strong><a className="btn btn-secondary" href={href.cat('all')}>Shop all</a></div></div>
  return <Listing title={cat?.name ?? 'All products'} blurb={cat?.blurb ?? 'Everything in the shop, from lamps to ferns.'} base={base} baseTypes={type ? [type] : []}
    crumbs={[{ label: 'Home', to: href.home }, ...(cat ? [{ label: 'Shop', to: href.cat('all') }, { label: cat.name }] : [{ label: 'Shop' }])]} />
}

export function SearchPage({ q }: { q: string }) {
  const base = useMemo(() => matches(q), [q])
  return <Listing title={q ? `Results for “${q}”` : 'Search'} blurb={undefined} base={base} crumbs={[{ label: 'Home', to: href.home }, { label: 'Search' }]}
    empty={<span className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>{CATS.slice(0, 4).map(c => <a key={c.id} className="btn btn-secondary" href={href.cat(c.id)}>{c.name}</a>)}</span>} />
}

export function WishlistPage() {
  const { wish } = useShop()
  const base = useMemo(() => PRODUCTS.filter(p => wish.includes(p.id)), [wish])
  return <Listing title="Wishlist" blurb={base.length ? undefined : 'Tap the heart on anything you like and it will wait for you here.'} base={base} crumbs={[{ label: 'Home', to: href.home }, { label: 'Wishlist' }]}
    empty={<a className="btn btn-primary" href={href.cat('all')}>Browse the shop</a>} />
}
