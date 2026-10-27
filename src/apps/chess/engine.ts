/* A small, complete chess rules engine. Board index 0 = a8, 63 = h1. Positive = white, negative = black. */
export const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6
export type Color = 1 | -1
export type Move = { from: number; to: number; piece: number; cap: number; promo?: number; ep?: boolean; castle?: 'k' | 'q' }
export type State = { b: Int8Array; turn: Color; cr: number; ep: number; half: number; full: number }

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const LETTER: Record<string, number> = { p: P, n: N, b: B, r: R, q: Q, k: K }
const CHAR = ['', 'p', 'n', 'b', 'r', 'q', 'k']

export const fileOf = (sq: number) => sq & 7
export const rankOf = (sq: number) => 8 - (sq >> 3)
export const sqName = (sq: number) => 'abcdefgh'[sq & 7] + (8 - (sq >> 3))
export const sqFrom = (name: string) => (8 - Number(name[1])) * 8 + 'abcdefgh'.indexOf(name[0])
export const colorOf = (p: number): Color => (p > 0 ? 1 : -1)

export function fromFEN(fen: string): State {
  const [pos, turn, castle, ep, half, full] = fen.split(' ')
  const b = new Int8Array(64)
  let i = 0
  for (const ch of pos) {
    if (ch === '/') continue
    if (ch >= '1' && ch <= '8') { i += Number(ch); continue }
    const lower = ch.toLowerCase()
    b[i++] = LETTER[lower] * (ch === lower ? -1 : 1)
  }
  let cr = 0
  if (castle?.includes('K')) cr |= 1
  if (castle?.includes('Q')) cr |= 2
  if (castle?.includes('k')) cr |= 4
  if (castle?.includes('q')) cr |= 8
  return { b, turn: turn === 'b' ? -1 : 1, cr, ep: ep && ep !== '-' ? sqFrom(ep) : -1, half: Number(half ?? 0), full: Number(full ?? 1) }
}

export function toFEN(s: State): string {
  let out = ''
  for (let r = 0; r < 8; r++) {
    let e = 0
    for (let f = 0; f < 8; f++) {
      const p = s.b[r * 8 + f]
      if (!p) { e++; continue }
      if (e) { out += e; e = 0 }
      const c = CHAR[Math.abs(p)]
      out += p > 0 ? c.toUpperCase() : c
    }
    if (e) out += e
    if (r < 7) out += '/'
  }
  const cr = (s.cr & 1 ? 'K' : '') + (s.cr & 2 ? 'Q' : '') + (s.cr & 4 ? 'k' : '') + (s.cr & 8 ? 'q' : '')
  return `${out} ${s.turn === 1 ? 'w' : 'b'} ${cr || '-'} ${s.ep >= 0 ? sqName(s.ep) : '-'} ${s.half} ${s.full}`
}

export const startState = () => fromFEN(START_FEN)

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]]

/** Is square `sq` attacked by any piece of colour `by`? */
export function attacked(b: Int8Array, sq: number, by: Color): boolean {
  const r = sq >> 3, f = sq & 7
  // pawns: a white pawn attacks toward lower rows, so it sits one row below (r+1) the target
  const pr = by === 1 ? r + 1 : r - 1
  if (pr >= 0 && pr < 8) for (const df of [-1, 1]) { const pf = f + df; if (pf >= 0 && pf < 8 && b[pr * 8 + pf] === P * by) return true }
  for (const [dr, df] of KN) { const rr = r + dr, ff = f + df; if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === N * by) return true }
  for (const [dr, df] of KG) { const rr = r + dr, ff = f + df; if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === K * by) return true }
  for (const [dr, df] of DIAG) {
    let rr = r + dr, ff = f + df
    while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
      const p = b[rr * 8 + ff]
      if (p) { if (p === B * by || p === Q * by) return true; break }
      rr += dr; ff += df
    }
  }
  for (const [dr, df] of ORTH) {
    let rr = r + dr, ff = f + df
    while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
      const p = b[rr * 8 + ff]
      if (p) { if (p === R * by || p === Q * by) return true; break }
      rr += dr; ff += df
    }
  }
  return false
}

export const kingSq = (b: Int8Array, c: Color) => b.indexOf(K * c)
export const inCheck = (s: State, c: Color = s.turn) => { const k = kingSq(s.b, c); return k >= 0 && attacked(s.b, k, -c as Color) }

function pseudo(s: State): Move[] {
  const { b, turn: c } = s
  const out: Move[] = []
  const add = (from: number, to: number, piece: number, extra?: Partial<Move>) => out.push({ from, to, piece, cap: b[to], ...extra })
  for (let from = 0; from < 64; from++) {
    const p = b[from]
    if (!p || colorOf(p) !== c) continue
    const t = Math.abs(p), r = from >> 3, f = from & 7
    if (t === P) {
      const dir = c === 1 ? -1 : 1, start = c === 1 ? 6 : 1, last = c === 1 ? 0 : 7
      const r1 = r + dir
      if (r1 < 0 || r1 > 7) continue
      if (!b[r1 * 8 + f]) {
        if (r1 === last) for (const pr of [Q, R, B, N]) add(from, r1 * 8 + f, P * c, { promo: pr })
        else {
          add(from, r1 * 8 + f, P * c)
          if (r === start && !b[(r + 2 * dir) * 8 + f]) add(from, (r + 2 * dir) * 8 + f, P * c)
        }
      }
      for (const df of [-1, 1]) {
        const ff = f + df
        if (ff < 0 || ff > 7) continue
        const to = r1 * 8 + ff
        if (b[to] && colorOf(b[to]) !== c) {
          if (r1 === last) for (const pr of [Q, R, B, N]) add(from, to, P * c, { promo: pr })
          else add(from, to, P * c)
        } else if (to === s.ep && !b[to]) add(from, to, P * c, { ep: true, cap: -P * c })
      }
    } else if (t === N || t === K) {
      for (const [dr, df] of t === N ? KN : KG) {
        const rr = r + dr, ff = f + df
        if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue
        const to = rr * 8 + ff
        if (!b[to] || colorOf(b[to]) !== c) add(from, to, t * c)
      }
      if (t === K) {
        const home = c === 1 ? 60 : 4
        if (from === home && !attacked(b, home, -c as Color)) {
          const ks = c === 1 ? 1 : 4, qs = c === 1 ? 2 : 8
          if (s.cr & ks && b[home + 3] === R * c && !b[home + 1] && !b[home + 2] && !attacked(b, home + 1, -c as Color) && !attacked(b, home + 2, -c as Color))
            add(from, home + 2, K * c, { castle: 'k', cap: 0 })
          if (s.cr & qs && b[home - 4] === R * c && !b[home - 1] && !b[home - 2] && !b[home - 3] && !attacked(b, home - 1, -c as Color) && !attacked(b, home - 2, -c as Color))
            add(from, home - 2, K * c, { castle: 'q', cap: 0 })
        }
      }
    } else {
      const dirs = t === B ? DIAG : t === R ? ORTH : [...DIAG, ...ORTH]
      for (const [dr, df] of dirs) {
        let rr = r + dr, ff = f + df
        while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
          const to = rr * 8 + ff
          if (b[to]) { if (colorOf(b[to]) !== c) add(from, to, t * c); break }
          add(from, to, t * c)
          rr += dr; ff += df
        }
      }
    }
  }
  return out
}

export function makeMove(s: State, m: Move): State {
  const b = new Int8Array(s.b)
  const c = s.turn
  b[m.to] = m.promo ? m.promo * c : b[m.from]
  b[m.from] = 0
  if (m.ep) b[m.to + (c === 1 ? 8 : -8)] = 0
  if (m.castle === 'k') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = 0 }
  if (m.castle === 'q') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = 0 }
  let cr = s.cr
  if (Math.abs(m.piece) === K) cr &= c === 1 ? ~3 : ~12
  for (const sq of [m.from, m.to]) {
    if (sq === 63) cr &= ~1
    if (sq === 56) cr &= ~2
    if (sq === 7) cr &= ~4
    if (sq === 0) cr &= ~8
  }
  const ep = Math.abs(m.piece) === P && Math.abs(m.to - m.from) === 16 ? (m.from + m.to) >> 1 : -1
  return { b, turn: -c as Color, cr, ep, half: Math.abs(m.piece) === P || m.cap ? 0 : s.half + 1, full: s.full + (c === -1 ? 1 : 0) }
}

export function legalMoves(s: State): Move[] {
  const c = s.turn
  return pseudo(s).filter(m => { const n = makeMove(s, m); const k = kingSq(n.b, c); return !attacked(n.b, k, -c as Color) })
}

/** Standard algebraic notation for move `m` in state `s` (legal list optional for speed). */
export function toSAN(s: State, m: Move, legal: Move[] = legalMoves(s)): string {
  let out: string
  if (m.castle) out = m.castle === 'k' ? 'O-O' : 'O-O-O'
  else {
    const t = Math.abs(m.piece)
    const capture = m.cap !== 0
    if (t === P) out = (capture ? 'abcdefgh'[m.from & 7] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + 'PNBRQK'[m.promo - 1] : '')
    else {
      const others = legal.filter(o => o !== m && o.to === m.to && Math.abs(o.piece) === t && o.from !== m.from)
      let dis = ''
      if (others.length) {
        const sameFile = others.some(o => (o.from & 7) === (m.from & 7))
        const sameRank = others.some(o => (o.from >> 3) === (m.from >> 3))
        dis = !sameFile ? 'abcdefgh'[m.from & 7] : !sameRank ? String(8 - (m.from >> 3)) : sqName(m.from)
      }
      out = 'PNBRQK'[t - 1] + dis + (capture ? 'x' : '') + sqName(m.to)
    }
  }
  const n = makeMove(s, m)
  if (inCheck(n)) out += legalMoves(n).length ? '+' : '#'
  return out
}

export function insufficient(b: Int8Array): boolean {
  const minors: { t: number; sq: number }[] = []
  for (let i = 0; i < 64; i++) {
    const t = Math.abs(b[i])
    if (!t || t === K) continue
    if (t === P || t === R || t === Q) return false
    minors.push({ t, sq: i })
  }
  if (minors.length <= 1) return true
  if (minors.every(m => m.t === B)) { const shade = (sq: number) => ((sq >> 3) + (sq & 7)) & 1; return minors.every(m => shade(m.sq) === shade(minors[0].sq)) }
  return false
}

/** Key for repetition: placement, side, castling, en passant (only if capturable). */
export function posKey(s: State): string {
  let ep = -1
  if (s.ep >= 0) {
    const c = s.turn, r = s.ep >> 3, f = s.ep & 7
    const pr = c === 1 ? r + 1 : r - 1
    for (const df of [-1, 1]) { const ff = f + df; if (ff >= 0 && ff < 8 && s.b[pr * 8 + ff] === P * c) ep = s.ep }
  }
  return `${s.b.join(',')}|${s.turn}|${s.cr}|${ep}`
}

export type Outcome = { over: false } | { over: true; result: '1-0' | '0-1' | '1/2-1/2'; reason: 'checkmate' | 'stalemate' | 'insufficient' | 'fifty' | 'threefold' }

export function outcome(s: State, keys: string[], legal: Move[] = legalMoves(s)): Outcome {
  if (!legal.length) {
    if (inCheck(s)) return { over: true, result: s.turn === 1 ? '0-1' : '1-0', reason: 'checkmate' }
    return { over: true, result: '1/2-1/2', reason: 'stalemate' }
  }
  if (insufficient(s.b)) return { over: true, result: '1/2-1/2', reason: 'insufficient' }
  if (s.half >= 100) return { over: true, result: '1/2-1/2', reason: 'fifty' }
  const k = posKey(s)
  let n = 0
  for (const x of keys) if (x === k) n++
  if (n >= 3) return { over: true, result: '1/2-1/2', reason: 'threefold' }
  return { over: false }
}

export const moveUCI = (m: Move) => sqName(m.from) + sqName(m.to) + (m.promo ? 'nbrq'[[N, B, R, Q].indexOf(m.promo)] : '')
export const findUCI = (s: State, uci: string) => legalMoves(s).find(m => moveUCI(m) === uci)

export const VALUE = [0, 100, 320, 330, 500, 900, 0]

/** Perft for self-checks. */
export function perft(s: State, d: number): number {
  if (d === 0) return 1
  const ms = legalMoves(s)
  if (d === 1) return ms.length
  let n = 0
  for (const m of ms) n += perft(makeMove(s, m), d - 1)
  return n
}
