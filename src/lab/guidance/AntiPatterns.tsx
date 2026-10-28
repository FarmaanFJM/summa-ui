import { useMemo, useState } from 'react'
import { Dropdown, Icon, SearchInput, Tabs } from '../../ui'
import { DEMOS, WIDE_DEMOS } from './ap/registry'
import { PRINCIPLE_TITLES } from './ap/principles'
import './antipatterns.css'

type Good = { id: string; title: string; description: string; demo: string; snippet?: string; preset?: string }
type AP = {
  id: string; name: string; summary: string; problem: string; severity: 'high' | 'medium' | 'low'; applicability: 'always' | 'default' | 'contextual'
  principles: string[]; bad: { description: string; demo: string; snippet?: string }; good: Good[]; why: string; exceptions: string[]
  detection: { objective: string[]; humanReview: string[] }; relatedPresets?: string[]; relatedAntiPatterns?: string[]
}

const modules = import.meta.glob('../../../guidance/antipatterns/*.json', { eager: true }) as Record<string, { default: AP }>
const ENTRIES: AP[] = Object.values(modules).map(m => m.default).sort((a, b) => a.id.localeCompare(b.id))
const BY_ID = new Map(ENTRIES.map(e => [e.id, e]))
const APPLIC: Record<AP['applicability'], string> = { always: 'Always', default: 'Default', contextual: 'Contextual' }
const SEV_ORDER = { high: 0, medium: 1, low: 2 }
type Sev = 'all' | AP['severity']


function Demo({ k }: { k: string }) {
  const C = DEMOS[k]
  return C ? <C /> : <span className="faint">Missing demo: {k}</span>
}

function Stage({ k, label }: { k: string; label: string }) {
  return (
    <div className={`apg-stage ${WIDE_DEMOS.includes(k) ? 'wide' : ''}`} role="group" aria-label={label}>
      <Demo k={k} />
    </div>
  )
}

function Index() {
  const [q, setQ] = useState('')
  const [sev, setSev] = useState<Sev>('all')
  const [pr, setPr] = useState<string>('all')
  const prOptions = useMemo(() => {
    const ids = Array.from(new Set(ENTRIES.flatMap(e => e.principles))).sort()
    return [{ value: 'all', label: 'All principles' }, ...ids.map(id => ({ value: id, label: `${id} ${PRINCIPLE_TITLES[id] ?? ''}` }))]
  }, [])
  const shown = ENTRIES.filter(e => {
    const t = q.trim().toLowerCase()
    return (sev === 'all' || e.severity === sev) && (pr === 'all' || e.principles.includes(pr)) &&
      (!t || `${e.id} ${e.name} ${e.summary}`.toLowerCase().includes(t))
  }).sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.id.localeCompare(b.id))
  return (
    <>
      <div className="apg-head">
        <h1>Anti-patterns</h1>
        <span className="muted">{ENTRIES.length} recurring mistakes in generated UI, each with a preferred alternative.</span>
      </div>
      <div className="apg-tools">
        <SearchInput aria-label="Search anti-patterns" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <Tabs<Sev> label="Severity" value={sev} onChange={setSev} items={[{ value: 'all', label: 'All' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        <Dropdown label="Principle" value={pr} onChange={setPr} options={prOptions} width={320} />
      </div>
      <div className="apg-list" role="list">
        {shown.map(e => (
          <a key={e.id} role="listitem" className="apg-item" href={`#/guidance/antipatterns/${e.id}`}>
            <span className="id">{e.id}</span>
            <span className="name truncate">{e.name}</span>
            <span className="meta">{e.severity}</span>
            <span className="meta app">{APPLIC[e.applicability]}</span>
          </a>
        ))}
        {!shown.length && <div className="apg-empty">No anti-patterns match.</div>}
      </div>
    </>
  )
}

function Detail({ e }: { e: AP }) {
  const [gi, setGi] = useState(0)
  const idx = ENTRIES.findIndex(x => x.id === e.id)
  const prev = ENTRIES[idx - 1], next = ENTRIES[idx + 1]
  const g = e.good[Math.min(gi, e.good.length - 1)]
  return (
    <article className="apg-detail" key={e.id}>
      <div className="apg-nav">
        <a className="btn btn-ghost" href="#/guidance/antipatterns"><Icon name="chevron-left" />All anti-patterns</a>
        <div className="grow" />
        {prev && <a className="btn btn-ghost" href={`#/guidance/antipatterns/${prev.id}`} aria-label={`Previous: ${prev.name}`}><Icon name="chevron-left" />{prev.id}</a>}
        {next && <a className="btn btn-ghost" href={`#/guidance/antipatterns/${next.id}`} aria-label={`Next: ${next.name}`}>{next.id}<Icon name="chevron-right" /></a>}
      </div>

      <header className="apg-title">
        <span className="id">{e.id}</span>
        <h1>{e.name}</h1>
        <p className="sum">{e.summary}</p>
        <div className="apg-facts"><span>Severity: {e.severity}</span><span>Applicability: {APPLIC[e.applicability]}</span></div>
      </header>

      <section className="apg-sec" aria-labelledby="apg-prob">
        <h2 id="apg-prob" className="eyebrow">Problem</h2>
        <p>{e.problem}</p>
      </section>

      <section className="apg-compare" aria-label="Visual comparison">
        <div className="apg-side">
          <div className="apg-side-head"><span className="lbl">Avoid</span></div>
          <Stage k={e.bad.demo} label={`Avoid: ${e.name}`} />
          <p className="apg-caption">{e.bad.description}</p>
        </div>
        <div className="apg-side">
          <div className="apg-side-head">
            <span className="lbl">Prefer</span>
            {e.good.length > 1 && <Tabs flat label="Alternatives" value={g.id} onChange={v => setGi(Math.max(0, e.good.findIndex(x => x.id === v)))} items={e.good.map(x => ({ value: x.id, label: x.title.length > 24 ? x.title.slice(0, 22) + '...' : x.title }))} />}
          </div>
          <Stage k={g.demo} label={`Prefer: ${g.title}`} />
          <p className="apg-caption"><strong>{g.title}.</strong> {g.description}{g.preset && <> Preset: <span className="apg-chk">{g.preset}</span></>}</p>
        </div>
      </section>

      <div className="apg-cols">
        <section className="apg-sec" aria-labelledby="apg-why"><h2 id="apg-why" className="eyebrow">Why</h2><p>{e.why}</p></section>
        <section className="apg-sec" aria-labelledby="apg-pr">
          <h2 id="apg-pr" className="eyebrow">Principles</h2>
          <div className="apg-plist">
            {e.principles.map(p => <a key={p} href="#/principles"><span className="pid">{p}</span><span>{PRINCIPLE_TITLES[p] ?? p}</span></a>)}
          </div>
        </section>
      </div>

      <div className="apg-cols">
        <section className="apg-sec" aria-labelledby="apg-ex">
          <h2 id="apg-ex" className="eyebrow">Exceptions</h2>
          {e.exceptions.length ? <ul>{e.exceptions.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="muted">None known.</p>}
        </section>
        <section className="apg-sec" aria-labelledby="apg-det">
          <h2 id="apg-det" className="eyebrow">Detection</h2>
          <p className="muted">Objective checks</p>
          <p>{e.detection.objective.length ? e.detection.objective.map((c, i) => <span key={c}>{i > 0 && ', '}<span className="apg-chk">{c}</span></span>) : 'None'}</p>
          <p className="muted" style={{ marginTop: 8 }}>Human review</p>
          <ul>{e.detection.humanReview.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </section>
      </div>

      {(e.relatedAntiPatterns?.length ?? 0) > 0 && (
        <section className="apg-sec" aria-labelledby="apg-rel">
          <h2 id="apg-rel" className="eyebrow">Related</h2>
          <div className="apg-plist">
            {e.relatedAntiPatterns!.map(id => BY_ID.get(id) && <a key={id} href={`#/guidance/antipatterns/${id}`}><span className="pid">{id}</span><span>{BY_ID.get(id)!.name}</span></a>)}
          </div>
        </section>
      )}
    </article>
  )
}

export default function AntiPatterns({ sub }: { sub?: string }) {
  const e = sub ? BY_ID.get(sub) : undefined
  return <div className="gd-wrap">{e ? <Detail e={e} /> : <Index />}</div>
}
