import { useMemo } from 'react'
import { Art } from './parts'
import { HeroArt } from './art'
import { ProductCard } from './Catalog'
import { CATS, PRODUCTS, byId, looksFor } from './data'
import { href } from './router'
import { SI } from './icons'

export function Home() {
  const hero = useMemo(() => ['ember-table-lamp:Sand', 'ridge-vase:Terracotta', 'everyday-mug:Oat'].map(s => { const [id, c] = s.split(':'); return looksFor(byId(id)!, c) }), [])
  const featured = useMemo(() => ['lull-desk-lamp', 'everyday-mug', 'grid-notebook', 'field-tote', 'ridge-vase', 'oslo-dining-chair', 'wool-throw', 'snake-plant'].map(id => byId(id)!), [])
  const rep: Record<string, string> = { lighting: 'ash-pendant', ceramics: 'ridge-vase', seating: 'linden-lounge-chair', desk: 'grid-notebook', bags: 'harbor-satchel', living: 'linen-cushion' }
  return (
    <div className="st-home">
      <section className="st-hero" aria-label="Autumn collection">
        <div className="st-hero-img"><HeroArt looks={hero} /></div>
        <div className="st-hero-copy">
          <span className="eyebrow">Autumn collection</span>
          <h1>Objects for slow mornings and long desks.</h1>
          <p>Lamps, ceramics and quiet furniture, made in small batches and built to be used every day.</p>
          <div className="row" style={{ gap: 8 }}>
            <a className="btn btn-primary btn-lg" href={href.cat('lighting')}>Shop lighting</a>
            <a className="btn btn-ghost btn-lg" href={href.cat('all')}>View everything</a>
          </div>
        </div>
      </section>
      <section className="st-section" aria-labelledby="st-cats-h">
        <div className="st-sect-head"><h2 id="st-cats-h">Shop by category</h2></div>
        <div className="st-tiles">
          {CATS.map(c => {
            const p = byId(rep[c.id])!
            return (
              <a key={c.id} className="st-tile" href={href.cat(c.id)}>
                <span className="st-tile-img"><Art p={p} view={2} /></span>
                <span className="st-tile-name">{c.name}<span className="muted num">{PRODUCTS.filter(x => x.cat === c.id).length} products</span></span>
              </a>
            )
          })}
        </div>
      </section>
      <section className="st-section" aria-labelledby="st-feat-h">
        <div className="st-sect-head"><h2 id="st-feat-h">Featured</h2><a className="st-seeall" href={href.cat('all')}>View all<SI name="arrow-right" size={14} /></a></div>
        <div className="st-grid">{featured.map(p => <ProductCard key={p.id} p={p} />)}</div>
      </section>
      <footer className="st-footer">
        <div className="col" style={{ gap: 6 }}><strong>Oak &amp; Ember</strong><span className="muted">Home and desk goods. Free standard delivery over $120, free returns for 30 days.</span></div>
        <nav className="st-foot-links" aria-label="Footer">{CATS.map(c => <a key={c.id} href={href.cat(c.id)}>{c.name}</a>)}</nav>
      </footer>
    </div>
  )
}
