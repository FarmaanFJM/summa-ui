import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_Q, qFromParams, type Currency, type Locale, type Query } from './data'

export type Trip = { id: string; ref: string; stayId: string; roomId: string; q: Query; total: number; name: string; email: string; status: 'confirmed' | 'cancelled'; booked: string }

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function save(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* storage unavailable */ } }

/* ------------------------------------------------------------------ Hash routes: #/travel[/page[/id]][?query] */
export type Route = { page: 'home' | 'results' | 'stay' | 'book' | 'trips'; id: string; params: URLSearchParams; q: Query }
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?travel\/?/, '')
  const [path, query = ''] = raw.split('?')
  const [page, id = ''] = path.split('/')
  const params = new URLSearchParams(query)
  const p = (['results', 'stay', 'book', 'trips'] as const).find(x => x === page) ?? 'home'
  return { page: p, id, params, q: qFromParams(params) }
}
export const go = (path: string) => { location.hash = '#/travel' + path }

type Ctx = {
  route: Route; cur: Currency; setCur: (c: Currency) => void; loc: Locale; setLoc: (l: Locale) => void
  saved: string[]; toggleSave: (id: string) => void
  trips: Trip[]; addTrip: (t: Trip) => void; cancelTrip: (id: string) => void
  recents: string[]; addRecent: (d: string) => void
  lastQ: Query; setLastQ: (q: Query) => void
}
const C = createContext<Ctx>(null as unknown as Ctx)
export const useTravel = () => useContext(C)

export function TravelProvider({ children }: { children: ReactNode }) {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => { const h = () => setHash(location.hash); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h) }, [])
  const route = useMemo(() => parseHash(hash), [hash])

  const [cur, setCurS] = useState<Currency>(() => load('wf.cur', 'GBP'))
  const [loc, setLocS] = useState<Locale>(() => load('wf.loc', 'en-GB'))
  const [saved, setSaved] = useState<string[]>(() => load('wf.saved', []))
  const [trips, setTrips] = useState<Trip[]>(() => load('wf.trips', []))
  const [recents, setRecents] = useState<string[]>(() => load('wf.recents', ['lisbon', 'chamonix']))
  const [lastQ, setLastQ] = useState<Query>(DEFAULT_Q)

  const setCur = useCallback((c: Currency) => { setCurS(c); save('wf.cur', c) }, [])
  const setLoc = useCallback((l: Locale) => { setLocS(l); save('wf.loc', l) }, [])
  const toggleSave = useCallback((id: string) => setSaved(s => { const n = s.includes(id) ? s.filter(x => x !== id) : [...s, id]; save('wf.saved', n); return n }), [])
  const addTrip = useCallback((t: Trip) => setTrips(s => { const n = [t, ...s.filter(x => x.id !== t.id)]; save('wf.trips', n); return n }), [])
  const cancelTrip = useCallback((id: string) => setTrips(s => { const n = s.map(t => (t.id === id ? { ...t, status: 'cancelled' as const } : t)); save('wf.trips', n); return n }), [])
  const addRecent = useCallback((d: string) => setRecents(s => { const n = [d, ...s.filter(x => x !== d)].slice(0, 4); save('wf.recents', n); return n }), [])

  const value = useMemo(() => ({ route, cur, setCur, loc, setLoc, saved, toggleSave, trips, addTrip, cancelTrip, recents, addRecent, lastQ, setLastQ }),
    [route, cur, setCur, loc, setLoc, saved, toggleSave, trips, addTrip, cancelTrip, recents, addRecent, lastQ])
  return <C.Provider value={value}>{children}</C.Provider>
}

/** Replace the current hash route without adding a history entry. */
export const replace = (path: string) => { location.replace(location.pathname + location.search + '#/travel' + path) }
