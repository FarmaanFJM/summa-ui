import { useEffect, useState, type ReactNode } from 'react'
import {
  ActionRow, Button, CopyButton, DetailPanel, Details, IconButton, InlineAlert, LogViewer, OperationProgress, SecretToggleAll, SecretValue,
  StatusIndicator, Switch, TerminalFrame, Tooltip, useRevealAll, type LogLine,
} from '../../ui'
import { ConfirmDialog } from '../../presets'

/* Information density: side by side Avoid / Prefer cases for the TOP principle (docs/TOP.md). Review view, outside the apps. */

function Pair({ title, avoid, prefer, note }: { title: string; avoid: ReactNode; prefer: ReactNode; note: string }) {
  return (
    <section className="col" style={{ gap: 'var(--sp-3)' }} aria-label={title}>
      <h2 className="eyebrow">{title}</h2>
      <div className="top-lab__pair">
        <div className="top-lab__case">
          <span className="eyebrow" data-kind="avoid">Avoid</span>
          <div className="top-lab__stage">{avoid}</div>
        </div>
        <div className="top-lab__case">
          <span className="eyebrow" data-kind="prefer">Prefer</span>
          <div className="top-lab__stage">{prefer}</div>
        </div>
      </div>
      <p className="top-lab__note">{note}</p>
    </section>
  )
}

const MENU = (name: string) => [
  { label: 'Open in terminal', icon: 'terminal' as const, onSelect: () => {} },
  { label: 'Copy path', icon: 'copy' as const, onSelect: () => {} },
  { type: 'sep' as const },
  { label: `Remove ${name}`, icon: 'trash' as const, danger: true, onSelect: () => {} },
]

const SECRETS = [
  { id: 'token', label: 'API token', value: 'demo-token-0000-not-a-real-key' },
  { id: 'db', label: 'Database URL', value: 'postgres://app:hunter2@db.internal:5432/main' },
]

const SAMPLE: LogLine[] = [
  'Building backend',
  'Resolving dependencies',
  'Compiling 214 modules',
  { text: 'Warning: unused export "legacyAuth"', level: 'warn' },
  'Listening on port 4100',
  { text: 'Error: database connection refused (db.internal:5432)', level: 'error' },
  'Retrying in 5 seconds',
]

export default function Density() {
  const [on, setOn] = useState(true)
  const [panel, setPanel] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [pct, setPct] = useState(35)
  const reveal = useRevealAll(SECRETS.map(s => s.id))
  useEffect(() => { document.title = 'Information density · Summa-UI' }, [])
  useEffect(() => { const t = window.setInterval(() => setPct(p => (p >= 100 ? 0 : p + 5)), 900); return () => window.clearInterval(t) }, [])

  return (
    <div className="top-lab__wrap">
      <header className="col" style={{ gap: 'var(--sp-2)' }}>
        <h1 className="top-lab__h1">Information density</h1>
        <p className="muted">Show only the information the user needs at the moment they need it. Each case shows the same task twice.</p>
      </header>

      <Pair title="Repository row"
        avoid={
          <div className="col" style={{ gap: 'var(--sp-2)', padding: 'var(--sp-2)' }}>
            <div className="row"><strong className="grow">example-service</strong><StatusIndicator state="warn" label="Needs attention" /></div>
            <p className="top-lab__para">This repository contains uncommitted changes. Synchronization with the remote has not been performed since yesterday. Click here to open the terminal for this repository, or use the buttons below.</p>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <Button variant="primary">Sync with Remote</Button><Button>Fetch</Button><Button>Pull</Button><Button>Push</Button><Button>Open terminal</Button><Button>Open in editor</Button>
            </div>
          </div>
        }
        prefer={
          <div className="top-lab__stack">
            <ActionRow label="example-service" name="example-service" status={<StatusIndicator state="warn" label="3 changed files" />}
              action={<Button variant="primary">Sync</Button>} menu={MENU('example-service')} onOpen={() => setPanel(true)} />
            <ActionRow label="docs-site" name="docs-site" status={<StatusIndicator state="ready" label="Synced" />}
              action={<Button>Sync</Button>} menu={MENU('docs-site')} />
            <ActionRow label="billing-api" name="billing-api" status={<StatusIndicator state="failed" label="Backend failed" />}
              action={<Button>Logs</Button>} menu={MENU('billing-api')} />
          </div>
        }
        note="The action is visible. Branch, path, terminal and removal are one menu away (button, right click, or the Menu key). Status is a word of two or three tokens, not a sentence." />

      <Pair title="Button instruction"
        avoid={
          <div className="col" style={{ gap: 'var(--sp-2)', padding: 'var(--sp-2)' }}>
            <div><Button variant="primary" icon="refresh">Sync with Remote</Button></div>
            <p className="top-lab__para">Pressing this button will fetch the latest commits from the remote, merge them into your current branch and then push your local commits. If there are conflicts you will be asked to resolve them.</p>
          </div>
        }
        prefer={
          <div className="row" style={{ padding: 'var(--sp-2)' }}>
            <Button variant="primary" icon="refresh">Sync with Remote</Button>
            <Tooltip content="Fetches, merges, then pushes this branch."><IconButton icon="info" label="About sync" /></Tooltip>
          </div>
        }
        note="The action carries the label. The one-sentence help is a deliberate hover or focus away, never repeats the label and never holds a destructive consequence." />

      <Pair title="Settings"
        avoid={
          <div className="col" style={{ gap: 'var(--sp-3)', padding: 'var(--sp-2)' }}>
            {['Auto fetch', 'Notifications', 'Show hidden files'].map(n => (
              <div key={n} className="top-lab__field">
                <div className="top-lab__field-text"><span>{n}</span><span className="top-lab__para">When this option is turned on, {n.toLowerCase()} will be enabled for every repository in your workspace until you turn it off again.</span></div>
                <Switch checked label={n} onChange={() => {}} />
              </div>
            ))}
          </div>
        }
        prefer={
          <div className="col" style={{ padding: 'var(--sp-2)' }}>
            <div className="top-lab__field"><span>Auto fetch</span><Switch checked={on} label="Auto fetch" onChange={setOn} /></div>
            <div className="top-lab__field"><span>Notifications</span><Switch checked label="Notifications" onChange={() => {}} /></div>
            <div className="top-lab__field"><span>Show hidden files</span><Switch checked={false} label="Show hidden files" onChange={() => {}} /></div>
          </div>
        }
        note="A switch with a clear name needs no paragraph. Add a tooltip only to the one setting whose effect is not obvious." />

      <Pair title="Status text"
        avoid={
          <div className="top-lab__stack" style={{ padding: 'var(--sp-2)' }}>
            {['Repository synchronization completed successfully', 'The process is currently running', 'An error occurred while attempting to start the backend', 'No active process was found for this service'].map(t => <span key={t} className="top-lab__para">{t}</span>)}
          </div>
        }
        prefer={
          <div className="top-lab__stack" style={{ padding: 'var(--sp-2)' }}>
            <StatusIndicator state="ready" label="Synced" /><StatusIndicator state="running" label="Running" />
            <StatusIndicator state="failed" label="Backend failed" /><StatusIndicator state="stopped" label="Stopped" />
          </div>
        }
        note="A mark plus one word. The reason for a failure lives behind Logs or Details, one action away." />

      <section className="col" style={{ gap: 'var(--sp-3)' }} aria-label="Components">
        <h2 className="eyebrow">Components</h2>
        <div className="top-lab__pair">
          <div className="top-lab__stage">
            <span className="eyebrow">Secrets</span>
            <div className="row"><SecretToggleAll controls={reveal} /></div>
            {SECRETS.map(s => (
              <div key={s.id} className="col" style={{ gap: 2 }}>
                <span className="top-lab__para">{s.label}</span>
                <SecretValue value={s.value} label={s.label} revealed={reveal.isRevealed(s.id)} onRevealedChange={v => reveal.set(s.id, v)} />
              </div>
            ))}
          </div>
          <div className="top-lab__stage">
            <span className="eyebrow">Alerts, progress, details</span>
            <InlineAlert tone="error" action={{ label: 'Logs', onClick: () => {} }}>Backend failed</InlineAlert>
            <InlineAlert tone="warn">3 changed files</InlineAlert>
            <OperationProgress label="Syncing" value={pct} />
            <OperationProgress label="Cloning" />
            <Details><span style={{ fontFamily: "var(--mono)" }}>branch main, origin/main, C:\Projects\Example</span> <CopyButton value={'C:\\Projects\\Example'} label="Copy path" /></Details>
          </div>
        </div>
        <LogViewer lines={SAMPLE} label="Backend log" searchable height={140} />
        <TerminalFrame shell="PowerShell" onNewTab={() => {}} onClose={() => {}} height={90}>
          <div className="top-log__body">xterm mounts here</div>
        </TerminalFrame>
        <div className="row"><Button variant="danger" icon="trash" onClick={() => setConfirm(true)}>Delete repository</Button></div>
      </section>

      <ConfirmDialog open={confirm} onCancel={() => setConfirm(false)} onConfirm={() => setConfirm(false)} destructive
        title="Delete local repository?" confirmLabel="Delete repository" target={'C:\\Projects\\Example'}
        consequences={['Moves the folder to the Recycle Bin', 'Unpushed commits are lost if you empty it']} />

      {panel && (
        <div className="top-lab__stage" style={{ padding: 0, minHeight: 200 }}>
          <DetailPanel title="example-service" onBack={() => setPanel(false)} actions={<Button variant="primary">Sync</Button>}>
            <p className="muted">The panel replaces the list in the main region. Escape or Back returns.</p>
          </DetailPanel>
        </div>
      )}
    </div>
  )
}
