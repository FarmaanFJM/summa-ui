import { Fragment, memo, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../../ui'

type Block =
  | { t: 'p'; s: string }
  | { t: 'h'; s: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'code'; lang: string; s: string }

function parse(raw: string): Block[] {
  let text = raw
  const fences = (text.match(/```/g) || []).length
  if (fences % 2 === 1 && !/```[\w-]*\n/.test(text.slice(text.lastIndexOf('```')))) text = text.slice(0, text.lastIndexOf('```'))
  const out: Block[] = []
  const pushText = (chunk: string) => {
    for (const para of chunk.split(/\n{2,}/)) {
      let buf: string[] = []
      let list: { t: 'ul' | 'ol'; items: string[] } | null = null as { t: 'ul' | 'ol'; items: string[] } | null
      const flushP = () => { if (buf.length) out.push({ t: 'p', s: buf.join(' ') }); buf = [] }
      const flushL = () => { if (list) out.push(list as Block); list = null }
      for (const line of para.split('\n')) {
        if (!line.trim()) continue
        const ul = /^[-*] (.*)/.exec(line), ol = /^\d+\. (.*)/.exec(line)
        if (ul || ol) {
          flushP()
          const t = ul ? 'ul' : 'ol'
          if (!list || list.t !== t) { flushL(); list = { t, items: [] } }
          list.items.push((ul || ol)![1])
        } else if (/^#{1,3} /.test(line)) { flushP(); flushL(); out.push({ t: 'h', s: line.replace(/^#+ /, '') }) }
        else { flushL(); buf.push(line) }
      }
      flushP(); flushL()
    }
  }
  const re = /```([\w-]*)\n([\s\S]*?)(?:```|$)/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    pushText(text.slice(last, m.index))
    out.push({ t: 'code', lang: m[1], s: m[2].replace(/\n$/, '') })
    last = re.lastIndex
    if (m[0].length === 0) break
  }
  pushText(text.slice(last))
  return out
}

function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={i} className="ai-ic">{part.slice(1, -1)}</code>
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className={`icon-btn sm ${className}`} aria-label={done ? 'Copied' : label} title={done ? 'Copied' : label}
      onClick={() => {
        try { void navigator.clipboard?.writeText(text) } catch { /* clipboard unavailable */ }
        setDone(true); window.setTimeout(() => setDone(false), 1500)
      }}>
      <Icon name={done ? 'check' : 'copy'} size={15} />
    </button>
  )
}

export const Rich = memo(function Rich({ text }: { text: string }) {
  const blocks = useMemo(() => parse(text), [text])
  return (
    <div className="ai-rich">
      {blocks.map((b, i) => {
        if (b.t === 'p') return <p key={i}>{inline(b.s)}</p>
        if (b.t === 'h') return <h4 key={i}>{inline(b.s)}</h4>
        if (b.t === 'ul') return <ul key={i}>{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>
        if (b.t === 'ol') return <ol key={i}>{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ol>
        return (
          <figure key={i} className="ai-code">
            <figcaption>
              <span>{b.lang || 'text'}</span>
              <CopyButton text={b.s} label="Copy code" />
            </figcaption>
            <pre className="scroll"><code>{b.s}</code></pre>
          </figure>
        )
      })}
    </div>
  )
})
