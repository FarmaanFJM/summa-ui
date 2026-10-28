import { useState } from 'react'
import { PROTOTYPES } from '../registry'
import { AppShell, Brand, DrawerToggle, Icon, NavItem, Tabs, useHotkey } from '../ui'
import './lab.css'

type Size = 'desktop' | 'tablet' | 'mobile'
const WIDTHS: Record<Size, number | null> = { desktop: null, tablet: 820, mobile: 390 }

const go = (id: string) => { location.hash = `/lab/${id}` }

export default function Lab({ current }: { current: string }) {
  const [size, setSize] = useState<Size>('desktop')
  const proto = PROTOTYPES.find(p => p.id === current) ?? PROTOTYPES[0]
  const w = WIDTHS[size]

  PROTOTYPES.forEach((p, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkey(String(i + 1), e => { if (!(e.target as HTMLElement).closest('input,textarea')) go(p.id) }, [])
  })

  const src = `${location.pathname}${location.search}#/${proto.id}`
  return (
    <AppShell
      sideWidth={248}
      sidebar={
        <>
          <Brand name="Summa-UI Laboratory" />
          {[1, 2].map(g => (
            <div key={g}>
              <div className="eyebrow lab-eyebrow">{g === 1 ? 'Phase 1: Workspaces' : 'Phase 2: Layout diversity'}</div>
              <nav className="col" aria-label={g === 1 ? 'Phase 1 prototypes' : 'Phase 2 prototypes'} style={{ gap: 2 }}>
                {PROTOTYPES.map((p, i) => p.group === g && (
                  <NavItem key={p.id} icon={p.icon} label={p.name} current={p.id === proto.id} count={i < 9 ? i + 1 : undefined} onClick={() => go(p.id)} />
                ))}
              </nav>
            </div>
          ))}
          <div>
            <div className="eyebrow lab-eyebrow">Guidance</div>
            <nav className="col" aria-label="Guidance" style={{ gap: 2 }}>
              <NavItem icon="x" label="Anti-patterns" onClick={() => { location.hash = '/guidance/antipatterns' }} />
              <NavItem icon="layers" label="Icons" onClick={() => { location.hash = '/guidance/icons' }} />
              <NavItem icon="sliders" label="Presets" onClick={() => { location.hash = '/guidance/presets' }} />
              <NavItem icon="info" label="Principles applied" onClick={() => { location.hash = '/principles' }} />
            </nav>
          </div>
        </>
      }
    >
      <div className="topbar lab-topbar">
        <DrawerToggle />
        <div className="grow col">
          <span className="lab-title truncate">{proto.name}</span>
        </div>
        <Tabs<Size> label="Viewport" value={size} onChange={setSize} items={[{ value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'mobile', label: 'Mobile' }]} />
        <a className="btn btn-ghost" href={`#/${proto.id}`} target="_blank" rel="noreferrer">
          <Icon name="external" /> <span className="lab-open-label">Open</span>
        </a>
      </div>
      <div className="lab-stage">
        <iframe key={proto.id} title={proto.name} src={src} className="lab-frame" style={w ? { width: w, maxWidth: '100%' } : undefined} />
      </div>
    </AppShell>
  )
}
