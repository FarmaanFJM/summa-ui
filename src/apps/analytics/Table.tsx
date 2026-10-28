import { useEffect, useMemo, useState, type MutableRefObject } from 'react'
import { Dropdown, Icon, IconButton, SearchInput } from '../../ui'
import type { Col, Row, TableDef } from './data'

const PAGE = 10
type Sort = { key: string; dir: 'asc' | 'desc' }

export function DataTable({ def, rows, viewRef }: { def: TableDef; rows: Row[]; viewRef: MutableRefObject<{ cols: Col[]; rows: Row[]; name: string } | null> }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<Sort>(def.defaultSort)
  const [page, setPage] = useState(0)

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const first = def.cols[0].key
    let out = rows.filter(r => (filter === 'all' || r[def.filter!.key] === filter) && (!needle || String(r[first]).toLowerCase().includes(needle)))
    out = [...out].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key]
      if (x === null || x === undefined) return y === null || y === undefined ? 0 : 1
      if (y === null || y === undefined) return -1
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return sort.dir === 'asc' ? c : -c
    })
    return out
  }, [rows, q, filter, sort, def])

  useEffect(() => { viewRef.current = { cols: def.cols, rows: view, name: def.csvName } }, [view, def, viewRef])
  useEffect(() => { setPage(0) }, [q, filter, sort])
  const pages = Math.max(1, Math.ceil(view.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const shown = view.slice(cur * PAGE, cur * PAGE + PAGE)
  const toggle = (c: Col) => setSort(s => s.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: c.align === 'right' ? 'desc' : 'asc' })

  return (
    <section className="an-panel an-table" aria-label={def.title}>
      <header className="an-ph">
        <h2>{def.title}</h2>
        <span className="grow" />
        <SearchInput className="an-search" placeholder={def.search} aria-label={def.search} value={q} onChange={e => setQ(e.target.value)} />
        {def.filter && (
          <Dropdown quiet label={def.filter.label} value={filter} onChange={setFilter} width={190}
            options={[{ value: 'all', label: `All ${def.filter.label.toLowerCase()}s` }, ...def.filter.options.map(o => ({ value: o, label: o }))]} />
        )}
      </header>
      <div className="an-tablewrap scroll">
        <table>
          <thead>
            <tr>
              {def.cols.map((c, i) => (
                <th key={c.key} className={`${c.align === 'right' ? 'r' : ''} ${i === 0 ? 'stick' : ''}`} aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" className="an-th" onClick={() => toggle(c)} data-on={sort.key === c.key || undefined}>
                    {c.label}
                    <Icon name={sort.key === c.key && sort.dir === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, ri) => (
              <tr key={ri}>
                {def.cols.map((c, i) => {
                  const v = r[c.key]
                  const text = c.fmt ? (c.fmt as (x: unknown) => string)(v) : String(v ?? '')
                  return <td key={c.key} className={`${c.align === 'right' ? 'r num' : ''} ${i === 0 ? 'stick' : 'sec'}`}>{i === 0 ? <span className="truncate">{text}</span> : text}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <div className="an-empty">No results{q ? <> for “{q}”</> : null}</div>}
      </div>
      <footer className="an-pf">
        <span className="muted num">{view.length ? `${cur * PAGE + 1}–${cur * PAGE + shown.length} of ${view.length}` : '0 results'}</span>
        <span className="grow" />
        <IconButton size="sm" icon="chevron-left" label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} />
        <IconButton size="sm" icon="chevron-right" label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} />
      </footer>
    </section>
  )
}
