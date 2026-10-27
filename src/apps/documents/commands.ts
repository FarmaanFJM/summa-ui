/* Pure DOM helpers for the contenteditable editor: selection offsets, block conversion, tables. */
import { tableHtml } from './markdown'

export type BlockKind = 'p' | 'h1' | 'h2' | 'h3' | 'quote' | 'code' | 'ul' | 'ol' | 'task'

const BLOCK_TAGS = /^(P|H[1-6]|BLOCKQUOTE|PRE|UL|OL|HR|DIV|TABLE)$/

/* ------------------------------------------------------------ selection */
export function textPos(root: HTMLElement, node: Node, off: number): number {
  const r = document.createRange()
  r.selectNodeContents(root)
  r.setEnd(node, off)
  return r.toString().length
}

export function locate(root: HTMLElement, pos: number): [Node, number] | null {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let acc = 0
  let n = w.nextNode()
  let last: Text | null = null
  while (n) {
    const len = (n.textContent ?? '').length
    if (pos <= acc + len) return [n, pos - acc]
    acc += len
    last = n as Text
    n = w.nextNode()
  }
  return last ? [last, last.length] : null
}

export function saveOffsets(root: HTMLElement): [number, number] | null {
  const s = getSelection()
  if (!s || !s.rangeCount || !s.anchorNode || !s.focusNode || !root.contains(s.anchorNode) || !root.contains(s.focusNode)) return null
  return [textPos(root, s.anchorNode, s.anchorOffset), textPos(root, s.focusNode, s.focusOffset)]
}

export function restoreOffsets(root: HTMLElement, o: [number, number] | null) {
  if (!o) return
  const a = locate(root, o[0]), f = locate(root, o[1])
  if (!a || !f) return
  getSelection()?.setBaseAndExtent(a[0], a[1], f[0], f[1])
}

export function caretTo(el: Node, atEnd = false) {
  const r = document.createRange()
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let first: Node | null = w.nextNode(), last = first
  for (let n = first; n; n = w.nextNode()) last = n
  if (first && last) {
    if (atEnd) r.setStart(last, (last.textContent ?? '').length); else r.setStart(first, 0)
  } else r.setStart(el, 0)
  r.collapse(true)
  const s = getSelection()
  s?.removeAllRanges()
  s?.addRange(r)
}

export function topBlock(root: HTMLElement, node: Node | null): HTMLElement | null {
  let n: Node | null = node
  while (n && n.parentNode !== root) n = n.parentNode
  return n && n.nodeType === 1 ? (n as HTMLElement) : null
}

export function selectedBlocks(root: HTMLElement): HTMLElement[] {
  const s = getSelection()
  if (!s || !s.rangeCount) return []
  const r = s.getRangeAt(0)
  const a = topBlock(root, r.startContainer), b = topBlock(root, r.endContainer)
  if (!a || !b) return []
  const out: HTMLElement[] = []
  for (let n: Element | null = a; n; n = n.nextElementSibling) {
    out.push(n as HTMLElement)
    if (n === b) break
  }
  return out
}

export function blockKindOf(el: Element | null): BlockKind | 'hr' | 'table' | null {
  if (!el) return null
  const t = el.tagName
  if (t === 'P' || (t === 'DIV' && !el.classList.contains('doc-tbl'))) return 'p'
  if (/^H[1-3]$/.test(t)) return t.toLowerCase() as BlockKind
  if (t === 'BLOCKQUOTE') return 'quote'
  if (t === 'PRE') return 'code'
  if (t === 'UL') return el.classList.contains('task') ? 'task' : 'ul'
  if (t === 'OL') return 'ol'
  if (t === 'HR') return 'hr'
  if (el.classList.contains('doc-tbl')) return 'table'
  return 'p'
}

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const orBr = (s: string) => (s.replace(/<br\s*\/?>/g, '').trim() ? s : '<br>')
const plain = (html: string) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent ?? '' }

function itemsOf(el: HTMLElement): { html: string; checked?: boolean }[] {
  const k = blockKindOf(el)
  if (k === 'ul' || k === 'ol' || k === 'task') return Array.from(el.querySelectorAll(':scope > li')).map(li => ({ html: li.innerHTML, checked: li.getAttribute('data-checked') === 'true' }))
  if (k === 'quote') {
    const kids = Array.from(el.children).filter(c => /^(P|DIV)$/.test(c.tagName))
    return kids.length ? kids.map(c => ({ html: c.innerHTML })) : [{ html: el.innerHTML }]
  }
  if (k === 'code') return (el.textContent ?? '').split('\n').map(t => ({ html: escHtml(t) }))
  return [{ html: el.innerHTML }]
}

/** Convert the given contiguous top-level blocks into `kind`. Returns the first new element. */
export function convertBlocks(root: HTMLElement, blocks: HTMLElement[], kind: BlockKind): HTMLElement | null {
  const src = blocks.filter(b => { const k = blockKindOf(b); return k !== 'hr' && k !== 'table' })
  if (!src.length) return null
  const items = src.flatMap(itemsOf)
  const mk = (tag: string, html: string) => { const e = document.createElement(tag); e.innerHTML = orBr(html); return e }
  let created: HTMLElement[] = []
  if (kind === 'p' || kind === 'h1' || kind === 'h2' || kind === 'h3') {
    created = items.map(i => mk(kind === 'p' ? 'p' : kind, i.html))
  } else if (kind === 'quote') {
    const q = document.createElement('blockquote')
    items.forEach(i => q.appendChild(mk('p', i.html)))
    created = [q]
  } else if (kind === 'code') {
    const pre = document.createElement('pre')
    const text = items.map(i => plain(i.html)).join('\n')
    if (text) pre.textContent = text; else pre.innerHTML = '<br>'
    created = [pre]
  } else {
    const l = document.createElement(kind === 'ol' ? 'ol' : 'ul')
    if (kind === 'task') l.className = 'task'
    items.forEach(i => { const li = mk('li', i.html); if (kind === 'task') li.setAttribute('data-checked', String(!!i.checked)); l.appendChild(li) })
    created = [l]
  }
  const first = src[0]
  created.forEach(c => root.insertBefore(c, first))
  src.forEach(b => b.remove())
  return created[0]
}

export function ensureTrailingParagraph(root: HTMLElement) {
  const last = root.lastElementChild
  if (!last || blockKindOf(last) !== 'p') {
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    root.appendChild(p)
  }
}

/* ------------------------------------------------------------ inline code */
export function toggleInlineCode(root: HTMLElement): boolean {
  const s = getSelection()
  if (!s || !s.rangeCount) return false
  const r = s.getRangeAt(0)
  const startEl = r.startContainer.nodeType === 1 ? (r.startContainer as Element) : r.startContainer.parentElement
  const existing = startEl?.closest('code')
  if (existing && root.contains(existing)) {
    const parent = existing.parentNode!
    const first = existing.firstChild, last = existing.lastChild
    while (existing.firstChild) parent.insertBefore(existing.firstChild, existing)
    parent.removeChild(existing)
    parent.normalize()
    if (first && last) { const nr = document.createRange(); nr.setStartBefore(first); nr.setEndAfter(last); s.removeAllRanges(); s.addRange(nr) }
    return true
  }
  if (r.collapsed) return false
  if (topBlock(root, r.startContainer) !== topBlock(root, r.endContainer)) return false
  const code = document.createElement('code')
  code.appendChild(r.extractContents())
  r.insertNode(code)
  const nr = document.createRange()
  nr.selectNodeContents(code)
  s.removeAllRanges()
  s.addRange(nr)
  return true
}

/* ------------------------------------------------------------ tables */
export function makeTable(rows: number, cols: number): HTMLElement {
  const grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (r === 0 ? `Column ${c + 1}` : '')))
  const d = document.createElement('div')
  d.innerHTML = tableHtml(grid)
  return d.firstElementChild as HTMLElement
}

/** Insert a table at the caret block. Returns the first header cell. */
export function insertTable(root: HTMLElement, rows: number, cols: number): HTMLElement {
  const s = getSelection()
  const cur = s?.anchorNode ? topBlock(root, s.anchorNode) : null
  const t = makeTable(rows, cols)
  if (cur && blockKindOf(cur) === 'p' && !(cur.textContent ?? '').trim()) root.replaceChild(t, cur)
  else if (cur) root.insertBefore(t, cur.nextSibling)
  else root.appendChild(t)
  if (!t.nextElementSibling || blockKindOf(t.nextElementSibling) === 'table') {
    const p = document.createElement('p'); p.innerHTML = '<br>'; t.after(p)
  }
  return t.querySelector('th') as HTMLElement
}

export const cellOf = (node: Node | null): HTMLTableCellElement | null => {
  const el = node && (node.nodeType === 1 ? (node as Element) : node.parentElement)
  return (el?.closest('td,th') as HTMLTableCellElement | null) ?? null
}

const newCell = (head: boolean) => { const c = document.createElement(head ? 'th' : 'td'); c.innerHTML = '<br>'; return c }

export type TableOp = 'row-above' | 'row-below' | 'col-left' | 'col-right' | 'del-row' | 'del-col' | 'del-table'

export function tableOp(cell: HTMLTableCellElement, op: TableOp): HTMLElement | null {
  const table = cell.closest('table')!
  const wrap = table.closest('.doc-tbl') as HTMLElement
  const row = cell.parentElement as HTMLTableRowElement
  const ri = row.rowIndex, ci = cell.cellIndex
  const rows = Array.from(table.rows)
  if (op === 'del-table') {
    const p = document.createElement('p'); p.innerHTML = '<br>'
    wrap.replaceWith(p)
    return p
  }
  if (op === 'row-above' || op === 'row-below') {
    const at = op === 'row-above' && ri > 0 ? ri : ri + 1
    const tr = table.tBodies[0].insertRow(at > table.rows.length ? -1 : at)
    for (let i = 0; i < row.cells.length; i++) tr.appendChild(newCell(false))
    return tr.cells[Math.min(ci, tr.cells.length - 1)]
  }
  if (op === 'col-left' || op === 'col-right') {
    const at = op === 'col-left' ? ci : ci + 1
    rows.forEach((r, i) => { const c = newCell(i === 0); r.insertBefore(c, r.cells[at] ?? null) })
    return rows[ri].cells[at]
  }
  if (op === 'del-row') {
    if (rows.length <= 1) return cell
    row.remove()
    if (ri === 0) {
      const nr = table.rows[0]
      Array.from(nr.cells).forEach(c => { const h = newCell(true); h.innerHTML = c.innerHTML; c.replaceWith(h) })
    }
    const nr = table.rows[Math.min(ri, table.rows.length - 1)]
    return nr.cells[Math.min(ci, nr.cells.length - 1)]
  }
  if (op === 'del-col') {
    if (row.cells.length <= 1) return cell
    rows.forEach(r => r.cells[ci]?.remove())
    const nr = table.rows[ri]
    return nr.cells[Math.min(ci, nr.cells.length - 1)]
  }
  return null
}

export function nextCell(cell: HTMLTableCellElement, dir: 1 | -1, grow: boolean): HTMLTableCellElement | null {
  const table = cell.closest('table')!
  const all = Array.from(table.querySelectorAll<HTMLTableCellElement>('th,td'))
  const i = all.indexOf(cell) + dir
  if (i < 0) return null
  if (i >= all.length) {
    if (!grow) return null
    return tableOp(cell.parentElement!.lastElementChild as HTMLTableCellElement, 'row-below') as HTMLTableCellElement
  }
  return all[i]
}

export function selectCellContents(cell: Element) {
  const r = document.createRange()
  r.selectNodeContents(cell)
  const s = getSelection()
  s?.removeAllRanges()
  s?.addRange(r)
}

export { BLOCK_TAGS }
