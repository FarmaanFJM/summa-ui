import { useMemo } from 'react'
import { Art } from './art'
import { DESTINATIONS, STAYS, breakdown, cheapestRoom, money, qToString, type Query } from './data'
import { SearchBar } from './Pickers'
import { StayTile } from './parts'
import { go, useTravel } from './store'

export function Landing({ q }: { q: Query }) {
  const { cur, lastQ } = useTravel()
  const base = { ...q, dest: '' }
  const popular = useMemo(() => [...STAYS].sort((a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews)).slice(0, 4), [])
  const flexible = useMemo(() => STAYS.filter(s => s.cancel && s.price < 200).sort((a, b) => a.price - b.price).slice(0, 4), [])
  const from = (id: string) => Math.min(...STAYS.filter(s => s.dest === id).map(s => breakdown(s, cheapestRoom(s, base), base).perNight))

  return (
    <div className="tv-page">
      <section className="tv-hero">
        <div className="tv-hero-art" aria-hidden="true"><Art motif="coast" pal="tide" seed={11} variant={1} /></div>
        <div className="tv-hero-shade" />
        <div className="tv-wrap tv-hero-in">
          <h1 className="tv-h1">Stays worth the journey</h1>
          <p className="tv-hero-sub">Hand-picked hotels, villas and guesthouses in eight places we love.</p>
        </div>
      </section>
      <div className="tv-wrap tv-search-wrap"><SearchBar initial={{ ...lastQ, dest: lastQ.dest }} /></div>

      <section className="tv-wrap tv-section" aria-labelledby="dest-h">
        <h2 id="dest-h" className="tv-h2">Curated destinations</h2>
        <div className="tv-mosaic">
          {DESTINATIONS.map((d, i) => (
            <button key={d.id} type="button" className={`tv-dest-tile t${i + 1}`} onClick={() => go('/results?' + qToString({ ...base, dest: d.id }))} aria-label={`${d.name}, ${d.country}`}>
              <Art motif={d.motif} pal={d.pal} seed={i + 3} variant={i % 2} />
              <span className="tv-dest-shade" />
              <span className="tv-dest-text">
                <span className="tv-dest-name">{d.name}</span>
                <span className="tv-dest-meta">{d.country}. {i === 0 ? d.blurb + '. ' : ''}From {money(from(d.id), cur)} a night</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="tv-wrap tv-section" aria-labelledby="pop-h">
        <h2 id="pop-h" className="tv-h2">Popular this season</h2>
        <div className="tv-tiles">{popular.map(s => <StayTile key={s.id} s={s} q={{ ...base, dest: s.dest }} />)}</div>
      </section>

      <section className="tv-wrap tv-section" aria-labelledby="flex-h">
        <h2 id="flex-h" className="tv-h2">Free cancellation under {money(200, cur)} a night</h2>
        <div className="tv-tiles">{flexible.map(s => <StayTile key={s.id} s={s} q={{ ...base, dest: s.dest }} />)}</div>
      </section>

      <footer className="tv-footer"><div className="tv-wrap muted">2026 Wayfarer Travel Ltd.</div></footer>
    </div>
  )
}
