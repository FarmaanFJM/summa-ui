/*
  Workspace: React reference for docs/WORKSPACE_PATTERN.md.

  A square primary region flanked by two optional, collapsible information panels. Nothing here knows
  what the primary region shows (an image, a canvas, a document preview). The numbers come from the
  framework-neutral workspaceGeometry.ts; this file measures, renders and wires interaction.

  The size controls are a rail attached to the primary region (a resize handle that is a slider, and one options
  menu with the discrete actions), not toolbar buttons: the toolbar is about the page (title, panel toggles), the rail is
  about the region it sits against. Its width is reserved on both sides so the region stays centered (geometry `rail`).

  Built only from existing tokens, presets and icons (sm-icon-btn, the shared Icon). Appearance of the
  workspace itself is in styles/workspace.css. Candidate preset spec: feedback/proposals/PR-0002.
*/
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import '../../guidance/css/presets.css'
import { Icon } from './icons'
import { SIZE_STEP, computeWorkspace, dragSize, stepSize, type PanelSpec } from './workspaceGeometry'

export type { PanelSpec }

const TOOLBAR_HEIGHT = 44
const PADDING = 16
const GAP = 16
const CHROME_GAP = 12
/** Width the control rail takes beside the primary region; reserved on both sides by the geometry. */
const RAIL = 40
export const WORKSPACE_STORAGE_KEY = 'summa-workspace-v1'

/* ------------------------------------------------------------------ Preferences */
type Side = 'left' | 'right'
type Persisted = { size: number | null; panels: Record<string, Partial<Record<Side, boolean>>>; sidebarCompact: boolean | null }
const EMPTY: Persisted = { size: null, panels: {}, sidebarCompact: null }

function load(storageKey: string): Persisted {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as Partial<Persisted> | null
    if (!p || typeof p !== 'object') return EMPTY
    const size = typeof p.size === 'number' && Number.isFinite(p.size) && p.size > 0 && p.size <= 4096 ? Math.round(p.size) : null
    const panels: Persisted['panels'] = {}
    if (p.panels && typeof p.panels === 'object') {
      for (const [k, v] of Object.entries(p.panels)) {
        if (!v || typeof v !== 'object') continue
        const e: Partial<Record<Side, boolean>> = {}
        if (typeof v.left === 'boolean') e.left = v.left
        if (typeof v.right === 'boolean') e.right = v.right
        panels[k] = e
      }
    }
    return { size, panels, sidebarCompact: typeof p.sidebarCompact === 'boolean' ? p.sidebarCompact : null }
  } catch { return EMPTY }
}

/**
 * Layout preferences, shared by every workspace of an application (call it once, pass the result down).
 * What is stored is the person's choice, never a measurement: `size` is the size they picked (null means the
 * responsive default) and a small window only clamps what is shown. Every storage access is guarded.
 * Device-local on purpose: a comfortable size depends on the screen in front of the person.
 */
export function useWorkspacePreferences(storageKey = WORKSPACE_STORAGE_KEY) {
  const [state, setState] = useState<Persisted>(() => load(storageKey))
  const update = useCallback((fn: (s: Persisted) => Persisted) => {
    setState(prev => {
      const next = fn(prev)
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* unavailable: the choice lives for this session only */ }
      return next
    })
  }, [storageKey])
  return useMemo(() => ({
    size: state.size,
    panels: state.panels,
    sidebarCompact: state.sidebarCompact,
    setSize: (v: number | null) => update(s => ({ ...s, size: v === null ? null : Math.round(v) })),
    isPanelOpen: (key: string, side: Side, fallback: boolean) => state.panels[key]?.[side] ?? fallback,
    setPanelOpen: (key: string, side: Side, open: boolean) => update(s => ({ ...s, panels: { ...s.panels, [key]: { ...s.panels[key], [side]: open } } })),
    setSidebarCompact: (v: boolean | null) => update(s => ({ ...s, sidebarCompact: v })),
    /** Back to the responsive default size and this workspace's standard panels. */
    restoreDefaults: (key: string) => update(s => { const panels = { ...s.panels }; delete panels[key]; return { ...s, size: null, panels } }),
  }), [state, update])
}
export type WorkspacePreferences = ReturnType<typeof useWorkspacePreferences>

/* ------------------------------------------------------------------ Control rail */
type RailProps = {
  label: string
  size: number; minSize: number; maxSize: number; atMin: boolean; atMax: boolean
  customized: boolean
  placement: 'side' | 'below'
  onStep: (direction: 1 | -1) => void
  onLargest: () => void
  onRestore: () => void
  onPreview: (size: number | null) => void
  onCommit: (size: number) => void
}

/**
 * The controls about the primary region, attached to it: a resize handle (a slider: drag, or arrow keys, Home, End)
 * and one labelled options menu (APG menu button) that holds the discrete actions. Rare actions live in the menu so the
 * region keeps four fewer permanent buttons. It follows the region, so it is never left behind at an old size.
 */
function WorkspaceRail({ label, size, minSize, maxSize, atMin, atMax, customized, placement, onStep, onLargest, onRestore, onPreview, onCommit }: RailProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; size: number } | null>(null)
  const last = useRef<number | null>(null)
  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])]
  const closeMenu = (returnFocus: boolean) => { setOpen(false); if (returnFocus) triggerRef.current?.focus() }
  useEffect(() => {
    if (!open) return
    const onDoc = (e: Event) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])
  const openMenu = (focusFirst: boolean) => { setOpen(true); if (focusFirst) requestAnimationFrame(() => items()[0]?.focus()) }
  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(true) }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); closeMenu(false) }
  }
  const onMenuKey = (e: KeyboardEvent) => {
    const list = items(), i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus() }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus() }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true) }
    else if (e.key === 'Tab') closeMenu(false)
  }
  const choose = (disabled: boolean, action: () => void) => { if (disabled) return; action(); closeMenu(true) }

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, size }
    e.preventDefault()
  }
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return
    last.current = dragSize(start.current.size, e.clientX - start.current.x, e.clientY - start.current.y, { minSize, maxSize })
    onPreview(last.current)
  }
  const onUp = () => { if (start.current && last.current !== null) onCommit(last.current); start.current = null; last.current = null; onPreview(null) }
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = ({ ArrowRight: size + SIZE_STEP, ArrowUp: size + SIZE_STEP, ArrowLeft: size - SIZE_STEP, ArrowDown: size - SIZE_STEP, Home: minSize, End: maxSize } as Record<string, number>)[e.key]
    if (next === undefined) return
    e.preventDefault()
    onCommit(Math.min(maxSize, Math.max(minSize, next)))
  }
  const item = (action: string, icon: 'plus' | 'minus' | 'maximize' | 'refresh', text: string, disabled: boolean, run: () => void) => (
    <button type="button" role="menuitem" className="ws-rail-item" data-ws={action} aria-disabled={disabled} tabIndex={-1} onClick={() => choose(disabled, run)}>
      <Icon name={icon} size={16} /><span>{text}</span>
    </button>
  )
  return (
    <div ref={rootRef} className={`ws-rail is-${placement} ${open ? 'is-open' : ''}`} data-ws-rail>
      <div className="ws-rail-menu-host">
        <button ref={triggerRef} type="button" className="sm-icon-btn ws-rail-btn" data-ws="options" aria-haspopup="menu" aria-expanded={open}
          aria-label={`${label} options`} title={`${label} options`} onClick={() => (open ? closeMenu(false) : openMenu(false))} onKeyDown={onTriggerKey}>
          <Icon name="settings" size={18} />
        </button>
        {open && (
          <div ref={menuRef} className="ws-rail-menu" role="menu" aria-label={`${label} options`} onKeyDown={onMenuKey}>
            {item('enlarge', 'plus', `Larger ${label}`, atMax, () => onStep(1))}
            {item('shrink', 'minus', `Smaller ${label}`, atMin, () => onStep(-1))}
            {item('fit', 'maximize', 'Largest that fits', atMax, onLargest)}
            <div className="ws-rail-sep" role="separator" />
            {item('restore', 'refresh', 'Restore default size and panels', !customized, onRestore)}
          </div>
        )}
      </div>
      <button type="button" className="ws-rail-btn ws-rail-handle" data-ws="resize" role="slider" aria-label={`Resize ${label}`} aria-orientation="horizontal"
        aria-valuemin={minSize} aria-valuemax={maxSize} aria-valuenow={size} aria-valuetext={`${size} pixels`} title={`Drag to resize the ${label}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
        <Icon name="arrow-down-right" size={16} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ Component */
export type WorkspaceProps = {
  /** Stable id for remembering panel visibility, for example `documents/review`. */
  workspaceKey: string
  prefs: WorkspacePreferences
  /** The primary region content. It fills a square of the computed size (use width: 100%; aspect-ratio: 1). */
  primary: ReactNode
  /** Name of the primary region, used in labels ("Preview"). */
  primaryLabel?: string
  /** Chrome above and below the square. Measured, never guessed, and held at its peak so the region does not jump. */
  primaryHeader?: ReactNode
  primaryFooter?: ReactNode
  left?: ReactNode
  right?: ReactNode
  leftTitle?: string
  rightTitle?: string
  leftPanel?: PanelSpec
  rightPanel?: PanelSpec
  leftDefaultOpen?: boolean
  rightDefaultOpen?: boolean
  toolbarStart?: ReactNode
  toolbarEnd?: ReactNode
  /** Called with the effective size after every layout change. */
  onSize?: (size: number) => void
}

type PanelState = 'absent' | 'hidden' | 'docked' | 'drawer' | 'drawer-open'

export function Workspace({
  workspaceKey, prefs, primary, primaryLabel = 'Preview', primaryHeader, primaryFooter, left, right,
  leftTitle = 'Details', rightTitle = 'Details', leftPanel = { preferred: 320, min: 240 }, rightPanel = { preferred: 340, min: 260 },
  leftDefaultOpen = true, rightDefaultOpen = true, toolbarStart, toolbarEnd, onSize,
}: WorkspaceProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [box, setBox] = useState({ w: 1280, h: 800, measured: false })
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const read = () => { const r = el.getBoundingClientRect(); setBox({ w: Math.floor(r.width), h: Math.floor(r.height), measured: true }) }
    read()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [])

  /* Chrome is measured, and the PEAK since the workspace opened is used: a footer that goes away must not make
     the region jump larger, and one that returns must not make it jump smaller. */
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [peak, setPeak] = useState({ header: 0, footer: 0 })
  const hasHeader = primaryHeader != null, hasFooter = primaryFooter != null
  useEffect(() => { setPeak({ header: 0, footer: 0 }) }, [workspaceKey])
  useLayoutEffect(() => {
    const read = () => {
      const h = headerRef.current ? Math.ceil(headerRef.current.getBoundingClientRect().height) : 0
      const f = footerRef.current ? Math.ceil(footerRef.current.getBoundingClientRect().height) + CHROME_GAP : 0
      setPeak(p => (h > p.header || f > p.footer ? { header: Math.max(p.header, h), footer: Math.max(p.footer, f) } : p))
    }
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    if (headerRef.current) ro.observe(headerRef.current)
    if (footerRef.current) ro.observe(footerRef.current)
    return () => ro.disconnect()
  }, [hasHeader, hasFooter, workspaceKey])

  const hasLeft = left != null, hasRight = right != null
  const leftOpen = prefs.isPanelOpen(workspaceKey, 'left', leftDefaultOpen)
  const rightOpen = prefs.isPanelOpen(workspaceKey, 'right', rightDefaultOpen)
  const [dragging, setDragging] = useState<number | null>(null)

  const g = useMemo(() => computeWorkspace({
    width: box.w, height: box.h, padding: PADDING, gap: GAP, rail: RAIL, chromeY: TOOLBAR_HEIGHT + peak.header + peak.footer,
    left: hasLeft ? leftPanel : null, right: hasRight ? rightPanel : null, leftOpen, rightOpen, preferred: dragging ?? prefs.size,
  }), [box.w, box.h, peak.header, peak.footer, hasLeft, hasRight, leftPanel, rightPanel, leftOpen, rightOpen, dragging, prefs.size])
  useEffect(() => { onSize?.(g.size) }, [g.size, onSize])
  const stacked = g.mode === 'stacked'

  /* Drawers: a panel that cannot dock opens over the workspace on demand. Escape closes it and focus returns. */
  const [drawer, setDrawer] = useState<Side | null>(null)
  const toggleRef = { left: useRef<HTMLButtonElement>(null), right: useRef<HTMLButtonElement>(null) }
  const panelRef = { left: useRef<HTMLElement>(null), right: useRef<HTMLElement>(null) }
  const dockOf = (s: Side) => (s === 'left' ? g.leftDock : g.rightDock)
  const panelState = (s: Side): PanelState => { const d = dockOf(s); return d === 'drawer' ? (drawer === s ? 'drawer-open' : 'drawer') : d }
  const toggle = (s: Side) => {
    if (dockOf(s) === 'drawer') { setDrawer(drawer === s ? null : s); return }
    prefs.setPanelOpen(workspaceKey, s, !(s === 'left' ? leftOpen : rightOpen))
  }
  // The background is inert while the drawer is open, so focus returns to the toggle after the update lifts that.
  const closeDrawer = useCallback(() => { const s = drawer; setDrawer(null); if (s) requestAnimationFrame(() => toggleRef[s].current?.focus()) }, [drawer]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (drawer) panelRef[drawer].current?.focus() }, [drawer]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (drawer && dockOf(drawer) !== 'drawer') setDrawer(null) }, [g.leftDock, g.rightDock]) // eslint-disable-line react-hooks/exhaustive-deps
  const onRootKey = (e: KeyboardEvent) => {
    if (!drawer) return
    if (e.key === 'Escape') { e.stopPropagation(); closeDrawer(); return }
    if (e.key === 'Tab') { // keep focus inside the open drawer
      const items = [...(panelRef[drawer].current?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? [])].filter(n => !n.hasAttribute('disabled'))
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef[drawer].current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  /* Size controls live in the rail attached to the region. */
  const customized = prefs.size !== null || prefs.panels[workspaceKey]?.left !== undefined || prefs.panels[workspaceKey]?.right !== undefined
  const step = (d: 1 | -1) => prefs.setSize(stepSize(g.size, d, g))
  const railProps: Omit<RailProps, 'placement'> = {
    label: primaryLabel.toLowerCase(), size: g.size, minSize: g.minSize, maxSize: g.maxSize, atMin: g.atMin, atMax: g.atMax, customized,
    onStep: step, onLargest: () => prefs.setSize(g.maxSize), onRestore: () => { setDrawer(null); prefs.restoreDefaults(workspaceKey) },
    onPreview: setDragging, onCommit: v => prefs.setSize(v),
  }

  const style = { '--ws-size': `${g.size}px`, '--ws-left': `${g.leftWidth}px`, '--ws-right': `${g.rightWidth}px`, '--ws-pad': `${PADDING}px`, '--ws-gap': `${g.gapX}px` } as CSSProperties
  const panelId = useId()
  const toggleLabel = (s: Side, title: string) => `${(s === 'left' ? leftOpen : rightOpen) && dockOf(s) !== 'drawer' ? 'Hide' : 'Show'} ${title}`

  const renderPanel = (s: Side, title: string, content: ReactNode) => {
    const st = panelState(s)
    return (
      <section key={s} ref={panelRef[s]} id={`${panelId}-${s}`} className={`ws-panel ws-panel-${s} is-${st}`} aria-label={title} tabIndex={-1}
        {...(st === 'drawer-open' ? { role: 'dialog', 'aria-modal': true } : {})} hidden={st === 'hidden' ? true : undefined} inert={drawer && drawer !== s ? true : undefined}>
        {st === 'drawer-open' && <button type="button" className="sm-icon-btn ws-btn ws-drawer-close" aria-label="Close panel" onClick={closeDrawer}><Icon name="x" size={18} /></button>}
        {stacked && <h2 className="ws-panel-title">{title}</h2>}
        <div className="ws-panel-body">{content}</div>
      </section>
    )
  }

  return (
    <section ref={rootRef} className={`ws ${stacked ? 'is-stacked' : ''} ${dragging !== null ? 'is-dragging' : ''}`} style={style}
      data-ws-mode={g.mode} data-ws-size={g.size} data-ws-left={panelState('left')} data-ws-right={panelState('right')} data-ws-measured={box.measured} onKeyDown={onRootKey}>
      <div className="ws-toolbar" role="toolbar" aria-label={`${primaryLabel} layout`} inert={drawer ? true : undefined}>
        <div className="ws-group">
          {hasLeft && (
            <button ref={toggleRef.left} type="button" className="sm-icon-btn ws-btn" data-ws-toggle="left" aria-pressed={g.leftDock === 'docked' || drawer === 'left'}
              aria-label={toggleLabel('left', leftTitle)} title={toggleLabel('left', leftTitle)} onClick={() => toggle('left')}><Icon name="panel" size={18} /></button>
          )}
          {toolbarStart}
        </div>
        <div className="ws-group ws-group-end">
          {toolbarEnd}
          {hasRight && (
            <button ref={toggleRef.right} type="button" className="sm-icon-btn ws-btn" data-ws-toggle="right" aria-pressed={g.rightDock === 'docked' || drawer === 'right'}
              aria-label={toggleLabel('right', rightTitle)} title={toggleLabel('right', rightTitle)} onClick={() => toggle('right')}><Icon name="sidebar-right" size={18} /></button>
          )}
        </div>
      </div>

      <div className="ws-body">
        {hasLeft && renderPanel('left', leftTitle, left)}
        <div className="ws-primary" role="region" aria-label={primaryLabel} inert={drawer ? true : undefined}>
          {hasHeader && <div ref={headerRef} className="ws-primary-header">{primaryHeader}</div>}
          <div className="ws-primary-box">
            {primary}
            {!stacked && <WorkspaceRail {...railProps} placement="side" />}
          </div>
          {stacked && <WorkspaceRail {...railProps} placement="below" />}
          {hasFooter && <div ref={footerRef} className="ws-primary-footer">{primaryFooter}</div>}
        </div>
        {hasRight && renderPanel('right', rightTitle, right)}
      </div>
      {drawer && <div className="ws-scrim" aria-hidden="true" onClick={closeDrawer} />}
    </section>
  )
}

/* ------------------------------------------------------------------ Compact rail toggle */
/** Width toggle for the application sidebar: place it at the bottom of the sidebar, next to AppShell's `compact` prop. */
export function RailToggle({ compact, onChange }: { compact: boolean; onChange: (compact: boolean) => void }) {
  const label = compact ? 'Expand navigation' : 'Collapse navigation'
  return (
    <button type="button" className="nav-item rail-toggle" aria-label={label} title={label} aria-pressed={!compact} onClick={() => onChange(!compact)}>
      <Icon name={compact ? 'chevrons-right' : 'chevrons-left'} size={16} />
      <span className="truncate">Collapse</span>
    </button>
  )
}
