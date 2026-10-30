import { useState } from 'react'
import { AppShell, Brand, Button, DrawerToggle, NavItem, type IconName } from '../../ui'
import { RailToggle, Workspace, useWorkspacePreferences } from '../../ui/workspace'
import './workspace-demo.css'

/*
  #/workspace: a standalone laboratory route that shows the workspace pattern (docs/WORKSPACE_PATTERN.md) with a
  neutral primary region: a square document page preview. It is not an approved reference application and is not
  part of the regression set. The primary region is content-agnostic; swap the page for an image, a canvas or a map.
*/
const NAV: { id: string; label: string; icon: IconName }[] = [
  { id: 'docs', label: 'Documents', icon: 'file-text' },
  { id: 'review', label: 'Review', icon: 'eye' },
  { id: 'archive', label: 'Archive', icon: 'archive' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]
const PAGES = Array.from({ length: 12 }, (_, i) => `Page ${i + 1}`)
const FACTS: [string, string][] = [['Author', 'Maya Okafor'], ['Updated', 'Oct 28, 2026'], ['Pages', '12'], ['Language', 'English']]

function PagePreview({ page }: { page: number }) {
  return (
    <div className="wsd-page" role="img" aria-label={`Preview of page ${page}`}>
      <div className="wsd-line wsd-title" />
      {[92, 100, 84, 100, 96, 60, 0, 100, 88, 100, 72, 0, 100, 94, 52].map((w, i) => (w ? <div key={i} className="wsd-line" style={{ width: `${w}%` }} /> : <div key={i} className="wsd-gap" />))}
    </div>
  )
}

export default function WorkspaceDemo() {
  const prefs = useWorkspacePreferences()
  const [page, setPage] = useState(3)
  const [note, setNote] = useState(false)
  const [size, setSize] = useState(0)
  // A workspace route defaults to the rail; an explicit choice always wins (null means "let the route decide").
  const compact = prefs.sidebarCompact ?? true
  return (
    <AppShell
      compact={compact}
      sidebar={
        <>
          <Brand name="Summa-UI" />
          <nav className="col" aria-label="Primary" style={{ gap: 2 }}>
            {NAV.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} current={n.id === 'review'} />)}
          </nav>
          <RailToggle compact={compact} onChange={c => prefs.setSidebarCompact(c)} />
        </>
      }
    >
      <header className="topbar">
        <DrawerToggle />
        <h1 className="wsd-h1">Contract review</h1>
      </header>
      <div className="wsd-fill">
        <Workspace
          workspaceKey="demo/review"
          prefs={prefs}
          primaryLabel="Page preview"
          onSize={setSize}
          primary={<PagePreview page={page} />}
          primaryFooter={
            <div className="col wsd-foot">
              <div className="row">
                <span className="grow muted">Page {page} of {PAGES.length}</span>
                <Button size="md" onClick={() => setNote(n => !n)} aria-expanded={note}>{note ? 'Hide reviewer note' : 'Show reviewer note'}</Button>
              </div>
              {note && <p className="muted">This section changes the payment terms. The footer grows, and the preview keeps its size.</p>}
            </div>
          }
          leftTitle="Pages"
          leftDefaultOpen={false}
          left={
            <div className="col" style={{ gap: 2 }} role="listbox" aria-label="Pages">
              {PAGES.map((p, i) => (
                <button key={p} type="button" role="option" aria-selected={page === i + 1} className="list-row" onClick={() => setPage(i + 1)}>{p}</button>
              ))}
            </div>
          }
          rightTitle="Properties"
          right={
            /* No heading and no card: the facts say what they are. The name "Properties" only labels the region and its chevron. */
            <div className="col" style={{ gap: 'var(--sp-4)' }}>
              {FACTS.map(([k, v]) => (
                <div key={k} className="col">
                  <span className="eyebrow">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="col">
                <span className="eyebrow">Preview size</span>
                <span className="num">{size} px</span>
              </div>
            </div>
          }
        />
      </div>
    </AppShell>
  )
}
