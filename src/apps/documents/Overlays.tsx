import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon, IconButton, Menu, Popover, useAnchored, type Anchor, type IconName, type MenuEntry } from '../../ui'
import type { BlockKind } from './commands'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD = isMac ? '⌘' : 'Ctrl+'
export const SHIFT = isMac ? '⇧' : 'Shift+'
export const ALT = isMac ? '⌥' : 'Alt+'

export type Fmt = { bold: boolean; italic: boolean; strike: boolean; code: boolean; link: string | null; block: BlockKind | 'hr' | 'table' | null }
export const NO_FMT: Fmt = { bold: false, italic: false, strike: false, code: false, link: null, block: null }

export const BLOCK_LABEL: Record<BlockKind, string> = {
  p: 'Text', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', ul: 'Bulleted list', ol: 'Numbered list', task: 'Task list', quote: 'Quote', code: 'Code block',
}
export const BLOCK_ICON: Record<BlockKind, IconName> = {
  p: 'file-text', h1: 'heading', h2: 'heading', h3: 'heading', ul: 'list', ol: 'list-ordered', task: 'list-check', quote: 'quote', code: 'code',
}

/* ------------------------------------------------------------ floating selection toolbar */
export type TbPos = { x: number; y: number; below: boolean }

export function FloatingToolbar({ pos, pageW, mobile, kb, mode, fmt, onInline, onBlock, onLinkOpen, onLinkApply, onLinkCancel }: {
  pos: TbPos; pageW: number; mobile: boolean; kb: number; mode: 'main' | 'link'; fmt: Fmt
  onInline: (c: 'bold' | 'italic' | 'strike' | 'code') => void; onBlock: (k: BlockKind) => void
  onLinkOpen: () => void; onLinkApply: (url: string) => void; onLinkCancel: () => void
}) {
  const head = useAnchored()
  const half = mode === 'link' ? 150 : 128
  const style: CSSProperties = mobile ? { bottom: kb } : { left: Math.max(8 + half, Math.min(pos.x, pageW - 8 - half)), top: pos.y, transform: pos.below ? 'translateX(-50%)' : 'translate(-50%, -100%)' }
  const blockLabel = fmt.block && fmt.block in BLOCK_LABEL ? BLOCK_LABEL[fmt.block as BlockKind] : 'Text'
  const short = blockLabel.startsWith('Heading') ? 'H' + blockLabel.slice(-1) : mobile ? 'Aa' : blockLabel.split(' ')[0]
  const keep = (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('input')) e.preventDefault() }
  const blocks: BlockKind[] = ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'task', 'quote', 'code']
  const headItems: MenuEntry[] = blocks.map(k => ({ label: BLOCK_LABEL[k], icon: BLOCK_ICON[k], checked: fmt.block === k, onSelect: () => onBlock(k) }))

  if (mode === 'link') {
    return (
      <div className={`doc-tb popover ${mobile ? 'mobile' : ''}`} style={style} role="toolbar" aria-label="Link" onMouseDown={keep}>
        <LinkField initial={fmt.link ?? ''} onApply={onLinkApply} onCancel={onLinkCancel} />
      </div>
    )
  }
  return (
    <div className={`doc-tb popover ${mobile ? 'mobile' : ''}`} style={style} role="toolbar" aria-label="Text formatting" onMouseDown={keep}>
      <button ref={head.ref} type="button" className="doc-tb-head" aria-haspopup="menu" aria-expanded={head.open} aria-label="Turn into" onClick={head.toggle}>
        <span>{short}</span><Icon name="chevron-down" size={13} />
      </button>
      <Menu anchor={head.el} open={head.open} onClose={head.close} items={headItems} placement={mobile ? 'top-start' : 'bottom-start'} label="Turn into" />
      <span className="doc-tb-sep" />
      <IconButton size="sm" icon="bold" label="Bold" on={fmt.bold} onClick={() => onInline('bold')} />
      <IconButton size="sm" icon="italic" label="Italic" on={fmt.italic} onClick={() => onInline('italic')} />
      <IconButton size="sm" icon="strike" label="Strikethrough" on={fmt.strike} onClick={() => onInline('strike')} />
      <IconButton size="sm" icon="code" label="Inline code" on={fmt.code} onClick={() => onInline('code')} />
      <IconButton size="sm" icon="link" label="Link" on={!!fmt.link} onClick={onLinkOpen} />
      <span className="doc-tb-sep" />
      <IconButton size="sm" icon="list" label="Bulleted list" on={fmt.block === 'ul'} onClick={() => onBlock('ul')} />
    </div>
  )
}

function LinkField({ initial, onApply, onCancel }: { initial: string; onApply: (u: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <form className="doc-link" onSubmit={e => { e.preventDefault(); onApply(v.trim()) }}>
      <Icon name="link" size={15} />
      <input ref={ref} className="doc-link-input" aria-label="Link address" placeholder="Paste or type a link" value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel() } }} />
      {initial && <button type="button" className="doc-link-remove" onClick={() => onApply('')}>Remove</button>}
      <button type="submit" className="doc-link-ok" aria-label="Apply link" disabled={!v.trim()}><Icon name="check" size={15} /></button>
    </form>
  )
}

/* ------------------------------------------------------------ slash menu */
export type SlashItem = { id: string; label: string; hint?: string; icon: IconName; kind?: BlockKind; keys: string }
export const SLASH_ITEMS: SlashItem[] = [
  { id: 'p', label: 'Text', icon: 'file-text', kind: 'p', keys: 'text paragraph plain' },
  { id: 'h1', label: 'Heading 1', hint: '#', icon: 'heading', kind: 'h1', keys: 'h1 heading title large' },
  { id: 'h2', label: 'Heading 2', hint: '##', icon: 'heading', kind: 'h2', keys: 'h2 heading section' },
  { id: 'h3', label: 'Heading 3', hint: '###', icon: 'heading', kind: 'h3', keys: 'h3 heading small' },
  { id: 'ul', label: 'Bulleted list', hint: '-', icon: 'list', kind: 'ul', keys: 'bullet unordered ul list' },
  { id: 'ol', label: 'Numbered list', hint: '1.', icon: 'list-ordered', kind: 'ol', keys: 'number ordered ol list' },
  { id: 'task', label: 'Task list', hint: '[]', icon: 'list-check', kind: 'task', keys: 'todo task checkbox check list' },
  { id: 'quote', label: 'Quote', hint: '>', icon: 'quote', kind: 'quote', keys: 'quote blockquote callout' },
  { id: 'code', label: 'Code block', hint: '```', icon: 'code', kind: 'code', keys: 'code block pre snippet' },
  { id: 'table', label: 'Table', icon: 'table', keys: 'table grid rows columns' },
  { id: 'hr', label: 'Divider', hint: '---', icon: 'minus', keys: 'divider hr rule line separator' },
]

export function filterSlash(q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return SLASH_ITEMS
  return SLASH_ITEMS.filter(i => i.label.toLowerCase().includes(s) || i.keys.split(' ').some(k => k.startsWith(s)))
}

export function SlashMenu({ x, y, top, items, index, onPick, onHover }: { x: number; y: number; top: number; items: SlashItem[]; index: number; onPick: (i: SlashItem) => void; onHover: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [up, setUp] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setUp(r.bottom > window.innerHeight - 8 && r.top - el.offsetHeight - 36 > 8 ? true : false)
  }, [y, items.length])
  useLayoutEffect(() => { ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [index])
  return (
    <div ref={ref} className="doc-slash popover" role="listbox" aria-label="Insert block" style={{ left: x, top: up ? top - 4 : y, transform: up ? 'translateY(-100%)' : undefined }} onMouseDown={e => e.preventDefault()}>
      <div className="doc-slash-list">
        {items.map((it, i) => (
          <button key={it.id} type="button" role="option" aria-selected={i === index} data-active={i === index} className="menu-item doc-slash-item"
            onMouseEnter={() => onHover(i)} onClick={() => onPick(it)}>
            <span className="doc-slash-ic"><Icon name={it.icon} size={16} /></span>
            <span className="truncate">{it.label}</span>
            {it.hint && <span className="shortcut">{it.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ table grid picker */
export function TablePicker({ anchor, onClose, onPick }: { anchor: Anchor; onClose: () => void; onPick: (rows: number, cols: number) => void }) {
  const R = 6, C = 8
  const [sz, setSz] = useState<[number, number]>([3, 3])
  const key = (e: React.KeyboardEvent) => {
    const [r, c] = sz
    if (e.key === 'ArrowRight') setSz([r, Math.min(C, c + 1)])
    else if (e.key === 'ArrowLeft') setSz([r, Math.max(1, c - 1)])
    else if (e.key === 'ArrowDown') setSz([Math.min(R, r + 1), c])
    else if (e.key === 'ArrowUp') setSz([Math.max(1, r - 1), c])
    else if (e.key === 'Enter') { onClose(); onPick(r, c) }
    else return
    e.preventDefault(); e.stopPropagation()
  }
  return (
    <Popover anchor={anchor} open onClose={onClose} role="dialog" label="Insert table" className="doc-picker" focusSelector="[data-item]">
      <div data-item tabIndex={0} className="doc-picker-grid" onKeyDown={key} aria-label={`Table size ${sz[0]} by ${sz[1]}. Use arrow keys, Enter to insert.`} style={{ gridTemplateColumns: `repeat(${C}, 22px)` }}>
        {Array.from({ length: R * C }, (_, i) => {
          const r = Math.floor(i / C) + 1, c = (i % C) + 1
          return <button key={i} type="button" tabIndex={-1} aria-label={`${r} by ${c}`} className={`doc-picker-cell ${r <= sz[0] && c <= sz[1] ? 'on' : ''}`}
            onMouseEnter={() => setSz([r, c])} onClick={() => { onClose(); onPick(r, c) }} />
        })}
      </div>
      <div className="doc-picker-label num">{sz[1]} × {sz[0]}</div>
    </Popover>
  )
}
