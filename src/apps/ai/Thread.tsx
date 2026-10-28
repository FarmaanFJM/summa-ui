import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, Icon, IconButton, MenuButton } from '../../ui'
import { STARTERS, type Conv, type Msg } from './data'
import { CopyButton, Rich } from './Rich'

export type Actions = {
  regenerate: (msgId: string) => void
  resume: (msgId: string) => void
  edit: (msgId: string, text: string) => void
  send: (text: string) => void
}

function Controls({ m, a, onEdit }: { m: Msg; a: Actions; onEdit?: () => void }) {
  const text = m.role === 'assistant' ? m.text.slice(0, m.shown) : m.text
  const copy = () => { try { void navigator.clipboard?.writeText(text) } catch { /* ignore */ } }
  return (
    <div className="ai-ctl">
      <CopyButton text={text} className="ai-direct" />
      {m.role === 'assistant'
        ? <IconButton size="sm" icon="refresh" label="Regenerate" className="ai-direct" onClick={() => a.regenerate(m.id)} />
        : <IconButton size="sm" icon="pencil" label="Edit message" className="ai-direct" onClick={onEdit} />}
      <MenuButton size="sm" label="Message actions" placement="bottom-start" items={[
        { label: 'Copy', icon: 'copy', onSelect: copy },
        m.role === 'assistant'
          ? { label: 'Regenerate', icon: 'refresh', onSelect: () => a.regenerate(m.id) }
          : { label: 'Edit', icon: 'pencil', onSelect: () => onEdit?.() },
      ]} />
    </div>
  )
}

function EditBox({ m, a, close }: { m: Msg; a: Actions; close: () => void }) {
  const [v, setV] = useState(m.text)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fit = () => { const t = ref.current; if (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 260) + 'px' } }
  useLayoutEffect(() => { fit(); ref.current?.focus(); ref.current?.setSelectionRange(v.length, v.length) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const save = () => { if (v.trim()) { a.edit(m.id, v.trim()); close() } }
  return (
    <div className="ai-edit">
      <textarea ref={ref} value={v} rows={1} aria-label="Edit message" onChange={e => { setV(e.target.value); fit() }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save() }
          if (e.key === 'Escape') { e.stopPropagation(); close() }
        }} />
      <div className="ai-edit-bar">
        <Button variant="ghost" onClick={close}>Cancel</Button>
        <Button variant="primary" disabled={!v.trim()} onClick={save}>Save and resend</Button>
      </div>
    </div>
  )
}

const Message = memo(function Message({ m, a }: { m: Msg; a: Actions }) {
  const [editing, setEditing] = useState(false)
  if (m.role === 'user') {
    return (
      <div className="ai-msg user">
        {editing ? <EditBox m={m} a={a} close={() => setEditing(false)} /> : (
          <>
            <div className="ai-bubble">
              {m.files?.map(f => <div key={f} className="ai-bubble-file"><Icon name="paperclip" size={13} /><span className="truncate">{f}</span></div>)}
              {m.text}
            </div>
            <Controls m={m} a={a} onEdit={() => setEditing(true)} />
          </>
        )}
      </div>
    )
  }
  const busy = m.status === 'thinking' || m.status === 'streaming'
  const shown = m.text.slice(0, m.shown)
  return (
    <div className="ai-msg assistant" data-status={m.status}>
      {m.status === 'thinking'
        ? <div className="ai-thinking" role="status">Thinking<span className="ai-dots" aria-hidden="true"><i /><i /><i /></span></div>
        : <Rich text={shown} />}
      {m.status === 'stopped' && (
        <div className="ai-resume">
          {m.shown > 0 && <Button variant="secondary" icon="play" onClick={() => a.resume(m.id)}>Continue</Button>}
          <Button variant="ghost" icon="refresh" onClick={() => a.regenerate(m.id)}>Regenerate</Button>
        </div>
      )}
      {!busy && m.status !== 'stopped' && <Controls m={m} a={a} />}
    </div>
  )
})

function Skeleton() {
  return (
    <div className="ai-col ai-skel" aria-busy="true" aria-label="Loading conversation">
      <div className="skeleton ai-skel-user" />
      <div className="skeleton" style={{ width: '92%' }} />
      <div className="skeleton" style={{ width: '98%' }} />
      <div className="skeleton" style={{ width: '71%' }} />
      <div className="skeleton" style={{ width: '88%', marginTop: 14 }} />
      <div className="skeleton" style={{ width: '94%' }} />
      <div className="skeleton" style={{ width: '46%' }} />
    </div>
  )
}

export function Thread({ conv, loading, actions, scrollKey }: { conv: Conv | null; loading: boolean; actions: Actions; scrollKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const [atBottom, setAtBottom] = useState(true)

  const onScroll = useCallback(() => {
    const el = ref.current; if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    stick.current = near
    setAtBottom(p => (p === near ? p : near))
  }, [])

  useLayoutEffect(() => { stick.current = true; setAtBottom(true) }, [scrollKey])
  const msgs = conv?.messages
  const last = msgs?.[msgs.length - 1]
  const userJustSent = last?.role === 'assistant' && last.status === 'thinking'
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return
    if (userJustSent) stick.current = true
    if (stick.current) el.scrollTop = el.scrollHeight
  }, [msgs, loading, scrollKey, userJustSent])
  // content can grow after layout (fonts, images); follow it while stuck
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { if (stick.current) el.scrollTop = el.scrollHeight })
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [scrollKey, loading, !!msgs?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const toLatest = () => { const el = ref.current; if (!el) return; stick.current = true; el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) }

  return (
    <div className="ai-threadwrap">
      <div ref={ref} className="ai-thread scroll" onScroll={onScroll} role="log" aria-label="Conversation">
        {loading ? <Skeleton /> : !msgs?.length ? (
          <div className="ai-col ai-empty">
            <h1>Good afternoon, Farmaan</h1>
            <p className="muted">What would you like to work on?</p>
            <ul className="ai-starters">
              {STARTERS.map(s => (
                <li key={s.text}>
                  <button type="button" className="list-row" onClick={() => actions.send(s.text)}>
                    <Icon name={s.icon} size={16} />
                    <span className="grow">{s.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="ai-col">
            {msgs.map(m => <Message key={m.id} m={m} a={actions} />)}
          </div>
        )}
      </div>
      {!atBottom && !loading && (
        <button type="button" className="ai-latest" aria-label="Scroll to latest message" title="Scroll to latest" onClick={toLatest}>
          <Icon name="arrow-down" size={16} />
        </button>
      )}
    </div>
  )
}
