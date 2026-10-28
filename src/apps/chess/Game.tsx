import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, Dropdown, Icon, Tabs } from '../../ui'
import { Board } from './Board'
import { botAssessment, LEVELS, type Level } from './bot'
import { requestBotMove } from './botClient'
import { inCheck, legalMoves, makeMove, outcome, posKey, startState, toSAN, VALUE, type Color, type Move, type State } from './engine'
import { Piece } from './pieces'

type Over = { result: '1-0' | '0-1' | '1/2-1/2'; reason: string }
type Game = { states: State[]; moves: Move[]; sans: string[]; keys: string[]; over: Over | null }
type Pref = 'white' | 'black' | 'random'

const fresh = (): Game => { const s = startState(); return { states: [s], moves: [], sans: [], keys: [posKey(s)], over: null } }
const apply = (g: Game, m: Move): Game => {
  const s = g.states[g.states.length - 1]
  const san = toSAN(s, m)
  const n = makeMove(s, m)
  const keys = [...g.keys, posKey(n)]
  const o = outcome(n, keys)
  return { states: [...g.states, n], moves: [...g.moves, m], sans: [...g.sans, san], keys, over: o.over ? { result: o.result, reason: o.reason } : null }
}

const TC = [{ value: '10', label: '10 minutes' }, { value: '5', label: '5 minutes' }, { value: '3', label: '3 minutes' }, { value: '0', label: 'Untimed' }]
const COLOURS = [{ value: 'white', label: 'White' }, { value: 'black', label: 'Black' }, { value: 'random', label: 'Random' }]
const fmt = (ms: number) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
const ORDER = [5, 4, 3, 2, 1]

function Captured({ pieces, diff }: { pieces: number[]; diff: number }) {
  const sorted = [...pieces].sort((a, b) => ORDER.indexOf(Math.abs(a)) - ORDER.indexOf(Math.abs(b)))
  return (
    <span className="cc-captured" aria-label={`Captured ${sorted.length} pieces`}>
      {sorted.map((p, i) => <span key={i} className="cc-cap"><Piece p={p} /></span>)}
      {diff > 0 && <span className="cc-diff num">+{diff}</span>}
    </span>
  )
}

function Strip({ name, rating, color, captured, diff, clock, active, timed }: { name: string; rating: number | null; color: Color; captured: number[]; diff: number; clock: number; active: boolean; timed: boolean }) {
  return (
    <div className="cc-strip">
      <div className="cc-strip-name">
        <span className="truncate">{name}</span>
        {rating !== null && <span className="faint num">{rating}</span>}
        <span className="faint">{color === 1 ? 'White' : 'Black'}</span>
      </div>
      <Captured pieces={captured} diff={diff} />
      {timed && <span className={`cc-clock num ${active ? 'on' : ''}`} role="timer" aria-label={`${color === 1 ? 'White' : 'Black'} clock`}>{fmt(clock)}</span>}
    </div>
  )
}

export function HeroGame() {
  const [g, setG] = useState<Game>(fresh)
  const [me, setMe] = useState<Color>(1)
  const [flipped, setFlipped] = useState(false)
  const [level, setLevel] = useState<Level>('medium')
  const [pref, setPref] = useState<Pref>('white')
  const [tc, setTc] = useState('10')
  const [clock, setClock] = useState<{ w: number; b: number }>({ w: 600000, b: 600000 })
  const [thinking, setThinking] = useState(false)
  const [notice, setNotice] = useState('')
  const [overOpen, setOverOpen] = useState(false)
  const [confirm, setConfirm] = useState<null | { kind: 'resign' } | { kind: 'new'; pref: Pref; tc: string }>(null)
  const lastOffer = useRef(-99)
  const listRef = useRef<HTMLDivElement>(null)

  const cur = g.states[g.states.length - 1]
  const legal = useMemo(() => legalMoves(cur), [cur])
  const last = g.moves[g.moves.length - 1] ?? null
  const bot = LEVELS[level]
  const timed = tc !== '0'
  const orientation: Color = flipped ? (-me as Color) : me

  const start = useCallback((p: Pref, minutes: string) => {
    const c: Color = p === 'random' ? (Math.random() < 0.5 ? 1 : -1) : p === 'white' ? 1 : -1
    setMe(c); setG(fresh()); setFlipped(false); setThinking(false); setNotice(''); setOverOpen(false)
    const ms = Number(minutes) * 60000
    setClock({ w: ms, b: ms })
    lastOffer.current = -99
  }, [])

  // Bot replies
  useEffect(() => {
    if (g.over || cur.turn === me) { setThinking(false); return }
    setThinking(true)
    const cancel = requestBotMove(cur, level, 450 + Math.random() * 450, m => { setThinking(false); if (m) setG(p => apply(p, m)) })
    return cancel
  }, [g, cur, me, level])

  // Clocks
  const running = timed && g.moves.length > 0 && !g.over
  const clockRef = useRef(clock)
  clockRef.current = clock
  useEffect(() => {
    if (!running) return
    let prev = Date.now()
    const side = cur.turn === 1 ? 'w' : 'b'
    const id = setInterval(() => {
      const now = Date.now(), dt = now - prev
      prev = now
      const left = clockRef.current[side] - dt
      clockRef.current = { ...clockRef.current, [side]: Math.max(0, left) }
      setClock(clockRef.current)
      if (left <= 0) setG(p => p.over ? p : { ...p, over: { result: side === 'w' ? '0-1' : '1-0', reason: 'timeout' } })
    }, 200)
    return () => clearInterval(id)
  }, [running, cur.turn])

  useEffect(() => { if (g.over) setOverOpen(true) }, [g.over])
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [g.sans.length])
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(t) }, [notice])

  const onUserMove = useCallback((m: Move) => setG(p => apply(p, m)), [])

  const undo = () => {
    const n = g.states.length - 1
    if (!n) return
    let k = cur.turn === me ? 2 : 1
    if (k > n) k = n
    setG(p => ({ states: p.states.slice(0, p.states.length - k), moves: p.moves.slice(0, -k), sans: p.sans.slice(0, -k), keys: p.keys.slice(0, -k), over: null }))
    setOverOpen(false)
  }
  const resign = () => {
    setConfirm(null)
    setG(p => ({ ...p, over: { result: me === 1 ? '0-1' : '1-0', reason: 'resign' } }))
  }
  const offerDraw = () => {
    const ply = g.moves.length
    if (ply - lastOffer.current < 8) { setNotice('Draw declined. Try again in a few moves.'); return }
    lastOffer.current = ply
    const botColor = (-me) as Color
    const edge = botAssessment(cur, botColor)
    const late = ply >= 60
    if (edge <= -40 || (late && edge <= 40)) setG(p => ({ ...p, over: { result: '1/2-1/2', reason: 'agreement' } }))
    else setNotice('Draw declined.')
  }
  const requestNew = (p: Pref, minutes: string) => {
    if (g.moves.length > 1 && !g.over) setConfirm({ kind: 'new', pref: p, tc: minutes })
    else { setPref(p); setTc(minutes); start(p, minutes) }
  }

  // Captured pieces and material
  const caps = useMemo(() => {
    const w: number[] = [], b: number[] = []
    for (const m of g.moves) if (m.cap) (m.cap < 0 ? w : b).push(m.cap)
    const sum = (a: number[]) => a.reduce((x, p) => x + VALUE[Math.abs(p)], 0)
    return { w, b, diff: sum(w) - sum(b) }
  }, [g.moves])

  const rows = useMemo(() => {
    const out: { n: number; w?: string; b?: string; wi: number; bi: number }[] = []
    g.sans.forEach((s, i) => {
      if (i % 2 === 0) out.push({ n: i / 2 + 1, w: s, wi: i, bi: -1 })
      else out[out.length - 1].b = s, out[out.length - 1].bi = i
    })
    return out
  }, [g.sans])

  const status = g.over ? summary(g.over, me, bot.name).title
    : thinking ? `${bot.name} is thinking`
    : cur.turn === me ? (inCheck(cur) ? 'Your move, you are in check' : 'Your move')
    : 'Opponent to move'

  const topColor = (-orientation) as Color, botColor = orientation
  const strip = (color: Color) => (
    <Strip
      name={color === me ? 'You' : `${bot.name} (bot)`} rating={color === me ? 1284 : bot.rating} color={color}
      captured={color === 1 ? caps.w : caps.b} diff={color === 1 ? Math.max(0, caps.diff) : Math.max(0, -caps.diff)}
      clock={color === 1 ? clock.w : clock.b} active={running && cur.turn === color} timed={timed}
    />
  )

  return (
    <>
      <div className="cc-board-col">
        {strip(topColor)}
        <Board state={cur} legal={legal} orientation={orientation} canMove={!g.over && cur.turn === me} last={last} onMove={onUserMove} label="Chessboard" />
        {strip(botColor)}
      </div>

      <aside className="cc-panel" aria-label="Game panel">
        <div className="cc-panel-head">
          <div className="eyebrow">Opponent</div>
          <Tabs label="Bot level" value={level} onChange={setLevel} items={(Object.keys(LEVELS) as Level[]).map(l => ({ value: l, label: LEVELS[l].label }))} />
          <div className="cc-panel-opts">
            <Dropdown<Pref> label="Play as" value={pref} options={COLOURS as { value: Pref; label: string }[]} onChange={v => requestNew(v, tc)} width={160}
              renderValue={s => <><span className="faint">Play as</span><span>{s[0]?.label}</span></>} />
            <Dropdown label="Clock" value={tc} options={TC} onChange={v => requestNew(pref, v)} width={160}
              renderValue={s => <><Icon name="clock" size={14} /><span>{s[0]?.label}</span></>} />
          </div>
        </div>

        <div className="cc-status" role="status" aria-live="polite">
          {thinking && !g.over && <span className="spinner" aria-hidden="true" />}
          <span>{notice || status}</span>
        </div>

        <div className="cc-moves scroll" ref={listRef} role="list" aria-label="Moves">
          {rows.length === 0 && <div className="cc-moves-empty faint">Moves appear here.</div>}
          {rows.map(r => (
            <div key={r.n} className="cc-move-row" role="listitem">
              <span className="faint num">{r.n}.</span>
              <span className={r.wi === g.sans.length - 1 ? 'cur' : ''}>{r.w}</span>
              <span className={r.bi === g.sans.length - 1 ? 'cur' : ''}>{r.b}</span>
            </div>
          ))}
        </div>

        <div className="cc-actions">
          <Button icon="plus" onClick={() => requestNew(pref, tc)}>New game</Button>
          <Button icon="skip-back" onClick={undo} disabled={g.moves.length === 0}>Undo</Button>
          <Button icon="refresh" onClick={() => setFlipped(f => !f)} aria-pressed={flipped}>Flip</Button>
          <Button onClick={offerDraw} disabled={!!g.over || g.moves.length < 2}>Offer draw</Button>
          <Button variant="danger" icon="flag" onClick={() => setConfirm({ kind: 'resign' })} disabled={!!g.over || g.moves.length < 1} className="cc-resign">Resign</Button>
        </div>
      </aside>

      <Dialog
        open={overOpen && !!g.over} onClose={() => setOverOpen(false)} title={g.over ? summary(g.over, me, bot.name).title : ''} width={400}
        footer={<><Button variant="ghost" onClick={() => setOverOpen(false)}>Review board</Button><Button variant="primary" data-autofocus onClick={() => start(pref, tc)}>New game</Button></>}
      >
        <p className="muted cc-dialog-p">{g.over ? summary(g.over, me, bot.name).detail : ''}</p>
        <p className="faint cc-dialog-p num">{g.sans.length ? `${Math.ceil(g.sans.length / 2)} ${Math.ceil(g.sans.length / 2) === 1 ? "move" : "moves"} played` : ''}</p>
      </Dialog>

      <Dialog
        open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.kind === 'resign' ? 'Resign this game?' : 'Start a new game?'} width={400}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            {confirm?.kind === 'resign'
              ? <Button variant="danger" icon="flag" data-autofocus onClick={resign}>Resign game</Button>
              : <Button variant="secondary" data-autofocus onClick={() => { const c = confirm!; if (c.kind === 'new') { setPref(c.pref); setTc(c.tc); start(c.pref, c.tc) }; setConfirm(null) }}>New game</Button>}
          </>
        }
      >
        <p className="muted cc-dialog-p">{confirm?.kind === 'resign' ? 'The game will be recorded as a loss.' : 'The current game will be abandoned.'}</p>
      </Dialog>
    </>
  )
}

function summary(o: Over, me: Color, bot: string): { title: string; detail: string } {
  const won = (o.result === '1-0' && me === 1) || (o.result === '0-1' && me === -1)
  const draw = o.result === '1/2-1/2'
  const title = draw ? 'Draw' : won ? 'You won' : 'You lost'
  const reason: Record<string, string> = {
    checkmate: draw ? '' : `Checkmate. ${won ? 'You win' : `${bot} wins`}.`,
    resign: 'You resigned the game.',
    timeout: won ? `${bot} ran out of time.` : 'You ran out of time.',
    stalemate: 'Stalemate. The side to move has no legal move and is not in check.',
    insufficient: 'Neither side has enough material to deliver checkmate.',
    fifty: 'Fifty moves passed without a capture or a pawn move.',
    threefold: 'The same position occurred three times.',
    agreement: `${bot} accepted your draw offer.`,
  }
  return { title, detail: reason[o.reason] ?? '' }
}
