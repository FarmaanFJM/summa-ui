import { useEffect, useRef, useState } from 'react'
import { Button } from '../../ui'
import { SI, SIB } from './icons'
import { Face } from './Post'
import { Scene, type Media, type Motif, type PalKey } from './art'
import { useSocial, type Draft } from './state'

const MAX = 280
const GALLERY: Media[] = (['sea', 'dunes', 'peaks', 'forest', 'dusk', 'tide', 'arch', 'tiles'] as Motif[]).map((m, i) => ({ m, s: 200 + i * 13, p: (['tide', 'ember', 'glacier', 'moss', 'plum', 'ochre', 'bone', 'plum'] as PalKey[])[i] }))

export function Composer({ draft, onDone, dialog }: { draft?: Draft; onDone?: () => void; dialog?: boolean }) {
  const { me, createPost, byId } = useSocial()
  const [text, setText] = useState(draft?.text ?? '')
  const [media, setMedia] = useState<Media[]>([])
  const [poll, setPoll] = useState<string[] | null>(null)
  const ta = useRef<HTMLTextAreaElement>(null)
  const quoted = draft?.quote ? byId(draft.quote) : undefined
  useEffect(() => { const el = ta.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 260) + 'px' } }, [text])
  useEffect(() => { if (dialog) ta.current?.focus() }, [dialog])

  const left = MAX - text.length
  const pollOk = !poll || poll.filter(o => o.trim()).length >= 2
  const can = (text.trim().length > 0 || media.length > 0 || !!draft?.quote) && left >= 0 && pollOk && (!poll || text.trim().length > 0)
  const submit = () => {
    if (!can) return
    createPost({ text: text.trim(), media: media.length ? media : undefined, poll: poll ? poll.filter(o => o.trim()).map(o => o.trim()) : undefined, quote: draft?.quote })
    setText(''); setMedia([]); setPoll(null); onDone?.()
  }
  const attach = () => setMedia(m => (m.length >= 4 ? m : [...m, GALLERY[(m.length * 3 + Math.floor(Math.random() * 3)) % GALLERY.length]]))

  return (
    <div className="so-composer" data-dialog={dialog ? 'true' : undefined}>
      <Face u={me} size={40} />
      <div className="so-comp-main">
        <textarea ref={ta} className="so-comp-input" rows={dialog ? 3 : 1} value={text} placeholder={draft?.quote ? 'Add a comment' : 'What is washing up on your shore?'} aria-label="Post text"
          onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } }} />
        {media.length > 0 && (
          <div className="so-comp-media" data-n={media.length}>
            {media.map((m, i) => (
              <div key={i} className="so-media-cell"><Scene {...m} />
                <button type="button" className="so-remove" aria-label={`Remove image ${i + 1}`} onClick={() => setMedia(a => a.filter((_, j) => j !== i))}><SI name="x" size={14} /></button>
              </div>
            ))}
          </div>
        )}
        {poll && (
          <div className="so-comp-poll">
            {poll.map((o, i) => (
              <div key={i} className="row" style={{ gap: 6 }}>
                <input className="input" value={o} maxLength={40} placeholder={`Choice ${i + 1}`} aria-label={`Poll choice ${i + 1}`} onChange={e => setPoll(p => p!.map((x, j) => (j === i ? e.target.value : x)))} />
                {poll.length > 2 && <SIB icon="x" label={`Remove choice ${i + 1}`} size="sm" onClick={() => setPoll(p => p!.filter((_, j) => j !== i))} />}
              </div>
            ))}
            <div className="row">
              {poll.length < 4 && <Button variant="ghost" icon="plus" onClick={() => setPoll(p => [...p!, ''])}>Add choice</Button>}
              <span className="grow" />
              <Button variant="ghost" onClick={() => setPoll(null)}>Remove poll</Button>
            </div>
          </div>
        )}
        {quoted && <div className="so-quote static"><strong>{quoted.by}</strong><span className="so-clamp3">{quoted.text}</span></div>}
        <div className="so-comp-bar">
          <SIB icon="image" label="Attach image" disabled={media.length >= 4 || !!poll} onClick={attach} />
          <SIB icon="bar-chart" label="Add poll" on={!!poll} disabled={media.length > 0 || !!draft?.quote} onClick={() => setPoll(p => (p ? null : ['', '']))} />
          <span className="grow" />
          <span className={`num so-count ${left < 0 ? 'over' : left <= 20 ? 'near' : ''}`} aria-live="polite" aria-label={`${left} characters left`}>{left}</span>
          <button type="button" className="so-submit" disabled={!can} onClick={submit}>Post</button>
        </div>
      </div>
    </div>
  )
}
