/* Arcline simulated market: seeded random walk, order book, tape, fills. Nothing here touches a network. */

export type TF = '1m' | '5m' | '1h' | '1D'
export const TFS: TF[] = ['1m', '5m', '1h', '1D']
export const TF_MS: Record<TF, number> = { '1m': 60e3, '5m': 300e3, '1h': 3600e3, '1D': 86400e3 }
export const TICK_MS = 10_000 // simulated time per engine tick

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number }
export type Trade = { id: number; t: number; p: number; q: number; side: 'buy' | 'sell' }
export type Level = { p: number; q: number }
export type Inst = { sym: string; name: string; kind: 'equity' | 'crypto'; dec: number; qdec: number; price0: number; vol: number; base: number; chg0: number; spreadBp: number; stepBp: number }

export const INSTRUMENTS: Inst[] = [
  { sym: 'NVXA', name: 'Nexavia Corp', kind: 'equity', dec: 2, qdec: 0, price0: 184.2, vol: 0.0006, base: 900, chg0: 0.0132, spreadBp: 0.0004, stepBp: 0.0004 },
  { sym: 'ORBT', name: 'Orbitron Systems', kind: 'equity', dec: 2, qdec: 0, price0: 62.85, vol: 0.0007, base: 2200, chg0: -0.0087, spreadBp: 0.0006, stepBp: 0.0005 },
  { sym: 'ZYNT', name: 'Zyntra Biosciences', kind: 'equity', dec: 2, qdec: 0, price0: 411.6, vol: 0.0008, base: 260, chg0: 0.0261, spreadBp: 0.0005, stepBp: 0.0004 },
  { sym: 'KELP', name: 'Kelpwave Energy', kind: 'equity', dec: 2, qdec: 0, price0: 27.4, vol: 0.0009, base: 5200, chg0: -0.0215, spreadBp: 0.0008, stepBp: 0.0007 },
  { sym: 'QUAR', name: 'Quarry Metals Group', kind: 'equity', dec: 2, qdec: 0, price0: 14.92, vol: 0.0008, base: 8400, chg0: 0.0049, spreadBp: 0.001, stepBp: 0.0009 },
  { sym: 'HALO/USD', name: 'Halo', kind: 'crypto', dec: 4, qdec: 0, price0: 3.482, vol: 0.0012, base: 14000, chg0: 0.0418, spreadBp: 0.0007, stepBp: 0.0006 },
  { sym: 'AURK/USD', name: 'Aurek', kind: 'crypto', dec: 4, qdec: 0, price0: 0.8274, vol: 0.0014, base: 52000, chg0: -0.0332, spreadBp: 0.0012, stepBp: 0.001 },
  { sym: 'LMNA/USD', name: 'Lumina', kind: 'crypto', dec: 2, qdec: 3, price0: 1286.4, vol: 0.001, base: 18, chg0: 0.0097, spreadBp: 0.0003, stepBp: 0.0004 },
  { sym: 'TIDE/USD', name: 'Tidewater', kind: 'crypto', dec: 5, qdec: 0, price0: 0.0412, vol: 0.0016, base: 380000, chg0: 0.0734, spreadBp: 0.0015, stepBp: 0.0012 },
  { sym: 'ARCL/USD', name: 'Arcline Token', kind: 'crypto', dec: 3, qdec: 2, price0: 12.906, vol: 0.0011, base: 2100, chg0: -0.0061, spreadBp: 0.0006, stepBp: 0.0005 },
]
export const inst = (sym: string) => INSTRUMENTS.find(i => i.sym === sym)!

export type Mkt = {
  price: number; open24: number; high24: number; low24: number; vol24: number
  candles: Record<TF, Candle[]>; asks: Level[]; bids: Level[]; trades: Trade[]; spark: number[]
  bsz: { a: number[]; b: number[] }
}
export type Order = { id: number; sym: string; side: 'buy' | 'sell'; type: 'limit' | 'stop'; price: number; qty: number; t: number }
export type Fill = { id: number; t: number; sym: string; side: 'buy' | 'sell'; type: 'market' | 'limit' | 'stop'; price: number; qty: number; fee: number; status: 'Filled' | 'Cancelled' | 'Rejected' }
export type Position = { sym: string; qty: number; avg: number }
export type State = {
  now: number; rnd: () => number; mk: Record<string, Mkt>; cash: number; positions: Position[]; orders: Order[]; history: Fill[]
  seq: number; startEquity: number; levels: number
}

export const FEE = { market: 0.001, stop: 0.001, limit: 0.0005 }
export const START = Date.UTC(2026, 9, 27, 14, 32, 10)

function mulberry(seed: number) {
  let a = seed
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export const roundTo = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d
const gauss = (r: () => number) => (r() + r() + r() - 1.5) * 1.1

function genCandles(i: Inst, tf: TF, n: number, endT: number, price: number, r: () => number): Candle[] {
  const ms = TF_MS[tf]
  const scale = Math.sqrt(ms / TICK_MS) * (tf === '1m' || tf === '5m' ? 1 : 0.55)
  const out: Candle[] = []
  let p = 1
  const t0 = Math.floor(endT / ms) * ms - (n - 1) * ms
  for (let k = 0; k < n; k++) {
    const o = p
    let hi = o, lo = o, c = o
    for (let s = 0; s < 5; s++) { c = c * (1 + gauss(r) * i.vol * scale * 0.45 + 0.00002 * (1 - c)); hi = Math.max(hi, c); lo = Math.min(lo, c) }
    const wick = i.vol * scale * 0.18
    hi *= 1 + r() * wick; lo *= 1 - r() * wick
    const ticks = ms / TICK_MS
    const v = i.base * ticks * (0.45 + r() * 0.9 + (Math.abs(c / o - 1) / (i.vol * scale)) * 0.6) * 0.5
    out.push({ t: t0 + k * ms, o, h: hi, l: lo, c, v })
    p = c
  }
  const f = price / out[out.length - 1].c
  return out.map(c => ({ t: c.t, o: c.o * f, h: c.h * f, l: c.l * f, c: c.c * f, v: c.v }))
}

function buildBook(i: Inst, mid: number, r: () => number, prev: { a: number[]; b: number[] } | null, n: number) {
  const spread = Math.max(mid * i.spreadBp, 10 ** -i.dec)
  const step = Math.max(mid * i.stepBp, 10 ** -i.dec)
  const bid0 = roundTo(mid - spread / 2, i.dec), ask0 = roundTo(bid0 + Math.max(spread, 10 ** -i.dec), i.dec)
  const asks: Level[] = [], bids: Level[] = []
  const a: number[] = [], b: number[] = []
  const sz = (x: number) => roundTo(x, i.qdec) || 10 ** -i.qdec
  for (let k = 0; k < n; k++) {
    const sa = i.base * (0.05 + r() * 0.16) * (1 + k * 0.06), sb = i.base * (0.05 + r() * 0.16) * (1 + k * 0.06)
    a.push(prev && prev.a[k] ? prev.a[k] * 0.6 + sa * 0.4 : sa); b.push(prev && prev.b[k] ? prev.b[k] * 0.6 + sb * 0.4 : sb)
    asks.push({ p: roundTo(ask0 + k * step, i.dec), q: sz(a[k]) })
    bids.push({ p: roundTo(bid0 - k * step, i.dec), q: sz(b[k]) })
  }
  return { asks, bids, bsz: { a, b } }
}

export function createState(): State {
  const rnd = mulberry(20261027)
  const LV = 14
  const s: State = { now: START, rnd, mk: {}, cash: 148320.55, positions: [], orders: [], history: [], seq: 1000, startEquity: 0, levels: LV }
  for (const i of INSTRUMENTS) {
    const r = mulberry(i.sym.split('').reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7))
    const candles = {} as Record<TF, Candle[]>
    for (const tf of TFS) candles[tf] = genCandles(i, tf, 160, START, i.price0, r)
    const day = candles['1h'].slice(-24)
    const book = buildBook(i, i.price0, r, null, LV)
    const trades: Trade[] = []
    for (let k = 0; k < 30; k++) trades.push({ id: k, t: START - (30 - k) * 3000, p: roundTo(i.price0 * (1 + gauss(r) * 0.0004), i.dec), q: roundTo(i.base * (0.002 + r() * 0.02), i.qdec) || 1, side: r() > 0.5 ? 'buy' : 'sell' })
    s.mk[i.sym] = {
      price: i.price0, open24: i.price0 / (1 + i.chg0), high24: Math.max(i.price0, ...day.map(c => c.h)), low24: Math.min(i.price0 / (1 + i.chg0), ...day.map(c => c.l)),
      vol24: day.reduce((x, c) => x + c.v, 0) * 1.4, candles, asks: book.asks, bids: book.bids, bsz: book.bsz, trades, spark: candles['1m'].slice(-48).map(c => c.c),
    }
  }
  const pos: [string, number, number][] = [['NVXA', 120, 176.4], ['HALO/USD', 5400, 3.12], ['KELP', 1500, 28.9], ['ORBT', 400, 58.2], ['LMNA/USD', 3.2, 1190.5]]
  s.positions = pos.map(([sym, qty, avg]) => ({ sym, qty, avg }))
  const mkOrder = (sym: string, side: 'buy' | 'sell', type: 'limit' | 'stop', f: number, qty: number, ago: number): Order => ({ id: s.seq++, sym, side, type, price: roundTo(inst(sym).price0 * f, inst(sym).dec), qty, t: START - ago * 60e3 })
  s.orders = [mkOrder('NVXA', 'buy', 'limit', 0.97, 100, 47), mkOrder('HALO/USD', 'sell', 'limit', 1.06, 2000, 190), mkOrder('KELP', 'sell', 'stop', 0.93, 800, 330)]
  const hist: [string, 'buy' | 'sell', 'market' | 'limit', number, number, number][] = [
    ['ZYNT', 'sell', 'limit', 398.1, 40, 25], ['ORBT', 'buy', 'market', 58.2, 400, 120], ['NVXA', 'buy', 'limit', 176.4, 120, 410], ['AURK/USD', 'sell', 'market', 0.8561, 12000, 690], ['KELP', 'buy', 'limit', 28.9, 1500, 1500],
  ]
  s.history = hist.map(([sym, side, type, price, qty, ago]) => ({ id: s.seq++, t: START - ago * 60e3, sym, side, type, price, qty, fee: roundTo(price * qty * FEE[type], 2), status: 'Filled' as const }))
  s.startEquity = equity(s)
  return s
}

export const markOf = (s: State, sym: string) => s.mk[sym].price
export const bestBid = (s: State, sym: string) => s.mk[sym].bids[0].p
export const bestAsk = (s: State, sym: string) => s.mk[sym].asks[0].p
export function equity(s: State) { return s.cash + s.positions.reduce((x, p) => x + p.qty * s.mk[p.sym].price, 0) }
export function reserved(s: State) {
  return {
    cash: s.orders.filter(o => o.side === 'buy').reduce((x, o) => x + o.price * o.qty * (1 + FEE[o.type]), 0),
    qty: (sym: string) => s.orders.filter(o => o.side === 'sell' && o.sym === sym).reduce((x, o) => x + o.qty, 0),
  }
}
export const heldQty = (s: State, sym: string) => s.positions.find(p => p.sym === sym)?.qty ?? 0
export const availCash = (s: State) => s.cash - reserved(s).cash
export const availQty = (s: State, sym: string) => heldQty(s, sym) - reserved(s).qty(sym)

function applyFill(s: State, sym: string, side: 'buy' | 'sell', type: 'market' | 'limit' | 'stop', price: number, qty: number) {
  const fee = roundTo(price * qty * FEE[type], 2)
  const pos = s.positions.find(p => p.sym === sym)
  if (side === 'buy') {
    s.cash -= price * qty + fee
    if (pos) { pos.avg = (pos.avg * pos.qty + price * qty) / (pos.qty + qty); pos.qty += qty } else s.positions.push({ sym, qty, avg: price })
  } else {
    s.cash += price * qty - fee
    if (pos) { pos.qty = roundTo(pos.qty - qty, 6); if (pos.qty <= 1e-9) s.positions = s.positions.filter(p => p !== pos) }
  }
  s.history.unshift({ id: s.seq++, t: s.now, sym, side, type, price, qty, fee, status: 'Filled' })
}

export type PlaceResult = { ok: true; msg: string } | { ok: false; msg: string }
export function place(s: State, o: { sym: string; side: 'buy' | 'sell'; type: 'market' | 'limit' | 'stop'; price: number; qty: number }): PlaceResult {
  const i = inst(o.sym)
  if (o.type === 'market') {
    const px = o.side === 'buy' ? bestAsk(s, o.sym) : bestBid(s, o.sym)
    if (o.side === 'buy' && px * o.qty * (1 + FEE.market) > availCash(s) + 1e-6) return { ok: false, msg: 'Insufficient balance' }
    if (o.side === 'sell' && o.qty > availQty(s, o.sym) + 1e-9) return { ok: false, msg: 'Insufficient holdings' }
    applyFill(s, o.sym, o.side, 'market', px, o.qty)
    return { ok: true, msg: `${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.qty} ${o.sym} at ${px.toFixed(i.dec)}` }
  }
  s.orders.unshift({ id: s.seq++, sym: o.sym, side: o.side, type: o.type, price: o.price, qty: o.qty, t: s.now })
  const done = matchOrders(s)
  return { ok: true, msg: done.length ? `${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.qty} ${o.sym}, limit filled` : `${o.type === 'limit' ? 'Limit' : 'Stop'} order placed for ${o.qty} ${o.sym}` }
}

export function cancel(s: State, id: number) {
  const o = s.orders.find(x => x.id === id)
  if (!o) return
  s.orders = s.orders.filter(x => x.id !== id)
  s.history.unshift({ id: s.seq++, t: s.now, sym: o.sym, side: o.side, type: o.type, price: o.price, qty: o.qty, fee: 0, status: 'Cancelled' })
}

export function closePosition(s: State, sym: string): string {
  const pos = s.positions.find(p => p.sym === sym)
  if (!pos) return ''
  // release any sell orders on this symbol first
  s.orders.filter(o => o.sym === sym && o.side === 'sell').forEach(o => cancel(s, o.id))
  const px = bestBid(s, sym), qty = pos.qty
  applyFill(s, sym, 'sell', 'market', px, qty)
  return `Closed ${qty} ${sym} at ${px.toFixed(inst(sym).dec)}`
}

function matchOrders(s: State): Order[] {
  const done: Order[] = []
  for (const o of [...s.orders]) {
    const m = s.mk[o.sym]
    let px: number | null = null
    if (o.type === 'limit') {
      if (o.side === 'buy' && m.asks[0].p <= o.price) px = Math.min(o.price, m.asks[0].p)
      if (o.side === 'sell' && m.bids[0].p >= o.price) px = Math.max(o.price, m.bids[0].p)
    } else {
      if (o.side === 'buy' && m.price >= o.price) px = m.asks[0].p
      if (o.side === 'sell' && m.price <= o.price) px = m.bids[0].p
    }
    if (px === null) continue
    s.orders = s.orders.filter(x => x.id !== o.id)
    const cashOk = o.side === 'sell' || s.cash >= px * o.qty * (1 + FEE[o.type])
    const qtyOk = o.side === 'buy' || heldQty(s, o.sym) >= o.qty - 1e-9
    if (!cashOk || !qtyOk) { s.history.unshift({ id: s.seq++, t: s.now, sym: o.sym, side: o.side, type: o.type, price: o.price, qty: o.qty, fee: 0, status: 'Rejected' }); continue }
    applyFill(s, o.sym, o.side, o.type, px, o.qty)
    done.push(o)
  }
  return done
}

export function tick(s: State): Order[] {
  const r = s.rnd
  s.now += TICK_MS
  for (const i of INSTRUMENTS) {
    const m = s.mk[i.sym]
    const drift = (i.price0 - m.price) / i.price0 * 0.01
    const ret = gauss(r) * i.vol * 1.6 + drift
    const p = Math.max(10 ** -i.dec, roundTo(m.price * (1 + ret), i.dec))
    const n = 1 + Math.floor(r() * 3)
    for (let k = 0; k < n; k++) {
      const tp = k === n - 1 ? p : roundTo(p * (1 + gauss(r) * 0.00025), i.dec)
      const q = roundTo(i.base * (0.002 + r() * r() * 0.05), i.qdec) || 10 ** -i.qdec
      m.trades.push({ id: s.seq++, t: s.now - (n - k) * 900, p: tp, q, side: ret + gauss(r) * i.vol * 0.4 >= 0 ? 'buy' : 'sell' })
      m.vol24 += q
      for (const tf of TFS) {
        const arr = m.candles[tf], ms = TF_MS[tf], bucket = Math.floor(s.now / ms) * ms
        let last = arr[arr.length - 1]
        if (last.t !== bucket) { last = { t: bucket, o: last.c, h: last.c, l: last.c, c: last.c, v: 0 }; arr.push(last); if (arr.length > 600) arr.shift() }
        last.c = tp; last.h = Math.max(last.h, tp); last.l = Math.min(last.l, tp); last.v += q
      }
    }
    if (m.trades.length > 60) m.trades.splice(0, m.trades.length - 60)
    m.price = p; m.high24 = Math.max(m.high24, p); m.low24 = Math.min(m.low24, p)
    const b = buildBook(i, p, r, m.bsz, s.levels)
    m.asks = b.asks; m.bids = b.bids; m.bsz = b.bsz
    m.spark.push(p); if (m.spark.length > 48) m.spark.shift()
  }
  return matchOrders(s)
}
