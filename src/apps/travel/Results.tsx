import { useEffect, useMemo, useState } from 'react'
import { Button, Dropdown, Icon, Popover, Switch, useAnchored, useMedia } from '../../ui'
import { AMENITIES, TYPES, breakdown, cheapestRoom, destById, fmtRange, money, qToString, soldOut, STAYS, type PropType, type Query, type Stay } from './data'
import { SearchBar, guestText } from './Pickers'
import { Heart, Rating, Sheet, StayImage, Stars, stayHref } from './parts'
import { go, useTravel } from './store'

type Sort = 'recommended' | 'price-asc' | 'price-desc' | 'rating'
type Filters = { max: number; stars: number; types: PropType[]; amenities: string[]; cancel: boolean; sort: Sort }
const FREE: Filters = { max: 500, stars: 0, types: [], amenities: [], cancel: false, sort: 'recommended' }
const SORTS = [{ value: 'recommended', label: 'Recommended' }, { value: 'price-asc', label: 'Price, low to high' }, { value: 'price-desc', label: 'Price, high to low' }, { value: 'rating', label: 'Guest rating' }] as { value: Sort; label: string }[]
const STARS = [{ value: '0', label: 'Any rating' }, { value: '3', label: '3 stars and up' }, { value: '4', label: '4 stars and up' }, { value: '5', label: '5 stars' }]

function PriceFilter({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const { cur } = useTravel()
  const a = useAnchored()
  return (
    <>
      <button ref={a.ref} type="button" className="select" aria-haspopup="dialog" aria-expanded={a.open} onClick={a.toggle}>
        <span>{f.max >= 500 ? 'Any price' : `Up to ${money(f.max, cur)}`}</span><Icon name="chevron-down" size={14} />
      </button>
      <Popover anchor={a.el} open={a.open} onClose={a.close} role="dialog" label="Price per night" width={280} focusSelector="input">
        <div className="tv-price-pop"><PriceSlider f={f} set={set} /></div>
      </Popover>
    </>
  )
}
function PriceSlider({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const { cur } = useTravel()
  return (
    <div className="tv-slider">
      <div className="row" style={{ justifyContent: 'space-between' }}><span className="tv-label">Maximum per night</span><span className="num tv-strong">{f.max >= 500 ? 'Any' : money(f.max, cur)}</span></div>
      <input type="range" min={60} max={500} step={10} value={f.max} aria-label="Maximum price per night" onChange={e => set({ max: Number(e.target.value) })} style={{ ['--pct' as string]: `${((f.max - 60) / 440) * 100}%` }} />
      <div className="row faint num" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}><span>{money(60, cur)}</span><span>{money(500, cur)}+</span></div>
    </div>
  )
}

function Controls({ f, set, vertical }: { f: Filters; set: (p: Partial<Filters>) => void; vertical?: boolean }) {
  return (
    <div className={vertical ? 'tv-controls v' : 'tv-controls'}>
      {vertical ? <PriceSlider f={f} set={set} /> : <PriceFilter f={f} set={set} />}
      <Dropdown label="Star rating" value={String(f.stars)} options={STARS} onChange={v => set({ stars: Number(v) })} width={190}
        renderValue={() => <span>{f.stars ? `${f.stars}+ stars` : 'Star rating'}</span>} />
      <Dropdown<PropType> label="Property type" multiple value={f.types} options={TYPES.map(t => ({ value: t, label: t }))} onChange={v => set({ types: v })} width={200} placeholder="Property type" />
      <Dropdown label="Amenities" multiple searchable value={f.amenities} options={AMENITIES.map(t => ({ value: t, label: t }))} onChange={v => set({ amenities: v })} width={230} placeholder="Amenities" />
      <label className="tv-switch-row"><Switch checked={f.cancel} onChange={v => set({ cancel: v })} label="Free cancellation only" /><span>Free cancellation</span></label>
    </div>
  )
}

export function Results({ q }: { q: Query }) {
  const { cur, loc } = useTravel()
  const [f, setF] = useState<Filters>(FREE)
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [edit, setEdit] = useState(false)
  const mobile = useMedia('(max-width: 820px)')
  const set = (p: Partial<Filters>) => setF(s => ({ ...s, ...p }))
  const key = qToString(q)
  const dest = destById(q.dest)

  const fkey = JSON.stringify(f)
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t) }, [key, fkey])

  const rows = useMemo(() => {
    const list = STAYS.filter(s => (!q.dest || s.dest === q.dest)).map(s => {
      const room = cheapestRoom(s, q)
      return { s, room, b: breakdown(s, room, q), out: soldOut(s, q) }
    }).filter(({ s, b }) => (f.max >= 500 || b.perNight <= f.max) && s.stars >= f.stars && (!f.types.length || f.types.includes(s.type)) && f.amenities.every(a => s.amenities.includes(a)) && (!f.cancel || s.cancel))
    const dir = (a: typeof list[number], b: typeof list[number]) => (a.out === b.out ? 0 : a.out ? 1 : -1)
    return list.sort((a, b) => dir(a, b) || (f.sort === 'price-asc' ? a.b.perNight - b.b.perNight : f.sort === 'price-desc' ? b.b.perNight - a.b.perNight : f.sort === 'rating' ? b.s.rating - a.s.rating : b.s.rating * Math.log(b.s.reviews) - a.s.rating * Math.log(a.s.reviews)))
  }, [q, f])

  const active = (f.max < 500 ? 1 : 0) + (f.stars ? 1 : 0) + f.types.length + f.amenities.length + (f.cancel ? 1 : 0)
  const reset = () => setF(s => ({ ...FREE, sort: s.sort }))

  return (
    <div className="tv-page">
      <div className="tv-wrap tv-res-top">
        <button type="button" className="tv-summary" onClick={() => setEdit(e => !e)} aria-expanded={edit}>
          <span className="tv-strong">{dest?.name ?? 'Anywhere'}</span>
          <span className="muted">{fmtRange(q.checkIn, q.checkOut, loc)}</span>
          <span className="muted">{guestText(q)}</span>
          <span className="tv-edit"><Icon name="pencil" size={14} /> Edit search</span>
        </button>
        {edit && <div className="tv-search-inline"><SearchBar initial={q} compact /></div>}
      </div>

      <div className="tv-filterbar">
        <div className="tv-wrap tv-filterbar-in">
          {mobile ? (
            <>
              <Button icon="sliders" onClick={() => setSheet(true)}>Filters{active ? ` (${active})` : ''}</Button>
              <Dropdown label="Sort" value={f.sort} options={SORTS} onChange={v => set({ sort: v })} width={200} />
            </>
          ) : (
            <>
              <Controls f={f} set={set} />
              <div className="tv-sort"><Dropdown label="Sort" value={f.sort} options={SORTS} onChange={v => set({ sort: v })} width={210} renderValue={s => <><span className="faint">Sort</span><span>{s[0]?.label}</span></>} /></div>
            </>
          )}
        </div>
      </div>

      <div className="tv-wrap tv-res">
        <h1 className="tv-count" aria-live="polite">{loading ? 'Searching stays' : `${rows.length} ${rows.length === 1 ? 'stay' : 'stays'}${dest ? ` in ${dest.name}` : ''}`}</h1>

        {loading ? (
          <div className="tv-cards">{[0, 1, 2].map(i => <div key={i} className="tv-card sk"><div className="skeleton tv-card-img" /><div className="tv-card-body"><div className="skeleton" style={{ height: 20, width: '50%' }} /><div className="skeleton" style={{ height: 14, width: '30%', marginTop: 10 }} /><div className="skeleton" style={{ height: 14, width: '70%', marginTop: 24 }} /></div></div>)}</div>
        ) : rows.length === 0 ? (
          <div className="tv-empty">
            <Icon name="search" size={22} />
            <h2 className="tv-h3">No stays match these filters</h2>
            <p className="muted">Try a higher price, fewer amenities or a different property type.</p>
            <Button onClick={reset}>Clear filters</Button>
          </div>
        ) : (
          <ul className="tv-cards" aria-label="Search results">
            {rows.map(({ s, room, b, out }) => <ResultCard key={s.id} s={s} q={q} b={b} roomName={room.name} out={out} />)}
          </ul>
        )}
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters" footer={<><Button variant="ghost" onClick={reset}>Clear all</Button><Button variant="primary" onClick={() => setSheet(false)}>{`Show ${rows.length} ${rows.length === 1 ? 'stay' : 'stays'}`}</Button></>}>
        <Controls f={f} set={set} vertical />
      </Sheet>
    </div>
  )
}

function ResultCard({ s, q, b, roomName, out }: { s: Stay; q: Query; b: ReturnType<typeof breakdown>; roomName: string; out: boolean }) {
  const { cur } = useTravel()
  const d = destById(s.dest)!
  return (
    <li className={`tv-card ${out ? 'out' : ''}`}>
      <button type="button" className="tv-card-hit" onClick={() => go(stayHref(s, q))} aria-label={`${s.name}, ${s.area}, ${d.name}`}>
        <StayImage s={s} className="tv-card-img" />
        <div className="tv-card-body">
          <div className="tv-card-main">
            <div className="tv-card-title"><span>{s.name}</span><Stars n={s.stars} /></div>
            <div className="muted">{s.area}, {d.name}. {s.type}</div>
            <Rating s={s} long />
            <div className="muted tv-card-am">{s.amenities.slice(0, 4).join(', ')}</div>
            <div className="faint tv-card-cx">{s.cancel ? 'Free cancellation' : 'Non-refundable'}</div>
          </div>
          <div className="tv-card-price">
            {out ? <div className="tv-strong">Sold out for your dates</div> : (
              <>
                <div className="num"><span className="tv-price">{money(b.perNight, cur)}</span> <span className="muted">night</span></div>
                <div className="muted num">{money(b.total, cur)} total for {b.nights} {b.nights === 1 ? 'night' : 'nights'}</div>
                <div className="faint tv-card-room">{roomName}</div>
              </>
            )}
          </div>
        </div>
      </button>
      <Heart id={s.id} name={s.name} />
    </li>
  )
}
