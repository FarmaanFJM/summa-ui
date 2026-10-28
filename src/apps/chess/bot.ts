import { B, K, N, P, Q, R, VALUE, attacked, inCheck, kingSq, legalMoves, makeMove, type Color, type Move, type State } from './engine'

/* Piece-square tables, white's point of view, index 0 = a8. */
const PST: Record<number, number[]> = {
  [P]: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  [N]: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  [B]: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  [R]: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  [Q]: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  [K]: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
}
const KING_END = [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]

/** Static evaluation in centipawns from the side to move's point of view. */
export function evaluate(s: State): number {
  let score = 0, material = 0
  for (let i = 0; i < 64; i++) { const t = Math.abs(s.b[i]); if (t && t !== K && t !== P) material += VALUE[t] }
  const endgame = material <= 2600
  for (let i = 0; i < 64; i++) {
    const p = s.b[i]
    if (!p) continue
    const t = Math.abs(p), white = p > 0
    const idx = white ? i : i ^ 56
    const table = t === K && endgame ? KING_END : PST[t]
    const v = VALUE[t] + table[idx]
    score += white ? v : -v
  }
  return s.turn === 1 ? score : -score
}

const MATE = 100000
const order = (ms: Move[]) => {
  const key = (m: Move) => (m.cap ? 10 * VALUE[Math.abs(m.cap)] - VALUE[Math.abs(m.piece)] / 10 + 1000 : 0) + (m.promo ? VALUE[m.promo] : 0)
  return ms.map(m => [key(m), m] as const).sort((a, b) => b[0] - a[0]).map(x => x[1])
}

type Ctx = { nodes: number; deadline: number; stop: boolean }

function quiesce(s: State, alpha: number, beta: number, qd: number, ctx: Ctx): number {
  const stand = evaluate(s)
  if (qd <= 0) return stand
  if (stand >= beta) return stand
  if (stand > alpha) alpha = stand
  const caps = order(legalMoves(s).filter(m => m.cap || m.promo))
  for (const m of caps) {
    const sc = -quiesce(makeMove(s, m), -beta, -alpha, qd - 1, ctx)
    if (sc >= beta) return sc
    if (sc > alpha) alpha = sc
  }
  return alpha
}

function negamax(s: State, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx, qd: number): number {
  ctx.nodes++
  if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) ctx.stop = true
  if (ctx.stop) return 0
  const ms = legalMoves(s)
  if (!ms.length) return inCheck(s) ? -MATE + ply : 0
  if (s.half >= 100) return 0
  if (depth <= 0) return qd > 0 ? quiesce(s, alpha, beta, qd, ctx) : evaluate(s)
  let best = -Infinity
  for (const m of order(ms)) {
    const sc = -negamax(makeMove(s, m), depth - 1, -beta, -alpha, ply + 1, ctx, qd)
    if (ctx.stop) return 0
    if (sc > best) best = sc
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

export type Level = 'easy' | 'medium' | 'hard'
export const LEVELS: Record<Level, { label: string; depth: number; q: number; noise: number; blunder: number; rating: number; name: string }> = {
  easy: { label: 'Easy', depth: 1, q: 0, noise: 90, blunder: 0.12, rating: 900, name: 'Pawny' },
  medium: { label: 'Medium', depth: 2, q: 2, noise: 25, blunder: 0, rating: 1350, name: 'Rookie' },
  hard: { label: 'Hard', depth: 3, q: 3, noise: 0, blunder: 0, rating: 1750, name: 'Castellan' },
}

/** Choose a move for the side to move. Synchronous; the UI calls it from a worker. */
export function chooseMove(s: State, level: Level): Move | null {
  const cfg = LEVELS[level]
  const ms = legalMoves(s)
  if (!ms.length) return null
  if (ms.length === 1) return ms[0]
  if (Math.random() < cfg.blunder) return ms[Math.floor(Math.random() * ms.length)]
  const ctx: Ctx = { nodes: 0, deadline: Date.now() + 2500, stop: false }
  const scored: { m: Move; sc: number }[] = []
  let alpha = -Infinity
  for (const m of order(ms)) {
    // full window when noise is wanted so near-best moves keep honest scores
    const a = cfg.noise ? -Infinity : alpha
    const sc = -negamax(makeMove(s, m), cfg.depth - 1, -Infinity, -a, 1, ctx, cfg.q)
    if (ctx.stop && scored.length) break
    scored.push({ m, sc: sc + (cfg.noise ? (Math.random() - 0.5) * cfg.noise : 0) })
    if (sc > alpha) alpha = sc
  }
  scored.sort((a, b) => b.sc - a.sc)
  return scored[0].m
}

/** Quick judgement for draw offers: positive means the bot thinks it is better. */
export function botAssessment(s: State, botColor: Color): number {
  const ev = evaluate(s)
  return s.turn === botColor ? ev : -ev
}

/** Forced mate search for puzzles: can the side to move mate within n of its own moves? */
export function mateIn(s: State, n: number): boolean {
  const ms = legalMoves(s)
  for (const m of ms) {
    const t = makeMove(s, m)
    const replies = legalMoves(t)
    if (!replies.length) { if (inCheck(t)) return true; continue }
    if (n <= 1) continue
    if (replies.every(r => mateIn(makeMove(t, r), n - 1))) return true
  }
  return false
}

/** Best defence versus a mating attack: the reply that survives longest. */
export function bestDefence(s: State, n: number): Move | null {
  const replies = legalMoves(s)
  if (!replies.length) return null
  for (let k = n; k >= 1; k--) {
    const escapes = replies.filter(r => !mateIn(makeMove(s, r), k))
    if (escapes.length) return escapes[0]
  }
  // all replies are mated in <= n: pick the one that lasts longest
  let best = replies[0], bestK = 0
  for (const r of replies) {
    const t = makeMove(s, r)
    let k = 1
    while (k <= n && !mateIn(t, k)) k++
    if (k > bestK) { bestK = k; best = r }
  }
  return best
}

export { attacked, kingSq }
