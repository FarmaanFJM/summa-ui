import type { ReactNode } from 'react'
import { Icon, Tabs } from '../../ui'
import './guidance.css'

export type GuidanceTab = 'antipatterns' | 'icons' | 'presets' | 'principles'
const ITEMS: { value: GuidanceTab; label: string }[] = [
  { value: 'antipatterns', label: 'Anti-patterns' },
  { value: 'icons', label: 'Icons' },
  { value: 'presets', label: 'Presets' },
  { value: 'principles', label: 'Principles' },
]

/** Shared chrome for the guidance galleries. Lives outside the prototype apps. */
export default function GuidanceLayout({ current, children }: { current: GuidanceTab; children: ReactNode }) {
  return (
    <div className="gd-page">
      <header className="gd-top">
        <a className="btn btn-ghost" href="#/lab"><Icon name="chevron-left" /> <span className="gd-back-label">Laboratory</span></a>
        <div className="grow" />
        <Tabs<GuidanceTab> label="Guidance" value={current} onChange={v => { location.hash = v === 'principles' ? '/principles' : `/guidance/${v}` }} items={ITEMS} />
      </header>
      <div className="gd-scroll scroll">{children}</div>
    </div>
  )
}
