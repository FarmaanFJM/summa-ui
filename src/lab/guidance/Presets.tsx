import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Dialog, Dropdown, Icon, Menu, useContextMenu, MenuButton, type MenuEntry } from '../../ui'
import { ConfirmProvider, ToastProvider, useConfirm, useToast } from '../../presets'
import '../../../guidance/css/presets.css'
import './presets.css'

type Spec = {
  id: string; name: string; purpose: string
  whenToUse: string[]; whenNotToUse: string[]; behavior?: string[]
  implementations: { html?: string; css?: string; react?: string }
}
const SPECS = Object.values(import.meta.glob<Spec>('../../../guidance/presets/*.json', { eager: true, import: 'default' }))
const byId = (id: string) => SPECS.find(s => s.id === `preset.${id}`)

const SECTIONS = [
  { slug: 'notification', label: 'Notification' },
  { slug: 'confirm-dialog', label: 'Confirm dialog' },
  { slug: 'destructive-button', label: 'Destructive button' },
  { slug: 'loading-state', label: 'Loading state' },
  { slug: 'empty-state', label: 'Empty state' },
  { slug: 'interaction-states', label: 'Interaction states' },
  { slug: 'context-menu', label: 'Context menu' },
  { slug: 'dropdown', label: 'Dropdown' },
] as const

/* ------------------------------------------------------------ layout helpers */
function List({ title, items, shown }: { title: string; items: string[]; shown: number }) {
  if (!items.length) return null
  return (
    <div>
      <div className="eyebrow">{title}</div>
      <ul>{items.slice(0, shown).map((t, i) => <li key={i}>{t}</li>)}</ul>
      {items.length > shown && (
        <details><summary>{items.length - shown} more</summary><ul>{items.slice(shown).map((t, i) => <li key={i}>{t}</li>)}</ul></details>
      )}
    </div>
  )
}

function Section({ slug, children }: { slug: string; children: ReactNode }) {
  const spec = byId(slug)
  const label = SECTIONS.find(s => s.slug === slug)!.label
  return (
    <section id={`preset-${slug}`} className="pz-section" aria-labelledby={`preset-${slug}-t`}>
      <div className="pz-head">
        <h2 id={`preset-${slug}-t`} className="pz-title">{label}</h2>
        <span className="faint">{spec?.id}</span>
        <div className="grow" />
        <div className="pz-links">
          {spec?.implementations.html && <a href={`/guidance/${spec.implementations.html}`} target="_blank" rel="noreferrer">HTML example</a>}
          <a href={`#/guidance/presets/${slug}`}>Link</a>
        </div>
      </div>
      {spec && <p className="muted pz-purpose">{spec.purpose}</p>}
      <div className="pz-grid">
        <div className="pz-demo">{children}</div>
        {spec && (
          <div className="pz-spec">
            <List title="When to use" items={spec.whenToUse} shown={3} />
            <List title="When not to use" items={spec.whenNotToUse} shown={4} />
            <List title="Behaviour" items={spec.behavior ?? []} shown={4} />
          </div>
        )}
      </div>
    </section>
  )
}
const Label = ({ children }: { children: ReactNode }) => <div className="eyebrow pz-label">{children}</div>

/* ------------------------------------------------------------ demos */
function NotificationDemo() {
  const toast = useToast()
  return (
    <>
      <div>
        <Label>Compact</Label>
        <div className="pz-wrap">
          <Button onClick={() => toast.success('Link copied')}>Success</Button>
          <Button onClick={() => toast.info('Sync paused while offline')}>Info</Button>
          <Button onClick={() => toast.neutral('Moved to Archive')}>Neutral</Button>
          <Button onClick={() => toast.warning('Storage is almost full')}>Warning</Button>
          <Button onClick={() => toast.error('Could not reach the server')}>Error (persists)</Button>
          <Button onClick={() => toast.neutral('Conversation archived', { action: { label: 'Undo', onClick: () => toast.success('Restored') } })}>With Undo</Button>
        </div>
      </div>
      <div>
        <Label>Expanded</Label>
        <div className="pz-wrap">
          <Button onClick={() => toast.error('Upload failed', { description: 'quarterly-report.pdf (48 MB) did not finish. Check your connection and try again.', action: { label: 'Retry' }, secondaryAction: { label: 'View details' } })}>Failed upload with Retry</Button>
          <Button onClick={() => toast.warning('Sync conflict', { description: 'Changes made on another device will be overwritten. Review the differences first.', action: { label: 'Review' } })}>Warning</Button>
          <Button onClick={() => toast.success('Project shared', { description: 'Invitations were sent to 4 people.' })}>Success</Button>
          <Button onClick={() => toast.info('Export updated', { description: 'Exports now include comments.' })}>Info</Button>
        </div>
      </div>
      <div>
        <Label>Behaviour</Label>
        <div className="pz-wrap">
          <Button onClick={() => { for (let i = 0; i < 3; i++) toast.success('Saved to Drafts') }}>Same message 3 times</Button>
          <Button onClick={() => { toast.info('First'); toast.neutral('Second'); toast.success('Third'); toast.warning('Fourth'); toast.info('Fifth') }}>Five at once (max 3 visible)</Button>
          <Button variant="ghost" onClick={toast.clear}>Dismiss all</Button>
        </div>
        <p className="pz-note" style={{ marginTop: 8 }}>Toasts appear at the bottom centre of the window. Tab to reach one, Esc to dismiss, hover or focus pauses the timer.</p>
      </div>
    </>
  )
}

function ConfirmDemo() {
  const confirm = useConfirm()
  const [msg, setMsg] = useState('Nothing confirmed yet.')
  const run = async (opts: Parameters<typeof confirm>[0], done: string) => setMsg((await confirm(opts)) ? done : 'Cancelled. Nothing changed.')
  return (
    <>
      <div className="pz-wrap">
        <Button onClick={() => run({ title: 'Archive this project?', description: 'It moves to Archive and stays there until you restore it.', confirmLabel: 'Archive project' }, 'Project archived.')}>Standard</Button>
        <Button onClick={() => run({ title: 'Delete project "Atlas"?', description: 'This permanently removes 24 files and 3 collaborators. This cannot be undone.', confirmLabel: 'Delete project', destructive: true }, 'Project deleted.')}>Destructive</Button>
        <Button onClick={() => run({ title: 'Delete workspace "Acme"?', description: 'All projects, files and members are removed immediately. This cannot be undone.', confirmLabel: 'Delete workspace', destructive: true, requireText: 'Acme' }, 'Workspace deleted.')}>Type to confirm</Button>
      </div>
      <p className="muted" aria-live="polite">{msg}</p>
      <p className="pz-note">Destructive opens with focus on Cancel, standard on the confirm button, type-to-confirm on the field. Esc and a click outside cancel.</p>
    </>
  )
}

function DestructiveDemo() {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const items: MenuEntry[] = [
    { label: 'Rename', icon: 'pencil', onSelect: () => {} },
    { label: 'Duplicate', icon: 'copy', onSelect: () => {} },
    { type: 'sep' },
    { label: 'Delete project', icon: 'trash', danger: true, onSelect: () => setOpen(true) },
  ]
  return (
    <>
      <div>
        <Label>Solid</Label>
        <div className="pz-wrap">
          <Button variant="danger" icon="trash">Delete project</Button>
          <Button variant="danger" size="lg" icon="trash">Delete project</Button>
          <Button variant="danger" icon="trash" disabled>Delete project</Button>
          <Button variant="danger" aria-busy={busy || undefined} disabled={busy} onClick={() => { setBusy(true); window.setTimeout(() => setBusy(false), 1500) }}>
            {busy ? <span className="sm-spinner" aria-hidden="true" /> : <Icon name="trash" />}{busy ? 'Deleting' : 'Delete (click)'}
          </Button>
        </div>
      </div>
      <div>
        <Label>Neutral destructive (low risk, or the trigger of a dialog)</Label>
        <div className="pz-wrap">
          <button className="sm-btn sm-btn--danger-quiet"><Icon name="trash" /> Remove from list</button>
          <Button>Remove</Button>
          <MenuButton label="Project actions" items={items} />
        </div>
      </div>
      <div>
        <Label>Hierarchy</Label>
        <div className="pz-hier">
          <div><span className="pz-note">Do: neutral beside destructive</span><div className="pz-wrap"><Button>Cancel</Button><Button variant="danger" icon="trash">Delete project</Button></div></div>
          <div><span className="pz-note">Do not: primary beside destructive</span><div className="pz-wrap"><Button variant="primary">Save changes</Button><Button variant="danger" icon="trash">Delete project</Button></div></div>
        </div>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title='Delete project "Atlas"?'
        footer={<><Button onClick={() => setOpen(false)} data-autofocus>Cancel</Button><Button variant="danger" icon="trash" onClick={() => setOpen(false)}>Delete project</Button></>}>
        <p className="muted">This permanently removes 24 files and 3 collaborators. This cannot be undone.</p>
      </Dialog>
    </>
  )
}

const ROWS = ['Quarterly report', 'Design review notes', 'Launch checklist', 'Customer interviews', 'Budget 2027', 'Roadmap']
function LoadingDemo() {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'skeleton' | 'done'>('done')
  const timers = useRef<number[]>([])
  const [saving, setSaving] = useState(false)
  const [pct, setPct] = useState(0)
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => clear, [])
  const load = (ms: number) => {
    clear(); setPhase('wait')
    let shownAt = 0
    timers.current.push(window.setTimeout(() => { shownAt = Date.now(); setPhase('skeleton') }, 200)) // delay 200ms
    timers.current.push(window.setTimeout(() => {
      const wait = shownAt ? Math.max(0, 400 - (Date.now() - shownAt)) : 0                           // min duration 400ms
      timers.current.push(window.setTimeout(() => setPhase('done'), wait))
    }, ms))
  }
  const upload = () => {
    setPct(0)
    const t = window.setInterval(() => setPct(p => { const n = Math.min(100, p + 8 + Math.random() * 10); if (n >= 100) clearInterval(t); return n }), 220)
    timers.current.push(t)
  }
  return (
    <>
      <div>
        <Label>Skeleton rows (shown after 200ms, kept at least 400ms)</Label>
        <div className="pz-wrap" style={{ marginBottom: 8 }}>
          <Button onClick={() => load(1400)}>Load list</Button>
          <Button variant="ghost" onClick={() => load(120)}>Fast load (no skeleton)</Button>
        </div>
        <div className="pz-box pz-skel-box" aria-busy={phase === 'wait' || phase === 'skeleton'}>
          {phase === 'skeleton' && (
            <div className="sm-skel-list">{[62, 48, 70, 55, 66, 44].map((w, i) => <div key={i} className="sm-skel-row"><span className="sm-skeleton" style={{ width: `${w}%` }} /></div>)}</div>
          )}
          {phase === 'done' && ROWS.map(r => <div key={r} className="sm-row">{r}</div>)}
        </div>
      </div>
      <div>
        <Label>Inline spinner</Label>
        <div className="pz-wrap">
          <Button variant="primary" aria-busy={saving || undefined} onClick={() => { if (saving) return; setSaving(true); window.setTimeout(() => setSaving(false), 1400) }}>
            {saving && <span className="sm-spinner" aria-hidden="true" />}{saving ? 'Saving' : 'Save changes'}
          </Button>
          <span className="muted row"><span className="sm-spinner" aria-hidden="true" /> Checking availability</span>
        </div>
      </div>
      <div>
        <Label>Determinate progress</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
          <div className="sm-progress-label"><span>Uploading quarterly-report.pdf</span><span>{Math.round(pct)}%</span></div>
          <div className="sm-progress" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
            style={{ ['--sm-progress' as string]: `${pct}%` }}><span /></div>
          <div><Button onClick={upload}>Start upload</Button></div>
        </div>
      </div>
    </>
  )
}

function EmptyDemo() {
  return (
    <>
      <div><Label>First use</Label><div className="pz-box"><div className="sm-empty"><p className="sm-empty__text">No projects yet. Create one to get started.</p><Button variant="primary">Create project</Button></div></div></div>
      <div><Label>No results</Label><div className="pz-box"><div className="sm-empty"><p className="sm-empty__text">No projects match "atlas".</p><Button>Clear search</Button></div></div></div>
      <div><Label>Error loading</Label><div className="pz-box"><div className="sm-empty"><p className="sm-empty__text">Projects could not be loaded. Check your connection and try again.</p><Button>Try again</Button></div></div></div>
    </>
  )
}

const STATE_ROWS: [string, string, string, string][] = [
  ['Focus (keyboard)', 'outline 1.5px solid, offset 1px; inputs: 1px box-shadow ring', '--focus', '3.8:1 to 4.7:1 on --s0 to --s4'],
  ['Hover', 'one surface step lighter', '--s2 (rows), --s3 to --s4 (buttons)', 'n/a (not the only cue)'],
  ['Selected', 'quiet fill, no frame', '--select', 'n/a (state also in ARIA)'],
  ['Pressed', 'one step beyond hover', '--s3 (rows), #444545 (buttons)', 'n/a'],
  ['Disabled', 'opacity 0.45, no hover', 'opacity', 'exempt'],
  ['Active nav', 'surface and full-strength text, aria-current', '--s3, --text', 'text above 4.5:1'],
]
function StateCell({ label, children }: { label: string; children: ReactNode }) {
  return <div className="sm-specimen__cell"><span className="sm-specimen__label">{label}</span>{children}</div>
}
function InteractionDemo() {
  return (
    <>
      <div>
        <Label>Button</Label>
        <div className="sm-specimen">
          <StateCell label="Default"><button className="sm-btn">Button</button></StateCell>
          <StateCell label="Hover"><button className="sm-btn is-hover">Button</button></StateCell>
          <StateCell label="Focus"><button className="sm-btn is-focus">Button</button></StateCell>
          <StateCell label="Pressed"><button className="sm-btn is-pressed">Button</button></StateCell>
          <StateCell label="Disabled"><button className="sm-btn" disabled>Button</button></StateCell>
        </div>
      </div>
      <div>
        <Label>List row</Label>
        <div className="sm-specimen">
          <StateCell label="Default"><div className="sm-row">Quarterly report</div></StateCell>
          <StateCell label="Hover"><div className="sm-row is-hover">Quarterly report</div></StateCell>
          <StateCell label="Focus"><div className="sm-row is-focus">Quarterly report</div></StateCell>
          <StateCell label="Selected"><div className="sm-row" aria-selected="true">Quarterly report</div></StateCell>
          <StateCell label="Disabled"><div className="sm-row" aria-disabled="true">Quarterly report</div></StateCell>
        </div>
      </div>
      <div>
        <Label>Input and navigation</Label>
        <div className="sm-specimen">
          <StateCell label="Input default"><input className="sm-input" placeholder="Search" aria-label="Default" /></StateCell>
          <StateCell label="Input focus"><input className="sm-input is-focus" defaultValue="Atlas" aria-label="Focused" /></StateCell>
          <StateCell label="Nav hover"><button className="sm-nav-item is-hover"><Icon name="home" /> Home</button></StateCell>
          <StateCell label="Nav active"><button className="sm-nav-item" aria-current="true"><Icon name="home" /> Home</button></StateCell>
        </div>
      </div>
      <div>
        <Label>Tokens</Label>
        <div className="pz-table">
          <div className="pz-th eyebrow">State</div><div className="pz-th eyebrow">Treatment</div><div className="pz-th eyebrow">Token and contrast</div>
          {STATE_ROWS.map(([s, t, tok, c]) => (
            <Fragment key={s}><div>{s}</div><div className="muted">{t}</div><div><code>{tok}</code><div className="faint">{c}</div></div></Fragment>
          ))}
        </div>
        <p className="pz-note" style={{ marginTop: 12 }}>P15 and P17: focus and selection are neutral and quiet. The ring must still reach 3:1 against the surface it sits on. Try Tab on this page.</p>
      </div>
    </>
  )
}

function ContextMenuDemo() {
  const ctx = useContextMenu()
  const [out, setOut] = useState('No action chosen.')
  const items: MenuEntry[] = [
    { type: 'heading', label: 'Project' },
    { label: 'Rename', icon: 'pencil', shortcut: 'F2', onSelect: () => setOut('Chose: Rename') },
    { label: 'Duplicate', icon: 'copy', shortcut: 'Ctrl D', onSelect: () => setOut('Chose: Duplicate') },
    { label: 'Favorite', icon: 'star', checked: true, onSelect: () => setOut('Chose: Favorite') },
    { label: 'Share', icon: 'share', disabled: true, onSelect: () => {} },
    { type: 'sep' },
    { label: 'Delete project', icon: 'trash', danger: true, onSelect: () => setOut('Chose: Delete project') },
  ]
  return (
    <>
      <div>
        <Label>Right click or long press</Label>
        <div className="pz-context" tabIndex={0} role="group" aria-label="Project card. Press Shift+F10 for actions."
          {...ctx.bind}
          onKeyDown={e => { if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); ctx.openAt(r.left + 24, r.top + 24) } }}>
          Project "Atlas"<br />Right click here
        </div>
        <Menu anchor={ctx.point} open={ctx.open} onClose={ctx.close} items={items} label="Project actions" />
        <p className="muted" aria-live="polite" style={{ marginTop: 8 }}>{out}</p>
      </div>
      <p className="pz-note">Arrow keys, Home, End, Esc and Enter work. Danger is last, after a separator, with text colour and icon only. The same actions must be reachable from a visible button as well.</p>
    </>
  )
}

function DropdownDemo() {
  const [status, setStatus] = useState<string | null>('todo')
  const [labels, setLabels] = useState(['Bug', 'Feature', 'Design', 'Docs', 'Research', 'Infra', 'Security', 'Performance'])
  const [label, setLabel] = useState<string | null>('Design')
  const [people, setPeople] = useState<string[]>(['ben', 'chen'])
  return (
    <>
      <div>
        <Label>Single (5 options: no search)</Label>
        <Dropdown label="Status" placeholder="Select status" value={status} onChange={setStatus}
          options={[{ value: 'backlog', label: 'Backlog' }, { value: 'todo', label: 'Todo' }, { value: 'doing', label: 'In progress' }, { value: 'review', label: 'In review' }, { value: 'done', label: 'Done' }]} />
      </div>
      <div>
        <Label>Searchable, create inside the list (8 options)</Label>
        <Dropdown label="Label" placeholder="Select label" searchable value={label} onChange={setLabel} createNoun="label" width={240}
          options={labels.map(l => ({ value: l, label: l }))}
          onCreate={name => { setLabels(l => [...l, name]); return name }} />
        <p className="pz-note" style={{ marginTop: 8 }}>Type a name that does not exist: Create label appears at the bottom. No separate Create button.</p>
      </div>
      <div>
        <Label>Multi-select</Label>
        <Dropdown label="Assignees" placeholder="Select assignees" multiple value={people} onChange={setPeople}
          options={[{ value: 'amira', label: 'Amira Nasser' }, { value: 'ben', label: 'Ben Okafor' }, { value: 'chen', label: 'Chen Wei' }, { value: 'dara', label: 'Dara Lindqvist' }]} />
      </div>
    </>
  )
}

/* ------------------------------------------------------------ page */
export default function Presets({ sub }: { sub?: string }) {
  useEffect(() => {
    if (!sub) return
    const el = document.getElementById(`preset-${sub}`)
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
  }, [sub])

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="gd-wrap">
          <div className="pz-intro">
            <h1 className="pz-h1">Presets</h1>
            <p className="muted pz-purpose">Ready-made behaviour and appearance for patterns that are usually done badly. Each preset has a JSON spec, framework-neutral CSS (guidance/css/presets.css) and an HTML example. The React code in src/presets is a reference only.</p>
            <nav className="pz-index" aria-label="Presets">
              {SECTIONS.map(s => <a key={s.slug} href={`#/guidance/presets/${s.slug}`} aria-current={sub === s.slug ? 'true' : undefined}>{s.label}</a>)}
            </nav>
          </div>
          <Section slug="notification"><NotificationDemo /></Section>
          <Section slug="confirm-dialog"><ConfirmDemo /></Section>
          <Section slug="destructive-button"><DestructiveDemo /></Section>
          <Section slug="loading-state"><LoadingDemo /></Section>
          <Section slug="empty-state"><EmptyDemo /></Section>
          <Section slug="interaction-states"><InteractionDemo /></Section>
          <Section slug="context-menu"><ContextMenuDemo /></Section>
          <Section slug="dropdown"><DropdownDemo /></Section>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
