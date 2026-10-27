import './ai.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell, DrawerToggle, IconButton, useHotkey } from '../../ui'
import { NOW, SEED, pickReply, type Conv, type Msg } from './data'
import { Sidebar } from './Sidebar'
import { Thread, type Actions } from './Thread'
import { Composer } from './Composer'

const ARM_MS = 700
const nextWord = (s: string, from: number, n: number) => {
  let i = from
  for (let k = 0; k < n && i < s.length; k++) {
    while (i < s.length && /\s/.test(s[i])) i++
    while (i < s.length && !/\s/.test(s[i])) i++
  }
  return i
}

export default function AiApp() {
  const [convs, setConvs] = useState<Conv[]>(SEED)
  const [activeId, setActiveId] = useState<string | null>('c1')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('pro')
  const [gen, setGen] = useState<{ convId: string; msgId: string } | null>(null)
  const [arming, setArming] = useState(false)
  const [armKey, setArmKey] = useState(0)

  const genRef = useRef(gen)
  genRef.current = gen
  const armedAt = useRef(0)
  const timers = useRef<{ think?: number; tick?: number; arm?: number; load?: number }>({})
  const seq = useRef({ id: 100, bump: 0, salt: 0 })
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const patch = useCallback((convId: string, msgId: string, fn: (m: Msg) => Msg) => {
    setConvs(cs => cs.map(c => c.id !== convId ? c : { ...c, messages: c.messages.map(m => m.id === msgId ? fn(m) : m) }))
  }, [])

  const halt = useCallback(() => {
    const t = timers.current
    window.clearTimeout(t.think); window.clearInterval(t.tick); window.clearTimeout(t.arm)
    setArming(false)
  }, [])

  /** Stop programmatically (no arming guard): used when navigating away. */
  const forceStop = useCallback(() => {
    const g = genRef.current
    if (!g) return
    halt(); setGen(null)
    patch(g.convId, g.msgId, m => ({ ...m, status: 'stopped' }))
  }, [halt, patch])

  const run = useCallback((convId: string, msgId: string, full: string, from: number) => {
    halt()
    setGen({ convId, msgId })
    armedAt.current = performance.now()
    setArming(true); setArmKey(k => k + 1)
    timers.current.arm = window.setTimeout(() => setArming(false), ARM_MS)
    patch(convId, msgId, m => ({ ...m, status: from === 0 ? 'thinking' : 'streaming' }))
    let pos = from
    timers.current.think = window.setTimeout(() => {
      patch(convId, msgId, m => ({ ...m, status: 'streaming' }))
      timers.current.tick = window.setInterval(() => {
        pos = nextWord(full, pos, 1 + Math.floor(Math.random() * 2))
        const done = pos >= full.length
        patch(convId, msgId, m => ({ ...m, shown: done ? full.length : pos, status: done ? 'done' : 'streaming' }))
        if (done) { halt(); setGen(null) }
      }, 34)
    }, from === 0 ? 1000 : 150)
  }, [halt, patch])

  const stop = () => {
    if (!genRef.current) return
    if (performance.now() - armedAt.current < ARM_MS) return // double-click guard
    forceStop()
  }

  const newAssistant = (text: string): Msg => ({ id: 'm' + seq.current.id++, role: 'assistant', text, shown: 0, status: 'thinking' })

  const send = useCallback((text: string, files: string[] = []) => {
    const t = text.trim()
    if (!t || genRef.current) return
    const reply = pickReply(t, 0)
    const user: Msg = { id: 'm' + seq.current.id++, role: 'user', text: t, shown: t.length, status: 'done', files: files.length ? files : undefined }
    const asst = newAssistant(reply)
    const upd = NOW + (seq.current.bump += 60_000)
    let id = activeId
    if (!id) {
      id = 'c' + seq.current.id++
      const title = t.length > 42 ? t.slice(0, 40).trimEnd() + '…' : t
      setConvs(cs => [{ id: id!, title, pinned: false, updated: upd, messages: [user, asst] }, ...cs])
      setActiveId(id)
    } else {
      setConvs(cs => cs.map(c => c.id === id ? { ...c, updated: upd, messages: [...c.messages, user, asst] } : c))
    }
    run(id, asst.id, reply, 0)
  }, [activeId, run])

  const active = convs.find(c => c.id === activeId) ?? null
  const activeRef = useRef(active)
  activeRef.current = active

  const regenerate = (msgId: string) => {
    const c = activeRef.current
    if (!c || genRef.current) return
    const i = c.messages.findIndex(m => m.id === msgId)
    const prompt = [...c.messages.slice(0, i)].reverse().find(m => m.role === 'user')?.text ?? ''
    const reply = pickReply(prompt, ++seq.current.salt)
    setConvs(cs => cs.map(x => x.id !== c.id ? x : { ...x, messages: [...x.messages.slice(0, i), { ...x.messages[i], text: reply, shown: 0, status: 'thinking' as const }] }))
    run(c.id, msgId, reply, 0)
  }
  const resume = (msgId: string) => {
    const c = activeRef.current; if (!c || genRef.current) return
    const m = c.messages.find(x => x.id === msgId); if (!m) return
    run(c.id, msgId, m.text, m.shown)
  }
  const edit = (msgId: string, text: string) => {
    const c = activeRef.current; if (!c) return
    if (genRef.current) forceStop()
    const i = c.messages.findIndex(m => m.id === msgId)
    const reply = pickReply(text, 0)
    const asst = newAssistant(reply)
    setConvs(cs => cs.map(x => x.id !== c.id ? x : { ...x, messages: [...x.messages.slice(0, i), { ...x.messages[i], text, shown: text.length }, asst] }))
    run(c.id, asst.id, reply, 0)
  }

  const live = useRef({ regenerate, resume, edit, send })
  live.current = { regenerate, resume, edit, send }
  const actions: Actions = useMemo(() => ({
    regenerate: id => live.current.regenerate(id), resume: id => live.current.resume(id),
    edit: (id, t) => live.current.edit(id, t), send: t => live.current.send(t),
  }), [])

  const openConv = (id: string) => {
    if (id === activeId) return
    forceStop()
    setActiveId(id); setLoading(true)
    window.clearTimeout(timers.current.load)
    timers.current.load = window.setTimeout(() => { setLoading(false); inputRef.current?.focus() }, 520)
  }
  const newChat = useCallback(() => {
    forceStop(); window.clearTimeout(timers.current.load); setLoading(false)
    setActiveId(null); setQuery('')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [forceStop])

  const remove = (id: string) => {
    if (genRef.current?.convId === id) { halt(); setGen(null) }
    setConvs(cs => cs.filter(c => c.id !== id))
    if (id === activeId) setActiveId(null)
  }

  useHotkey('mod+k', e => { e.preventDefault(); const i = searchRef.current?.querySelector('input'); i?.focus(); i?.select() })
  useHotkey('mod+shift+o', e => { e.preventDefault(); newChat() }, [newChat])
  useEffect(() => () => { const t = timers.current; window.clearTimeout(t.think); window.clearInterval(t.tick); window.clearTimeout(t.arm); window.clearTimeout(t.load) }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const el = document.activeElement as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) el.blur()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  useEffect(() => { inputRef.current?.focus() }, [])

  const generating = !!gen && gen.convId === activeId

  return (
    <AppShell
      sidebar={
        <Sidebar convs={convs} activeId={activeId} query={query} onQuery={setQuery} searchRef={searchRef}
          onNew={newChat} onOpen={openConv} onRename={(id, t) => setConvs(cs => cs.map(c => c.id === id ? { ...c, title: t } : c))}
          onPin={id => setConvs(cs => cs.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c))} onDelete={remove} />
      }
    >
      <div className="ai-main">
        <header className="topbar">
          <DrawerToggle />
          <h1 className="ai-title truncate grow">{active?.title ?? 'New chat'}</h1>
          <IconButton className="mobile-only" icon="message-plus" label="New chat" onClick={newChat} />
        </header>
        <Thread conv={active} loading={loading} actions={actions} scrollKey={activeId ?? 'new'} />
        <Composer generating={generating} arming={arming} armKey={armKey} onSend={send} onStop={stop}
          model={model} onModel={setModel} inputRef={inputRef} />
      </div>
    </AppShell>
  )
}
