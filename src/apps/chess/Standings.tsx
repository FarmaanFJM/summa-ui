import { useMemo, useState } from 'react'
import { Avatar, Button, Dialog, Icon, SearchInput, Tabs } from '../../ui'
import { PLAYERS, ratingHistory, type Player, type Section } from './data'
import { Band, BandHead } from './parts'

type SecFilter = 'all' | Section
type SortKey = 'rank' | 'name' | 'rating' | 'wins'
const COLS: { key: SortKey; label: string; cls: string }[] = [
  { key: 'rank', label: '#', cls: 'rank' }, { key: 'name', label: 'Player', cls: 'name' }, { key: 'rating', label: 'Rating', cls: 'rating' }, { key: 'wins', label: 'W / D / L', cls: 'wdl' },
]

export function Standings() {
  const [sec, setSec] = useState<SecFilter>('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 })
  const [open, setOpen] = useState<Player | null>(null)

  const ranked = useMemo(() => {
    const base = PLAYERS.filter(p => sec === 'all' || p.section === sec).sort((a, b) => b.rating - a.rating)
    return base.map((p, i) => ({ p, rank: i + 1 }))
  }, [sec])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    const list = ranked.filter(r => !n || r.p.name.toLowerCase().includes(n))
    const { key, dir } = sort
    return list.sort((a, b) => {
      const c = key === 'rank' ? a.rank - b.rank : key === 'rating' ? a.p.rating - b.p.rating : key === 'name' ? a.p.name.localeCompare(b.p.name) : a.p.w - b.p.w || b.p.l - a.p.l
      return c * dir
    })
  }, [ranked, q, sort])

  const toggle = (key: SortKey) => setSort(s => (s.key === key ? { key, dir: (-s.dir) as 1 | -1 } : { key, dir: key === 'rating' || key === 'wins' ? -1 : 1 }))
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none') as 'ascending' | 'descending' | 'none'

  return (
    <Band id="standings" tone="a">
      <BandHead title="Standings">
        <SearchInput className="cc-search" placeholder="Search players" aria-label="Search players" value={q} onChange={e => setQ(e.target.value)} />
        <Tabs label="Section" value={sec} onChange={setSec} items={[{ value: 'all', label: 'All' }, { value: 'Open', label: 'Open' }, { value: 'Junior', label: 'Junior' }, { value: 'Women', label: 'Women' }]} />
      </BandHead>

      <div className="cc-table-wrap">
        <table className="cc-table">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className={c.cls} aria-sort={ariaSort(c.key)} scope="col">
                  <button type="button" className="cc-th" onClick={() => toggle(c.key)}>
                    {c.label}
                    {sort.key === c.key && <Icon name={sort.dir === 1 ? 'chevron-up' : 'chevron-down'} size={13} />}
                  </button>
                </th>
              ))}
              <th className="form" scope="col"><span className="cc-th static">Form</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, rank }) => (
              <tr key={p.id} onClick={() => setOpen(p)}>
                <td className="rank num faint">{rank}</td>
                <td className="name">
                  <button type="button" className="cc-player" onClick={e => { e.stopPropagation(); setOpen(p) }} aria-label={`${p.name}, rating ${p.rating}. Open rating history`}>
                    <Avatar name={p.name} />
                    <span className="truncate">{p.name}</span>
                    <span className="faint cc-sec">{p.section}</span>
                  </button>
                </td>
                <td className="rating num">{p.rating}</td>
                <td className="wdl num muted">{p.w} / {p.d} / {p.l}</td>
                <td className="form num faint">{p.form}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="cc-empty">
            <p>No players match “{q.trim()}”.</p>
            <Button variant="ghost" onClick={() => { setQ(''); setSec('all') }}>Clear filters</Button>
          </div>
        )}
      </div>

      <PlayerDialog p={open} onClose={() => setOpen(null)} rank={open ? PLAYERS.filter(x => x.rating > open.rating).length + 1 : 0} />
    </Band>
  )
}

function PlayerDialog({ p, onClose, rank }: { p: Player | null; onClose: () => void; rank: number }) {
  return (
    <Dialog open={!!p} onClose={onClose} title={p?.name ?? ''} width={560} footer={<Button onClick={onClose} data-autofocus>Close</Button>}>
      {p && <PlayerBody p={p} rank={rank} />}
    </Dialog>
  )
}

function PlayerBody({ p, rank }: { p: Player; rank: number }) {
  const hist = useMemo(() => ratingHistory(p), [p])
  const [hover, setHover] = useState<number | null>(null)
  const games = p.w + p.d + p.l
  const delta = hist[hist.length - 1].value - hist[0].value

  const W = 520, H = 190, L = 40, Rr = 12, T = 14, Bm = 26
  const vals = hist.map(h => h.value)
  const lo = Math.floor((Math.min(...vals) - 10) / 20) * 20, hi = Math.ceil((Math.max(...vals) + 10) / 20) * 20
  const x = (i: number) => L + (i * (W - L - Rr)) / (hist.length - 1)
  const y = (v: number) => T + ((hi - v) * (H - T - Bm)) / (hi - lo)
  const path = hist.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(h.value).toFixed(1)}`).join(' ')
  const ticks = [lo, Math.round((lo + hi) / 2), hi]
  const shown = hover ?? hist.length - 1

  return (
    <div className="cc-player-body">
      <p className="muted">{p.section} section. Member since {p.since}.</p>
      <dl className="cc-stats">
        <div><dt className="eyebrow">Rating</dt><dd className="num">{p.rating}</dd></div>
        <div><dt className="eyebrow">Club rank</dt><dd className="num">{rank}</dd></div>
        <div><dt className="eyebrow">Games</dt><dd className="num">{games}</dd></div>
        <div><dt className="eyebrow">Score</dt><dd className="num">{Math.round(((p.w + p.d / 2) / games) * 100)}%</dd></div>
      </dl>
      <div className="cc-chart-head">
        <span className="eyebrow">Rating, last 12 months</span>
        <span className={`cc-delta num ${delta >= 0 ? 'up' : 'down'}`}>
          <Icon name={delta >= 0 ? 'trending-up' : 'trending-down'} size={14} />
          {delta >= 0 ? '+' : '-'}{Math.abs(delta)}
        </span>
      </div>
      <svg className="cc-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Rating history for ${p.name}: from ${hist[0].value} to ${hist[hist.length - 1].value}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          setHover(Math.max(0, Math.min(hist.length - 1, Math.round(((px - L) / (W - L - Rr)) * (hist.length - 1)))))
        }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={L} x2={W - Rr} y1={y(t)} y2={y(t)} className="cc-grid-line" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="cc-axis">{t}</text>
          </g>
        ))}
        {hist.map((h, i) => (i % 2 === 0 || i === hist.length - 1) && <text key={h.label} x={x(i)} y={H - 6} textAnchor="middle" className="cc-axis">{h.label}</text>)}
        <path d={path} className="cc-line" fill="none" />
        {hist.map((h, i) => <circle key={i} cx={x(i)} cy={y(h.value)} r={i === shown ? 4.5 : 2.5} className={i === shown ? 'cc-dot on' : 'cc-dot'} />)}
        <g transform={`translate(${Math.min(Math.max(x(shown), L + 30), W - 40)},${Math.max(y(hist[shown].value) - 12, 10)})`}>
          <text textAnchor="middle" className="cc-tip">{hist[shown].label} {hist[shown].value}</text>
        </g>
      </svg>
      <p className="faint num cc-form-line">Recent form: {p.form}</p>
    </div>
  )
}
