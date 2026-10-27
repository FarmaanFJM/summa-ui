import { useEffect, useId, type ReactNode } from 'react'
import { Icon, IconButton } from '../../ui'
import { Art } from './art'
import { breakdown, cheapestRoom, destById, money, ratingWord, type Query, type Stay } from './data'
import { go, useTravel } from './store'
import { qToString } from './data'

export const stayHref = (s: Stay, q: Query) => `/stay/${s.id}?${qToString(q)}`

export function Heart({ id, name }: { id: string; name: string }) {
  const { saved, toggleSave } = useTravel()
  const on = saved.includes(id)
  return (
    <IconButton icon="heart" label={on ? `Remove ${name} from saved` : `Save ${name}`} className={`tv-heart ${on ? 'on' : ''}`} aria-pressed={on}
      onClick={e => { e.stopPropagation(); toggleSave(id) }} />
  )
}

export function Rating({ s, long }: { s: Stay; long?: boolean }) {
  return (
    <span className="tv-rating">
      <span className="tv-score num">{s.rating.toFixed(1)}</span>
      <span>{ratingWord(s.rating)}</span>
      <span className="faint num">{long ? `${s.reviews.toLocaleString('en-GB')} reviews` : `(${s.reviews.toLocaleString('en-GB')})`}</span>
    </span>
  )
}

export function StayImage({ s, variant = (s.seed % 2) * 2, className }: { s: Stay; variant?: number; className?: string }) {
  const d = destById(s.dest)!
  return <div className={className}><Art motif={variant === 1 ? 'room' : variant === 3 ? 'detail' : d.motif} pal={d.pal} seed={s.seed} variant={variant} label={`${s.name}, photo ${variant + 1}`} /></div>
}

/** Compact vertical card for landing rows. */
export function StayTile({ s, q }: { s: Stay; q: Query }) {
  const { cur } = useTravel()
  const d = destById(s.dest)!
  const room = cheapestRoom(s, q)
  return (
    <article className="tv-tile">
      <button type="button" className="tv-tile-main" onClick={() => go(stayHref(s, { ...q, dest: s.dest }))} aria-label={`${s.name}, ${d.name}`}>
        <StayImage s={s} className="tv-tile-img" />
        <div className="tv-tile-body">
          <div className="tv-tile-name truncate">{s.name}</div>
          <div className="muted truncate">{s.area}, {d.name}</div>
          <Rating s={s} />
          <div className="tv-tile-price"><span className="num tv-strong">{money(breakdown(s, room, q).perNight, cur)}</span> <span className="muted">night</span></div>
        </div>
      </button>
      <Heart id={s.id} name={s.name} />
    </article>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (p: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId()
  const msg = error || hint
  return (
    <div className="tv-fld">
      <label htmlFor={id} className="tv-label">{label}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': msg ? id + '-m' : undefined })}
      {msg && <div id={id + '-m'} className={`tv-fld-msg ${error ? 'err' : ''}`} role={error ? 'alert' : undefined}>{msg}</div>}
    </div>
  )
}

/** Bottom sheet for mobile filters. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <>
      <div className="tv-scrim" onClick={onClose} />
      <div className="tv-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="tv-sheet-head"><h2 className="tv-h3">{title}</h2><IconButton icon="x" label="Close" onClick={onClose} /></div>
        <div className="tv-sheet-body scroll">{children}</div>
        {footer && <div className="tv-sheet-foot">{footer}</div>}
      </div>
    </>
  )
}

export function Stars({ n }: { n: number }) {
  return <span className="tv-stars" aria-label={`${n} stars`}>{Array.from({ length: n }, (_, i) => <Icon key={i} name="star" size={12} fill />)}</span>
}

