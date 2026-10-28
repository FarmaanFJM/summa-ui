import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, Dropdown, Icon, SearchInput, type IconName } from '../../ui'
import catalog from '../../../guidance/icons/catalog.json'
import './icons.css'

type Entry = { name: string; lucide: string; category: string; tags: string[]; use: string; avoid?: string; file: string }

const SVG = import.meta.glob('../../../guidance/icons/svg/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const markup = (e: Entry) => (SVG[`../../../${'guidance/' + e.file}`] ?? '').trim()

const ICONS_LIST = catalog.icons as Entry[]
const CATS = catalog.categories as string[]
const label = (c: string) => c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ')
const go = (name?: string) => { location.hash = name ? `/guidance/icons/${name}` : '/guidance/icons' }

/** Plain HTML snippet: inline SVG with explicit size, hidden from assistive tech. */
function htmlSnippet(svg: string) {
  return svg.replace('width="24" height="24"', 'width="20" height="20" aria-hidden="true" focusable="false"').replace(' xmlns="http://www.w3.org/2000/svg"', '')
}

function CopyBlock({ title, code }: { title: string; code: string }) {
  const [done, setDone] = useState(false)
  const t = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(t.current), [])
  const copy = async () => {
    try { await navigator.clipboard.writeText(code) } catch {
      const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      ta.remove()
    }
    setDone(true); window.clearTimeout(t.current); t.current = window.setTimeout(() => setDone(false), 1600)
  }
  return (
    <div className="ic-snip">
      <div className="ic-snip-head">
        <span className="ic-h">{title}</span>
        <Button variant="ghost" icon={done ? 'check' : 'copy'} onClick={copy} aria-label={`Copy ${title}`}>
          <span aria-live="polite">{done ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      <pre className="ic-code"><code>{code}</code></pre>
    </div>
  )
}

function Detail({ e }: { e: Entry }) {
  const svg = markup(e)
  return (
    <div className="ic-detail" tabIndex={-1} data-autofocus>
      <div className="ic-preview">
        {[16, 20, 24].map(s => (
          <figure key={s}>
            <span className="ic-box"><Icon name={e.name as IconName} size={s} /></span>
            <figcaption>{s}px</figcaption>
          </figure>
        ))}
        <figure>
          <span className="ic-box"><Icon name={e.name as IconName} size={20} fill /></span>
          <figcaption>fill</figcaption>
        </figure>
      </div>
      <dl className="ic-meta">
        <dt>Name</dt><dd className="mono">{e.name}</dd>
        <dt>Lucide</dt><dd className="mono">{e.lucide}</dd>
        <dt>Category</dt><dd>{label(e.category)}</dd>
        <dt>Tags</dt><dd>{e.tags.join(', ')}</dd>
        <dt>Use</dt><dd>{e.use}</dd>
        {e.avoid && (<><dt>Avoid</dt><dd>{e.avoid}</dd></>)}
      </dl>
      <CopyBlock title="React" code={`<Icon name="${e.name}" />`} />
      <CopyBlock title="Inline SVG" code={svg} />
      <CopyBlock title="Plain HTML" code={htmlSnippet(svg)} />
    </div>
  )
}

export default function Icons({ sub }: { sub?: string }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const query = q.trim().toLowerCase()
  const shown = useMemo(() => ICONS_LIST.filter(i =>
    (cat === 'all' || i.category === cat) &&
    (!query || `${i.name} ${i.lucide} ${i.tags.join(' ')} ${i.use}`.toLowerCase().includes(query))), [cat, query])
  const current = sub ? ICONS_LIST.find(i => i.name === sub) : undefined
  const grouped = useMemo(() => CATS.map(c => ({ c, items: shown.filter(i => i.category === c) })).filter(g => g.items.length), [shown])
  const options = useMemo(() => [{ value: 'all', label: 'All categories' }, ...CATS.map(c => ({ value: c, label: label(c) }))], [])

  return (
    <div className="gd-wrap ic-page">
      <header className="ic-head">
        <h1>Icons</h1>
        <p className="muted">{ICONS_LIST.length} Lucide icons on a 24px grid with one 1.75 stroke. Use only these, inherit the text colour.</p>
      </header>

      <div className="ic-tools">
        <SearchInput className="ic-search" placeholder="Search icons" aria-label="Search icons" value={q} onChange={e => setQ(e.target.value)} />
        <Dropdown<string> label="Category" options={options} value={cat} onChange={setCat} width={220} className="ic-cat" />
      </div>

      {grouped.length === 0 && <p className="muted ic-empty">No icons match.</p>}
      {grouped.map(g => (
        <section key={g.c} className="ic-section">
          <h2 className="ic-h">{label(g.c)}</h2>
          <div className="ic-grid">
            {g.items.map(i => (
              <button key={i.name} type="button" className="ic-tile" aria-current={sub === i.name || undefined} onClick={() => go(i.name)} title={i.use}>
                <Icon name={i.name as IconName} size={20} />
                <span className="ic-name">{i.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="ic-section ic-usage">
        <h2 className="ic-h">Usage guidance</h2>
        <ul>
          {catalog.usage.map(r => <li key={r}>{r}</li>)}
        </ul>
        <p className="muted ic-src">Source: {catalog.source.name} {catalog.source.version} ({catalog.source.license}), {catalog.source.url}</p>
      </section>

      <Dialog open={!!current} onClose={() => go()} title={current?.name ?? ''} width={560}>
        {current && <Detail e={current} />}
      </Dialog>
    </div>
  )
}
