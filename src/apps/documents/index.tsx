import './documents.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AppShell, Brand, Button, Dialog, DrawerToggle, Icon, IconButton, Menu, MenuButton, SearchInput, Tabs, Tag, useAnchored, useHotkey, useMedia,
  type MenuEntry,
} from '../../ui'
import Editor, { type EditorApi } from './Editor'
import { NOW, SEED, relTime, type Doc } from './data'
import { wordCount } from './markdown'

const KEY = 'summa-docs-v1'
const clock = () => NOW + Math.round(performance.now())

function load(): Doc[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw)
      if (Array.isArray(v) && v.every(d => d && typeof d.id === 'string' && typeof d.md === 'string')) return v
    }
  } catch { /* fall through to seed */ }
  return SEED
}

export default function DocumentsApp() {
  const [docs, setDocs] = useState<Doc[]>(load)
  const [activeId, setActiveId] = useState<string | null>(() => docs[0]?.id ?? null)
  const [mode, setMode] = useState<'write' | 'source'>('write')
  const [gen, setGen] = useState(0)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(null)
  const mobile = useMedia('(max-width: 820px)')
  const apiRef = useRef<EditorApi | null>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const focusTitle = useRef(false)
  const seq = useRef(100)

  const doc = docs.find(d => d.id === activeId) ?? null

  /* implicit autosave: only a failure is ever surfaced */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(docs)); setSaveFailed(false) } catch { setSaveFailed(true) }
    }, 500)
    return () => window.clearTimeout(t)
  }, [docs])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const patch = useCallback((id: string, p: Partial<Doc>) => setDocs(ds => ds.map(d => (d.id === id ? { ...d, ...p, updated: clock() } : d))), [])

  const onBody = useCallback((md: string) => { if (activeId) patch(activeId, { md }) }, [activeId, patch])

  const open = (id: string) => { setActiveId(id); setMode('write'); setGen(g => g + 1) }

  const create = (title = '', md = '') => {
    const d: Doc = { id: `n${seq.current++}`, title, md, updated: clock() }
    setDocs(ds => [d, ...ds])
    setQuery('')
    focusTitle.current = true
    open(d.id)
  }

  const duplicate = (id: string) => {
    const s = docs.find(d => d.id === id)
    if (!s) return
    const d: Doc = { ...s, id: `n${seq.current++}`, title: `${s.title || 'Untitled'} (copy)`, updated: clock() }
    setDocs(ds => { const i = ds.findIndex(x => x.id === id); return [...ds.slice(0, i + 1), d, ...ds.slice(i + 1)] })
    open(d.id)
  }

  const remove = (id: string) => {
    setDocs(ds => {
      const i = ds.findIndex(d => d.id === id)
      const next = ds.filter(d => d.id !== id)
      if (id === activeId) { const n = next[Math.min(i, next.length - 1)]; setActiveId(n?.id ?? null); setGen(g => g + 1) }
      return next
    })
    setConfirm(null)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? docs.filter(d => d.title.toLowerCase().includes(q) || d.md.toLowerCase().includes(q)) : docs
  }, [docs, query])

  const words = useMemo(() => (doc ? wordCount(doc.md) : 0), [doc])

  useLayoutEffect(() => {
    if (focusTitle.current && titleRef.current) { titleRef.current.focus(); focusTitle.current = false }
  }, [activeId, gen])

  useLayoutEffect(() => {
    const t = titleRef.current
    if (t) { t.style.height = '0'; t.style.height = t.scrollHeight + 'px' }
  }, [doc?.title, activeId, mobile, collapsed])

  useHotkey('mod+\\', e => { e.preventDefault(); setCollapsed(c => !c) }, [])

  const mdFile = () => ({ name: `${(doc?.title || 'Untitled').replace(/[\\/:*?"<>|]+/g, '-')}.md`, text: `${doc?.title ? `# ${doc.title}\n\n` : ''}${doc?.md ?? ''}` })
  const exportMd = () => {
    const f = mdFile()
    const url = URL.createObjectURL(new Blob([f.text], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url; a.download = f.name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const copyMd = async () => {
    try { await navigator.clipboard.writeText(mdFile().text); setToast('Copied as Markdown') } catch { setToast('Copy is not available here') }
  }

  const docMenu = (d: Doc): MenuEntry[] => [
    { label: 'Rename', icon: 'pencil', onSelect: () => setRenaming(d.id) },
    { label: 'Duplicate', icon: 'copy', onSelect: () => duplicate(d.id) },
    { type: 'sep' },
    { label: 'Delete', icon: 'trash', danger: true, onSelect: () => setConfirm(d.id) },
  ]

  const sidebar = (
    <>
      <Brand name="Documents" />
      <div className="doc-side-tools">
        <SearchInput placeholder="Search documents" aria-label="Search documents" value={query} onChange={e => setQuery(e.target.value)} />
        <Button variant="secondary" icon="plus" className="doc-new" onClick={() => create()}>New document</Button>
      </div>
      <nav className="doc-list scroll" aria-label="Documents">
        {filtered.map(d => (
          <DocRow key={d.id} d={d} current={d.id === activeId} renaming={renaming === d.id} items={docMenu(d)}
            onOpen={() => open(d.id)} onContext={(x, y) => setCtx({ id: d.id, x, y })}
            onRename={t => { setRenaming(null); if (t !== null) patch(d.id, { title: t }) }} />
        ))}
        {!filtered.length && <p className="doc-list-empty">{query ? 'No documents match' : 'No documents yet'}</p>}
      </nav>
      <Menu anchor={ctx ? { x: ctx.x, y: ctx.y } : null} open={!!ctx} onClose={() => setCtx(null)} items={ctx ? docMenu(docs.find(d => d.id === ctx.id)!) : []} label="Document actions" />
    </>
  )

  const overflow: MenuEntry[] = [
    { label: 'Export as Markdown', icon: 'download', onSelect: exportMd },
    { label: 'Copy as Markdown', icon: 'copy', onSelect: copyMd },
    { type: 'sep' },
    { label: 'Delete document', icon: 'trash', danger: true, onSelect: () => doc && setConfirm(doc.id) },
  ]

  const target = docs.find(d => d.id === confirm)

  return (
    <div className={`docs-app ${collapsed ? 'collapsed' : ''}`}>
      <AppShell sidebar={sidebar} sideWidth={264}>
        <header className="topbar doc-topbar">
          <DrawerToggle />
          <IconButton icon="panel" label={collapsed ? 'Show sidebar' : 'Hide sidebar'} className="doc-collapse" onClick={() => setCollapsed(c => !c)} aria-pressed={!collapsed} />
          <nav className="doc-crumb" aria-label="Breadcrumb">
            <span className="muted doc-crumb-root">Documents</span>
            {doc && <><Icon name="chevron-right" size={13} className="faint doc-crumb-root" /><span className="truncate">{doc.title || 'Untitled'}</span></>}
          </nav>
          <div className="grow" />
          {saveFailed && <Tag icon="info">Not saved</Tag>}
          {doc && <span className="doc-words num faint" aria-label={`${words} words`}>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}</span>}
          {doc && <Tabs label="Editor mode" value={mode} onChange={m => { if (m === 'write' && mode === 'source') setGen(g => g + 1); setMode(m) }} items={[{ value: 'write', label: 'Write' }, { value: 'source', label: 'Source' }]} />}
          {doc && <MenuButton label="Document actions" items={overflow} />}
        </header>

        {doc ? (
          <div className="doc-scroll scroll" key={doc.id + ':' + gen}>
            <div className="doc-canvas">
              <textarea ref={titleRef} className="doc-title" rows={1} placeholder="Untitled" aria-label="Document title" value={doc.title}
                onChange={e => patch(doc.id, { title: e.target.value.replace(/\n/g, ' ') })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (mode === 'write') apiRef.current?.focusStart() } }} />
              {mode === 'write'
                ? <EditorHost md={doc.md} onChange={onBody} apiRef={apiRef} mobile={mobile} notify={setToast} />
                : <SourceView md={doc.md} onChange={md => patch(doc.id, { md })} />}
            </div>
          </div>
        ) : (
          <div className="doc-empty">
            <Icon name="file-text" size={28} />
            <p>No document open</p>
            <Button variant="primary" icon="plus" onClick={() => create()}>New document</Button>
          </div>
        )}
        {toast && <div className="doc-toast" role="status">{toast}</div>}
      </AppShell>
      <Dialog open={!!target} onClose={() => setConfirm(null)} title="Delete document?"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" autoFocus onClick={() => target && remove(target.id)}>Delete</Button></>}>
        <p className="muted">“{target?.title || 'Untitled'}” will be permanently deleted.</p>
      </Dialog>
    </div>
  )
}

/* Editor host: snapshots the initial markdown once per mount so keystrokes never re-parse. */
function EditorHost({ md, onChange, apiRef, mobile, notify }: { md: string; onChange: (m: string) => void; apiRef: React.RefObject<EditorApi | null>; mobile: boolean; notify: (m: string) => void }) {
  const [initial] = useState(md)
  return <Editor initialMd={initial} onChange={onChange} apiRef={apiRef} mobile={mobile} notify={notify} />
}

function SourceView({ md, onChange }: { md: string; onChange: (m: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => { const t = ref.current; if (t) { t.style.height = '0'; t.style.height = Math.max(t.scrollHeight, 240) + 'px' } }, [md])
  return <textarea ref={ref} className="doc-source" spellCheck={false} aria-label="Markdown source" value={md} onChange={e => onChange(e.target.value)} />
}

function DocRow({ d, current, renaming, items, onOpen, onContext, onRename }: {
  d: Doc; current: boolean; renaming: boolean; items: MenuEntry[]; onOpen: () => void; onContext: (x: number, y: number) => void; onRename: (t: string | null) => void
}) {
  const a = useAnchored()
  const [val, setVal] = useState(d.title)
  useEffect(() => { if (renaming) setVal(d.title) }, [renaming, d.title])
  if (renaming) {
    return (
      <div className="doc-row editing">
        <input className="input" autoFocus aria-label="Document name" value={val} onChange={e => setVal(e.target.value)} onFocus={e => e.currentTarget.select()}
          onBlur={() => onRename(val.trim())}
          onKeyDown={e => { if (e.key === 'Enter') onRename(val.trim()); if (e.key === 'Escape') { e.stopPropagation(); onRename(null) } }} />
      </div>
    )
  }
  return (
    <div className={`doc-row ${current ? 'current' : ''} ${a.open ? 'menu-open' : ''}`} onContextMenu={e => { e.preventDefault(); onContext(e.clientX, e.clientY) }}>
      <button type="button" className="doc-row-main" aria-current={current ? 'true' : undefined} data-closes-drawer onClick={onOpen}>
        <span className="truncate doc-row-title">{d.title || 'Untitled'}</span>
        <span className="truncate doc-row-meta">{relTime(d.updated, clock())}</span>
      </button>
      <IconButton ref={a.ref} size="sm" icon="more-h" label={`Actions for ${d.title || 'Untitled'}`} className="doc-row-more" aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle} />
      <Menu anchor={a.el} open={a.open} onClose={a.close} items={items} placement="bottom-end" label="Document actions" />
    </div>
  )
}
