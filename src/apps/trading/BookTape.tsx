import { useSize } from './useSize'
import { Icon } from '../../ui'
import { inst, type State } from './engine'
import { hms, num } from './fmt'

export function OrderBook({ s, sym, onPick, fixedRows }: { s: State; sym: string; onPick: (price: number) => void; fixedRows?: number }) {
  const m = s.mk[sym], i = inst(sym)
  const { ref, h } = useSize<HTMLDivElement>()
  const rows = fixedRows ?? Math.max(4, Math.min(14, Math.floor((h - 30 - 38) / 2 / 21)))
  const asks = m.asks.slice(0, rows), bids = m.bids.slice(0, rows)
  const cumA: number[] = [], cumB: number[] = []
  asks.reduce((c, l, k) => (cumA[k] = c + l.q), 0); bids.reduce((c, l, k) => (cumB[k] = c + l.q), 0)
  const max = Math.max(cumA[cumA.length - 1], cumB[cumB.length - 1])
  const spread = m.asks[0].p - m.bids[0].p
  const row = (side: 'ask' | 'bid', l: { p: number; q: number }, c: number, k: number) => (
    <button key={`${side}${k}`} type="button" className={`tr-bk-r ${side}`} onClick={() => onPick(l.p)} aria-label={`${side === 'ask' ? 'Ask' : 'Bid'} ${num(l.p, i.dec)}, size ${num(l.q, i.qdec)}. Use as limit price`}>
      <span className="tr-bk-d" style={{ width: `${(c / max) * 100}%` }} />
      <span className={`num ${side === 'ask' ? 'tr-down' : 'tr-up'}`}>{num(l.p, i.dec)}</span>
      <span className="num">{num(l.q, i.qdec)}</span>
      <span className="num muted">{num(c, i.qdec)}</span>
    </button>
  )
  return (
    <div className="tr-bk">
      <div className="tr-bk-h eyebrow"><span>Price</span><span className="r">Size</span><span className="r">Total</span></div>
      <div ref={ref} className="tr-bk-body">
        <div className="tr-bk-side">{[...asks].map((l, k) => row('ask', l, cumA[k], k)).reverse()}</div>
        <div className="tr-bk-sp num">
          <span>Spread</span><b>{num(spread, i.dec)}</b><span className="faint">{((spread / m.price) * 100).toFixed(3)}%</span>
        </div>
        <div className="tr-bk-side">{bids.map((l, k) => row('bid', l, cumB[k], k))}</div>
      </div>
    </div>
  )
}

export function Tape({ s, sym }: { s: State; sym: string }) {
  const m = s.mk[sym], i = inst(sym)
  const list = m.trades.slice(-40).reverse()
  return (
    <div className="tr-tape">
      <div className="tr-tp-h eyebrow"><span>Price</span><span className="r">Size</span><span className="r">Time</span></div>
      <ul role="list" className="tr-tp-list scroll">
        {list.map(t => (
          <li key={t.id} className="tr-tp-r num">
            <span className={`tr-tp-p ${t.side === 'buy' ? 'tr-up' : 'tr-down'}`}><Icon name={t.side === 'buy' ? 'arrow-up' : 'arrow-down'} size={10} strokeWidth={2.6} aria-label={t.side === 'buy' ? 'Buy' : 'Sell'} />{num(t.p, i.dec)}</span>
            <span className="r">{num(t.q, i.qdec)}</span>
            <span className="r faint">{hms(t.t)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
