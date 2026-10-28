import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SI } from './icons'
import { ProductArt } from './art'
import { COLORS, looksFor, type Product } from './data'

export function Art({ p, color, view = 0 }: { p: Product; color?: string; view?: number }) {
  const c = color ?? p.colors[0]
  return <ProductArt look={looksFor(p, c)} view={view} label={`${p.name} in ${c}`} />
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="st-stars" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => <SI key={i} name="star" size={size} fill style={{ opacity: value >= i - 0.25 ? 1 : value >= i - 0.75 ? 0.55 : 0.2 }} />)}
    </span>
  )
}

export function Swatch({ name, on, onClick, size = 28 }: { name: string; on?: boolean; onClick?: () => void; size?: number }) {
  return (
    <button type="button" role="radio" aria-checked={!!on} aria-label={name} title={name} className="st-swatch" data-on={on ? 'true' : undefined} onClick={onClick} style={{ ['--sw' as string]: COLORS[name], width: size, height: size }} />
  )
}

export function Stepper({ value, onChange, min = 1, max = 10, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="st-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}><SI name="minus" size={14} /></button>
      <span className="num" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}><SI name="plus" size={14} /></button>
    </div>
  )
}

/** Slide-over / sheet with focus trap, scrim and Escape. */
export function Overlay({ open, onClose, side, label, children, className = '' }: { open: boolean; onClose: () => void; side: 'left' | 'right' | 'bottom'; label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current!
    ;(el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>('button, input'))?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const f = Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href],select,textarea,[tabindex]:not([tabindex="-1"])')).filter(x => x.offsetParent !== null)
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); prev?.focus() }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="st-overlay" data-side={side} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className={`st-sheet ${className}`} role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>,
    document.body,
  )
}
