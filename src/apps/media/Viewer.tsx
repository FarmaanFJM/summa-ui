import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Dropdown, Icon, IconButton } from '../../ui'
import { Art } from './art'
import { details, fmtTime, type Asset, type Collection } from './data'

type Props = {
  asset: Asset; index: number; total: number; collections: Collection[]; playingId: string | null; playing: boolean
  onClose: () => void; onStep: (d: 1 | -1) => void; onFav: () => void; onPlay: () => void
  onCollections: (ids: string[]) => void; onCreateCollection: (name: string) => string
}

const typing = (t: EventTarget | null) => ['INPUT', 'TEXTAREA'].includes((t as HTMLElement | null)?.tagName ?? '')
const KIND = { photo: 'Photograph', music: 'Track', film: 'Film still · trailer' } as const

export function Viewer({ asset: a, index, total, collections, playingId, playing, onClose, onStep, onFav, onPlay, onCollections, onCreateCollection }: Props) {
  const [info, setInfo] = useState(() => window.innerWidth > 820)
  const root = useRef<HTMLDivElement>(null)
  const live = playingId === a.id && playing
  const playable = a.kind !== 'photo'

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    root.current?.focus()
    return () => prev?.focus?.()
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (typing(e.target) || document.querySelector('.popover')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); onStep(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onStep(-1) }
      else if (e.key === 'i') setInfo(v => !v)
      else if (e.key === 'Tab' && root.current) {
        const f = Array.from(root.current.querySelectorAll<HTMLElement>('button:not(:disabled),input,[tabindex]:not([tabindex="-1"])'))
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose, onStep])

  const named = collections.map(c => ({ value: c.id, label: c.name }))
  return createPortal(
    <div ref={root} className="md-viewer" role="dialog" aria-modal="true" aria-label={a.title} tabIndex={-1} data-info={info}>
      <header className="md-v-top">
        <div className="md-v-title"><span className="truncate">{a.title}</span><span className="truncate muted">{a.by}</span></div>
        <IconButton icon="heart" label={a.fav ? 'Remove from favorites' : 'Add to favorites'} on={a.fav} aria-pressed={a.fav} onClick={onFav} />
        <IconButton icon="info" label="Details" on={info} aria-pressed={info} onClick={() => setInfo(v => !v)} />
        <IconButton icon="x" label="Close viewer" onClick={onClose} />
      </header>
      <div className="md-v-body">
        <div className="md-v-stage" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
          <IconButton icon="chevron-left" label="Previous" className="md-v-nav prev" onClick={() => onStep(-1)} />
          <figure className={`md-v-fig ${live ? 'live' : ''}`} style={{ ['--r' as string]: a.ratio }}>
            <Art key={a.id} motif={a.motif} pal={a.pal} seed={a.seed} ratio={a.ratio} vignette={a.kind === 'film'} />
            {playable && (
              <button type="button" className="md-v-play" aria-label={live ? `Pause ${a.title}` : `Play ${a.title}`} onClick={onPlay}>
                <Icon name={live ? 'pause' : 'play'} size={22} />
              </button>
            )}
          </figure>
          <IconButton icon="chevron-right" label="Next" className="md-v-nav next" onClick={() => onStep(1)} />
          <span className="md-v-count num faint">{index + 1} / {total}</span>
        </div>
        {info && (
          <aside className="md-v-info" aria-label="Details">
            <div className="col" style={{ gap: 2 }}>
              <h2 className="md-v-h">{a.title}</h2>
              <p className="muted">{a.by} · {a.year}</p>
            </div>
            <div className="col" style={{ gap: 8 }}>
              <span className="eyebrow">Collections</span>
              <Dropdown multiple searchable label="Collections" createNoun="collection" placeholder="Add to collection" options={named} value={a.cols}
                onChange={onCollections} onCreate={onCreateCollection} />
            </div>
            {playable && <Button variant="primary" icon={live ? 'pause' : 'play'} onClick={onPlay}>{live ? 'Pause' : a.kind === 'film' ? 'Play trailer' : 'Play'} <span className="num" style={{ opacity: 0.7 }}>{fmtTime(a.dur)}</span></Button>}
            <dl className="md-v-dl">
              <div className="md-v-kv"><dt className="eyebrow">Type</dt><dd>{KIND[a.kind]}</dd></div>
              {details(a).map(([k, v]) => <div key={k} className="md-v-kv"><dt className="eyebrow">{k}</dt><dd>{v}</dd></div>)}
              <div className="md-v-kv"><dt className="eyebrow">Added</dt><dd>{a.added === 1 ? 'Yesterday' : `${a.added} days ago`}</dd></div>
            </dl>
          </aside>
        )}
      </div>
    </div>,
    document.body,
  )
}
