import { Icon, type IconName } from '../../../ui'

/* Deliberate mistakes. Recreated with scoped ap-bad-* CSS so they never leak into shared classes. */

export function NestedBorders() {
  return (
    <div className="ap-demo ap-bad-nest" role="group" aria-label="Project settings">
      <div className="ap-h">Project settings</div>
      <div className="card">
        <label className="muted" htmlFor="ap-n1" style={{ fontSize: 12.5 }}>Project name</label>
        <input id="ap-n1" className="fld" defaultValue="Northwind" readOnly />
        <div className="inner"><span>Notifications</span><span className="bt row">Manage</span></div>
      </div>
    </div>
  )
}

export function LeftBorder() {
  return (
    <div className="ap-demo">
      <div className="ap-bad-lb"><strong>Deployment finished</strong><span className="muted">Build 214 is live.</span></div>
      <div className="ap-bad-lb b"><strong>Tip</strong><span className="muted">Press / to search.</span></div>
      <div className="ap-bad-lb c"><strong>Active plan</strong><span className="muted">Team, 12 seats.</span></div>
    </div>
  )
}

export function WashedDestructive() {
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Northwind</div>
        <div className="ap-split"><button type="button" className="ap-bad-ghost-danger" tabIndex={-1}><Icon name="trash" size={15} />Delete</button></div>
      </div>
    </div>
  )
}

export function AccentFocus() {
  return (
    <div className="ap-demo">
      <div className="ap-field"><label htmlFor="ap-af1">Email</label><input id="ap-af1" className="input ap-bad-focus" defaultValue="mira@northwind.io" readOnly /></div>
      <div className="ap-field"><label htmlFor="ap-af2">Team</label><input id="ap-af2" className="input" defaultValue="Design" readOnly /></div>
      <div className="ap-split ap-bad-sel list-row" style={{ minHeight: 36 }}><span className="ap-bad-check"><Icon name="check" size={11} strokeWidth={3} /></span><span>Weekly digest</span></div>
    </div>
  )
}

export function PillTags() {
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h">Quarterly report</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          <span className="ap-bad-pill g"><Icon name="check" size={11} />Automatically saved</span>
          <span className="ap-bad-pill y">Draft</span>
          <span className="ap-bad-pill b">Updated 2m ago</span>
          <span className="ap-bad-pill p">Private</span>
        </div>
      </div>
    </div>
  )
}

const HUES = ['#e11d48', '#7c3aed', '#0891b2', '#d97706']
export function InitialsAvatars() {
  const rows = ['Mira Okafor', 'Jon Hale', 'Ana Reyes', 'Tomas Weber']
  return (
    <div className="ap-demo">
      <div className="ap-panel" role="list" aria-label="Members">
        {rows.map((n, i) => (
          <div key={n} role="listitem" className="ap-split">
            <span className="ap-bad-av" style={{ background: HUES[i] }} aria-hidden="true">{n.split(' ').map(s => s[0]).join('')}</span>
            <span className="grow">{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DenseMobile() {
  return (
    <div className="ap-frame" role="group" aria-label="Crammed 360 pixel mobile screen">
      <div className="ap-frame-body" style={{ margin: 6 }}>
        <div className="ap-bad-crammed">
          <div className="r"><Icon name="menu" size={15} /><strong className="grow">Inbox</strong><Icon name="search" size={15} /><Icon name="filter" size={15} /><Icon name="more-h" size={15} /></div>
          <div className="r"><span className="tb">All</span><span className="tb">Unread</span><span className="tb">Starred</span><span className="tb">Sent</span><span className="tb">Drafts</span></div>
          <div className="r"><span className="chip">Today</span><span className="chip">Work</span><span className="chip">Billing</span><span className="chip">Team</span></div>
          <div className="r"><span className="tb">Select</span><span className="tb">Archive</span><span className="tb">New</span></div>
          <div className="it">Invoice 4821</div><div className="it">Standup notes</div><div className="it">Welcome aboard</div><div className="it">Q3 roadmap</div>
        </div>
      </div>
    </div>
  )
}

export function SendAndStop() {
  return (
    <div className="ap-demo">
      <div className="ap-bad-send">
        <label htmlFor="ap-ss" className="sr-only">Message</label>
        <input id="ap-ss" className="input" defaultValue="Summarise the Q3 report" readOnly style={{ background: 'var(--s3)' }} />
        <div className="ap-split" style={{ justifyContent: 'flex-end' }}>
          <span className="btn btn-secondary" aria-label="Stop (disabled, shown at the same time)"><Icon name="stop" size={14} />Stop</span>
          <span className="btn btn-primary"><Icon name="arrow-up" size={14} />Send</span>
        </div>
      </div>
    </div>
  )
}

export function SelectPlusCreate() {
  return (
    <div className="ap-demo">
      <div className="ap-field"><label>Label</label>
        <div className="ap-split">
          <span className="select grow" role="img" aria-label="Label select showing Design"><span>Design</span><Icon name="chevron-down" size={14} /></span>
          <span className="btn btn-secondary"><Icon name="plus" size={14} />Create label</span>
        </div>
      </div>
    </div>
  )
}

export function HelperText() {
  const f: [string, string, string][] = [
    ['Full name', 'Mira Okafor', 'Enter your full name as it appears on your official documents.'],
    ['Email', 'mira@northwind.io', 'We will send a confirmation to this address. Make sure you can access it.'],
    ['Team', 'Design', 'Choose the team you work with most so we can suggest relevant content.'],
  ]
  return (
    <div className="ap-demo">
      {f.map(([l, v, h], i) => (
        <div className="ap-field" key={l}>
          <label htmlFor={`ap-ht${i}`}>{l}</label>
          <input id={`ap-ht${i}`} className="input" defaultValue={v} readOnly />
          <span className="faint" style={{ fontSize: 12 }}>{h}</span>
        </div>
      ))}
    </div>
  )
}

export function StackedSidebars() {
  const I = ({ children, on }: { children: string; on?: boolean }) => <div className={`i ${on ? 'on' : ''}`}>{children}</div>
  return (
    <div className="ap-demo w" role="group" aria-label="Two navigation sidebars side by side" style={{ height: 230, background: 'var(--s1)', borderRadius: 12, overflow: 'hidden' }}>
      <div className="ap-bad-side">
        <nav className="a" aria-label="Primary"><I>Home</I><I on>Settings</I><I>Billing</I><I>Team</I></nav>
        <nav className="b" aria-label="Secondary"><I>General</I><I on>Members</I><I>Security</I><I>Audit</I></nav>
        <div className="c"><strong>Members</strong><div className="muted" style={{ marginTop: 6 }}>Only a sliver is left for content.</div></div>
      </div>
    </div>
  )
}

export function AllEmerald() {
  const bars = [40, 62, 48, 80, 66, 90]
  return (
    <div className="ap-demo">
      <div className="ap-panel">
        <div className="ap-h ap-bad-em">Revenue overview</div>
        <div className="row" style={{ gap: 6 }}><span className="ap-bad-em-nav">Overview</span><span className="ap-bad-em">Reports</span><span className="ap-bad-em">Export</span></div>
        <div className="row" style={{ alignItems: 'flex-end', height: 56, gap: 4 }} role="img" aria-label="Bar chart in a single green">
          {bars.map((h, i) => <div key={i} className="ap-bad-em-bar" style={{ height: h + '%' }} />)}
        </div>
        <div className="row"><span className="ap-bad-em-btn">Save</span><span className="ap-bad-em-btn">Share</span><span className="ap-bad-em-btn">Invite</span><span className="tag accent">Pro</span></div>
      </div>
    </div>
  )
}

export function GlowHero() {
  return (
    <div className="ap-demo" style={{ padding: 10 }}>
      <div className="ap-bad-glow"><h3>Build faster, ship brighter</h3><span style={{ opacity: 0.9 }}>The all in one platform for your team.</span><span className="cta">Get started</span></div>
    </div>
  )
}

export function IndentedTree() {
  const rows: [number, string, IconName][] = [[0, 'Design', 'folder'], [1, 'Brand', 'folder'], [2, 'Logos', 'folder'], [3, 'primary.svg', 'file'], [3, 'mono.svg', 'file'], [2, 'Colours', 'folder'], [1, 'Product', 'folder'], [2, 'Mockups', 'folder']]
  return (
    <div className="ap-demo">
      <div className="ap-panel ap-bad-tree" role="tree" aria-label="Folders as an indented tree">
        {rows.map(([d, n, ic], i) => <div key={i} role="treeitem" aria-level={d + 1} aria-selected="false" style={{ paddingLeft: d * 22 }}><Icon name={ic} size={14} />{n}</div>)}
      </div>
    </div>
  )
}

export function CardInCard() {
  return (
    <div className="ap-demo">
      <div className="ap-bad-c1">
        <div className="ap-h">Team</div>
        <div className="ap-bad-c2">
          <span className="muted">Members</span>
          <div className="ap-bad-c3"><span>Mira Okafor</span><span className="muted">Admin</span></div>
          <div className="ap-bad-c3"><span>Jon Hale</span><span className="muted">Editor</span></div>
        </div>
      </div>
    </div>
  )
}

export function ToolbarOverload() {
  const icons: IconName[] = ['bold', 'italic', 'strike', 'code', 'link', 'list', 'list-ordered', 'list-check', 'quote', 'table', 'image', 'heading', 'copy', 'share']
  return (
    <div className="ap-demo w">
      <div className="ap-bad-tools" role="toolbar" aria-label="Editor toolbar with every action visible">
        {icons.map(n => <span key={n} className="icon-btn" aria-hidden="true"><Icon name={n} size={16} /></span>)}
      </div>
    </div>
  )
}
