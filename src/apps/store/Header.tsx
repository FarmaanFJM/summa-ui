import { useEffect, useMemo, useRef, useState } from 'react'
import { IconButton } from '../../ui'
import { SI } from './icons'
import { Art, Overlay } from './parts'
import { CATS, PRODUCTS, kindLabel, money, type Product } from './data'
import { go, href, type Route } from './router'
import { totals, useShop } from './state'

export function Logo({ to = href.home }: { to?: string }) {
  return (
    <a className="st-logo" href={to} aria-label="Oak & Ember home">
      <span className="brand-mark"><SI name="layers" size={13} strokeWidth={2.4} /></span>
      <span>Oak &amp; Ember</span>
    </a>
  )
}

/* ---------------------------------------------------------------- search */
const norm = (s: string) => s.toLowerCase()
export function matches(q: string): Product[] {
  const toks = norm(q).split(/\s+/).filter(Boolean)
  if (!toks.length) return []
  return PRODUCTS.filter(p => {
    const hay = norm([p.name, kindLabel(p.kind), CATS.find(c => c.id === p.cat)?.name, p.material, p.colors.join(' ')].join(' '))
    return toks.every(t => hay.includes(t.replace(/s$/, '')))
  })
}

function SearchBox({ route, autoFocus, onDone }: { route: Route; autoFocus?: boolean; onDone?: () => void }) {
  const { recents, addRecent, removeRecent, clearRecents } = useShop()
  const [q, setQ] = useState(route.name === 'search' ? route.q : '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => { setQ(route.name === 'search' ? route.q : '') }, [route])
  useEffect(() => {
    if (!open) return
    const d = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', d)
    return () => document.removeEventListener('mousedown', d)
  }, [open])
  const results = useMemo(() => matches(q).slice(0, 5), [q])
  type Row = { key: string; kind: 'recent' | 'product' | 'search'; text: string; p?: Product }
  const rows: Row[] = q.trim()
    ? [{ key: 'all', kind: 'search', text: q.trim() }, ...results.map(p => ({ key: p.id, kind: 'product' as const, text: p.name, p }))]
    : recents.map(r => ({ key: r, kind: 'recent' as const, text: r }))
  const submit = (text: string) => { addRecent(text); setOpen(false); setActive(-1); onDone?.(); go(href.search(text)) }
  const choose = (r: Row) => { if (r.kind === 'product') { addRecent(q.trim() || r.text); setOpen(false); onDone?.(); go(href.product(r.p!.id)) } else submit(r.text) }
  return (
    <div className="st-search" ref={wrap}>
      <form className="search" role="search" onSubmit={e => { e.preventDefault(); if (active >= 0 && rows[active]) choose(rows[active]); else if (q.trim()) submit(q.trim()) }}>
        <SI name="search" size={15} />
        <input className="input" type="search" autoComplete="off" autoFocus={autoFocus} placeholder="Search lamps, mugs, notebooks" aria-label="Search the store" role="combobox" aria-expanded={open} aria-controls="st-sugg" aria-autocomplete="list"
          value={q} onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); setActive(-1) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(rows.length - 1, a + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(-1, a - 1)) }
            if (e.key === 'Escape') { setOpen(false); setActive(-1) }
          }} />
      </form>
      {open && (rows.length > 0 || q.trim()) && (
        <div className="st-sugg" id="st-sugg" role="listbox" aria-label="Suggestions">
          {!q.trim() && <div className="st-sugg-head"><span className="eyebrow">Recent searches</span><button type="button" className="st-linkbtn" onClick={clearRecents}>Clear</button></div>}
          {q.trim() && results.length > 0 && <div className="st-sugg-head"><span className="eyebrow">Suggestions</span></div>}
          {rows.map((r, i) => (
            <div key={r.key} className="st-sugg-row" role="option" aria-selected={active === i} data-active={active === i} onMouseEnter={() => setActive(i)}>
              <button type="button" className="st-sugg-main" onClick={() => choose(r)}>
                {r.kind === 'recent' && <SI name="clock" size={15} />}
                {r.kind === 'search' && <SI name="search" size={15} />}
                {r.kind === 'product' && <span className="st-sugg-img"><Art p={r.p!} /></span>}
                <span className="truncate">{r.kind === 'search' ? <>Search for “{r.text}”</> : r.text}</span>
                {r.kind === 'product' && <span className="muted num">{money(r.p!.price)}</span>}
              </button>
              {r.kind === 'recent' && <button type="button" className="icon-btn sm" aria-label={`Remove ${r.text}`} onClick={() => removeRecent(r.text)}><SI name="x" size={14} /></button>}
            </div>
          ))}
          {q.trim() && results.length === 0 && <div className="st-sugg-empty muted">No products match “{q.trim()}”</div>}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- mega menu */
function Mega({ id, onClose }: { id: string; onClose: () => void }) {
  const cat = CATS.find(c => c.id === id)!
  const items = PRODUCTS.filter(p => p.cat === id)
  const featured = [...items].sort((a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews)).slice(0, 2)
  return (
    <div className="st-mega" role="region" aria-label={`${cat.name} menu`}>
      <div className="st-mega-in">
        <div className="st-mega-col">
          <h2>{cat.name}</h2>
          <p className="muted">{cat.blurb}</p>
          <a className="btn btn-secondary" href={href.cat(id)} onClick={onClose}>Shop all {cat.name.toLowerCase()}</a>
        </div>
        <div className="st-mega-col">
          <div className="eyebrow">Browse</div>
          {cat.kinds.map(k => <a key={k.kind} className="st-mega-link" href={href.cat(id, k.kind)} onClick={onClose}><span>{k.label}</span><span className="faint num">{items.filter(p => p.kind === k.kind).length}</span></a>)}
        </div>
        {featured.map(p => (
          <a key={p.id} className="st-mega-feat" href={href.product(p.id)} onClick={onClose}>
            <span className="st-mega-img"><Art p={p} /></span>
            <span className="truncate">{p.name}</span><span className="muted num">{money(p.price)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- header */
export function Header({ route }: { route: Route }) {
  const { lines, promo, wish, openDrawer } = useShop()
  const [mega, setMega] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [msearch, setMsearch] = useState(false)
  const t = useRef(0)
  const count = totals(lines, promo).count
  const open = (id: string | null, ms = 90) => { window.clearTimeout(t.current); t.current = window.setTimeout(() => setMega(id), id ? ms : 160) }
  useEffect(() => { setMega(null); setMenu(false); setMsearch(false) }, [route])
  useEffect(() => {
    if (!mega) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setMega(null) }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [mega])
  const activeCat = route.name === 'category' ? route.id : route.name === 'product' ? PRODUCTS.find(p => p.id === route.id)?.cat : undefined
  return (
    <header className="st-header" onMouseLeave={() => open(null)}>
      <div className="st-bar">
        <IconButton icon="menu" label="Open menu" className="st-only-m" onClick={() => setMenu(true)} />
        <Logo />
        <div className="st-searchslot"><SearchBox route={route} /></div>
        <div className="st-actions">
          <IconButton icon="search" label="Search" className="st-only-m" on={msearch} onClick={() => setMsearch(s => !s)} />
          <a className="icon-btn st-hearts" href={href.wishlist} aria-label={`Wishlist, ${wish.length} saved`} title="Wishlist"><SI name="heart" size={18} />{wish.length > 0 && <span className="st-dot num">{wish.length}</span>}</a>
          <button type="button" className="st-cartbtn" aria-label={`Open bag, ${count} items`} onClick={openDrawer}><SI name="bag" size={18} /><span className="num">{count}</span></button>
        </div>
      </div>
      {msearch && <div className="st-msearch"><SearchBox route={route} autoFocus onDone={() => setMsearch(false)} /></div>}
      <nav className="st-catnav" aria-label="Categories" onMouseEnter={() => window.clearTimeout(t.current)}>
        <a href={href.cat('all')} className="st-catlink" aria-current={route.name === 'category' && route.id === 'all' ? 'page' : undefined} onMouseEnter={() => open(null, 0)}>Shop all</a>
        {CATS.map(c => (
          <a key={c.id} href={href.cat(c.id)} className="st-catlink" aria-current={activeCat === c.id ? 'page' : undefined} aria-expanded={mega === c.id} aria-haspopup="true"
            onMouseEnter={() => open(c.id)} onFocus={() => open(c.id, 0)}
            onClick={e => { if (matchMedia('(pointer: coarse)').matches && mega !== c.id) { e.preventDefault(); setMega(c.id) } }}>{c.name}</a>
        ))}
      </nav>
      {mega && <div onMouseEnter={() => window.clearTimeout(t.current)}><Mega id={mega} onClose={() => setMega(null)} /></div>}
      <Overlay open={menu} onClose={() => setMenu(false)} side="left" label="Menu">
        <div className="st-sheet-head"><Logo /><IconButton icon="x" label="Close menu" onClick={() => setMenu(false)} /></div>
        <div className="st-sheet-body">
          <a className="st-menulink" href={href.cat('all')}>Shop all</a>
          {CATS.map(c => <a key={c.id} className="st-menulink" href={href.cat(c.id)}>{c.name}<span className="faint num">{PRODUCTS.filter(p => p.cat === c.id).length}</span></a>)}
          <a className="st-menulink" href={href.wishlist}>Wishlist<span className="faint num">{wish.length}</span></a>
        </div>
      </Overlay>
    </header>
  )
}

export function MiniHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="st-mini">
      <div className="st-mini-in">
        <Logo />
        <span className="grow" />
        {right}
      </div>
    </header>
  )
}
