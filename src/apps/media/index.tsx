import './media.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell, Brand, Button, Dialog, DrawerToggle, Icon, IconButton, Menu, NavItem, SearchInput, Tabs, useAnchored, type MenuEntry } from '../../ui'
import { Art } from './art'
import { SEED_ASSETS, SEED_COLLECTIONS, fmtTime, type Asset, type Collection, type Kind } from './data'
import { Player } from './Player'
import { Viewer } from './Viewer'

type Sort = 'added' | 'title' | 'year'
type Type = 'all' | Kind
type Density = 's' | 'm' | 'l'
const COLW: Record<Density, number> = { s: 170, m: 240, l: 360 }
const SORTS: { value: Sort; label: string }[] = [{ value: 'added', label: 'Recently added' }, { value: 'title', label: 'Title' }, { value: 'year', label: 'Year' }]
const RECENT_DAYS = 14

export default function MediaApp() {
  const [assets, setAssets] = useState<Asset[]>(SEED_ASSETS)
  const [cols, setCols] = useState<Collection[]>(SEED_COLLECTIONS)
  const [view, setView] = useState<string>('library')
  const [type, setType] = useState<Type>('all')
  const [sort, setSort] = useState<Sort>('added')
  const [density, setDensity] = useState<Density>('m')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<string | null>(null)
  const [newCol, setNewCol] = useState(false)

  // player
  const [pl, setPl] = useState<{ id: string | null; queue: string[]; playing: boolean; t: number }>({ id: null, queue: [], playing: false, t: 0 })
  const [vol, setVol] = useState(70)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t) }, [])
  useEffect(() => { if (view !== 'library') { setLoading(true); const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t) } }, [view])

  const byId = useMemo(() => new Map(assets.map(a => [a.id, a])), [assets])
  const inView = useCallback((a: Asset) => view === 'library' ? true : view === 'favorites' ? a.fav : view === 'recent' ? a.added <= RECENT_DAYS : a.cols.includes(view), [view])
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase()
    return assets.filter(a => inView(a) && (type === 'all' || a.kind === type) && (!n || (a.title + ' ' + a.by + ' ' + a.motif).toLowerCase().includes(n)))
      .sort((a, b) => sort === 'added' ? a.added - b.added : sort === 'title' ? a.title.localeCompare(b.title) : b.year - a.year)
  }, [assets, inView, type, q, sort])

  const title = view === 'library' ? 'Library' : view === 'favorites' ? 'Favorites' : view === 'recent' ? 'Recently added' : cols.find(c => c.id === view)?.name ?? ''
  const count = (f: (a: Asset) => boolean) => assets.filter(f).length

  /* ---------- mutations ---------- */
  const patch = (id: string, p: Partial<Asset>) => setAssets(as => as.map(a => a.id === id ? { ...a, ...p } : a))
  const toggleFav = (id: string) => setAssets(as => as.map(a => a.id === id ? { ...a, fav: !a.fav } : a))
  const createCollection = (name: string) => {
    const id = 'c' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + cols.length
    setCols(cs => [...cs, { id, name }]); return id
  }
  const remove = (id: string) => { setAssets(as => as.filter(a => a.id !== id)); if (pl.id === id) setPl({ id: null, queue: [], playing: false, t: 0 }); if (viewing === id) setViewing(null) }

  /* ---------- playback (simulated) ---------- */
  const cur = pl.id ? byId.get(pl.id) ?? null : null
  const play = (a: Asset) => {
    if (pl.id === a.id) { setPl(s => ({ ...s, playing: !s.playing })); return }
    const queue = shown.filter(x => x.kind !== 'photo').map(x => x.id)
    setPl({ id: a.id, queue: queue.includes(a.id) ? queue : [a.id, ...queue], playing: true, t: 0 })
  }
  const step = useCallback((dir: 1 | -1, auto = false) => {
    setPl(s => {
      const q = s.queue.filter(id => byId.has(id)); if (!s.id || !q.length) return s
      const i = q.indexOf(s.id)
      if (auto && repeat) return { ...s, t: 0 }
      let n: number
      if (shuffle && q.length > 1) { do n = Math.floor(Math.random() * q.length); while (n === i) }
      else n = i + dir
      if (n >= q.length) { if (auto) return { ...s, playing: false, t: 0 }; n = 0 }
      if (n < 0) n = q.length - 1
      return { ...s, id: q[n], t: 0, playing: true }
    })
  }, [byId, repeat, shuffle])
  const stepRef = useRef(step); stepRef.current = step
  useEffect(() => {
    if (!pl.playing) return
    const iv = setInterval(() => setPl(s => ({ ...s, t: s.t + 0.25 })), 250)
    return () => clearInterval(iv)
  }, [pl.playing])
  useEffect(() => { if (cur && pl.t >= cur.dur) stepRef.current(1, true) }, [pl.t, cur])

  /* ---------- viewer ---------- */
  const vIndex = viewing ? shown.findIndex(a => a.id === viewing) : -1
  const viewer = viewing ? byId.get(viewing) : null
  const stepViewer = useCallback((d: 1 | -1) => {
    setViewing(id => { const i = shown.findIndex(a => a.id === id); if (i < 0 || !shown.length) return id; return shown[(i + d + shown.length) % shown.length].id })
  }, [shown])
  useEffect(() => { if (viewing && vIndex < 0) setViewing(null) }, [viewing, vIndex])

  const sidebar = (
    <>
      <Brand name="Studio Library" />
      <nav className="col" style={{ gap: 2 }} aria-label="Library">
        <NavItem icon="grid" label="Library" count={assets.length} current={view === 'library'} onClick={() => setView('library')} />
        <NavItem icon="heart" label="Favorites" count={count(a => a.fav)} current={view === 'favorites'} onClick={() => setView('favorites')} />
        <NavItem icon="clock" label="Recently added" count={count(a => a.added <= RECENT_DAYS)} current={view === 'recent'} onClick={() => setView('recent')} />
      </nav>
      <div className="md-side-head"><span className="eyebrow">Collections</span><IconButton icon="plus" size="sm" label="New collection" onClick={() => setNewCol(true)} /></div>
      <nav className="col scroll grow" style={{ gap: 2 }} aria-label="Collections">
        {cols.map(c => <NavItem key={c.id} icon="folder" label={c.name} count={count(a => a.cols.includes(c.id))} current={view === c.id} onClick={() => setView(c.id)} />)}
      </nav>
    </>
  )

  return (
    <AppShell sidebar={sidebar}>
      <div className="md-main">
        <header className="md-top">
          <DrawerToggle />
          <h1 className="md-h1 truncate">{title}</h1>
          {!loading && <span className="faint num md-count">{shown.length}</span>}
          <span className="grow" />
          <SearchInput className="md-search" placeholder="Search library" aria-label="Search library" value={q} onChange={e => setQ(e.target.value)} />
          <div className="md-tabs"><Tabs label="Type" value={type} onChange={setType} items={[{ value: 'all', label: 'All' }, { value: 'photo', label: 'Photos' }, { value: 'music', label: 'Music' }, { value: 'film', label: 'Film' }]} /></div>
          <MenuTrigger icon="sort" label="Sort" items={SORTS.map(s => ({ label: s.label, checked: s.value === sort, onSelect: () => setSort(s.value) }))} />
          <MenuTrigger icon="grid" label="Grid size" className="md-density" items={([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']] as const).map(([v, l]) => ({ label: l, checked: v === density, onSelect: () => setDensity(v) }))} />
        </header>

        <div className="md-scroll scroll" aria-busy={loading}>
          {loading ? <Skeleton w={COLW[density]} /> : shown.length === 0 ? (
            <div className="md-empty">
              <span className="md-empty-icon"><Icon name={q ? 'search' : 'image'} size={20} /></span>
              <h2>{q ? `No results for “${q}”` : 'Nothing here yet'}</h2>
              <p className="muted">{q ? 'Check the spelling or try a different search.' : view === 'favorites' ? 'Heart an asset to keep it here.' : 'Add assets from the viewer or a tile menu.'}</p>
              {(q || type !== 'all') && <Button onClick={() => { setQ(''); setType('all') }}>Clear search</Button>}
            </div>
          ) : (
            <ul className="md-grid" style={{ ['--cw' as string]: COLW[density] + 'px' }} aria-label="Assets">
              {shown.map(a => (
                <Tile key={a.id} a={a} cols={cols} current={pl.id === a.id} playing={pl.id === a.id && pl.playing} view={view}
                  onOpen={() => setViewing(a.id)} onPlay={() => play(a)} onFav={() => toggleFav(a.id)}
                  onRemoveFromCol={() => patch(a.id, { cols: a.cols.filter(c => c !== view) })} onDelete={() => remove(a.id)} />
              ))}
            </ul>
          )}
        </div>

        {cur && <Player asset={cur} playing={pl.playing} t={pl.t} vol={vol} shuffle={shuffle} repeat={repeat}
          onToggle={() => setPl(s => ({ ...s, playing: !s.playing }))} onPrev={() => (pl.t > 3 ? setPl(s => ({ ...s, t: 0 })) : step(-1))} onNext={() => step(1)}
          onSeek={t => setPl(s => ({ ...s, t }))} onVol={setVol} onShuffle={() => setShuffle(v => !v)} onRepeat={() => setRepeat(v => !v)}
          onClose={() => setPl({ id: null, queue: [], playing: false, t: 0 })} onOpen={() => setViewing(cur.id)} />}
      </div>

      {viewer && (
        <Viewer asset={viewer} index={vIndex} total={shown.length} collections={cols} playingId={pl.id} playing={pl.playing}
          onClose={() => setViewing(null)} onStep={stepViewer} onFav={() => toggleFav(viewer.id)} onPlay={() => play(viewer)}
          onCollections={ids => patch(viewer.id, { cols: ids })}
          onCreateCollection={name => { const id = createCollection(name); return id }} />
      )}
      <NewCollection open={newCol} onClose={() => setNewCol(false)} onCreate={name => { const id = createCollection(name); setView(id); setNewCol(false) }} />
    </AppShell>
  )
}

function MenuTrigger({ icon, label, items, className = '' }: { icon: 'sort' | 'grid'; label: string; items: MenuEntry[]; className?: string }) {
  const a = useAnchored()
  return (
    <>
      <IconButton ref={a.ref} icon={icon} label={label} className={className} aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle} />
      <Menu anchor={a.el} open={a.open} onClose={a.close} items={items} placement="bottom-end" label={label} />
    </>
  )
}

function Tile({ a, cols, current, playing, view, onOpen, onPlay, onFav, onRemoveFromCol, onDelete }: {
  a: Asset; cols: Collection[]; current: boolean; playing: boolean; view: string
  onOpen: () => void; onPlay: () => void; onFav: () => void; onRemoveFromCol: () => void; onDelete: () => void
}) {
  const menu = useAnchored()
  const playable = a.kind !== 'photo'
  const inCol = cols.some(c => c.id === view)
  const items: MenuEntry[] = [
    { label: 'Open details', icon: 'maximize', onSelect: onOpen },
    ...(playable ? [{ label: playing ? 'Pause' : a.kind === 'film' ? 'Play trailer' : 'Play', icon: playing ? 'pause' as const : 'play' as const, onSelect: onPlay }] : []),
    { label: a.fav ? 'Remove from favorites' : 'Add to favorites', icon: 'heart', onSelect: onFav },
    ...(inCol ? [{ label: 'Remove from collection', icon: 'minus' as const, onSelect: onRemoveFromCol }] : []),
    { type: 'sep' },
    { label: 'Delete from library', icon: 'trash', danger: true, onSelect: onDelete },
  ]
  const primary = a.kind === 'music' ? onPlay : onOpen
  const label = a.kind === 'music' ? `${playing ? 'Pause' : 'Play'} ${a.title} by ${a.by}` : `Open ${a.title}`
  return (
    <li className={`md-tile ${current ? 'cur' : ''} ${menu.open ? 'menu-open' : ''}`} data-kind={a.kind} style={{ aspectRatio: a.ratio }}>
      <Art motif={a.motif} pal={a.pal} seed={a.seed} ratio={a.ratio} vignette={a.kind === 'film'} />
      <button type="button" className="md-hit" aria-label={label} onClick={primary} onDoubleClick={a.kind === 'music' ? onOpen : undefined} />
      <div className="md-cap">
        <span className="truncate md-cap-t">{a.title}</span>
        <span className="truncate md-cap-s">{a.by}{playable ? ` · ${fmtTime(a.dur)}` : ''}</span>
      </div>
      {playable && (
        <button type="button" className={`md-tile-play ${playing ? 'on' : ''}`} aria-label={playing ? `Pause ${a.title}` : `Play ${a.title}`} onClick={onPlay}>
          {playing ? <span className="md-eq" aria-hidden="true"><i /><i /><i /></span> : <Icon name="play" size={18} />}
        </button>
      )}
      <div className="md-actions">
        <button type="button" className={`md-ov ${a.fav ? 'fav' : ''}`} aria-label={a.fav ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={a.fav} onClick={onFav}><Icon name="heart" size={15} /></button>
        <button ref={menu.ref} type="button" className="md-ov" aria-label={`More actions for ${a.title}`} aria-haspopup="menu" aria-expanded={menu.open} onClick={menu.toggle}><Icon name="more-h" size={16} /></button>
        <Menu anchor={menu.el} open={menu.open} onClose={menu.close} items={items} placement="bottom-end" label="Asset actions" />
      </div>
    </li>
  )
}

function Skeleton({ w }: { w: number }) {
  const r = [1.5, 0.8, 1, 1.78, 1.33, 0.8, 1, 1.5, 0.75, 1.33, 1, 1.78, 0.8, 1.5]
  return <ul className="md-grid" style={{ ['--cw' as string]: w + 'px' }} aria-hidden="true">{r.map((x, i) => <li key={i} className="md-tile skeleton" style={{ aspectRatio: x, borderRadius: 12 }} />)}</ul>
}

function NewCollection({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (n: string) => void }) {
  const [name, setName] = useState('')
  useEffect(() => { if (open) setName('') }, [open])
  const submit = () => { if (name.trim()) onCreate(name.trim()) }
  return (
    <Dialog open={open} onClose={onClose} title="New collection" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={submit}>Create</Button></>}>
      <input className="input" style={{ height: 40 }} autoFocus placeholder="Collection name" aria-label="Collection name" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }} />
    </Dialog>
  )
}
