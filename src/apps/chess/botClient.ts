import { chooseMove, type Level } from './bot'
import type { Move, State } from './engine'

/* The bot searches in a worker so the board never freezes. Falls back to a timer if workers are unavailable. */
let worker: Worker | null = null
let failed = false
let seq = 0
const pending = new Map<number, { cb: (m: Move | null) => void; state: State; level: Level }>()

function ensure() {
  if (worker || failed) return worker
  try {
    worker = new Worker(new URL('./botWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ id: number; move: Move | null }>) => {
      const p = pending.get(e.data.id)
      pending.delete(e.data.id)
      p?.cb(e.data.move)
    }
    worker.onerror = () => { failed = true; worker = null; const all = [...pending.values()]; pending.clear(); all.forEach(p => p.cb(chooseMove(p.state, p.level))) }
  } catch { failed = true }
  return worker
}

/** Returns a cancel function. Resolves with the chosen move after at least `minMs`. */
export function requestBotMove(state: State, level: Level, minMs: number, done: (m: Move | null) => void): () => void {
  const id = ++seq
  let cancelled = false
  const started = Date.now()
  const finish = (m: Move | null) => {
    const wait = Math.max(0, minMs - (Date.now() - started))
    setTimeout(() => { if (!cancelled) done(m) }, wait)
  }
  const w = ensure()
  if (w) { pending.set(id, { cb: finish, state, level }); w.postMessage({ id, state, level }) }
  else setTimeout(() => { if (!cancelled) finish(chooseMove(state, level)) }, 30)
  return () => { cancelled = true; pending.delete(id) }
}
