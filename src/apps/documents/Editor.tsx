import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { IconButton, Menu, useAnchored, useContextMenu, type IconName, type MenuEntry } from '../../ui'
import { domToMd, mdToHtml } from './markdown'
import {
  blockKindOf, caretTo, cellOf, convertBlocks, ensureTrailingParagraph, insertTable, locate, nextCell, restoreOffsets, saveOffsets, selectCellContents,
  selectedBlocks, tableOp, textPos, toggleInlineCode, topBlock, type BlockKind, type TableOp,
} from './commands'
import {
  ALT, BLOCK_ICON, BLOCK_LABEL, FloatingToolbar, MOD, NO_FMT, SHIFT, SlashMenu, TablePicker, filterSlash, type Fmt, type SlashItem, type TbPos,
} from './Overlays'

export type EditorApi = { focusStart: () => void }
type Props = { initialMd: string; onChange: (md: string) => void; apiRef: RefObject<EditorApi | null>; mobile: boolean; notify: (m: string) => void }

const MD_SHORTCUTS: [RegExp, BlockKind, boolean?][] = [
  [/^#$/, 'h1'], [/^##$/, 'h2'], [/^###$/, 'h3'], [/^[-*+]$/, 'ul'], [/^\d+\.$/, 'ol'], [/^>$/, 'quote'], [/^\[ ?\]$/, 'task'], [/^\[[xX]\]$/, 'task', true],
]

function Editor({ initialMd, onChange, apiRef, mobile, notify }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [html] = useState(() => mdToHtml(initialMd))
  const lastRange = useRef<Range | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [fmt, setFmt] = useState<Fmt>(NO_FMT)
  const [tb, setTb] = useState<TbPos | null>(null)
  const [tbMode, setTbMode] = useState<'main' | 'link'>('main')
  const linkMode = useRef(false)
  const [slash, setSlash] = useState<{ x: number; y: number; top: number; q: string } | null>(null)
  const [slashIdx, setSlashIdx] = useState(0)
  const [tblPos, setTblPos] = useState<{ x: number; y: number } | null>(null)
  const [picker, setPicker] = useState<{ x: number; y: number } | null>(null)
  const [kb, setKb] = useState(0)
  const [pageW, setPageW] = useState(720)
  const ctx = useContextMenu()

  const slashItems = useMemo(() => (slash ? filterSlash(slash.q) : []), [slash])
  const slashOpen = !!slash && slashItems.length > 0

  const emit = useCallback(() => { if (rootRef.current) onChangeRef.current(domToMd(rootRef.current)) }, [])

  /* ---- selection bookkeeping ---- */
  const inRoot = (n: Node | null) => !!n && !!rootRef.current?.contains(n)

  const restore = useCallback(() => {
    const root = rootRef.current!
    const s = getSelection()
    if (s && s.anchorNode && inRoot(s.anchorNode)) { if (document.activeElement !== root && !root.contains(document.activeElement)) root.focus({ preventScroll: true }); return }
    root.focus({ preventScroll: true })
    if (lastRange.current && s) { s.removeAllRanges(); s.addRange(lastRange.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const relTo = (rect: { left: number; top: number; right: number; bottom: number; width: number }) => {
    const pr = pageRef.current!.getBoundingClientRect()
    return { left: rect.left - pr.left, top: rect.top - pr.top, right: rect.right - pr.left, bottom: rect.bottom - pr.top, width: rect.width }
  }

  const refresh = useCallback(() => {
    const root = rootRef.current, page = pageRef.current
    if (!root || !page) return
    const s = getSelection()
    if (!s || !s.rangeCount || !s.anchorNode || !root.contains(s.anchorNode)) {
      if (!document.activeElement?.closest?.('.doc-tb') && !linkMode.current) setTb(null)
      return
    }
    const r = s.getRangeAt(0)
    lastRange.current = r.cloneRange()
    const el = (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement) as Element | null
    const a = el?.closest('a')
    const blk = topBlock(root, s.anchorNode)
    let q = (c: string) => false
    try { q = (c: string) => document.queryCommandState(c) } catch { /* ignore */ }
    setFmt({ bold: q('bold'), italic: q('italic'), strike: q('strikeThrough'), code: !!el?.closest('code'), link: a?.getAttribute('href') ?? null, block: blockKindOf(blk) })
    setPageW(page.clientWidth)

    if (!r.collapsed && s.toString().trim() && !cellSpan(r)) {
      const rect = r.getBoundingClientRect()
      const rel = relTo(rect)
      const vTop = rect.top
      const below = vTop < 120
      setTb({ x: rel.left + rel.width / 2, y: below ? rel.bottom + 8 : rel.top - 8, below })
    } else if (!linkMode.current) { setTb(null); setTbMode('main') }

    const cell = cellOf(s.anchorNode)
    if (cell) {
      const w = relTo(cell.closest('.doc-tbl')!.getBoundingClientRect())
      setTblPos({ x: w.right, y: w.top })
    } else setTblPos(null)
  }, [])

  const cellSpan = (r: Range) => !!cellOf(r.startContainer) && cellOf(r.startContainer) !== cellOf(r.endContainer)

  useEffect(() => {
    const f = () => refresh()
    document.addEventListener('selectionchange', f)
    return () => document.removeEventListener('selectionchange', f)
  }, [refresh])

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p')
    const vv = window.visualViewport
    if (!vv) return
    const f = () => setKb(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    vv.addEventListener('resize', f); vv.addEventListener('scroll', f)
    return () => { vv.removeEventListener('resize', f); vv.removeEventListener('scroll', f) }
  }, [])

  useEffect(() => {
    apiRef.current = {
      focusStart: () => {
        const root = rootRef.current!
        root.focus({ preventScroll: true })
        const first = root.firstElementChild
        if (first) caretTo(first)
      },
    }
    return () => { apiRef.current = null }
  }, [apiRef])

  /* ---- commands ---- */
  const cmd = (c: string, v?: string) => { restore(); document.execCommand(c, false, v); emit(); refresh() }

  const inline = (k: 'bold' | 'italic' | 'strike' | 'code') => {
    restore()
    if (k === 'code') toggleInlineCode(rootRef.current!)
    else document.execCommand(k === 'strike' ? 'strikeThrough' : k)
    emit(); refresh()
  }

  const applyBlock = (kind: BlockKind, opts?: { checked?: boolean }) => {
    restore()
    const root = rootRef.current!
    const s = getSelection()
    const blocks = selectedBlocks(root)
    if (!blocks.length || !s) return
    const same = blocks.every(b => blockKindOf(b) === kind)
    const target: BlockKind = same && kind !== 'p' ? 'p' : kind
    const off = saveOffsets(root)
    const collapsed = s.isCollapsed
    const first = convertBlocks(root, blocks, target)
    ensureTrailingParagraph(root)
    restoreOffsets(root, off)
    if (first && collapsed && !(first.textContent ?? '').length) caretTo(first)
    if (opts?.checked && first) first.querySelector('li')?.setAttribute('data-checked', 'true')
    emit(); refresh()
  }

  const insertHr = () => {
    restore()
    const root = rootRef.current!
    const s = getSelection()
    const cur = s?.anchorNode ? topBlock(root, s.anchorNode) : null
    const hr = document.createElement('hr')
    const empty = cur && blockKindOf(cur) === 'p' && !(cur.textContent ?? '').trim()
    if (cur && empty) cur.before(hr); else if (cur) cur.after(hr); else root.appendChild(hr)
    if (!hr.nextElementSibling || blockKindOf(hr.nextElementSibling) !== 'p') { const p = document.createElement('p'); p.innerHTML = '<br>'; hr.after(p) }
    caretTo(empty && cur ? cur : (hr.nextElementSibling as HTMLElement))
    emit(); refresh()
  }

  const addTable = (rows: number, cols: number) => {
    restore()
    const first = insertTable(rootRef.current!, rows, cols)
    selectCellContents(first)
    emit(); refresh()
  }

  const runTable = (op: TableOp) => {
    restore()
    const s = getSelection()
    const cell = cellOf(s?.anchorNode ?? null) ?? cellOf(lastRange.current?.startContainer ?? null)
    if (!cell) return
    const res = tableOp(cell, op)
    if (res) { if (op === 'del-table') caretTo(res); else selectCellContents(res) }
    emit(); refresh()
  }

  const startLink = () => {
    restore()
    const s = getSelection()
    if (!s || !s.rangeCount) return
    const r = s.getRangeAt(0)
    const a = (r.startContainer.nodeType === 1 ? (r.startContainer as Element) : r.startContainer.parentElement)?.closest('a')
    if (r.collapsed && a) { const nr = document.createRange(); nr.selectNodeContents(a); s.removeAllRanges(); s.addRange(nr) }
    const rect = (s.getRangeAt(0).getClientRects()[0] ?? r.getBoundingClientRect())
    const rel = relTo(rect)
    linkMode.current = true
    lastRange.current = s.getRangeAt(0).cloneRange()
    setTb({ x: rel.left + rel.width / 2, y: rect.top < 120 ? rel.bottom + 8 : rel.top - 8, below: rect.top < 120 })
    setTbMode('link')
  }

  const endLink = () => { linkMode.current = false; setTbMode('main') }

  const applyLink = (raw: string) => {
    endLink()
    restore()
    const s = getSelection()
    if (!raw) { document.execCommand('unlink'); emit(); refresh(); return }
    const url = /^([a-z][a-z0-9+.-]*:|#|\/)/i.test(raw) ? raw : /^[^\s]+\.[^\s]{2,}$/.test(raw) || raw.startsWith('www.') ? 'https://' + raw : raw
    if (s && s.isCollapsed) document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '&quot;')}">${raw.replace(/</g, '&lt;')}</a>`)
    else document.execCommand('createLink', false, url)
    emit(); refresh()
  }

  const cancelLink = () => { endLink(); restore(); refresh() }

  /* ---- slash menu ---- */
  const checkSlash = () => {
    const root = rootRef.current!
    const s = getSelection()
    if (s && s.isCollapsed && s.anchorNode && root.contains(s.anchorNode)) {
      const blk = topBlock(root, s.anchorNode)
      if (blk && blk.tagName === 'P') {
        const m = /^\/([a-z0-9]*)$/i.exec((blk.textContent ?? '').replace(/ /g, ' '))
        if (m) {
          const br = blk.getBoundingClientRect()
          const sc = blk.closest('.doc-scroll') as HTMLElement | null
          if (sc && br.bottom + 340 > window.innerHeight) sc.scrollBy({ top: br.bottom + 340 - window.innerHeight })
          const rel = relTo(blk.getBoundingClientRect())
          setSlash(prev => { if (!prev || prev.q !== m[1]) setSlashIdx(0); return { x: rel.left, y: rel.bottom + 4, top: rel.top, q: m[1] } })
          return
        }
      }
    }
    setSlash(null)
  }

  const pickSlash = (item: SlashItem) => {
    const root = rootRef.current!
    const s = getSelection()
    const blk = s?.anchorNode ? topBlock(root, s.anchorNode) : null
    if (blk) { blk.innerHTML = '<br>'; caretTo(blk) }
    const at = slash
    setSlash(null)
    if (item.id === 'table') { setPicker({ x: (at?.x ?? 0) + (pageRef.current?.getBoundingClientRect().left ?? 0), y: (blk?.getBoundingClientRect().bottom ?? 200) + 4 }); return }
    if (item.id === 'hr') { insertHr(); return }
    if (item.kind) applyBlock(item.kind)
  }

  /* ---- DOM events ---- */
  const onInput = () => {
    const root = rootRef.current!
    const s = getSelection()
    if (s && s.anchorNode && (s.anchorNode === root || (s.anchorNode.parentNode === root && s.anchorNode.nodeType === 3))) document.execCommand('formatBlock', false, 'p')
    if (!root.firstChild) { root.innerHTML = '<p><br></p>'; caretTo(root.firstChild!) }
    emit(); checkSlash(); refresh()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = rootRef.current!
    const s = getSelection()
    const mod = e.metaKey || e.ctrlKey
    if (e.nativeEvent.isComposing) return

    if (slashOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => (i + 1) % slashItems.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(i => (i - 1 + slashItems.length) % slashItems.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickSlash(slashItems[Math.min(slashIdx, slashItems.length - 1)]); return }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setSlash(null); return }
    }

    if (mod) {
      const k = e.key.toLowerCase()
      if (!e.altKey && !e.shiftKey) {
        if (k === 'b') { e.preventDefault(); inline('bold'); return }
        if (k === 'i') { e.preventDefault(); inline('italic'); return }
        if (k === 'e') { e.preventDefault(); inline('code'); return }
        if (k === 'k') { e.preventDefault(); startLink(); return }
      }
      if (e.shiftKey && !e.altKey) {
        if (k === 'x' || k === 's') { e.preventDefault(); inline('strike'); return }
        if (e.code === 'Digit7') { e.preventDefault(); applyBlock('ol'); return }
        if (e.code === 'Digit8') { e.preventDefault(); applyBlock('ul'); return }
        if (e.code === 'Digit9') { e.preventDefault(); applyBlock('task'); return }
        if (e.code === 'Period') { e.preventDefault(); applyBlock('quote'); return }
      }
      if (e.altKey) {
        const map: Record<string, BlockKind> = { Digit0: 'p', Digit1: 'h1', Digit2: 'h2', Digit3: 'h3', KeyC: 'code' }
        if (map[e.code]) { e.preventDefault(); applyBlock(map[e.code]); return }
      }
    }
    if (!s || !s.anchorNode || !root.contains(s.anchorNode)) return
    const blk = topBlock(root, s.anchorNode)
    const kind = blockKindOf(blk)

    /* tables: Tab / Enter navigation */
    const cell = cellOf(s.anchorNode)
    if (cell) {
      if (e.key === 'Tab') {
        e.preventDefault()
        const n = nextCell(cell, e.shiftKey ? -1 : 1, !e.shiftKey)
        if (n) { selectCellContents(n); emit(); refresh() }
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const table = cell.closest('table')!
        const row = cell.parentElement as HTMLTableRowElement
        const next = table.rows[row.rowIndex + 1]?.cells[cell.cellIndex] ?? tableOp(cell, 'row-below')
        if (next) { selectCellContents(next); emit(); refresh() }
        return
      }
      if (e.key === 'Backspace' && s.isCollapsed && !(cell.textContent ?? '').length) { e.preventDefault(); return }
    }

    if (e.key === 'Enter' && blk) {
      if (kind === 'p' && s.isCollapsed && !e.shiftKey) {
        const t = (blk.textContent ?? '').trim()
        if (/^```[\w-]*$/.test(t)) { e.preventDefault(); blk.innerHTML = '<br>'; caretTo(blk); applyBlock('code'); return }
        if (/^(---|\*\*\*|___)$/.test(t)) { e.preventDefault(); blk.innerHTML = '<br>'; caretTo(blk); insertHr(); return }
      }
      if (kind === 'code') {
        e.preventDefault()
        const pos = textPos(blk, s.anchorNode, s.anchorOffset)
        const text = Array.from(blk.childNodes).map(n => (n.nodeName === 'BR' ? '\n' : n.textContent ?? '')).join('')
        const before = text.slice(0, pos), after = text.slice(pos)
        if (mod || (before.endsWith('\n') && /^\n*$/.test(after))) {
          const kept = (before + after).replace(/\n+$/, '')
          if (kept) blk.textContent = kept; else blk.innerHTML = '<br>'
          let p = blk.nextElementSibling as HTMLElement | null
          if (!p || blockKindOf(p) !== 'p') { p = document.createElement('p'); p.innerHTML = '<br>'; blk.after(p) }
          caretTo(p)
        } else {
          blk.textContent = before + '\n' + after + (after === '' ? '\n' : '')
          const loc = locate(blk, pos + 1)
          if (loc) getSelection()?.setBaseAndExtent(loc[0], loc[1], loc[0], loc[1])
        }
        emit(); refresh()
        return
      }
      if (kind === 'quote') {
        const child = (() => { let n: Node | null = s.anchorNode; while (n && n.parentNode !== blk) n = n.parentNode; return n as HTMLElement | null })()
        if (child && child !== blk && child.nodeType === 1 && !(child.textContent ?? '').length) {
          e.preventDefault()
          child.remove()
          const p = document.createElement('p'); p.innerHTML = '<br>'
          if (!blk.children.length) { blk.replaceWith(p) } else blk.after(p)
          caretTo(p)
          emit(); refresh()
          return
        }
      }
      if (kind === 'task') setTimeout(() => {
        const s2 = getSelection()
        const li = (s2?.anchorNode && (s2.anchorNode.nodeType === 1 ? (s2.anchorNode as Element) : s2.anchorNode.parentElement))?.closest('li')
        if (li && li.parentElement?.classList.contains('task') && !(li.textContent ?? '').length) { li.setAttribute('data-checked', 'false'); emit() }
      }, 0)
    }

    /* markdown shortcuts */
    if (e.key === ' ' && !mod && s.isCollapsed && blk && blk.tagName === 'P') {
      const r = document.createRange()
      r.setStart(blk, 0); r.setEnd(s.anchorNode, s.anchorOffset)
      const pre = r.toString().replace(/ /g, ' ')
      const hit = MD_SHORTCUTS.find(([re]) => re.test(pre))
      if (hit) {
        e.preventDefault()
        r.deleteContents()
        if (!(blk.textContent ?? '').length) blk.innerHTML = '<br>'
        applyBlock(hit[1], { checked: hit[2] })
        return
      }
    }

    if (e.key === 'Backspace' && s.isCollapsed && blk && ['h1', 'h2', 'h3', 'quote', 'code'].includes(kind ?? '')) {
      if (textPos(blk, s.anchorNode, s.anchorOffset) === 0 || (kind === 'code' && !(blk.textContent ?? '').length)) {
        const first = kind === 'quote' ? (blk.firstElementChild ?? blk) : blk
        const r = document.createRange(); r.setStart(first, 0); r.setEnd(s.anchorNode, s.anchorOffset)
        if (r.toString().length === 0) { e.preventDefault(); applyBlock('p'); return }
      }
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    pasteText(text)
  }

  const pasteText = (text: string) => {
    restore()
    const root = rootRef.current!
    const s = getSelection()
    const blk = s?.anchorNode ? topBlock(root, s.anchorNode) : null
    if (s && !s.isCollapsed && /^https?:\/\/\S+$/.test(text.trim())) { document.execCommand('createLink', false, text.trim()); emit(); refresh(); return }
    if (!text.includes('\n') || blk?.tagName === 'PRE' || cellOf(s?.anchorNode ?? null)) document.execCommand('insertText', false, text.replace(/\n+/g, blk?.tagName === 'PRE' ? '\n' : ' '))
    else document.execCommand('insertHTML', false, mdToHtml(text).replace(/<p><br><\/p>$/, ''))
    emit(); refresh()
  }

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    const li = t.closest('li')
    if (li && li.parentElement?.classList.contains('task') && e.clientX - li.getBoundingClientRect().left < 28) {
      li.setAttribute('data-checked', li.getAttribute('data-checked') === 'true' ? 'false' : 'true')
      emit()
      return
    }
    const a = t.closest('a')
    if (a && (e.metaKey || e.ctrlKey)) window.open(a.getAttribute('href') ?? '', '_blank', 'noopener')
  }

  /* ---- context menu ---- */
  const ctxItems = (): MenuEntry[] => {
    const inCell = !!cellOf(getSelection()?.anchorNode ?? lastRange.current?.startContainer ?? null)
    const it = (label: string, icon: IconName, shortcut: string | undefined, onSelect: () => void, extra?: object): MenuEntry => ({ label, icon, shortcut, onSelect, ...extra })
    const out: MenuEntry[] = [
      it('Cut', 'scissors', MOD + 'X', () => { restore(); document.execCommand('cut'); emit() }),
      it('Copy', 'copy', MOD + 'C', () => { restore(); document.execCommand('copy') }),
      it('Paste', 'download', MOD + 'V', async () => {
        try { const t = await navigator.clipboard.readText(); if (t) pasteText(t) } catch { notify(`Press ${MOD}V to paste`) }
      }),
      { type: 'sep' },
      it('Bold', 'bold', MOD + 'B', () => inline('bold'), { checked: fmt.bold }),
      it('Italic', 'italic', MOD + 'I', () => inline('italic'), { checked: fmt.italic }),
      it('Strikethrough', 'strike', MOD + SHIFT + 'X', () => inline('strike'), { checked: fmt.strike }),
      it('Inline code', 'code', MOD + 'E', () => inline('code'), { checked: fmt.code }),
      it('Link…', 'link', MOD + 'K', () => startLink()),
      { type: 'sep' },
    ]
    if (inCell) {
      out.push({ type: 'heading', label: 'Table' })
      const ops: [string, TableOp][] = [['Insert row above', 'row-above'], ['Insert row below', 'row-below'], ['Insert column left', 'col-left'], ['Insert column right', 'col-right'], ['Delete row', 'del-row'], ['Delete column', 'del-col']]
      ops.forEach(([l, o]) => out.push({ label: l, onSelect: () => runTable(o), danger: o.startsWith('del') }))
      out.push({ label: 'Delete table', icon: 'trash', danger: true, onSelect: () => runTable('del-table') })
    } else {
      out.push({ type: 'heading', label: 'Turn into' })
      ;(['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'task', 'quote', 'code'] as BlockKind[]).forEach(k => out.push({ label: BLOCK_LABEL[k], icon: BLOCK_ICON[k], checked: fmt.block === k, onSelect: () => applyBlock(k) }))
      out.push({ type: 'sep' })
      out.push({ label: 'Insert table…', icon: 'table', onSelect: () => { const l = lastRange.current?.getBoundingClientRect(); setPicker({ x: ctx.point?.x ?? l?.left ?? 200, y: ctx.point?.y ?? l?.bottom ?? 200 }) } })
      out.push({ label: 'Insert divider', icon: 'minus', onSelect: insertHr })
    }
    return out
  }

  const tableMenuItems: MenuEntry[] = [
    { label: 'Insert row above', onSelect: () => runTable('row-above') },
    { label: 'Insert row below', onSelect: () => runTable('row-below') },
    { label: 'Insert column left', onSelect: () => runTable('col-left') },
    { label: 'Insert column right', onSelect: () => runTable('col-right') },
    { type: 'sep' },
    { label: 'Delete row', onSelect: () => runTable('del-row'), danger: true },
    { label: 'Delete column', onSelect: () => runTable('del-col'), danger: true },
    { label: 'Delete table', icon: 'trash', onSelect: () => runTable('del-table'), danger: true },
  ]

  useLayoutEffect(() => { const el = pageRef.current; if (el) setPageW(el.clientWidth) }, [])

  return (
    <div className="doc-page" ref={pageRef}>
      <div
        ref={rootRef} className="doc-editor" contentEditable suppressContentEditableWarning spellCheck role="textbox" aria-multiline="true" aria-label="Document body"
        data-placeholder="Type '/' for blocks" dangerouslySetInnerHTML={{ __html: html }}
        onInput={onInput} onKeyDown={onKeyDown} onPaste={onPaste} onClick={onClick}
        onContextMenu={e => { e.preventDefault(); ctx.openAt(e.clientX, e.clientY) }}
        onKeyUp={e => { if (e.key.startsWith('Arrow') || e.key === 'Backspace') checkSlash() }}
        onBlur={() => { /* keep toolbar while interacting with it */ }}
      />
      {tb && <FloatingToolbar pos={tb} pageW={pageW} mobile={mobile} kb={kb} mode={tbMode} fmt={fmt}
        onInline={inline} onBlock={applyBlock} onLinkOpen={startLink} onLinkApply={applyLink} onLinkCancel={cancelLink} />}
      {slashOpen && slash && <SlashMenu x={slash.x} y={slash.y} top={slash.top} items={slashItems} index={Math.min(slashIdx, slashItems.length - 1)} onPick={pickSlash} onHover={setSlashIdx} />}
      {tblPos && <TableHandle x={tblPos.x} y={tblPos.y} items={tableMenuItems} />}
      <Menu anchor={ctx.point} open={ctx.open} onClose={ctx.close} items={ctx.open ? ctxItems() : []} label="Editor actions" />
      {picker && <TablePicker anchor={picker} onClose={() => setPicker(null)} onPick={addTable} />}
    </div>
  )
}

function TableHandle({ x, y, items }: { x: number; y: number; items: MenuEntry[] }) {
  const a = useAnchored()
  return (
    <div className="doc-tbl-handle" style={{ left: x - 28, top: y - 30 }} onMouseDown={e => e.preventDefault()}>
      <IconButton ref={a.ref} size="sm" icon="more-h" label="Table options" aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle} />
      <Menu anchor={a.el} open={a.open} onClose={a.close} items={items} placement="bottom-end" label="Table options" />
    </div>
  )
}

export default memo(Editor)
