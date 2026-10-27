import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, Icon, IconButton, Menu, useAnchored } from '../../ui'
import { excerptFor, fmtDate, fmtSize, kindLabel, type Item } from './data'
import { FileIcon, thumbStyle } from './FileViews'

/* ------------------------------------------------------------ fake previews */
function bars(seed: string, n: number) {
  let h = 7
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0
  return Array.from({ length: n }, () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296 })
}

function Preview({ it }: { it: Item }) {
  const r = bars(it.name, 40)
  switch (it.kind) {
    case 'image':
      return (
        <div className="pv-image" style={thumbStyle(it.name)} role="img" aria-label={`Preview of ${it.name}`}>
          <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <circle cx="122" cy="26" r="10" fill="rgba(255,255,255,0.16)" />
            <path d="M0 100 L0 72 L34 44 L58 66 L88 36 L126 74 L160 56 L160 100Z" fill="rgba(0,0,0,0.22)" />
            <path d="M0 100 L0 86 L40 64 L70 84 L104 60 L160 90 L160 100Z" fill="rgba(0,0,0,0.3)" />
          </svg>
        </div>
      )
    case 'pdf': case 'doc':
      return (
        <div className="pv-page" role="img" aria-label={`Preview of ${it.name}`}>
          <span className="pv-bar" style={{ width: '55%', height: 12 }} />
          {[92, 100, 84, 96, 60, 0, 98, 88, 100, 72, 0, 94, 80, 46].map((w, i) => w ? <span key={i} className="pv-bar" style={{ width: `${w}%` }} /> : <span key={i} className="pv-gap" />)}
        </div>
      )
    case 'text': case 'code':
      return <pre className="pv-code" aria-label={`Contents of ${it.name}`}>{excerptFor(it) || 'No preview available'}</pre>
    case 'sheet':
      return (
        <div className="pv-sheet" role="img" aria-label={`Preview of ${it.name}`}>
          {Array.from({ length: 6 }, (_, y) => <div key={y} className="pv-srow">{Array.from({ length: 5 }, (_, x) => <span key={x} className={`pv-cell ${y === 0 ? 'h' : ''}`} style={{ width: `${40 + Math.round(r[y * 5 + x] * 50)}%` }} />)}</div>)}
        </div>
      )
    case 'slides':
      return (
        <div className="pv-slide" role="img" aria-label={`Preview of ${it.name}`}>
          <span className="pv-bar" style={{ width: '48%', height: 14 }} />
          <span className="pv-bar" style={{ width: '70%' }} /><span className="pv-bar" style={{ width: '62%' }} /><span className="pv-bar" style={{ width: '54%' }} />
        </div>
      )
    case 'video':
      return <div className="pv-video" role="img" aria-label={`Preview of ${it.name}`}><span className="pv-play"><Icon name="play" size={22} /></span></div>
    case 'audio':
      return (
        <div className="pv-audio" role="img" aria-label={`Waveform of ${it.name}`}>
          <span className="pv-play sm"><Icon name="play" size={14} /></span>
          <div className="pv-wave">{r.map((v, i) => <span key={i} style={{ height: `${14 + v * 86}%` }} />)}</div>
        </div>
      )
    case 'archive':
      return (
        <div className="pv-list" role="img" aria-label={`Contents of ${it.name}`}>
          {['contracts/', 'invoices/', 'readme.txt', 'index.json'].map(n => <div key={n} className="row"><Icon name={n.endsWith('/') ? 'folder' : 'file'} size={15} /><span>{n}</span></div>)}
        </div>
      )
    case 'design':
      return (
        <div className="pv-design" role="img" aria-label={`Preview of ${it.name}`}>
          <span className="pv-frame" style={{ width: '34%', height: '70%' }} /><span className="pv-frame" style={{ width: '24%', height: '46%' }} /><span className="pv-frame" style={{ width: '28%', height: '58%' }} />
        </div>
      )
    default:
      return <div className="pv-image" style={thumbStyle(it.name)} />
  }
}

export function PreviewDialog({ item, pos, count, location, onClose, onNav, onDownload }: {
  item: Item; pos: number; count: number; location: string; onClose: () => void; onNav: (d: -1 | 1) => void; onDownload: () => void
}) {
  const done = useRef<HTMLButtonElement>(null)
  useEffect(() => { const t = window.setTimeout(() => done.current?.focus(), 0); return () => window.clearTimeout(t) }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); onNav(1) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onNav(-1) }
      else if (e.key === ' ') { e.preventDefault(); onClose() }
    }
    // registered a tick late so the keystroke that opened the preview cannot also close it
    const t = window.setTimeout(() => document.addEventListener('keydown', k), 0)
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', k) }
  }, [onNav, onClose])
  return (
    <Dialog open onClose={onClose} title={item.name} width={680}
      footer={<>
        <span className="muted num files-pv-count">{pos} of {count}</span>
        <span className="grow" />
        <IconButton icon="chevron-left" label="Previous file" disabled={count < 2} onClick={() => onNav(-1)} />
        <IconButton icon="chevron-right" label="Next file" disabled={count < 2} onClick={() => onNav(1)} />
        <Button variant="secondary" icon="download" onClick={onDownload}>Download</Button>
        <Button ref={done} variant="primary" onClick={onClose}>Done</Button>
      </>}>
      <div className="files-pv">
        <Preview it={item} />
        <dl className="files-pv-meta">
          <div><dt>Kind</dt><dd>{kindLabel(item)}</dd></div>
          <div><dt>Size</dt><dd className="num">{fmtSize(item.size)}</dd></div>
          <div><dt>Modified</dt><dd className="num">{fmtDate(item.modified, true)}</dd></div>
          <div><dt>Location</dt><dd className="truncate">{location}</dd></div>
        </dl>
      </div>
    </Dialog>
  )
}

/* ------------------------------------------------------------ move / copy picker (single-level, flat) */
export function MovePicker({ mode, moving, all, start, onClose, onConfirm }: {
  mode: 'move' | 'copy'; moving: Item[]; all: Item[]; start: string; onClose: () => void; onConfirm: (dest: string) => void
}) {
  const [cur, setCur] = useState(start)
  const more = useAnchored()
  const byId = useMemo(() => new Map(all.map(i => [i.id, i])), [all])
  const movingIds = useMemo(() => new Set(moving.filter(m => m.kind === 'folder').map(m => m.id)), [moving])
  const crumbs = useMemo(() => {
    const out: { id: string; name: string }[] = []
    for (let id: string | undefined = cur; id && id !== 'root'; id = byId.get(id)?.parent) out.unshift({ id, name: byId.get(id)?.name ?? '' })
    return [{ id: 'root', name: 'My Drive' }, ...out]
  }, [cur, byId])
  const inside = (id: string) => { for (let x: string | undefined = id; x; x = byId.get(x)?.parent) if (movingIds.has(x)) return true; return false }
  const children = all.filter(i => i.kind === 'folder' && i.parent === cur && !i.trashed).sort((a, b) => a.name.localeCompare(b.name))
  const same = mode === 'move' && moving.every(m => m.parent === cur)
  const invalid = inside(cur) || same
  const fold = crumbs.length > 3
  const hidden = fold ? crumbs.slice(1, -2) : []
  const shown = fold ? [crumbs[0], ...crumbs.slice(-2)] : crumbs
  const label = moving.length === 1 ? `“${moving[0].name}”` : `${moving.length} items`
  return (
    <Dialog open onClose={onClose} title={`${mode === 'move' ? 'Move' : 'Copy'} ${label}`} width={460}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={invalid} onClick={() => onConfirm(cur)}>{mode === 'move' ? 'Move here' : 'Copy here'}</Button></>}>
      <nav className="files-pk-crumbs" aria-label="Destination path">
        {shown.map((c, i) => (
          <span key={c.id} className="row" style={{ gap: 2 }}>
            {i > 0 && <Icon name="chevron-right" size={12} className="faint" />}
            {fold && i === 1 && (
              <>
                <button ref={more.ref} type="button" className="files-crumb" aria-label="Show hidden folders" aria-haspopup="menu" aria-expanded={more.open} onClick={more.toggle}>…</button>
                <Menu anchor={more.el} open={more.open} onClose={more.close} label="Path" items={hidden.map(h => ({ label: h.name, icon: 'folder' as const, onSelect: () => setCur(h.id) }))} />
                <Icon name="chevron-right" size={12} className="faint" />
              </>
            )}
            {i === shown.length - 1 ? <span className="files-pk-cur" aria-current="location">{c.name}</span> : <button type="button" className="files-crumb" onClick={() => setCur(c.id)}>{c.name}</button>}
          </span>
        ))}
      </nav>
      <div className="files-pk-list" role="listbox" aria-label="Folders">
        {children.map(f => {
          const blocked = inside(f.id)
          return (
            <button key={f.id} type="button" role="option" aria-selected="false" disabled={blocked} className="list-row files-pk-row" onClick={() => setCur(f.id)}>
              <FileIcon item={f} />
              <span className="truncate grow">{f.name}</span>
              {!blocked && <Icon name="chevron-right" size={15} className="faint" />}
            </button>
          )
        })}
        {!children.length && <p className="files-pk-empty muted">No folders here</p>}
      </div>
    </Dialog>
  )
}
