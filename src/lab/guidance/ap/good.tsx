import { useEffect, useRef, useState } from 'react'
import { Button, Dropdown, Icon, IconButton, MenuButton, Tabs, Tag, NavItem, type IconName, type Option } from '../../../ui'

/* Preferred alternatives. They use the shared components and tokens. */

export function FlatSurfaces() {
  return (
    <div className="ap-demo">
      <div className="ap-panel" role="group" aria-label="Project settings">
        <div className="ap-h">Project settings</div>
        <div className="ap-field"><label htmlFor="ap-g1">Project name</label><input id="ap-g1" className="input" style={{ background: 'var(--s3)' }} defaultValue="Northwind" readOnly /></div>
        <div className="ap-split"><span className="grow">Notifications</span><Button variant="secondary">Manage</Button></div>
      </div>
    </div>
  )
}

export function FillEmphasis() {
  return (
    <div className="ap-demo">
      <div className="ap-panel"><strong>Deployment finished</strong><span className="muted">Build 214 is live.</span></div>
      <div className="ap-panel"><span className="eyebrow">Tip</span><span>Press / to search.</span></div>
      <div className="ap-panel s3"><strong>Active plan</strong><span className="muted">Team, 12 seats.</span></div>
    </div>
  )
}

export function SolidDestructive() {
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Northwind</div>
        <div className="ap-split"><Button variant="danger" icon="trash">Delete project</Button></div>
      </div>
    </div>
  )
}

export function NeutralDestructive() {
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Northwind</div>
        <div className="ap-split"><Button variant="secondary" icon="trash">Delete project</Button><span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>Opens a confirmation</span></div>
      </div>
    </div>
  )
}

export function NeutralFocus() {
  return (
    <div className="ap-demo">
      <div className="ap-field"><label htmlFor="ap-gf1">Email</label><input id="ap-gf1" className="input ap-focused" defaultValue="mira@northwind.io" readOnly /></div>
      <div className="ap-field"><label htmlFor="ap-gf2">Team</label><input id="ap-gf2" className="input" defaultValue="Design" readOnly /></div>
      <div className="list-row selected"><span className="checkbox" role="img" aria-label="Checked" aria-checked="true" style={{ background: 'var(--text)', color: 'var(--s0)', boxShadow: 'none' }}><Icon name="check" size={12} strokeWidth={3} /></span><span>Weekly digest</span></div>
    </div>
  )
}

export function PlainMeta() {
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Quarterly report</div>
        <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>Draft, edited 2 minutes ago</div>
      </div>
    </div>
  )
}

export function FunctionalTag() {
  const [on, setOn] = useState<string | null>('Finance')
  const items: [string, string][] = [['Quarterly report', 'Finance'], ['Hiring plan', 'People'], ['Budget 2027', 'Finance']]
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="row" role="group" aria-label="Filter by label">
          {['Finance', 'People'].map(t => (
            <button key={t} type="button" aria-pressed={on === t} onClick={() => setOn(on === t ? null : t)} className={`btn ${on === t ? 'btn-secondary' : 'btn-ghost'}`} style={{ height: 28 }}>{t}</button>
          ))}
        </div>
        {items.filter(([, t]) => !on || t === on).map(([n, t]) => <div key={n} className="ap-split"><span className="grow">{n}</span><Tag>{t}</Tag></div>)}
      </div>
    </div>
  )
}

export function ToastSaved() {
  return (
    <div className="ap-demo">
      <div className="ap-toast" role="status"><Icon name="check" size={15} /><span className="grow">Report saved</span><IconButton icon="x" label="Dismiss" size="sm" /></div>
    </div>
  )
}

export function PlainNames() {
  const rows: [string, string][] = [['Mira Okafor', '1840'], ['Jon Hale', '1712'], ['Ana Reyes', '1655'], ['Tomas Weber', '1590']]
  return (
    <div className="ap-demo">
      <div className="ap-panel" role="list" aria-label="Members">
        {rows.map(([n, r]) => <div key={n} role="listitem" className="ap-split"><span className="grow">{n}</span><span className="muted num">{r}</span></div>)}
      </div>
    </div>
  )
}

export function AirySheet() {
  const [tab, setTab] = useState('all')
  return (
    <div className="ap-frame" role="group" aria-label="Spacious 360 pixel mobile screen">
      <div className="topbar" style={{ minHeight: 56 }}>
        <IconButton icon="menu" label="Menu" />
        <strong className="grow" style={{ fontSize: 'var(--fs-lg)' }}>Inbox</strong>
        <IconButton icon="search" label="Search" />
        <IconButton icon="sliders" label="Filters and sort" />
      </div>
      <div className="ap-frame-body" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Tabs flat label="Folder" value={tab} onChange={setTab} items={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'sent', label: 'Sent' }]} />
        <div className="col" style={{ gap: 4 }}>
          {['Invoice 4821', 'Standup notes', 'Welcome aboard'].map(n => <div key={n} className="list-row"><span className="grow">{n}</span></div>)}
        </div>
      </div>
    </div>
  )
}

export function SendOrStop() {
  const [busy, setBusy] = useState(false)
  const [armed, setArmed] = useState(false)
  const t = useRef(0)
  useEffect(() => () => window.clearTimeout(t.current), [])
  const send = () => { setBusy(true); setArmed(false); t.current = window.setTimeout(() => setArmed(true), 700) }
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <label htmlFor="ap-gs" className="sr-only">Message</label>
        <input id="ap-gs" className="input" style={{ background: 'var(--s3)' }} defaultValue="Summarise the Q3 report" readOnly />
        <div className="ap-split" style={{ justifyContent: 'space-between' }}>
          <span className="muted" role="status" style={{ fontSize: 'var(--fs-sm)' }}>{busy ? 'Generating' : ''}</span>
          {busy
            ? <IconButton icon="stop" label="Stop generating" filled disabled={!armed} onClick={() => setBusy(false)} />
            : <IconButton icon="arrow-up" label="Send" filled onClick={send} />}
        </div>
      </div>
    </div>
  )
}

export function DropdownCreate() {
  const [opts, setOpts] = useState<Option[]>([{ value: 'design', label: 'Design' }, { value: 'bug', label: 'Bug' }, { value: 'research', label: 'Research' }])
  const [v, setV] = useState<string | null>('design')
  return (
    <div className="ap-demo">
      <div className="ap-field"><label>Label</label>
        <Dropdown label="Label" searchable options={opts} value={v} onChange={setV} createNoun="label" width={300}
          onCreate={name => { const value = name.toLowerCase().replace(/\s+/g, '-'); setOpts(o => [...o, { value, label: name }]); return value }} />
      </div>
      <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>Type a new name in the list to create it.</span>
    </div>
  )
}

export function PlainForm() {
  const f: [string, string][] = [['Full name', 'Mira Okafor'], ['Email', 'mira@northwind.io'], ['Team', 'Design']]
  return (
    <div className="ap-demo">
      {f.map(([l, v], i) => <div className="ap-field" key={l}><label htmlFor={`ap-pf${i}`}>{l}</label><input id={`ap-pf${i}`} className="input" defaultValue={v} readOnly /></div>)}
    </div>
  )
}

export function EmptyLine() {
  return (
    <div className="ap-demo">
      <div className="ap-panel" style={{ alignItems: 'center', padding: 28, gap: 12 }}>
        <Icon name="folder" size={22} />
        <div className="ap-h">No projects yet</div>
        <Button variant="primary" icon="plus">New project</Button>
      </div>
    </div>
  )
}

export function SidebarSwap() {
  const [view, setView] = useState<'main' | 'settings'>('main')
  return (
    <div className="ap-demo w" style={{ height: 230, background: 'var(--s0)', borderRadius: 12, overflow: 'hidden', flexDirection: 'row', gap: 0 }}>
      <nav aria-label="Sidebar" style={{ width: 170, padding: 8 }} className="col">
        {view === 'main' ? (
          <>
            <NavItem icon="home" label="Home" current closesDrawer={false} />
            <NavItem icon="sliders" label="Settings" closesDrawer={false} onClick={() => setView('settings')} />
            <NavItem icon="users" label="Team" closesDrawer={false} />
          </>
        ) : (
          <>
            <NavItem icon="chevron-left" label="Settings" closesDrawer={false} onClick={() => setView('main')} />
            <NavItem label="General" closesDrawer={false} />
            <NavItem label="Members" current closesDrawer={false} />
            <NavItem label="Security" closesDrawer={false} />
          </>
        )}
      </nav>
      <div style={{ flex: 1, margin: '6px 6px 6px 0', background: 'var(--s1)', borderRadius: 12, padding: 14 }}><strong>{view === 'main' ? 'Home' : 'Members'}</strong></div>
    </div>
  )
}

export function ContentDetail() {
  return (
    <div className="ap-demo w" style={{ height: 230, background: 'var(--s0)', borderRadius: 12, overflow: 'hidden', flexDirection: 'row', gap: 0 }}>
      <nav aria-label="Sidebar" style={{ width: 150, padding: 8 }} className="col">
        <NavItem icon="home" label="Home" closesDrawer={false} />
        <NavItem icon="sliders" label="Settings" current closesDrawer={false} />
        <NavItem icon="users" label="Team" closesDrawer={false} />
      </nav>
      <div style={{ flex: 1, margin: '6px 6px 6px 0', background: 'var(--s1)', borderRadius: 12, padding: 14 }} className="col">
        <Tabs flat label="Settings section" value="m" onChange={() => {}} items={[{ value: 'g', label: 'General' }, { value: 'm', label: 'Members' }, { value: 's', label: 'Security' }]} />
        <div className="col" style={{ marginTop: 12 }}>{['Mira Okafor', 'Jon Hale'].map(n => <div key={n} className="list-row"><span>{n}</span></div>)}</div>
      </div>
    </div>
  )
}

export function RestrainedAccent() {
  const bars = [40, 62, 48, 80, 66, 90]
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Revenue overview</div>
        <Tabs flat label="Section" value="o" onChange={() => {}} items={[{ value: 'o', label: 'Overview' }, { value: 'r', label: 'Reports' }, { value: 'e', label: 'Export' }]} />
        <div className="row" style={{ alignItems: 'flex-end', height: 56, gap: 4 }} role="img" aria-label="Bar chart in neutral grey">
          {bars.map((h, i) => <div key={i} style={{ height: h + '%', flex: 1, background: 'var(--text-3)', borderRadius: '3px 3px 0 0' }} />)}
        </div>
        <div className="row"><Button variant="primary">Save</Button><Button variant="secondary">Share</Button><Button variant="ghost">Invite</Button><span className="grow" /><span className="row" style={{ color: 'var(--accent-text)', gap: 4 }}><Icon name="trending-up" size={14} />12%</span></div>
      </div>
    </div>
  )
}

export function MatteHero() {
  return (
    <div className="ap-demo">
      <div className="ap-panel" style={{ padding: 22, gap: 10 }}>
        <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Build faster, ship calmer</h3>
        <span className="muted">One workspace for your team.</span>
        <div><Button variant="primary" size="lg">Get started</Button></div>
      </div>
    </div>
  )
}

export function FlatBreadcrumbs() {
  const rows: [string, IconName][] = [['Colours', 'folder'], ['Logos', 'folder'], ['Mockups', 'folder']]
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <nav aria-label="Breadcrumb" className="row muted" style={{ fontSize: 'var(--fs-sm)' }}>Design<Icon name="chevron-right" size={12} />Brand</nav>
        <div className="col">{rows.map(([n, ic]) => <div key={n} className="list-row"><Icon name={ic} size={15} /><span className="grow">{n}</span><Icon name="chevron-right" size={14} /></div>)}</div>
      </div>
    </div>
  )
}

export function SingleSurface() {
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Team</div>
        <span className="eyebrow">Members</span>
        <div className="col">
          <div className="list-row"><span className="grow">Mira Okafor</span><span className="muted">Admin</span></div>
          <div className="list-row"><span className="grow">Jon Hale</span><span className="muted">Editor</span></div>
        </div>
      </div>
    </div>
  )
}

export function ToolbarMenu() {
  return (
    <div className="ap-demo w">
      <div className="ap-split ap-panel" style={{ flexDirection: 'row', padding: 4 }} role="toolbar" aria-label="Editor toolbar">
        <IconButton icon="bold" label="Bold" /><IconButton icon="italic" label="Italic" /><IconButton icon="link" label="Link" />
        <span className="grow" />
        <MenuButton label="More formatting" icon="more-h" items={[
          { label: 'Strikethrough', icon: 'strike', onSelect: () => {} }, { label: 'Code', icon: 'code', onSelect: () => {} },
          { label: 'Quote', icon: 'quote', onSelect: () => {} }, { label: 'Table', icon: 'table', onSelect: () => {} },
        ]} />
      </div>
    </div>
  )
}

export function StaticContextMenu() {
  const items: [IconName, string, string?][] = [['pencil', 'Rename', 'F2'], ['copy', 'Duplicate', 'Ctrl D'], ['share', 'Share']]
  return (
    <div className="ap-demo ap-pop-static">
      <div className="ap-panel" style={{ gap: 8 }}>
        <div className="list-row selected"><Icon name="file-text" size={15} /><span className="grow">Quarterly report</span></div>
        <div className="popover" role="menu" aria-label="Row actions">
          {items.map(([ic, l, s]) => <button key={l} type="button" role="menuitem" className="menu-item"><Icon name={ic} size={15} /><span className="truncate">{l}</span>{s && <span className="shortcut">{s}</span>}</button>)}
          <hr className="divider" />
          <button type="button" role="menuitem" className="menu-item danger"><Icon name="trash" size={15} /><span className="truncate">Delete</span></button>
        </div>
      </div>
    </div>
  )
}
