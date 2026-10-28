import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Icon } from '../../ui'
import { Board } from './Board'
import { bestDefence, mateIn } from './bot'
import { fromFEN, inCheck, legalMoves, makeMove, toSAN, type Color, type Move, type State } from './engine'

type PuzzleDef = { id: string; fen: string; n: number; rating: number; source: string }

/* Every position below is verified with the engine: the side to move has a forced mate in n. */
export const PUZZLES: PuzzleDef[] = [
  { id: 'p1', fen: 'r1b3rk/pp3p1p/3p4/3P2Q1/3P4/8/PP1P1KPb/R1B1R3 w - - 1 17', n: 2, rating: 1480, source: 'Club ladder, round 6' },
  { id: 'p2', fen: '6k1/pp3ppp/8/1p2r1B1/8/P7/P1PR1PPP/6K1 w - - 0 21', n: 2, rating: 1210, source: 'Tuesday rapid' },
  { id: 'p3', fen: 'r3kbnr/pp3ppp/2p5/3pPbB1/3P4/5N2/3KQPPP/1q5R b kq - 3 18', n: 2, rating: 1650, source: 'Spring Open' },
]

type Phase = 'play' | 'wrong' | 'solved'

const wins = (s: State, m: Move, n: number) => {
  const t = makeMove(s, m)
  const replies = legalMoves(t)
  if (!replies.length) return inCheck(t)
  return n > 1 && replies.every(r => mateIn(makeMove(t, r), n - 1))
}

export function PuzzleBoard() {
  const [idx, setIdx] = useState(0)
  const def = PUZZLES[idx]
  const start = useMemo(() => fromFEN(def.fen), [def])
  const user: Color = start.turn
  const [pos, setPos] = useState<State>(start)
  const [left, setLeft] = useState(def.n)
  const [last, setLast] = useState<Move | null>(null)
  const [phase, setPhase] = useState<Phase>('play')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [line, setLine] = useState<string[]>([])
  const timers = useRef<number[]>([])

  const reset = (i = idx) => {
    timers.current.forEach(clearTimeout); timers.current = []
    const s = fromFEN(PUZZLES[i].fen)
    setPos(s); setLeft(PUZZLES[i].n); setLast(null); setPhase('play'); setBusy(false); setHint(null); setMsg(''); setLine([])
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const legal = useMemo(() => legalMoves(pos), [pos])

  const onMove = (m: Move) => {
    setHint(null)
    const san = toSAN(pos, m, legal)
    if (!wins(pos, m, left)) {
      setPhase('wrong'); setMsg(`${san} does not force mate. Try again.`)
      const t = window.setTimeout(() => setPhase(p => (p === 'wrong' ? 'play' : p)), 1400)
      timers.current.push(t)
      return
    }
    const next = makeMove(pos, m)
    setPos(next); setLast(m); setPhase('play'); setLine(l => [...l, san])
    if (!legalMoves(next).length) { setPhase('solved'); setMsg('Checkmate. Puzzle solved.'); return }
    setBusy(true); setMsg('Correct. Black replies.'.replace('Black', user === 1 ? 'Black' : 'White'))
    const t = window.setTimeout(() => {
      const r = bestDefence(next, left - 1)
      if (!r) return
      const after = makeMove(next, r)
      setPos(after); setLast(r); setLeft(left - 1); setBusy(false); setLine(l => [...l, toSAN(next, r)])
      setMsg('Find the mating move.')
    }, 750)
    timers.current.push(t)
  }

  const showHint = () => {
    const m = legal.find(x => wins(pos, x, left))
    if (m) { setHint(m.from); setMsg('Look at the highlighted piece.') }
  }

  const label = `${user === 1 ? 'White' : 'Black'} to play, mate in ${def.n}`

  return (
    <div className="cc-puzzle">
      <div className="cc-puzzle-board">
        <Board state={pos} legal={legal} orientation={user} canMove={phase !== 'solved' && !busy && pos.turn === user} last={last} hint={hint} onMove={onMove} label="Puzzle board" small />
      </div>
      <div className="cc-puzzle-info">
        <div className="eyebrow">Puzzle of the day</div>
        <h3 className="cc-h3">{label}</h3>
        <p className="muted num">Rated {def.rating}. {def.source}.</p>
        <div className={`cc-puzzle-status ${phase}`} role="status" aria-live="polite">
          {phase === 'solved' && <Icon name="circle-check" size={16} />}
          {phase === 'wrong' && <Icon name="circle-x" size={16} />}
          <span>{msg || 'Your move.'}</span>
        </div>
        {line.length > 0 && <p className="cc-puzzle-line num">{line.join('  ')}</p>}
        <div className="cc-puzzle-actions">
          {phase === 'solved'
            ? <Button onClick={() => { const i = (idx + 1) % PUZZLES.length; setIdx(i); reset(i) }} icon="arrow-right">Next puzzle</Button>
            : <Button onClick={showHint} icon="sparkle" disabled={busy}>Hint</Button>}
          <Button variant="ghost" onClick={() => reset()} icon="refresh">Reset</Button>
          {phase !== 'solved' && <Button variant="ghost" onClick={() => { const i = (idx + 1) % PUZZLES.length; setIdx(i); reset(i) }}>Skip</Button>}
        </div>
      </div>
    </div>
  )
}
