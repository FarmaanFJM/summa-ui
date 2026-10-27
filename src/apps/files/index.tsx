import './files.css'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  AppShell, Brand, Button, Dialog, DrawerToggle, Icon, IconButton, Menu, NavItem, SearchInput, useAnchored, useMedia, type IconName, type MenuEntry,
} from '../../ui'
import { DAY, NOW, QUICK_ACCESS, QUOTA, buildItems, excerptFor, fmtSize, kindFor, kindLabel, type Item } from './data'
import { EmptyState, GridView, ListView, MobileList, Skeleton, type Sort, type SortKey, type ViewProps } from './FileViews'
import { MovePicker, PreviewDialog } from './Dialogs'

type Loc = 'drive' | 'recent' | 'starred' | 'shared' | 'trash'
const LOCS: { id: Loc; label: string; icon: IconName }[] = [
  { id: 'drive', label: 'My Drive', icon: 'drive' }, { id: 'recent', label: 'Recent', icon: 'clock' }, { id: 'starred', label: 'Starred', icon: 'star' },
  { id: 'shared', label: 'Shared', icon: 'users' }, { id: 'trash', label: 'Trash', icon: 'trash' },
]
const LOC_LABEL: Record<Loc, string> = { drive: 'My Drive', recent: 'Recent', starred: 'Starred', shared: 'Shared', trash: 'Trash' }

type Snack = { id: number; text: string; undo?: () => void }
type Upload = { id: number; name: string; pct: number }
type Ctx = { x: number; y: number; ids: string[] | null; placement?: 'bottom-start' | 'bottom-end' }

const clock = () => NOW + Math.round(performance.now())
const isInput = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)

export default function FilesApp() {
  const mobile = useMedia('(max-width: 820px)')
  const [items, setItems] = useState<Item[]>(buildItems)
  const [loc, setLoc] = useState<Loc>('drive')
  const [folder, setFolder] = useState('root')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sort, setSort] = useState<Sort>({ key: 'name', dir: 'asc' })
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'here' | 'all'>('here')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [focusId, setFocusId] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [clip, setClip] = useState<{ ids: string[]; mode: 'copy' | 'cut' } | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [picker, setPicker] = useState<{ ids: string[]; mode: 'move' | 'copy' } | null>(null)
  const [confirm, setConfirm] = useState<{ ids: string[] | 'all' } | null>(null)
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [uploads, setUploads] = useState<Upload[]>([])
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [dropId, setDropId] = useState<string | null>(null)
  const [fileDrag, setFileDrag] = useState(false)

  const anchor = useRef<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const dragIds = useRef<string[]>([])
  const seq = useRef(1000)
  const timers = useRef<number[]>([])
  const loadTimer = useRef<number>(0)
  const newMenu = useAnchored()
  const sortMenu = useAnchored()

  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(loadTimer.current) }, [])

  /* ---------------------------------------------------------------- derived */
  const byId = useMemo(() => new Map(items.map(i => [i.id, i])), [items])
  const live = useMemo(() => {
    const memo = new Map<string, boolean>()
    const ok = (i: Item): boolean => {
      if (i.trashed) return false
      if (i.parent === 'root') return true
      const m = memo.get(i.id)
      if (m !== undefined) return m
      const p = byId.get(i.parent)
      const v = p ? ok(p) : true
      memo.set(i.id, v)
      return v
    }
    return new Set(items.filter(ok).map(i => i.id))
  }, [items, byId])

  const pathOf = useCallback((it: Item) => {
    const names: string[] = []
    for (let p = byId.get(it.parent); p; p = byId.get(p.parent)) names.unshift(p.name)
    return names.length ? names.join(' / ') : 'My Drive'
  }, [byId])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list: Item[]
    if (scope === 'all' && q) list = items.filter(i => live.has(i.id))
    else if (loc === 'drive') list = items.filter(i => live.has(i.id) && i.parent === folder)
    else if (loc === 'recent') list = items.filter(i => live.has(i.id) && i.kind !== 'folder' && NOW - i.modified < 14 * DAY)
    else if (loc === 'starred') list = items.filter(i => live.has(i.id) && i.starred)
    else if (loc === 'shared') list = items.filter(i => live.has(i.id) && i.shared?.length)
    else list = items.filter(i => i.trashed)
    if (q) list = list.filter(i => i.name.toLowerCase().includes(q))
    const dir = sort.dir === 'asc' ? 1 : -1
    const cmp = (a: Item, b: Item) => {
      let r = 0
      if (sort.key === 'name') r = a.name.localeCompare(b.name, undefined, { numeric: true })
      else if (sort.key === 'modified') r = a.modified - b.modified
      else if (sort.key === 'size') r = a.size - b.size
      else r = kindLabel(a).localeCompare(kindLabel(b))
      return r * dir || a.name.localeCompare(b.name, undefined, { numeric: true })
    }
    return list.sort((a, b) => (a.kind === 'folder' ? 0 : 1) - (b.kind === 'folder' ? 0 : 1) || cmp(a, b))
  }, [items, live, loc, folder, query, scope, sort])

  const used = useMemo(() => items.reduce((s, i) => s + i.size, 0), [items])
  const showPath = scope === 'all' || loc !== 'drive'
  const trashView = loc === 'trash'
  const selItems = useMemo(() => rows.filter(r => sel.has(r.id)), [rows, sel])

  // keep the selection consistent with what is visible
  useEffect(() => {
    setSel(s => {
      const ids = new Set(rows.map(r => r.id))
      const next = new Set([...s].filter(id => ids.has(id)))
      return next.size === s.size ? s : next
    })
  }, [rows])
  useEffect(() => { if (selectMode && sel.size === 0) setSelectMode(false) }, [selectMode, sel])

  /* ---------------------------------------------------------------- snackbars, navigation */
  const snack = (text: string, undo?: () => void) => {
    const id = ++seq.current
    setSnacks(s => [...s.slice(-1), { id, text, undo }])
    timers.current.push(window.setTimeout(() => setSnacks(s => s.filter(x => x.id !== id)), undo ? 7000 : 3500))
  }
  const dismissSnack = (id: number) => setSnacks(s => s.filter(x => x.id !== id))

  const go = (next: { loc: Loc; folder?: string }) => {
    setLoc(next.loc)
    if (next.folder !== undefined) setFolder(next.folder)
    setQuery(''); setScope('here'); setSel(new Set()); setFocusId(null); setRenamingId(null); setSelectMode(false)
    setSort(next.loc === 'recent' ? { key: 'modified', dir: 'desc' } : next.loc === 'trash' ? { key: 'modified', dir: 'desc' } : { key: 'name', dir: 'asc' })
    setLoading(true)
    clearTimeout(loadTimer.current)
    loadTimer.current = window.setTimeout(() => setLoading(false), 380)
    bodyRef.current?.scrollTo({ top: 0 })
  }
  useEffect(() => { loadTimer.current = window.setTimeout(() => setLoading(false), 450) }, [])

  const crumbs = useMemo(() => {
    const out: { id: string; name: string }[] = []
    for (let p: Item | undefined = byId.get(folder); p; p = byId.get(p.parent)) out.unshift({ id: p.id, name: p.name })
    return [{ id: 'root', name: 'My Drive' }, ...out]
  }, [byId, folder])

  /* ---------------------------------------------------------------- mutations */
  const patch = (ids: string[], fn: (i: Item) => Partial<Item>) => {
    const prev = new Map<string, Item>()
    setItems(cur => cur.map(i => { if (!ids.includes(i.id)) return i; prev.set(i.id, i); return { ...i, ...fn(i) } }))
    return () => setItems(cur => cur.map(i => prev.get(i.id) ?? i))
  }
  const plural = (n: number, w = 'item') => (n === 1 ? `1 ${w}` : `${n} ${w}s`)
  const nameOf = (ids: string[]) => (ids.length === 1 ? `“${byId.get(ids[0])?.name}”` : plural(ids.length))

  const trash = (ids: string[]) => {
    if (!ids.length) return
    const undo = patch(ids, () => ({ trashed: clock() }))
    setSel(new Set()); setFocusId(null)
    snack(`Moved ${nameOf(ids)} to Trash`, undo)
  }
  const restore = (ids: string[]) => {
    const undo = patch(ids, i => ({ trashed: undefined, parent: byId.get(i.parent) && live.has(i.parent) || i.parent === 'root' ? i.parent : 'root' }))
    setSel(new Set())
    snack(`Restored ${nameOf(ids)}`, undo)
  }
  const deleteForever = (ids: string[] | 'all') => {
    const targets = ids === 'all' ? items.filter(i => i.trashed).map(i => i.id) : ids
    const kill = new Set(targets)
    let grew = true
    while (grew) { grew = false; items.forEach(i => { if (!kill.has(i.id) && kill.has(i.parent)) { kill.add(i.id); grew = true } }) }
    setItems(cur => cur.filter(i => !kill.has(i.id)))
    setSel(new Set()); setConfirm(null)
    snack(ids === 'all' ? 'Trash emptied' : `Deleted ${plural(targets.length)} forever`)
  }
  const isInside = (destId: string, folderIds: string[]) => { for (let x: string | undefined = destId; x && x !== 'root'; x = byId.get(x)?.parent) if (folderIds.includes(x)) return true; return false }
  const move = (ids: string[], dest: string) => {
    const movable = ids.filter(id => { const it = byId.get(id); return it && it.parent !== dest && !isInside(dest, [id]) })
    if (!movable.length) return
    const undo = patch(movable, () => ({ parent: dest }))
    setSel(new Set())
    snack(`Moved ${nameOf(movable)} to ${dest === 'root' ? 'My Drive' : byId.get(dest)?.name}`, undo)
  }
  const copy = (ids: string[], dest: string) => {
    const clones: Item[] = []
    const walk = (it: Item, parent: string, top: boolean) => {
      const id = `c${++seq.current}`
      let name = it.name
      if (top && it.parent === dest) { const dot = it.kind === 'folder' ? -1 : it.name.lastIndexOf('.'); name = dot > 0 ? `${it.name.slice(0, dot)} copy${it.name.slice(dot)}` : `${it.name} copy` }
      clones.push({ ...it, id, parent, name, modified: clock(), starred: false, trashed: undefined })
      if (it.kind === 'folder') items.filter(c => c.parent === it.id && !c.trashed).forEach(c => walk(c, id, false))
    }
    ids.forEach(id => { const it = byId.get(id); if (it) walk(it, dest, true) })
    setItems(cur => [...cur, ...clones])
    const added = new Set(clones.map(c => c.id))
    snack(`Copied ${nameOf(ids)}`, () => setItems(cur => cur.filter(i => !added.has(i.id))))
  }
  const rename = (id: string, name: string | null) => {
    setRenamingId(null)
    const n = name?.trim()
    if (!n || n === byId.get(id)?.name) return
    const it = byId.get(id)!
    patch([id], () => ({ name: n, kind: it.kind === 'folder' ? 'folder' : kindFor(n), modified: clock() }))
  }
  const star = (ids: string[]) => {
    const all = ids.every(id => byId.get(id)?.starred)
    patch(ids, () => ({ starred: !all }))
    if (ids.length > 1 || !all) snack(all ? `Removed ${nameOf(ids)} from Starred` : `Added ${nameOf(ids)} to Starred`)
  }

  const targetFolder = () => (loc === 'drive' ? folder : folder)
  const ensureDrive = () => { if (loc !== 'drive' || scope === 'all') go({ loc: 'drive', folder: targetFolder() }) }
  const create = (kind: 'folder' | 'doc') => {
    ensureDrive()
    const id = `n${++seq.current}`
    const it: Item = { id, parent: targetFolder(), kind: kind === 'folder' ? 'folder' : 'text', name: kind === 'folder' ? 'Untitled folder' : 'Untitled document.md', size: kind === 'folder' ? 0 : 0, modified: clock() }
    setItems(cur => [...cur, it])
    setSel(new Set([id])); setFocusId(id); anchor.current = id
    setRenamingId(id)
    setTimeout(() => bodyRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest' }), 30)
  }

  const startUpload = (files: { name: string; size: number }[]) => {
    ensureDrive()
    const dest = targetFolder()
    files.forEach((f, n) => {
      const id = ++seq.current
      setUploads(u => [...u, { id, name: f.name, pct: 0 }])
      let pct = 0
      const t = window.setInterval(() => {
        pct = Math.min(100, pct + 9 + ((id + n) % 4) * 4)
        setUploads(u => u.map(x => (x.id === id ? { ...x, pct } : x)))
        if (pct >= 100) {
          clearInterval(t)
          setItems(cur => [...cur, { id: `u${id}`, parent: dest, name: f.name, kind: kindFor(f.name), size: f.size, modified: clock() }])
          timers.current.push(window.setTimeout(() => setUploads(u => u.filter(x => x.id !== id)), 900))
        }
      }, 110)
      timers.current.push(t)
    })
  }

  const download = (ids: string[]) => {
    const its = ids.map(id => byId.get(id)).filter(Boolean) as Item[]
    if (its.length === 1 && its[0].kind !== 'folder') {
      const it = its[0]
      const url = URL.createObjectURL(new Blob([excerptFor(it) || `${it.name}\n`], { type: 'application/octet-stream' }))
      const a = document.createElement('a')
      a.href = url; a.download = it.name
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      snack(`Downloading ${it.name}`)
    } else snack(`Preparing ${plural(its.length)} for download`)
  }

  /* ---------------------------------------------------------------- selection + open */
  const open = (id: string) => {
    const it = byId.get(id)
    if (!it) return
    if (it.kind === 'folder') { if (!trashView) go({ loc: 'drive', folder: id }) } else setPreviewId(id)
  }

  const select = (e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }, id: string) => {
    if (mobile && !selectMode) { open(id); return }
    setFocusId(id)
    if (e.shiftKey && anchor.current && !(mobile && selectMode)) {
      const a = rows.findIndex(r => r.id === anchor.current), b = rows.findIndex(r => r.id === id)
      if (a >= 0 && b >= 0) { setSel(new Set(rows.slice(Math.min(a, b), Math.max(a, b) + 1).map(r => r.id))); return }
    }
    if (e.metaKey || e.ctrlKey || (mobile && selectMode)) {
      setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
      anchor.current = id
      return
    }
    setSel(new Set([id])); anchor.current = id
  }

  const toggleAll = () => setSel(s => (rows.length && rows.every(r => s.has(r.id)) ? new Set() : new Set(rows.map(r => r.id))))

  const longPress = (id: string) => { setSelectMode(true); setSel(s => new Set(s).add(id)); anchor.current = id }

  const moveFocus = (dir: 'up' | 'down' | 'left' | 'right', extend: boolean) => {
    if (!rows.length) return
    let cols = 1
    if (view === 'grid' && !mobile) {
      const cards = Array.from(bodyRef.current?.querySelectorAll<HTMLElement>('.files-card') ?? [])
      cols = Math.max(1, cards.filter(c => c.offsetTop === cards[0]?.offsetTop).length)
    } else if (view === 'grid') cols = 2
    const cur = rows.findIndex(r => r.id === (focusId ?? [...sel].pop()))
    let n = cur < 0 ? 0 : cur + (dir === 'down' ? cols : dir === 'up' ? -cols : dir === 'right' ? 1 : -1)
    if (view === 'list' && (dir === 'left' || dir === 'right')) return
    n = Math.max(0, Math.min(rows.length - 1, n))
    const id = rows[n].id
    setFocusId(id)
    if (extend && anchor.current) {
      const a = rows.findIndex(r => r.id === anchor.current)
      setSel(new Set(rows.slice(Math.min(a, n), Math.max(a, n) + 1).map(r => r.id)))
    } else { setSel(new Set([id])); anchor.current = id }
    bodyRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isInput(e.target) || previewId || picker || confirm) return
    const mod = e.metaKey || e.ctrlKey
    const ids = [...sel]
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); setSel(new Set(rows.map(r => r.id))); return }
    if (e.key === 'Escape') { if (sel.size) { setSel(new Set()); setSelectMode(false) } else if (query) { setQuery(''); setScope('here') } return }
    if (e.key.startsWith('Arrow')) { e.preventDefault(); moveFocus(e.key.slice(5).toLowerCase() as 'up', e.shiftKey); return }
    if (e.key === 'Enter' && ids.length === 1) { e.preventDefault(); open(ids[0]); return }
    if (e.key === ' ' && ids.length) { e.preventDefault(); const f = ids.map(id => byId.get(id)!).find(i => i.kind !== 'folder'); if (f) setPreviewId(f.id); return }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length) { e.preventDefault(); if (trashView) setConfirm({ ids }); else trash(ids); return }
    if (e.key === 'F2' && ids.length === 1 && !trashView) { e.preventDefault(); setRenamingId(ids[0]); return }
    if (mod && !trashView && ids.length && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) { e.preventDefault(); setClip({ ids, mode: e.key.toLowerCase() === 'c' ? 'copy' : 'cut' }); snack(`${e.key.toLowerCase() === 'c' ? 'Copied' : 'Cut'} ${nameOf(ids)}`); return }
    if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); paste(); return }
  }

  const paste = () => {
    if (!clip || trashView) return
    const dest = loc === 'drive' && scope === 'here' ? folder : null
    if (!dest) return
    if (clip.mode === 'copy') copy(clip.ids, dest); else { move(clip.ids, dest); setClip(null) }
  }

  /* ---------------------------------------------------------------- drag & drop */
  const canDrop = (dest: string) => {
    const ids = dragIds.current
    if (!ids.length || ids.includes(dest) || isInside(dest, ids)) return false
    return !ids.every(id => byId.get(id)?.parent === dest)
  }
  const drag: ViewProps['drag'] = {
    start: (e, id) => {
      const ids = sel.has(id) ? [...sel] : [id]
      if (!sel.has(id)) { setSel(new Set([id])); anchor.current = id }
      dragIds.current = ids
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', ids.join(','))
    },
    end: () => { dragIds.current = []; setDropId(null) },
    over: (e, id) => { if (canDrop(id)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropId(id) } },
    leave: id => setDropId(d => (d === id ? null : d)),
    drop: (e, id) => { e.preventDefault(); if (canDrop(id)) move(dragIds.current, id); dragIds.current = []; setDropId(null) },
  }
  const dropOn = (id: string, kind: 'folder' | 'trash' = 'folder') => ({
    onDragOver: (e: DragEvent) => { if (kind === 'trash' ? dragIds.current.length : canDrop(id)) { e.preventDefault(); setDropId(id) } },
    onDragLeave: () => setDropId(d => (d === id ? null : d)),
    onDrop: (e: DragEvent) => { e.preventDefault(); if (kind === 'trash') trash(dragIds.current); else if (canDrop(id)) move(dragIds.current, id); dragIds.current = []; setDropId(null) },
  })

  /* ---------------------------------------------------------------- menus */
  const itemMenu = (ids: string[]): MenuEntry[] => {
    const its = ids.map(id => byId.get(id)).filter(Boolean) as Item[]
    const one = its.length === 1 ? its[0] : null
    if (trashView) return [
      { label: 'Restore', icon: 'refresh', onSelect: () => restore(ids) },
      { type: 'sep' },
      { label: 'Delete forever', icon: 'trash', danger: true, shortcut: 'Del', onSelect: () => setConfirm({ ids }) },
    ]
    const out: MenuEntry[] = []
    if (one) out.push({ label: one.kind === 'folder' ? 'Open' : 'Preview', icon: one.kind === 'folder' ? 'folder' : 'eye', shortcut: one.kind === 'folder' ? 'Enter' : 'Space', onSelect: () => open(one.id) })
    out.push({ label: 'Download', icon: 'download', onSelect: () => download(ids) })
    out.push({ type: 'sep' })
    if (one) out.push({ label: 'Rename', icon: 'pencil', shortcut: 'F2', onSelect: () => setRenamingId(one.id) })
    out.push({ label: 'Move to…', icon: 'move', onSelect: () => setPicker({ ids, mode: 'move' }) })
    out.push({ label: 'Copy to…', icon: 'copy', onSelect: () => setPicker({ ids, mode: 'copy' }) })
    out.push({ label: 'Cut', icon: 'scissors', shortcut: '⌘X', onSelect: () => { setClip({ ids, mode: 'cut' }); snack(`Cut ${nameOf(ids)}`) } })
    out.push({ label: 'Copy', icon: 'copy', shortcut: '⌘C', onSelect: () => { setClip({ ids, mode: 'copy' }); snack(`Copied ${nameOf(ids)}`) } })
    out.push({ type: 'sep' })
    const allStar = its.every(i => i.starred)
    out.push({ label: allStar ? 'Remove star' : 'Add star', icon: 'star', onSelect: () => star(ids) })
    out.push({ type: 'sep' })
    out.push({ label: 'Move to Trash', icon: 'trash', danger: true, shortcut: 'Del', onSelect: () => trash(ids) })
    return out
  }

  const spaceMenu = (): MenuEntry[] => trashView
    ? [{ label: 'Empty trash', icon: 'trash', danger: true, disabled: !rows.length, onSelect: () => setConfirm({ ids: 'all' }) }]
    : [
      { label: 'New folder', icon: 'folder', onSelect: () => create('folder') },
      { label: 'New document', icon: 'file-text', onSelect: () => create('doc') },
      { label: 'Upload file…', icon: 'upload', onSelect: () => fileInput.current?.click() },
      { type: 'sep' },
      { label: 'Paste', icon: 'copy', shortcut: '⌘V', disabled: !clip || loc !== 'drive' || scope === 'all', onSelect: paste },
    ]

  const openMenuAt = (rect: DOMRect, id: string | null) => {
    let ids: string[] | null = null
    if (id) { ids = sel.has(id) ? [...sel] : [id]; if (!sel.has(id)) { setSel(new Set([id])); anchor.current = id } } else ids = [...sel]
    setCtx({ x: rect.right, y: rect.bottom, ids, placement: 'bottom-end' })
  }

  const sortItems: MenuEntry[] = [
    ...(['name', 'modified', 'size', 'kind'] as SortKey[]).map(k => ({ label: k[0].toUpperCase() + k.slice(1), checked: sort.key === k, onSelect: () => setSort(s => ({ ...s, key: k })) })),
    { type: 'sep' as const },
    { label: 'Ascending', checked: sort.dir === 'asc', onSelect: () => setSort(s => ({ ...s, dir: 'asc' })) },
    { label: 'Descending', checked: sort.dir === 'desc', onSelect: () => setSort(s => ({ ...s, dir: 'desc' })) },
  ]
  const onSort = (k: SortKey) => setSort(s => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: k === 'modified' || k === 'size' ? 'desc' : 'asc' }))

  /* ---------------------------------------------------------------- render pieces */
  const previewable = rows.filter(r => r.kind !== 'folder')
  const previewItem = previewId ? byId.get(previewId) ?? null : null
  const pvIndex = previewItem ? previewable.findIndex(r => r.id === previewItem.id) : -1
  const navPreview = useCallback((d: -1 | 1) => {
    if (previewable.length < 2) return
    const i = pvIndex < 0 ? 0 : (pvIndex + d + previewable.length) % previewable.length
    setPreviewId(previewable[i].id)
  }, [previewable, pvIndex])

  const viewProps: ViewProps = {
    rows, sel, focusId, renamingId, showPath, pathOf, trashView, selectMode, mobile, sort, onSort, dropId,
    onSelect: select, onOpen: open, onContext: (x, y, id) => { const ids = sel.has(id) ? [...sel] : [id]; if (!sel.has(id)) { setSel(new Set([id])); anchor.current = id } setFocusId(id); setCtx({ x, y, ids }) },
    onMore: openMenuAt, onStar: id => star([id]), onRename: rename, onLongPress: longPress, onToggleAll: toggleAll, drag,
  }

  const selBar = sel.size >= 2 || (mobile && selectMode && sel.size >= 1)
  const selIds = [...sel]

  const sidebar = (
    <>
      <Brand name="Files" />
      <nav className="files-locs" aria-label="Locations">
        {LOCS.map(l => (
          <div key={l.id} {...(l.id === 'trash' ? dropOn('trash', 'trash') : l.id === 'drive' ? dropOn('root') : {})} className={`files-drop-wrap ${dropId === (l.id === 'trash' ? 'trash' : l.id === 'drive' ? 'root' : '') ? 'drop' : ''}`}>
            <NavItem icon={l.icon} label={l.label} current={loc === l.id && (l.id !== 'drive' || folder === 'root')} onClick={() => go({ loc: l.id, folder: l.id === 'drive' ? 'root' : undefined })} />
          </div>
        ))}
      </nav>
      <div className="eyebrow files-side-head">Folders</div>
      <nav className="files-quick scroll" aria-label="Folders">
        {QUICK_ACCESS.map(id => {
          const f = byId.get(id)
          if (!f || !live.has(id)) return null
          return (
            <div key={id} {...dropOn(id)} className={`files-drop-wrap ${dropId === id ? 'drop' : ''}`}>
              <NavItem icon="folder" label={f.name} current={loc === 'drive' && folder === id} onClick={() => go({ loc: 'drive', folder: id })} />
            </div>
          )
        })}
      </nav>
      <div className="files-storage">
        <div className="files-storage-bar" role="img" aria-label={`${fmtSize(used)} of ${fmtSize(QUOTA)} used`}><span style={{ width: `${Math.min(100, (used / QUOTA) * 100)}%` }} /></div>
        <span className="muted num">{fmtSize(used)} of {fmtSize(QUOTA)} used</span>
      </div>
    </>
  )

  const searchBox = (
    <SearchInput className="files-search" placeholder={loc === 'drive' && scope === 'here' ? 'Search this folder' : 'Search'} aria-label="Search files" value={query}
      onChange={e => { setQuery(e.target.value); if (!e.target.value) setScope('here') }}
      onKeyDown={e => {
        if (e.key === 'Enter' && query.trim()) { setScope('all'); setSel(new Set()); setLoading(true); clearTimeout(loadTimer.current); loadTimer.current = window.setTimeout(() => setLoading(false), 300) }
        if (e.key === 'Escape') { e.stopPropagation(); if (query) { setQuery(''); setScope('here') } else (e.currentTarget as HTMLElement).blur() }
      }} />
  )

  const viewToggle = (
    <div className="tabs files-viewtoggle" role="tablist" aria-label="View">
      {(['list', 'grid'] as const).map(v => (
        <button key={v} type="button" role="tab" aria-selected={view === v} aria-label={v === 'list' ? 'List view' : 'Grid view'} title={v === 'list' ? 'List view' : 'Grid view'} className="tab files-viewtab" onClick={() => setView(v)}>
          <Icon name={v === 'list' ? 'rows' : 'grid'} size={15} />
        </button>
      ))}
    </div>
  )

  const parent = byId.get(folder)
  const title = scope === 'all' ? 'Search results' : loc === 'drive' ? (folder === 'root' ? 'My Drive' : parent?.name ?? '') : LOC_LABEL[loc]
  const canBack = loc === 'drive' && folder !== 'root' && scope === 'here'

  const breadcrumb = mobile ? (
    <div className="files-mcrumb">
      {canBack && <IconButton icon="chevron-left" label={`Back to ${parent && parent.parent !== 'root' ? byId.get(parent.parent)?.name : 'My Drive'}`} onClick={() => go({ loc: 'drive', folder: parent?.parent ?? 'root' })} />}
      <h1 className="truncate files-title">{title}</h1>
    </div>
  ) : (
    <nav className="files-crumbs" aria-label="Breadcrumb">
      {scope === 'all' ? (
        <h1 className="files-title">Search results <span className="muted">for “{query.trim()}”</span></h1>
      ) : loc === 'drive' ? (
        <CrumbTrail crumbs={crumbs} dropId={dropId} dropOn={dropOn} onGo={id => go({ loc: 'drive', folder: id })} />
      ) : <h1 className="files-title">{LOC_LABEL[loc]}</h1>}
    </nav>
  )

  const sortBtn = (
    <>
      <Button ref={sortMenu.ref} variant="ghost" icon="sort" aria-haspopup="menu" aria-expanded={sortMenu.open} className="files-sortbtn" onClick={sortMenu.toggle} aria-label={`Sort by ${sort.key}`}>
        <span className="files-sortlabel">{sort.key[0].toUpperCase() + sort.key.slice(1)}</span>
      </Button>
      <Menu anchor={sortMenu.el} open={sortMenu.open} onClose={sortMenu.close} items={sortItems} label="Sort" />
    </>
  )

  const header = selBar ? (
    <header className="topbar files-topbar files-selbar" aria-label="Selection">
      <IconButton icon="x" label="Clear selection" onClick={() => { setSel(new Set()); setSelectMode(false) }} />
      <span className="files-selcount num" role="status">{sel.size} selected</span>
      <div className="grow" />
      {trashView ? (
        <>
          <Button variant="ghost" icon="refresh" onClick={() => restore(selIds)}>{mobile ? '' : 'Restore'}</Button>
          <Button variant="danger" icon="trash" onClick={() => setConfirm({ ids: selIds })}>{mobile ? '' : 'Delete forever'}</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" icon="move" aria-label="Move to" onClick={() => setPicker({ ids: selIds, mode: 'move' })}>{mobile ? '' : 'Move'}</Button>
          <Button variant="ghost" icon="download" aria-label="Download" onClick={() => download(selIds)}>{mobile ? '' : 'Download'}</Button>
          <Button variant="ghost" icon="trash" aria-label="Move to Trash" onClick={() => trash(selIds)}>{mobile ? '' : 'Delete'}</Button>
          <IconButton icon="more-h" label="More actions" aria-haspopup="menu" onClick={e => openMenuAt(e.currentTarget.getBoundingClientRect(), null)} />
        </>
      )}
    </header>
  ) : (
    <header className="topbar files-topbar">
      <DrawerToggle />
      {breadcrumb}
      <div className="grow" />
      {!mobile && searchBox}
      {(view === 'grid' || mobile) && sortBtn}
      {viewToggle}
      {trashView
        ? <Button variant="secondary" icon="trash" disabled={!rows.length} onClick={() => setConfirm({ ids: 'all' })}>Empty trash</Button>
        : <>
          <Button ref={newMenu.ref} variant="primary" icon="plus" aria-haspopup="menu" aria-expanded={newMenu.open} onClick={newMenu.toggle}>New</Button>
          <Menu anchor={newMenu.el} open={newMenu.open} onClose={newMenu.close} label="New" placement="bottom-end" items={[
            { label: 'New folder', icon: 'folder', onSelect: () => create('folder') },
            { label: 'New document', icon: 'file-text', onSelect: () => create('doc') },
            { type: 'sep' },
            { label: 'Upload file…', icon: 'upload', onSelect: () => fileInput.current?.click() },
          ]} />
        </>}
    </header>
  )

  const q = query.trim()
  let body: React.ReactNode
  if (loading) body = <Skeleton grid={view === 'grid'} mobile={mobile && view === 'list'} />
  else if (!rows.length) {
    body = q ? <EmptyState icon="search" title={`No results for “${q}”`} body={scope === 'here' ? 'Press Enter to search everywhere.' : 'Try a different name.'} />
      : loc === 'trash' ? <EmptyState icon="trash" title="Trash is empty" body="Items you delete stay here until you remove them for good." />
      : loc === 'starred' ? <EmptyState icon="star" title="No starred items" body="Star the files you come back to most." />
      : loc === 'shared' ? <EmptyState icon="users" title="Nothing shared yet" />
      : loc === 'recent' ? <EmptyState icon="clock" title="No recent files" />
      : <EmptyState icon="folder" title="This folder is empty" body="Drop files here, or add something to get started.">
        <Button variant="secondary" icon="folder" onClick={() => create('folder')}>New folder</Button>
        <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>Upload file</Button>
      </EmptyState>
  } else body = view === 'grid' ? <GridView {...viewProps} /> : mobile ? <MobileList {...viewProps} /> : <ListView {...viewProps} />

  return (
    <div className="files-app">
      <AppShell sidebar={sidebar} sideWidth={248}>
        {header}
        {mobile && !selBar && <div className="files-subbar">{searchBox}</div>}
        <div
          ref={bodyRef} className={`files-body scroll ${fileDrag ? 'file-drag' : ''} ${sel.size ? 'has-sel' : ''}`} tabIndex={0} aria-label="File area" onKeyDown={onKeyDown}
          onMouseDown={e => { if ((e.target as HTMLElement).closest('input,button')) return; (e.currentTarget as HTMLElement).focus({ preventScroll: true }) }}
          onClick={e => { if (!(e.target as HTMLElement).closest('[data-id],button,input,th,a')) { setSel(new Set()); setSelectMode(false) } }}
          onContextMenu={e => { if ((e.target as HTMLElement).closest('[data-id]')) return; e.preventDefault(); setSel(new Set()); setCtx({ x: e.clientX, y: e.clientY, ids: null }) }}
          onDragOver={e => { if (e.dataTransfer.types.includes('Files') && !trashView) { e.preventDefault(); setFileDrag(true) } }}
          onDragLeave={e => { if (e.currentTarget === e.target) setFileDrag(false) }}
          onDrop={e => { setFileDrag(false); if (e.dataTransfer.files.length && !trashView) { e.preventDefault(); startUpload(Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: f.size }))) } }}
        >
          {body}
        </div>

        <div className="files-toasts" aria-live="polite">
          {uploads.length > 0 && (
            <div className="files-uploads" role="status">
              {uploads.slice(-3).map(u => (
                <div key={u.id} className="files-upload">
                  <div className="row"><span className="truncate grow">{u.name}</span><span className="muted num">{u.pct >= 100 ? 'Done' : `${u.pct}%`}</span></div>
                  <div className="files-upload-bar"><span style={{ width: `${u.pct}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          {snacks.map(s => (
            <div key={s.id} className="files-snack" role="status">
              <span className="truncate">{s.text}</span>
              {s.undo && <button type="button" className="files-snack-undo" onClick={() => { s.undo!(); dismissSnack(s.id) }}>Undo</button>}
            </div>
          ))}
        </div>
      </AppShell>

      <input ref={fileInput} type="file" multiple hidden aria-hidden="true" tabIndex={-1} onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) startUpload(f.map(x => ({ name: x.name, size: x.size }))); e.target.value = '' }} />

      <Menu anchor={ctx ? { x: ctx.x, y: ctx.y } : null} open={!!ctx} onClose={() => setCtx(null)} placement={ctx?.placement} items={ctx ? (ctx.ids && ctx.ids.length ? itemMenu(ctx.ids) : spaceMenu()) : []} label="File actions" />

      {previewItem && <PreviewDialog item={previewItem} pos={Math.max(1, pvIndex + 1)} count={previewable.length || 1} location={pathOf(previewItem)} onClose={() => setPreviewId(null)} onNav={navPreview} onDownload={() => download([previewItem.id])} />}
      {picker && <MovePicker mode={picker.mode} moving={picker.ids.map(id => byId.get(id)!).filter(Boolean)} all={items} start={loc === 'drive' ? folder : 'root'} onClose={() => setPicker(null)}
        onConfirm={dest => { const p = picker; setPicker(null); if (p.mode === 'move') move(p.ids, dest); else copy(p.ids, dest) }} />}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.ids === 'all' ? 'Empty trash?' : 'Delete forever?'}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => confirm && deleteForever(confirm.ids)}>{confirm?.ids === 'all' ? 'Empty trash' : 'Delete forever'}</Button></>}>
        <p className="muted">{confirm?.ids === 'all' ? 'Everything in Trash will be permanently deleted.' : `${Array.isArray(confirm?.ids) ? nameOf(confirm!.ids as string[]) : ''} will be permanently deleted. This can’t be undone.`}</p>
      </Dialog>
    </div>
  )
}

/* Breadcrumb trail; long paths fold their middle into a menu. Crumbs accept drops (move into that folder). */
function CrumbTrail({ crumbs, dropId, dropOn, onGo }: { crumbs: { id: string; name: string }[]; dropId: string | null; dropOn: (id: string) => object; onGo: (id: string) => void }) {
  const a = useAnchored()
  const fold = crumbs.length > 4
  const hidden = fold ? crumbs.slice(1, crumbs.length - 2) : []
  const shown = fold ? [crumbs[0], ...crumbs.slice(-2)] : crumbs
  return (
    <ol className="files-crumblist">
      {shown.map((c, i) => {
        const last = c.id === crumbs[crumbs.length - 1].id
        return (
          <li key={c.id} className="files-crumbitem">
            {i > 0 && <Icon name="chevron-right" size={13} className="faint" />}
            {fold && i === 1 && (
              <>
                <button ref={a.ref} type="button" className="files-crumb" aria-label="Show folders in path" aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle}>…</button>
                <Menu anchor={a.el} open={a.open} onClose={a.close} items={hidden.map(h => ({ label: h.name, icon: 'folder' as IconName, onSelect: () => onGo(h.id) }))} label="Path" />
                <Icon name="chevron-right" size={13} className="faint" />
              </>
            )}
            {last ? <h1 className="files-title" aria-current="location">{c.name}</h1>
              : <button type="button" className={`files-crumb ${dropId === c.id ? 'drop' : ''}`} onClick={() => onGo(c.id)} {...dropOn(c.id)}>{c.name}</button>}
          </li>
        )
      })}
    </ol>
  )
}
