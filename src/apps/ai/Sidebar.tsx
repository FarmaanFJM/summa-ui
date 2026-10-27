import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { Avatar, Brand, Button, Dialog, Icon, IconButton, Menu, SearchInput, useAnchored } from '../../ui'
import { GROUP_ORDER, groupOf, type Conv } from './data'

type RowProps = { c: Conv; active: boolean; onOpen: () => void; onRename: (t: string) => void; onPin: () => void; onDelete: () => void }

function Row({ c, active, onOpen, onRename, onPin, onDelete }: RowProps) {
  const a = useAnchored()
  const [renaming, setRenaming] = useState(false)
  const [v, setV] = useState(c.title)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (renaming) { input.current?.focus(); input.current?.select() } }, [renaming])
  const commit = () => { const t = v.trim(); if (t && t !== c.title) onRename(t); setRenaming(false) }

  return (
    <li className="ai-conv" data-active={active || undefined} data-open={a.open || undefined}>
      {renaming ? (
        <input ref={input} className="ai-rename" value={v} aria-label="Conversation name" maxLength={80}
          onChange={e => setV(e.target.value)} onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'Escape') { e.stopPropagation(); setV(c.title); setRenaming(false) }
          }} />
      ) : (
        <>
          <button type="button" className="ai-conv-main" aria-current={active ? 'page' : undefined} data-closes-drawer onClick={onOpen}>
            <span className="truncate">{c.title}</span>
          </button>
          <IconButton ref={a.ref} className="ai-more" size="sm" icon="more-h" label={`Actions for ${c.title}`} aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle} />
          <Menu anchor={a.el} open={a.open} onClose={a.close} label="Conversation actions" width={176} items={[
            { label: 'Rename', icon: 'pencil', onSelect: () => { setV(c.title); setRenaming(true) } },
            { label: c.pinned ? 'Unpin' : 'Pin', icon: 'star', onSelect: onPin },
            { type: 'sep' },
            { label: 'Delete', icon: 'trash', danger: true, onSelect: onDelete },
          ]} />
        </>
      )}
    </li>
  )
}

type Props = {
  convs: Conv[]; activeId: string | null; query: string; onQuery: (q: string) => void; searchRef: Ref<HTMLDivElement>
  onNew: () => void; onOpen: (id: string) => void; onRename: (id: string, t: string) => void; onPin: (id: string) => void; onDelete: (id: string) => void
}

export function Sidebar({ convs, activeId, query, onQuery, searchRef, onNew, onOpen, onRename, onPin, onDelete }: Props) {
  const [confirm, setConfirm] = useState<Conv | null>(null)
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = convs
      .filter(c => !q || c.title.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q)))
      .sort((x, y) => y.updated - x.updated)
    const map = new Map<string, Conv[]>()
    for (const c of list) {
      const g = c.pinned ? 'Pinned' : groupOf(c.updated)
      map.set(g, [...(map.get(g) ?? []), c])
    }
    return GROUP_ORDER.filter(g => map.has(g)).map(g => ({ g, items: map.get(g)! }))
  }, [convs, query])

  return (
    <div className="ai-side">
      <Brand name="Atlas" />
      <div className="ai-side-top">
        <Button variant="secondary" icon="message-plus" className="ai-new" data-closes-drawer onClick={onNew} title="New chat (Ctrl+Shift+O)">New chat</Button>
        <div ref={searchRef}><SearchInput placeholder="Search chats" aria-label="Search chats" value={query} title="Search (Ctrl+K)"
          onChange={e => onQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { if (query) onQuery(''); else e.currentTarget.blur() } }} /></div>
      </div>
      <nav className="ai-convs scroll" aria-label="Conversations">
        {groups.map(({ g, items }) => (
          <section key={g} aria-label={g}>
            <h2 className="eyebrow">{g}</h2>
            <ul>
              {items.map(c => (
                <Row key={c.id} c={c} active={c.id === activeId} onOpen={() => onOpen(c.id)}
                  onRename={t => onRename(c.id, t)} onPin={() => onPin(c.id)} onDelete={() => setConfirm(c)} />
              ))}
            </ul>
          </section>
        ))}
        {!groups.length && <p className="ai-none faint">{query ? 'No chats match your search' : 'No conversations yet'}</p>}
      </nav>
      <div className="ai-user">
        <Avatar name="Farmaan Mohammad" />
        <span className="truncate grow">Farmaan Mohammad</span>
        <Icon name="chevron-down" size={14} className="faint" />
      </div>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete conversation?" width={400}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" autoFocus onClick={() => { if (confirm) onDelete(confirm.id); setConfirm(null) }}>Delete</Button>
        </>}>
        <p className="muted truncate">“{confirm?.title}” will be permanently removed.</p>
      </Dialog>
    </div>
  )
}
