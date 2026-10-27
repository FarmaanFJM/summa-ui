import { useEffect, useRef, type DragEvent, type MouseEvent } from 'react'
import { Avatar, Checkbox, Icon, IconButton } from '../../ui'
import { ICON, fmtDate, fmtSize, kindLabel, type Item } from './data'

export type SortKey = 'name' | 'modified' | 'size' | 'kind'
export type Sort = { key: SortKey; dir: 'asc' | 'desc' }

export type ViewProps = {
  rows: Item[]; sel: Set<string>; focusId: string | null; renamingId: string | null
  showPath: boolean; pathOf: (it: Item) => string; trashView: boolean
  selectMode: boolean; mobile: boolean
  sort: Sort; onSort: (k: SortKey) => void
  dropId: string | null
  onSelect: (e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }, id: string) => void
  onOpen: (id: string) => void
  onContext: (x: number, y: number, id: string) => void
  onMore: (rect: DOMRect, id: string) => void
  onStar: (id: string) => void
  onRename: (id: string, name: string | null) => void
  onLongPress: (id: string) => void
  onToggleAll: () => void
  drag: { start: (e: DragEvent, id: string) => void; end: () => void; over: (e: DragEvent, id: string) => void; leave: (id: string) => void; drop: (e: DragEvent, id: string) => void }
}

/* ------------------------------------------------------------ small pieces */
export function FileIcon({ item, size = 18 }: { item: Item; size?: number }) {
  return <span className={`files-icon k-${item.kind}`}><Icon name={ICON[item.kind]} size={size} fill={false} /></span>
}

function hueOf(name: string) { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360; return h }
export const thumbStyle = (name: string) => { const h = hueOf(name); return { background: `linear-gradient(135deg, hsl(${h} 22% 34%), hsl(${(h + 40) % 360} 26% 22%))` } }

function Avatars({ people }: { people?: string[] }) {
  if (!people?.length) return null
  const shown = people.slice(0, 3)
  return (
    <span className="files-avatars" aria-label={`Shared with ${people.join(', ')}`}>
      {shown.map(p => <Avatar key={p} name={p} />)}
      {people.length > 3 && <span className="faint num files-more">+{people.length - 3}</span>}
    </span>
  )
}

function RenameInput({ item, onDone }: { item: Item; onDone: (name: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  useEffect(() => {
    const el = ref.current!
    el.focus()
    const dot = item.kind === 'folder' ? -1 : item.name.lastIndexOf('.')
    el.setSelectionRange(0, dot > 0 ? dot : item.name.length)
  }, [item.kind, item.name])
  const finish = (v: string | null) => { if (done.current) return; done.current = true; onDone(v) }
  return (
    <input ref={ref} className="input files-rename" defaultValue={item.name} aria-label="Name" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}
      onBlur={e => finish(e.currentTarget.value)}
      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') finish(e.currentTarget.value); if (e.key === 'Escape') finish(null) }} />
  )
}

const rowProps = (p: ViewProps, it: Item) => ({
  'data-id': it.id,
  'aria-selected': p.sel.has(it.id),
  draggable: !p.mobile && p.renamingId !== it.id,
  onDragStart: (e: DragEvent) => p.drag.start(e, it.id),
  onDragEnd: p.drag.end,
  ...(it.kind === 'folder' && !p.trashView ? {
    onDragOver: (e: DragEvent) => p.drag.over(e, it.id),
    onDragLeave: () => p.drag.leave(it.id),
    onDrop: (e: DragEvent) => p.drag.drop(e, it.id),
  } : {}),
  onClick: (e: MouseEvent) => { if (longPressed.current) { longPressed.current = false; return } p.onSelect(e, it.id) },
  onDoubleClick: () => { if (!p.mobile && !p.selectMode) p.onOpen(it.id) },
  onContextMenu: (e: MouseEvent) => { e.preventDefault(); if (p.mobile) p.onLongPress(it.id); else p.onContext(e.clientX, e.clientY, it.id) },
})

const longPressed = { current: false }
function useLongPress(on: () => void) {
  const t = useRef<number>(0)
  return {
    onTouchStart: () => { t.current = window.setTimeout(() => { longPressed.current = true; on() }, 480) },
    onTouchEnd: () => window.clearTimeout(t.current),
    onTouchMove: () => window.clearTimeout(t.current),
  }
}

/* ------------------------------------------------------------ list (desktop table) */
const HEAD: { key: SortKey; label: string; cls: string }[] = [
  { key: 'name', label: 'Name', cls: 'c-name' }, { key: 'modified', label: 'Modified', cls: 'c-mod' }, { key: 'size', label: 'Size', cls: 'c-size' }, { key: 'kind', label: 'Kind', cls: 'c-kind' },
]

export function ListView(p: ViewProps) {
  const all = p.rows.length > 0 && p.rows.every(r => p.sel.has(r.id))
  const some = p.rows.some(r => p.sel.has(r.id))
  return (
    <table className="files-table" role="grid" aria-multiselectable="true" aria-label="Files">
      <colgroup><col className="w-check" /><col /><col className="w-mod" /><col className="w-size" /><col className="w-kind" /><col className="w-share" /><col className="w-act" /></colgroup>
      <thead>
        <tr role="row">
          <th className="c-check" role="columnheader"><Checkbox checked={all ? true : some ? 'mixed' : false} onChange={p.onToggleAll} label="Select all" /></th>
          {HEAD.map(h => {
            const active = p.sort.key === h.key
            return (
              <th key={h.key} role="columnheader" className={h.cls} aria-sort={active ? (p.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`files-th ${active ? 'on' : ''}`} onClick={() => p.onSort(h.key)}>
                  {h.label}
                  <Icon name={p.sort.dir === 'asc' ? 'arrow-up' : 'arrow-down'} size={12} />
                </button>
              </th>
            )
          })}
          <th className="c-share" role="columnheader"><span className="sr-only">Shared with</span></th>
          <th className="c-act" role="columnheader"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {p.rows.map(it => (
          <tr key={it.id} role="row" {...rowProps(p, it)} className={`files-row ${p.sel.has(it.id) ? 'sel' : ''} ${p.focusId === it.id ? 'focus' : ''} ${p.dropId === it.id ? 'drop' : ''}`}>
            <td className="c-check" role="gridcell"><Checkbox checked={p.sel.has(it.id)} onChange={() => p.onSelect({ shiftKey: false, metaKey: true, ctrlKey: false }, it.id)} label={`Select ${it.name}`} /></td>
            <td className="c-name" role="gridcell">
              <div className="files-namecell">
                <FileIcon item={it} />
                <div className="files-nametext">
                  {p.renamingId === it.id ? <RenameInput item={it} onDone={n => p.onRename(it.id, n)} /> : <span className="truncate files-name">{it.name}</span>}
                  {p.showPath && <span className="truncate files-path">{p.pathOf(it)}</span>}
                </div>
              </div>
            </td>
            <td className="c-mod muted num" role="gridcell">{fmtDate(it.modified)}</td>
            <td className="c-size muted num" role="gridcell">{it.kind === 'folder' ? '' : fmtSize(it.size)}</td>
            <td className="c-kind muted" role="gridcell"><span className="truncate">{kindLabel(it)}</span></td>
            <td className="c-share" role="gridcell"><Avatars people={it.shared} /></td>
            <td className="c-act" role="gridcell">
              <span className="files-actions">
                {!p.trashView && <IconButton size="sm" icon="star" label={it.starred ? 'Remove star' : 'Add star'} className={it.starred ? 'on starred' : 'star-off'} onClick={e => { e.stopPropagation(); p.onStar(it.id) }} onDoubleClick={e => e.stopPropagation()} />}
                <IconButton size="sm" icon="more-h" label={`More actions for ${it.name}`} aria-haspopup="menu" onClick={e => { e.stopPropagation(); p.onMore(e.currentTarget.getBoundingClientRect(), it.id) }} onDoubleClick={e => e.stopPropagation()} />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------ grid */
export function GridView(p: ViewProps) {
  return (
    <div className="files-grid" role="listbox" aria-multiselectable="true" aria-label="Files">
      {p.rows.map(it => <Card key={it.id} it={it} p={p} />)}
    </div>
  )
}

function Card({ it, p }: { it: Item; p: ViewProps }) {
  const lp = useLongPress(() => p.onLongPress(it.id))
  return (
    <div role="option" {...rowProps(p, it)} {...(p.mobile ? lp : {})} className={`files-card ${p.sel.has(it.id) ? 'sel' : ''} ${p.focusId === it.id ? 'focus' : ''} ${p.dropId === it.id ? 'drop' : ''}`}>
      <div className="files-thumb" style={it.kind === 'image' ? thumbStyle(it.name) : undefined}>
        {it.kind === 'folder' ? <Icon name="folder" size={44} strokeWidth={1.25} /> : <Icon name={ICON[it.kind]} size={it.kind === 'image' ? 22 : 34} strokeWidth={1.25} />}
        {!p.trashView && it.starred && <Icon name="star" size={13} fill className="files-thumb-star" />}
        <span className="files-card-check"><Checkbox checked={p.sel.has(it.id)} onChange={() => p.onSelect({ shiftKey: false, metaKey: true, ctrlKey: false }, it.id)} label={`Select ${it.name}`} /></span>
        <span className="files-card-more"><IconButton size="sm" icon="more-h" label={`More actions for ${it.name}`} aria-haspopup="menu" onClick={e => { e.stopPropagation(); p.onMore(e.currentTarget.getBoundingClientRect(), it.id) }} onDoubleClick={e => e.stopPropagation()} /></span>
      </div>
      <div className="files-card-text">
        {p.renamingId === it.id ? <RenameInput item={it} onDone={n => p.onRename(it.id, n)} /> : <span className="truncate files-name">{it.name}</span>}
        <span className="truncate files-path">{p.showPath ? p.pathOf(it) : it.kind === 'folder' ? fmtDate(it.modified) : `${fmtDate(it.modified)} · ${fmtSize(it.size)}`}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ mobile rows */
export function MobileList(p: ViewProps) {
  return (
    <div className="files-mlist" role="listbox" aria-multiselectable="true" aria-label="Files">
      {p.rows.map(it => <MobileRow key={it.id} it={it} p={p} />)}
    </div>
  )
}

function MobileRow({ it, p }: { it: Item; p: ViewProps }) {
  const lp = useLongPress(() => p.onLongPress(it.id))
  return (
    <div role="option" {...rowProps(p, it)} {...lp} className={`files-mrow ${p.sel.has(it.id) ? 'sel' : ''}`}>
      {p.selectMode ? <Checkbox checked={p.sel.has(it.id)} onChange={() => p.onSelect({ shiftKey: false, metaKey: true, ctrlKey: false }, it.id)} label={`Select ${it.name}`} /> : null}
      <FileIcon item={it} size={20} />
      <div className="files-nametext">
        {p.renamingId === it.id ? <RenameInput item={it} onDone={n => p.onRename(it.id, n)} /> : <span className="truncate files-name">{it.name}</span>}
        <span className="truncate files-path">{p.showPath ? p.pathOf(it) : it.kind === 'folder' ? fmtDate(it.modified) : `${fmtDate(it.modified)} · ${fmtSize(it.size)}`}</span>
      </div>
      {it.starred && !p.trashView && <Icon name="star" size={13} fill className="files-mstar" />}
      {!p.selectMode && <IconButton icon="more-h" label={`More actions for ${it.name}`} aria-haspopup="menu" onClick={e => { e.stopPropagation(); p.onMore(e.currentTarget.getBoundingClientRect(), it.id) }} />}
    </div>
  )
}

/* ------------------------------------------------------------ states */
export function Skeleton({ grid, mobile }: { grid: boolean; mobile: boolean }) {
  if (grid) return <div className="files-grid" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <div key={i} className="files-card"><div className="files-thumb skeleton" /><div className="files-card-text"><span className="skeleton sk-line" style={{ width: '70%' }} /><span className="skeleton sk-line" style={{ width: '40%', height: 10 }} /></div></div>)}</div>
  return (
    <div className={mobile ? 'files-mlist' : 'files-skel'} aria-hidden="true" aria-busy="true">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="files-skel-row">
          <span className="skeleton sk-icon" />
          <span className="skeleton sk-line" style={{ width: `${34 + ((i * 17) % 30)}%` }} />
          {!mobile && <><span className="skeleton sk-line sk-r" style={{ width: 70 }} /><span className="skeleton sk-line sk-r" style={{ width: 50 }} /></>}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, body, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="files-empty">
      <span className="files-empty-ic"><Icon name={icon} size={26} strokeWidth={1.4} /></span>
      <p className="files-empty-title">{title}</p>
      {body && <p className="muted files-empty-body">{body}</p>}
      {children && <div className="row files-empty-actions">{children}</div>}
    </div>
  )
}

