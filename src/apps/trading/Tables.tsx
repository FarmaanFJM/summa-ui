import type { ReactNode } from 'react'
import { Button } from '../../ui'
import { availQty, heldQty, inst, reserved, type State } from './engine'
import { base, hms, num, sgnPct, sgnUsd, usd } from './fmt'

type Col = { k: string; label: string; r?: boolean; v: ReactNode }
function Grid({ rows, label, mobile, empty, onRow }: { rows: { key: string | number; cols: Col[]; action?: ReactNode; sym?: string }[]; label: string; mobile: boolean; empty: string; onRow?: (sym: string) => void }) {
  if (!rows.length) return <div className="tr-empty">{empty}</div>
  if (mobile) {
    return (
      <ul role="list" className="tr-cards" aria-label={label}>
        {rows.map(r => (
          <li key={r.key} className="tr-card">
            <div className="tr-card-g">
              {r.cols.map(c => <div key={c.k} className={c.k === 'sym' ? 'full' : ''}><span className="tr-card-l">{c.label}</span><span className="num">{c.v}</span></div>)}
            </div>
            {r.action && <div className="tr-card-a">{r.action}</div>}
          </li>
        ))}
      </ul>
    )
  }
  const heads = rows[0].cols
  return (
    <table className="tr-table" aria-label={label}>
      <thead><tr>{heads.map(c => <th key={c.k} scope="col" className={c.r ? 'r' : ''}>{c.label}</th>)}<th className="act" /></tr></thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.key} onClick={r.sym && onRow ? () => onRow(r.sym!) : undefined}>
            {r.cols.map(c => <td key={c.k} className={c.r ? 'r num' : ''}>{c.v}</td>)}
            <td className="act r">{r.action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
const Side = ({ s }: { s: 'buy' | 'sell' }) => <span className={s === 'buy' ? 'tr-up' : 'tr-down'}>{s === 'buy' ? 'Buy' : 'Sell'}</span>
const cap = (x: string) => x[0].toUpperCase() + x.slice(1)
const Pnl = ({ v, p }: { v: number; p?: number }) => <span className={v >= 0 ? 'tr-up' : 'tr-down'}>{p === undefined ? sgnUsd(v) : sgnPct(p)}</span>

export function Positions({ s, mobile, onClose, onRow }: { s: State; mobile: boolean; onClose: (sym: string) => void; onRow: (sym: string) => void }) {
  const rows = s.positions.map(p => {
    const i = inst(p.sym), mark = s.mk[p.sym].price, pnl = (mark - p.avg) * p.qty, pct = (mark / p.avg - 1) * 100
    return {
      key: p.sym, sym: p.sym,
      cols: [
        { k: 'sym', label: 'Instrument', v: <b>{p.sym}</b> }, { k: 'q', label: 'Size', r: true, v: num(p.qty, i.qdec) }, { k: 'a', label: 'Avg entry', r: true, v: num(p.avg, i.dec) },
        { k: 'm', label: 'Mark', r: true, v: num(mark, i.dec) }, { k: 'v', label: 'Value', r: true, v: usd(p.qty * mark) },
        { k: 'p', label: 'P&L', r: true, v: <Pnl v={pnl} /> }, { k: 'pp', label: 'P&L %', r: true, v: <Pnl v={pnl} p={pct} /> },
      ],
      action: <Button variant="danger" onClick={e => { e.stopPropagation(); onClose(p.sym) }} aria-label={`Close position ${p.sym}`}>Close</Button>,
    }
  })
  return <Grid rows={rows} label="Positions" mobile={mobile} empty="No open positions." onRow={onRow} />
}

export function OpenOrders({ s, mobile, onCancel, onRow }: { s: State; mobile: boolean; onCancel: (id: number) => void; onRow: (sym: string) => void }) {
  const rows = s.orders.map(o => {
    const i = inst(o.sym)
    return {
      key: o.id, sym: o.sym,
      cols: [
        { k: 'sym', label: 'Instrument', v: <b>{o.sym}</b> }, { k: 't', label: 'Time', v: hms(o.t) }, { k: 's', label: 'Side', v: <Side s={o.side} /> }, { k: 'ty', label: 'Type', v: cap(o.type) },
        { k: 'p', label: o.type === 'stop' ? 'Stop price' : 'Price', r: true, v: num(o.price, i.dec) }, { k: 'q', label: 'Size', r: true, v: num(o.qty, i.qdec) },
        { k: 'd', label: 'Last', r: true, v: num(s.mk[o.sym].price, i.dec) }, { k: 'v', label: 'Value', r: true, v: usd(o.price * o.qty) },
      ],
      action: <Button variant="ghost" onClick={e => { e.stopPropagation(); onCancel(o.id) }} aria-label={`Cancel order ${o.side} ${o.qty} ${o.sym}`}>Cancel</Button>,
    }
  })
  return <Grid rows={rows} label="Open orders" mobile={mobile} empty="No open orders." onRow={onRow} />
}

export function History({ s, mobile }: { s: State; mobile: boolean }) {
  const rows = s.history.slice(0, 40).map(f => {
    const i = inst(f.sym)
    return {
      key: f.id,
      cols: [
        { k: 'sym', label: 'Instrument', v: <b>{f.sym}</b> }, { k: 't', label: 'Time', v: hms(f.t) }, { k: 's', label: 'Side', v: <Side s={f.side} /> }, { k: 'ty', label: 'Type', v: cap(f.type) },
        { k: 'p', label: 'Price', r: true, v: num(f.price, i.dec) }, { k: 'q', label: 'Size', r: true, v: num(f.qty, i.qdec) }, { k: 'f', label: 'Fee', r: true, v: usd(f.fee) },
        { k: 'st', label: 'Status', r: true, v: <span className={f.status === 'Filled' ? '' : 'muted'}>{f.status}</span> },
      ],
    }
  })
  return <Grid rows={rows} label="Order history" mobile={mobile} empty="No orders yet." />
}

export function Balances({ s, mobile }: { s: State; mobile: boolean }) {
  const res = reserved(s)
  const rows = [
    { key: 'USD', cols: [{ k: 'sym', label: 'Asset', v: <b>USD</b> }, { k: 't', label: 'Total', r: true, v: usd(s.cash) }, { k: 'a', label: 'Available', r: true, v: usd(s.cash - res.cash) }, { k: 'o', label: 'In orders', r: true, v: usd(res.cash) }, { k: 'v', label: 'Value (USD)', r: true, v: usd(s.cash) }] },
    ...s.positions.map(p => {
      const i = inst(p.sym)
      return { key: p.sym, cols: [{ k: 'sym', label: 'Asset', v: <b>{base(p.sym)}</b> }, { k: 't', label: 'Total', r: true, v: num(heldQty(s, p.sym), i.qdec) }, { k: 'a', label: 'Available', r: true, v: num(availQty(s, p.sym), i.qdec) }, { k: 'o', label: 'In orders', r: true, v: num(res.qty(p.sym), i.qdec) }, { k: 'v', label: 'Value (USD)', r: true, v: usd(p.qty * s.mk[p.sym].price) }] }
    }),
  ]
  return <Grid rows={rows} label="Balances" mobile={mobile} empty="No balances." />
}
