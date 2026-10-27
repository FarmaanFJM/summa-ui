import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '../../ui'
import { inCheck, kingSq, sqName, type Color, type Move, type State } from './engine'
import { Piece, PIECE_NAMES, pieceLabel } from './pieces'

type Props = {
  state: State
  legal: Move[]
  orientation: Color
  /** The board accepts moves from the side to move only when true. */
  canMove: boolean
  last?: Move | null
  hint?: number | null
  onMove: (m: Move) => void
  label: string
  small?: boolean
}

const FILES = 'abcdefgh'

export function Board({ state, legal, orientation, canMove, last, hint, onMove, label, small }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState<number | null>(null)
  const [cursor, setCursor] = useState<number>(() => (orientation === 1 ? 52 : 12))
  const [focused, setFocused] = useState(false)
  const [drag, setDrag] = useState<{ sq: number; x: number; y: number; size: number } | null>(null)
  const [promo, setPromo] = useState<Move[] | null>(null)
  const [say, setSay] = useState('')
  const press = useRef<{ sq: number; x: number; y: number; wasSel: boolean; mouse: boolean; active: boolean } | null>(null)

  // Any new position clears the selection.
  useEffect(() => { setSel(null); setPromo(null) }, [state])

  const targets = useMemo(() => (sel === null ? [] : legal.filter(m => m.from === sel)), [sel, legal])
  const targetSet = useMemo(() => new Set(targets.map(m => m.to)), [targets])
  const checkSq = useMemo(() => (inCheck(state) ? kingSq(state.b, state.turn) : -1), [state])
  const mine = useCallback((sq: number) => canMove && state.b[sq] !== 0 && (state.b[sq] > 0 ? 1 : -1) === state.turn && legal.some(m => m.from === sq), [canMove, state, legal])

  const toSq = (i: number) => (orientation === 1 ? i : 63 - i)
  const toIdx = (sq: number) => (orientation === 1 ? sq : 63 - sq)

  const attempt = useCallback((from: number, to: number) => {
    const ms = legal.filter(m => m.from === from && m.to === to)
    if (!ms.length) return false
    if (ms.length > 1) { setPromo(ms); return true }
    setSel(null)
    onMove(ms[0])
    return true
  }, [legal, onMove])

  const squareAt = (e: { clientX: number; clientY: number }) => {
    const r = grid.current!.getBoundingClientRect()
    const col = Math.floor(((e.clientX - r.left) / r.width) * 8), row = Math.floor(((e.clientY - r.top) / r.height) * 8)
    if (col < 0 || col > 7 || row < 0 || row > 7) return null
    return toSq(row * 8 + col)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || promo) return
    const sq = squareAt(e)
    if (sq === null) return
    setCursor(sq)
    if (sel !== null && targetSet.has(sq)) { attempt(sel, sq); return }
    if (mine(sq)) {
      press.current = { sq, x: e.clientX, y: e.clientY, wasSel: sel === sq, mouse: e.pointerType !== 'touch', active: false }
      setSel(sq)
      if (e.pointerType !== 'touch') grid.current!.setPointerCapture(e.pointerId)
    } else setSel(null)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current
    if (!p || !p.mouse) return
    if (!p.active && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 5) p.active = true
    if (p.active) setDrag({ sq: p.sq, x: e.clientX, y: e.clientY, size: grid.current!.getBoundingClientRect().width / 8 })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const p = press.current
    press.current = null
    if (!p) return
    if (p.active) {
      setDrag(null)
      const to = squareAt(e)
      if (to !== null && to !== p.sq) { if (!attempt(p.sq, to)) setSel(null) }
    } else if (p.wasSel) setSel(null)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (promo) return
    const dir: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (dir[e.key]) {
      e.preventDefault()
      const i = toIdx(cursor)
      const row = Math.min(7, Math.max(0, (i >> 3) + dir[e.key][0])), col = Math.min(7, Math.max(0, (i & 7) + dir[e.key][1]))
      const sq = toSq(row * 8 + col)
      setCursor(sq)
      const pc = state.b[sq]
      setSay(`${sqName(sq)}${pc ? ', ' + pieceLabel(pc) : ', empty'}${sel !== null && targetSet.has(sq) ? ', legal destination' : ''}`)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (sel !== null && targetSet.has(cursor)) { attempt(sel, cursor); setSay(`Moved to ${sqName(cursor)}`) }
      else if (mine(cursor)) { setSel(cursor); setSay(`Selected ${sqName(cursor)}, ${legal.filter(m => m.from === cursor).length} destinations`) }
      else if (sel !== null) { setSel(null); setSay('Selection cleared') }
    } else if (e.key === 'Escape' && sel !== null) { e.stopPropagation(); setSel(null); setSay('Selection cleared') }
  }

  const cells = []
  for (let i = 0; i < 64; i++) {
    const sq = toSq(i)
    const row = i >> 3, col = i & 7
    const dark = (row + col) & 1
    const pc = state.b[sq]
    const isTarget = targetSet.has(sq)
    const cls = ['cb-sq', dark ? 'dark' : 'light']
    if (last && (last.from === sq || last.to === sq)) cls.push('last')
    if (sel === sq) cls.push('sel')
    if (hint === sq) cls.push('hint')
    if (checkSq === sq) cls.push('check')
    if (focused && cursor === sq) cls.push('cursor')
    cells.push(
      <div key={i} className={cls.join(' ')} data-sq={sqName(sq)}>
        {col === 0 && <span className="cb-rank">{8 - (sq >> 3)}</span>}
        {row === 7 && <span className="cb-file">{FILES[sq & 7]}</span>}
        {pc !== 0 && <span className={`cb-piece ${drag?.sq === sq ? 'lifted' : ''}`}><Piece p={pc} /></span>}
        {isTarget && <span className={`cb-dot ${pc || legal.some(m => m.from === sel && m.to === sq && m.ep) ? 'cap' : ''}`} />}
      </div>,
    )
  }

  return (
    <div ref={root} className={`cb ${small ? 'small' : ''}`}>
      <div
        ref={grid} className="cb-grid" role="application" tabIndex={0} aria-label={`${label}. Arrow keys move the cursor, Enter selects a piece and places it.`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { press.current = null; setDrag(null) }}
        onKeyDown={onKeyDown} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      >
        {cells}
      </div>
      <div className="sr-only" aria-live="polite">{say}</div>
      {drag && (
        <div className="cb-ghost" style={{ left: drag.x - drag.size / 2, top: drag.y - drag.size / 2, width: drag.size, height: drag.size }}><Piece p={state.b[drag.sq]} /></div>
      )}
      <Dialog open={!!promo} onClose={() => setPromo(null)} title="Promote pawn to" width={360}>
        <div className="cb-promo">
          {promo?.slice().sort((a, b) => b.promo! - a.promo!).map((m, i) => (
            <button key={m.promo} type="button" className="cb-promo-opt" data-autofocus={i === 0 ? true : undefined} aria-label={PIECE_NAMES[m.promo!]}
              onClick={() => { const mv = m; setPromo(null); setSel(null); onMove(mv) }}>
              <Piece p={state.turn * m.promo!} />
              <span>{PIECE_NAMES[m.promo!][0].toUpperCase() + PIECE_NAMES[m.promo!].slice(1)}</span>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  )
}
