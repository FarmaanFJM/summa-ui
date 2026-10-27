import { chooseMove, type Level } from './bot'
import type { State } from './engine'

self.onmessage = (e: MessageEvent<{ id: number; state: State; level: Level }>) => {
  const { id, state, level } = e.data
  const move = chooseMove(state, level)
  ;(self as unknown as Worker).postMessage({ id, move })
}
