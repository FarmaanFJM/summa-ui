import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import { Dropdown, Icon, IconButton } from '../../ui'
import { MODELS } from './data'

type Props = {
  generating: boolean; arming: boolean; armKey: number
  onSend: (text: string, files: string[]) => void; onStop: () => void
  model: string; onModel: (m: string) => void
  inputRef: Ref<HTMLTextAreaElement>
}

export function Composer({ generating, arming, armKey, onSend, onStop, model, onModel, inputRef }: Props) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const ta = useRef<HTMLTextAreaElement | null>(null)
  const pick = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    const t = ta.current; if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 220) + 'px'
  }, [text])

  const canSend = text.trim().length > 0
  const submit = () => {
    if (generating || !canSend) return
    onSend(text.trim(), files); setText(''); setFiles([])
  }
  const setRefs = (el: HTMLTextAreaElement | null) => {
    ta.current = el
    if (typeof inputRef === 'function') inputRef(el)
    else if (inputRef) (inputRef as { current: HTMLTextAreaElement | null }).current = el
  }

  return (
    <div className="ai-dock">
      <form className="ai-composer" onSubmit={e => { e.preventDefault(); submit() }} onClick={e => { if (e.target === e.currentTarget) ta.current?.focus() }}>
        {files.length > 0 && (
          <div className="ai-files">
            {files.map(f => (
              <span key={f} className="ai-file">
                <Icon name="paperclip" size={13} /><span className="truncate">{f}</span>
                <button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles(fs => fs.filter(x => x !== f))}><Icon name="x" size={13} /></button>
              </span>
            ))}
          </div>
        )}
        <textarea ref={setRefs} rows={1} value={text} placeholder="Message Atlas" aria-label="Message" enterKeyHint="send"
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() }
          }} />
        <div className="ai-bar">
          <input ref={pick} type="file" multiple hidden onChange={e => { setFiles(fs => [...fs, ...Array.from(e.target.files ?? []).map(f => f.name)]); e.target.value = '' }} />
          <IconButton icon="paperclip" label="Attach files" onClick={() => pick.current?.click()} />
          <Dropdown quiet label="Model" value={model} onChange={onModel} options={MODELS} width={240} />
          <span className="grow" />
          {generating ? (
            <button key="stop" type="button" className="ai-send" data-arming={arming || undefined} aria-label="Stop generating" title="Stop generating"
              aria-disabled={arming || undefined} onClick={onStop}>
              {arming && (
                <svg key={armKey} className="ai-ring" viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="17" pathLength={100} /></svg>
              )}
              <Icon name="stop" size={14} />
            </button>
          ) : (
            <button key="send" type="submit" className="ai-send" disabled={!canSend} aria-label="Send message" title="Send message">
              <Icon name="arrow-up" size={17} strokeWidth={2.25} />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
