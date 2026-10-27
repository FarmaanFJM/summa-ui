import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PRODUCTS, PROMOS, SHIPPING, byId, priceOf, type Product } from './data'

export type Line = { pid: string; color: string; size?: string; qty: number }
export const keyOf = (l: Pick<Line, 'pid' | 'color' | 'size'>) => `${l.pid}|${l.color}|${l.size ?? ''}`
export type Order = {
  ref: string; lines: Line[]; promo: string | null; ship: string; email: string; name: string; address: string; card: string
  subtotal: number; discount: number; shipping: number; total: number; placed: string
}

function load<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d } }
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } }

export function totals(lines: Line[], promo: string | null, shipId = 'standard') {
  const subtotal = lines.reduce((s, l) => { const p = byId(l.pid); return s + (p ? priceOf(p, l.size) * l.qty : 0) }, 0)
  const pr = promo ? PROMOS[promo] : undefined
  const discount = pr?.pct ? Math.round(subtotal * pr.pct * 100) / 100 : 0
  const m = SHIPPING.find(s => s.id === shipId) ?? SHIPPING[0]
  const after = subtotal - discount
  const shipping = lines.length === 0 ? 0 : m.id === 'standard' && (after >= (m.freeOver ?? Infinity) || pr?.freeShip) ? 0 : m.price
  return { subtotal, discount, shipping, total: after + shipping, count: lines.reduce((s, l) => s + l.qty, 0) }
}

type Ctx = {
  lines: Line[]; add: (p: Product, color: string, size: string | undefined, qty: number, open?: boolean) => void; setQty: (k: string, q: number) => void; remove: (k: string) => void; clear: () => void
  promo: string | null; applyPromo: (code: string) => string | null; clearPromo: () => void
  wish: string[]; toggleWish: (id: string) => void
  recents: string[]; addRecent: (q: string) => void; removeRecent: (q: string) => void; clearRecents: () => void
  orders: Order[]; place: (o: Order) => void
  drawer: boolean; openDrawer: () => void; closeDrawer: () => void
  toast: string | null; say: (s: string) => void
}
const C = createContext<Ctx>(null as never)
export const useShop = () => useContext(C)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>(() => load<Line[]>('oe-cart', []).filter(l => byId(l.pid)))
  const [promo, setPromo] = useState<string | null>(() => load<string | null>('oe-promo', null))
  const [wish, setWish] = useState<string[]>(() => load<string[]>('oe-wish', []).filter(id => PRODUCTS.some(p => p.id === id)))
  const [recents, setRecents] = useState<string[]>(() => load<string[]>('oe-recent', ['desk lamp', 'linen cushion']))
  const [orders, setOrders] = useState<Order[]>(() => load<Order[]>('oe-orders', []))
  const [drawer, setDrawer] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef(0)
  useEffect(() => save('oe-cart', lines), [lines])
  useEffect(() => save('oe-promo', promo), [promo])
  useEffect(() => save('oe-wish', wish), [wish])
  useEffect(() => save('oe-recent', recents), [recents])
  useEffect(() => save('oe-orders', orders), [orders])
  const say = useCallback((s: string) => { setToast(s); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 2200) }, [])

  const value: Ctx = useMemo(() => ({
    lines,
    add: (p, color, size, qty, open = true) => {
      setLines(ls => {
        const k = keyOf({ pid: p.id, color, size }), i = ls.findIndex(l => keyOf(l) === k)
        return i >= 0 ? ls.map((l, j) => (j === i ? { ...l, qty: Math.min(10, l.qty + qty) } : l)) : [...ls, { pid: p.id, color, size, qty }]
      })
      if (open) setDrawer(true)
    },
    setQty: (k, q) => setLines(ls => ls.map(l => (keyOf(l) === k ? { ...l, qty: Math.max(1, Math.min(10, q)) } : l))),
    remove: k => setLines(ls => ls.filter(l => keyOf(l) !== k)),
    clear: () => { setLines([]); setPromo(null) },
    promo,
    applyPromo: code => { const c = code.trim().toUpperCase(); if (!c) return 'Enter a code'; if (!PROMOS[c]) return 'That code is not valid'; setPromo(c); return null },
    clearPromo: () => setPromo(null),
    wish, toggleWish: id => setWish(w => (w.includes(id) ? w.filter(x => x !== id) : [...w, id])),
    recents,
    addRecent: q => { const t = q.trim(); if (t) setRecents(r => [t, ...r.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 5)) },
    removeRecent: q => setRecents(r => r.filter(x => x !== q)), clearRecents: () => setRecents([]),
    orders, place: o => setOrders(os => [o, ...os]),
    drawer, openDrawer: () => setDrawer(true), closeDrawer: () => setDrawer(false),
    toast, say,
  }), [lines, promo, wish, recents, orders, drawer, toast, say])
  return <C.Provider value={value}>{children}</C.Provider>
}
