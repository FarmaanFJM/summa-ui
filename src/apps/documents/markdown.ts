/* Markdown <-> editor DOM converter (a reasonable subset: headings 1-3, paragraphs, bold/italic/strike/code,
   links, flat bullet/numbered/task lists, blockquote, fenced code, hr, tables). */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;')

/* ------------------------------------------------------------ Markdown -> HTML */
const ESCAPABLE = /\\([\\`*_{}\[\]()#+\-.!~|>])/g

export function inlineToHtml(src: string): string {
  const stash: string[] = []
  const hold = (html: string) => { stash.push(html); return `${stash.length - 1}` }
  let s = src.replace(ESCAPABLE, (_, c: string) => hold(esc(c)))
  s = s.replace(/`([^`]+)`/g, (_, c: string) => hold(`<code>${esc(c)}</code>`))
  s = esc(s)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t: string, u: string) => hold(`<a href="${escAttr(u.replace(/&amp;/g, '&'))}">${t}</a>`))
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>')
  s = s.replace(/~~([^~]+?)~~/g, '<s>$1</s>')
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<i>$2</i>')
  s = s.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<i>$2</i>')
  s = s.replace(/ {2,}\n/g, '<br>').replace(/\n/g, ' ')
  // link text may contain stash markers; restore repeatedly
  for (let i = 0; i < 3; i++) s = s.replace(/(\d+)/g, (_, n: string) => stash[+n])
  return s
}

const isFence = (l: string) => /^```/.test(l)
const isHr = (l: string) => /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l)
const isHeading = (l: string) => /^#{1,3}\s+/.test(l)
const isQuote = (l: string) => /^\s{0,3}>/.test(l)
const isBullet = (l: string) => /^\s*[-*+]\s+/.test(l)
const isOrdered = (l: string) => /^\s*\d+[.)]\s+/.test(l)
const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l)
const isSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('|')

function splitRow(l: string): string[] {
  const t = l.trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '\\' && t[i + 1] === '|') { cur += '|'; i++ } else if (t[i] === '|') { cells.push(cur.trim()); cur = '' } else cur += t[i]
  }
  cells.push(cur.trim())
  return cells
}

export function tableHtml(rows: string[][]): string {
  const cols = Math.max(...rows.map(r => r.length), 1)
  const body = rows.map((r, ri) => {
    const tag = ri === 0 ? 'th' : 'td'
    return `<tr>${Array.from({ length: cols }, (_, i) => `<${tag}>${inlineToHtml(r[i] ?? '') || '<br>'}</${tag}>`).join('')}</tr>`
  }).join('')
  return `<div class="doc-tbl"><table><tbody>${body}</tbody></table></div>`
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  const startsBlock = (l: string, next?: string) =>
    isFence(l) || isHeading(l) || isHr(l) || isQuote(l) || isBullet(l) || isOrdered(l) || (isTableRow(l) && next !== undefined && isSep(next))
  while (i < lines.length) {
    const l = lines[i]
    if (!l.trim()) { i++; continue }
    if (isFence(l)) {
      const buf: string[] = []
      i++
      while (i < lines.length && !isFence(lines[i])) buf.push(lines[i++])
      i++
      out.push(`<pre>${esc(buf.join('\n')) || '<br>'}</pre>`)
      continue
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(l)
    if (h) { out.push(`<h${h[1].length}>${inlineToHtml(h[2].trim()) || '<br>'}</h${h[1].length}>`); i++; continue }
    if (isHr(l)) { out.push('<hr>'); i++; continue }
    if (isTableRow(l) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const rows = [splitRow(l)]
      i += 2
      while (i < lines.length && isTableRow(lines[i])) rows.push(splitRow(lines[i++]))
      out.push(tableHtml(rows))
      continue
    }
    if (isQuote(l)) {
      const paras: string[][] = [[]]
      while (i < lines.length && isQuote(lines[i])) {
        const t = lines[i].replace(/^\s{0,3}>\s?/, '')
        if (!t.trim()) paras.push([]); else paras[paras.length - 1].push(t)
        i++
      }
      out.push(`<blockquote>${paras.filter(p => p.length).map(p => `<p>${inlineToHtml(p.join('\n'))}</p>`).join('') || '<p><br></p>'}</blockquote>`)
      continue
    }
    if (isBullet(l) || isOrdered(l)) {
      const ordered = isOrdered(l)
      const items: string[] = []
      while (i < lines.length && (ordered ? isOrdered(lines[i]) : isBullet(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/, ''))
        i++
      }
      const task = !ordered && items.every(t => /^\[[ xX]\](\s|$)/.test(t))
      const lis = items.map(t => {
        if (task) {
          const done = /^\[[xX]\]/.test(t)
          return `<li data-checked="${done}">${inlineToHtml(t.replace(/^\[[ xX]\]\s?/, '')) || '<br>'}</li>`
        }
        return `<li>${inlineToHtml(t) || '<br>'}</li>`
      }).join('')
      out.push(ordered ? `<ol>${lis}</ol>` : `<ul${task ? ' class="task"' : ''}>${lis}</ul>`)
      continue
    }
    const buf = [l.replace(/\s+$/, (m) => (m.length >= 2 ? '  ' : ''))]
    i++
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i], lines[i + 1])) { buf.push(lines[i].replace(/\s+$/, m => (m.length >= 2 ? '  ' : ''))); i++ }
    out.push(`<p>${inlineToHtml(buf.join('\n'))}</p>`)
  }
  if (!out.length || !/^<p>/.test(out[out.length - 1])) out.push('<p><br></p>')
  return out.join('')
}

/* ------------------------------------------------------------ DOM -> Markdown */
const escText = (s: string) => s.replace(/ /g, ' ').replace(/([\\`*_~\[\]])/g, '\\$1')

function wrapMarks(mark: string, inner: string) {
  if (!inner.trim()) return inner
  const lead = /^\s*/.exec(inner)![0], trail = /\s*$/.exec(inner)![0]
  return `${lead}${mark}${inner.trim()}${mark}${trail}`
}

export function inlineToMd(node: Node): string {
  let out = ''
  node.childNodes.forEach(c => {
    if (c.nodeType === 3) { out += escText(c.textContent ?? ''); return }
    if (c.nodeType !== 1) return
    const el = c as HTMLElement
    const tag = el.tagName
    const inner = () => inlineToMd(el)
    if (tag === 'B' || tag === 'STRONG') out += wrapMarks('**', inner())
    else if (tag === 'I' || tag === 'EM') out += wrapMarks('*', inner())
    else if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') out += wrapMarks('~~', inner())
    else if (tag === 'CODE') out += (el.textContent ? '`' + el.textContent.replace(/ /g, ' ') + '`' : '')
    else if (tag === 'A') out += `[${inner()}](${el.getAttribute('href') ?? ''})`
    else if (tag === 'BR') { if (el.nextSibling || el.previousSibling) out += '  \n' }
    else if (tag === 'SPAN') {
      const st = el.style
      let t = inner()
      if (parseInt(st.fontWeight) >= 600 || st.fontWeight === 'bold') t = wrapMarks('**', t)
      if (st.fontStyle === 'italic') t = wrapMarks('*', t)
      out += t
    } else out += inner()
  })
  return out
}

function preText(el: Node): string {
  let out = ''
  el.childNodes.forEach(c => {
    if (c.nodeType === 3) out += c.textContent ?? ''
    else if ((c as Element).tagName === 'BR') out += '\n'
    else out += preText(c)
  })
  return out
}

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, ' ').trim()

function blockToMd(el: Element): string | null {
  const tag = el.tagName
  if (/^H[1-3]$/.test(tag)) { const t = inlineToMd(el).trim(); return t ? `${'#'.repeat(+tag[1])} ${oneLine(t)}` : null }
  if (/^H[4-6]$/.test(tag)) { const t = inlineToMd(el).trim(); return t ? `### ${oneLine(t)}` : null }
  if (tag === 'HR') return '---'
  if (tag === 'PRE') return '```\n' + (el.textContent ?? '').replace(/ /g, ' ').replace(/\n+$/, '') + '\n```'
  if (tag === 'UL' || tag === 'OL') {
    const task = el.classList.contains('task')
    const lines: string[] = []
    let n = 1
    el.querySelectorAll(':scope > li').forEach(li => {
      const t = oneLine(inlineToMd(li))
      lines.push(tag === 'OL' ? `${n++}. ${t}` : task ? `- [${li.getAttribute('data-checked') === 'true' ? 'x' : ' '}] ${t}` : `- ${t}`)
    })
    return lines.join('\n') || null
  }
  if (tag === 'BLOCKQUOTE') {
    const parts: string[] = []
    const kids = Array.from(el.children).filter(k => /^(P|DIV)$/.test(k.tagName))
    if (!kids.length) { const t = inlineToMd(el).trim(); if (t) parts.push(t) } else kids.forEach(k => { const t = inlineToMd(k).trim(); if (t) parts.push(t) })
    return parts.length ? parts.map(p => p.split('\n').map(l => `> ${l}`.trimEnd()).join('\n')).join('\n>\n') : null
  }
  if (tag === 'DIV' && el.classList.contains('doc-tbl')) return tableToMd(el.querySelector('table'))
  if (tag === 'TABLE') return tableToMd(el as HTMLTableElement)
  const t = inlineToMd(el).trim()
  return t || null
}

function tableToMd(table: HTMLTableElement | null): string | null {
  if (!table) return null
  const rows = Array.from(table.rows).map(r => Array.from(r.cells).map(c => oneLine(inlineToMd(c)).replace(/\|/g, '\\|')))
  if (!rows.length) return null
  const cols = Math.max(...rows.map(r => r.length))
  const grid = rows.map(r => Array.from({ length: cols }, (_, i) => r[i] ?? ''))
  const w = Array.from({ length: cols }, (_, i) => Math.max(3, ...grid.map(r => r[i].length)))
  const fmt = (r: string[]) => '| ' + r.map((c, i) => c.padEnd(w[i])).join(' | ') + ' |'
  return [fmt(grid[0]), '| ' + w.map(n => '-'.repeat(n)).join(' | ') + ' |', ...grid.slice(1).map(fmt)].join('\n')
}

export function domToMd(root: HTMLElement): string {
  const blocks: string[] = []
  let loose = ''
  const flush = () => { if (loose.trim()) blocks.push(loose.trim()); loose = '' }
  root.childNodes.forEach(n => {
    if (n.nodeType === 1) {
      const el = n as Element
      if (/^(B|STRONG|I|EM|S|CODE|A|SPAN|BR)$/.test(el.tagName)) { loose += inlineToMd({ childNodes: [el] } as unknown as Node); return }
      flush()
      const b = blockToMd(el)
      if (b) blocks.push(b)
    } else if (n.nodeType === 3) loose += escText(n.textContent ?? '')
  })
  flush()
  return blocks.join('\n\n') + (blocks.length ? '\n' : '')
}

export function wordCount(md: string): number {
  const t = md.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`~|]|\[[ xX]\]|^\s*[-\d.]+\s/gm, ' ').replace(/\]\([^)]*\)/g, ' ').replace(/-{3,}/g, ' ')
  const m = t.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu)
  return m ? m.length : 0
}
