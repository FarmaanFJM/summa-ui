import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SI } from './icons'
import { Scene } from './art'
import { useSocial } from './state'

export function Viewer() {
  const { viewer, openViewer, closeViewer } = useSocial()
  const ref = useRef<HTMLDivElement>(null)
  const open = !!viewer
  const n = viewer?.media.length ?? 0, i = viewer?.i ?? 0
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('[data-close]')?.focus()
    return () => prev?.focus()
  }, [open])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeViewer() }
      if (e.key === 'ArrowRight' && n > 1) openViewer(viewer!.media, (i + 1) % n)
      if (e.key === 'ArrowLeft' && n > 1) openViewer(viewer!.media, (i - 1 + n) % n)
      if (e.key === 'Tab') {
        const f = Array.from(ref.current!.querySelectorAll<HTMLElement>('button'))
        const a = document.activeElement as HTMLElement
        if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus() } else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    document.addEventListener('keydown', k, true)
    return () => document.removeEventListener('keydown', k, true)
  })
  if (!viewer) return null
  return createPortal(
    <div ref={ref} className="so-viewer" role="dialog" aria-modal="true" aria-label={`Image ${i + 1} of ${n}`} onMouseDown={e => { if (e.target === e.currentTarget) closeViewer() }}>
      <button type="button" data-close className="so-vbtn so-vclose" aria-label="Close viewer" onClick={closeViewer}><SI name="x" size={20} /></button>
      <div className="so-vstage" onMouseDown={e => { if (e.target === e.currentTarget) closeViewer() }}>
        {n > 1 && <button type="button" className="so-vbtn so-vprev" aria-label="Previous image" onClick={() => openViewer(viewer.media, (i - 1 + n) % n)}><SI name="chevron-left" size={22} /></button>}
        <div className="so-vimg"><Scene {...viewer.media[i]} /></div>
        {n > 1 && <button type="button" className="so-vbtn so-vnext" aria-label="Next image" onClick={() => openViewer(viewer.media, (i + 1) % n)}><SI name="chevron-right" size={22} /></button>}
      </div>
      {n > 1 && <div className="so-vcount num" aria-hidden="true">{i + 1} / {n}</div>}
    </div>,
    document.body,
  )
}
