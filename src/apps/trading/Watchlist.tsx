import { useMemo, useState } from 'react'
import { Dropdown, Icon, IconButton, SearchInput, Tabs } from '../../ui'
import { INSTRUMENTS, type State } from './engine'
import { num, sgnPct } from './fmt'

type SortKey = 'sym' | 'chg' | 'price' | 'vol'

export function Spark({ data, up, w = 52, h = 22 }: { data: number[]; up: boolean; w?: number; h?: number }) {
  const mn = Math.min(...data), mx = Math.max(...data), rg = mx - mn || 1
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${((i / (data.length - 1)) * (w - 2) + 1).toFixed(1)} ${(2 + (1 - (v - mn) / rg) * (h - 4)).toFixed(1)}`).join('')
  return <svg width={w} height={h} aria-hidden="true" className={up ? 'tr-up' : 'tr-down'}><path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

export function Watchlist({ s, sel, onSel, starred, onStar }: { s: State; sel: string; onSel: (sym: string) => void; starred: string[]; onStar: (sym: string) => void }) {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<'all' | 'starred'>('all')
  const [key, setKey] = useState<SortKey>('sym')
  const [dir, setDir] = useState<1 | -1>(1)
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return INSTRUMENTS.filter(i => (scope === 'all' || starred.includes(i.sym)) && (!ql || i.sym.toLowerCase().includes(ql) || i.name.toLowerCase().includes(ql)))
  }, [q, scope, starred])
  const val = (sym: string) => { const m = s.mk[sym]; return key === 'sym' ? sym : key === 'price' ? m.price : key === 'vol' ? m.vol24 * m.price : (m.price / m.open24 - 1) }
  const sorted = [...rows].sort((a, b) => { const x = val(a.sym), y = val(b.sym); return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * dir })
  return (
    <div className="tr-wl">
      <div className="tr-wl-top">
        <SearchInput placeholder="Search instruments" aria-label="Search instruments" value={q} onChange={e => setQ(e.target.value)} />
        <div className="tr-wl-ctl">
          <Tabs label="Watchlist scope" flat items={[{ value: 'all', label: 'All' }, { value: 'starred', label: `Starred ${starred.length}` }]} value={scope} onChange={setScope} />
          <div className="grow" />
          <Dropdown quiet label="Sort by" value={key} onChange={setKey} width={160}
            options={[{ value: 'sym', label: 'Symbol' }, { value: 'chg', label: 'Change %' }, { value: 'price', label: 'Last price' }, { value: 'vol', label: 'Volume' }]}
            renderValue={sel => <span className="truncate">{sel[0]?.label}</span>} />
          <IconButton icon={dir === 1 ? 'arrow-up' : 'arrow-down'} label={dir === 1 ? 'Sort ascending' : 'Sort descending'} size="sm" onClick={() => setDir(d => (d === 1 ? -1 : 1))} />
        </div>
      </div>
      <ul role="list" className="tr-wl-list scroll">
        {sorted.map(i => {
          const m = s.mk[i.sym], chg = (m.price / m.open24 - 1) * 100, up = chg >= 0
          const on = starred.includes(i.sym)
          return (
            <li key={i.sym} className={`tr-wl-row ${sel === i.sym ? 'sel' : ''}`}>
              <button type="button" className={`tr-star ${on ? 'on' : ''}`} aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${i.sym} ${on ? 'from' : 'to'} starred`} onClick={() => onStar(i.sym)}>
                <Icon name="star" size={14} fill={on} />
              </button>
              <button type="button" className="tr-wl-main" aria-current={sel === i.sym ? 'true' : undefined} onClick={() => onSel(i.sym)}>
                <span className="tr-wl-s"><b>{i.sym}</b><span className="faint truncate">{i.name}</span></span>
                <Spark data={m.spark} up={up} />
                <span className="tr-wl-p"><span className="num">{num(m.price, i.dec)}</span><span className={`num ${up ? 'tr-up' : 'tr-down'}`}>{sgnPct(chg)}</span></span>
              </button>
            </li>
          )
        })}
        {!sorted.length && <li className="tr-empty">{scope === 'starred' && !q ? 'Star an instrument to pin it here.' : 'No instruments match.'}</li>}
      </ul>
    </div>
  )
}
