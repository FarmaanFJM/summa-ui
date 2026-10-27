import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import './trading.css'
import { Icon, IconButton, Tabs, useMedia } from '../../ui'
import { Chart, type Indicators } from './Chart'
import { OrderBook, Tape } from './BookTape'
import { emptyForm, OrderEntry, type Draft, type Form } from './Order'
import { Balances, History, OpenOrders, Positions } from './Tables'
import { Watchlist } from './Watchlist'
import { INSTRUMENTS, cancel, closePosition, createState, equity, inst, place, tick, type State, type TF } from './engine'
import { compact, hms, num, sgnPct, sgnUsd, usd } from './fmt'

type Toast = { id: number; msg: string }
type BTab = 'positions' | 'orders' | 'history' | 'balances'
type MTab = BTab | 'book' | 'trades'

export default function Trading() {
  const store = useRef<State | null>(null)
  if (!store.current) store.current = createState()
  const s = store.current
  const [, force] = useReducer((x: number) => x + 1, 0)
  const [paused, setPaused] = useState(false)
  const [sel, setSel] = useState('NVXA')
  const [starred, setStarred] = useState(['NVXA', 'HALO/USD', 'KELP'])
  const [tf, setTf] = useState<TF>('1m')
  const [ind, setInd] = useState<Indicators>({ sma20: true, sma50: false, volume: true })
  const [form, setForm] = useState<Form>(emptyForm)
  const [btab, setBtab] = useState<BTab>('positions')
  const [mtab, setMtab] = useState<MTab>('book')
  const [toast, setToast] = useState<Toast | null>(null)
  const [instSheet, setInstSheet] = useState(false)
  const [orderSheet, setOrderSheet] = useState(false)
  const wide = useMedia('(min-width: 1180px)')
  const mobile = useMedia('(max-width: 819px)')
  const timer = useRef(0)

  const say = useCallback((msg: string) => {
    clearTimeout(timer.current); setToast({ id: Date.now(), msg })
    timer.current = window.setTimeout(() => setToast(null), 4500)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      const done = tick(s)
      if (done.length) { const o = done[0]; say(`${o.type === 'stop' ? 'Stop' : 'Limit'} order filled: ${o.side === 'buy' ? 'bought' : 'sold'} ${o.qty} ${o.sym}`) }
      force()
    }, 700)
    return () => clearInterval(id)
  }, [paused, s, say])

  const select = (sym: string) => { setSel(sym); setInstSheet(false); setForm(f => ({ ...f, price: '' })) }
  const star = (sym: string) => setStarred(l => (l.includes(sym) ? l.filter(x => x !== sym) : [...l, sym]))
  const submit = (d: Draft) => { const r = place(s, d); if (r.ok) { say(r.msg); setOrderSheet(false) } force(); return r }
  const onCancel = (id: number) => { cancel(s, id); say('Order cancelled'); force() }
  const onClose = (sym: string) => { say(closePosition(s, sym)); force() }
  const pick = (p: number) => { setForm(f => ({ ...f, type: f.type === 'market' ? 'limit' : f.type, price: String(p) })); if (mobile) setOrderSheet(true) }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || document.querySelector('.popover,.backdrop')) return
      const x = e.key.toLowerCase()
      if (x !== 'b' && x !== 's') return
      e.preventDefault()
      setForm(f => ({ ...f, side: x === 'b' ? 'buy' : 'sell' }))
      if (mobile) setOrderSheet(true)
      else setTimeout(() => document.getElementById('tr-size')?.focus(), 0)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [mobile])

  const i = inst(sel), m = s.mk[sel]
  const chg = m.price - m.open24, chgP = (m.price / m.open24 - 1) * 100, up = chg >= 0
  const eq = equity(s), day = eq - s.startEquity
  const movers = [...INSTRUMENTS].sort((a, b) => Math.abs(s.mk[b.sym].price / s.mk[b.sym].open24 - 1) - Math.abs(s.mk[a.sym].price / s.mk[a.sym].open24 - 1))
  const oe = <OrderEntry s={s} sym={sel} form={form} setForm={setForm} onSubmit={submit} sizeId="tr-size" />
  const wl = <Watchlist s={s} sel={sel} onSel={select} starred={starred} onStar={star} />

  const ticker = (aria: boolean) => (
    <div className="tr-marq-in" aria-hidden={aria || undefined}>
      {movers.map(x => {
        const mm = s.mk[x.sym], c = (mm.price / mm.open24 - 1) * 100
        return (
          <button key={x.sym} type="button" tabIndex={aria ? -1 : 0} className="tr-mv" onClick={() => select(x.sym)}>
            <b>{x.sym}</b><span className="num">{num(mm.price, x.dec)}</span><span className={`num ${c >= 0 ? 'tr-up' : 'tr-down'}`}>{sgnPct(c)}</span>
          </button>
        )
      })}
    </div>
  )

  const header = (
    <div className="tr-head">
      <div className="tr-head-id">
        {!wide ? (
          <button type="button" className="tr-switch" onClick={() => setInstSheet(true)} aria-haspopup="dialog" aria-label={`Instrument ${sel}, change`}>
            <b>{sel}</b><Icon name="chevron-down" size={15} />
          </button>
        ) : <b className="tr-sym">{sel}</b>}
        <span className="faint truncate">{i.name}</span>
      </div>
      <div className="tr-head-px">
        <span className="tr-price num">{num(m.price, i.dec)}</span>
        <span className={`tr-chg num ${up ? 'tr-up' : 'tr-down'}`}>{up ? '+' : '−'}{num(Math.abs(chg), i.dec)} ({sgnPct(chgP)})</span>
      </div>
      <dl className="tr-stats num">
        <div><dt>24h high</dt><dd>{num(m.high24, i.dec)}</dd></div>
        <div><dt>24h low</dt><dd>{num(m.low24, i.dec)}</dd></div>
        <div><dt>24h volume</dt><dd>{compact(m.vol24)}</dd></div>
        <div><dt>24h turnover</dt><dd>${compact(m.vol24 * m.price)}</dd></div>
      </dl>
    </div>
  )

  const bottom = (tab: MTab): ReactNode => tab === 'positions' ? <Positions s={s} mobile={mobile} onClose={onClose} onRow={select} /> : tab === 'orders' ? <OpenOrders s={s} mobile={mobile} onCancel={onCancel} onRow={select} /> : tab === 'history' ? <History s={s} mobile={mobile} /> : tab === 'balances' ? <Balances s={s} mobile={mobile} /> : tab === 'book' ? <div className="tr-m-book"><OrderBook s={s} sym={sel} onPick={pick} fixedRows={8} /></div> : <div className="tr-m-tape"><Tape s={s} sym={sel} /></div>
  const counts = { positions: s.positions.length, orders: s.orders.length }

  return (
    <div className={`tr-root ${wide ? 'wide' : mobile ? 'mobile' : 'mid'}`}>
      <header className="tr-top">
        <div className="tr-brand"><span className="brand-mark"><Icon name="layers" size={13} strokeWidth={2.4} /></span><span>Arcline</span></div>
        {!mobile && <div className="tr-marq" role="region" aria-label="Top movers">{ticker(false)}{ticker(true)}</div>}
        {mobile && <div className="grow" />}
        <div className="tr-eq num" aria-label="Account equity">
          <span className="tr-eq-l">Equity</span>
          <b>{usd(eq)}</b>
          <span className={day >= 0 ? 'tr-up' : 'tr-down'}>{sgnUsd(day)}</span>
        </div>
        {!mobile && <span className="tr-clock num" aria-label="Market time">{hms(s.now)} UTC</span>}
        <IconButton icon={paused ? 'play' : 'pause'} label={paused ? 'Resume market feed' : 'Pause market feed'} on={paused} onClick={() => setPaused(p => !p)} />
      </header>
      {mobile && <div className="tr-marq tr-marq-m" role="region" aria-label="Top movers">{ticker(false)}{ticker(true)}</div>}

      <div className="tr-main">
        {wide && <aside className="tr-pane tr-left" aria-label="Watchlist">{wl}</aside>}
        <section className="tr-center">
          <div className="tr-pane">{header}</div>
          <div className="tr-crow">
            <div className="tr-pane tr-chartp"><Chart candles={m.candles[tf]} tf={tf} onTf={setTf} dec={i.dec} ind={ind} onInd={setInd} /></div>
            {!mobile && <div className="tr-pane tr-oep"><div className="tr-pt eyebrow">Order entry</div>{oe}</div>}
          </div>
        </section>
        {!mobile && (
          <aside className="tr-right">
            <div className="tr-pane tr-bookp"><div className="tr-pt eyebrow">Order book</div><OrderBook s={s} sym={sel} onPick={pick} /></div>
            <div className="tr-pane tr-tapep"><div className="tr-pt eyebrow">Recent trades</div><Tape s={s} sym={sel} /></div>
          </aside>
        )}
      </div>

      {!mobile ? (
        <section className="tr-pane tr-bottom" aria-label="Account">
          <div className="tr-bt-bar">
            <Tabs label="Account" flat value={btab} onChange={setBtab} items={[
              { value: 'positions', label: `Positions (${counts.positions})` }, { value: 'orders', label: `Open orders (${counts.orders})` }, { value: 'history', label: 'Order history' }, { value: 'balances', label: 'Balances' },
            ]} />
          </div>
          <div className="tr-bt-body scroll">{bottom(btab)}</div>
        </section>
      ) : (
        <section className="tr-pane tr-mtabs">
          <div className="tr-mt-bar scroll">
            <Tabs label="Market and account" flat value={mtab} onChange={setMtab} items={[
              { value: 'book', label: 'Book' }, { value: 'trades', label: 'Trades' }, { value: 'positions', label: `Positions (${counts.positions})` }, { value: 'orders', label: `Orders (${counts.orders})` }, { value: 'history', label: 'History' }, { value: 'balances', label: 'Balances' },
            ]} />
          </div>
          <div className="tr-mt-body">{bottom(mtab)}</div>
        </section>
      )}

      {mobile && (
        <div className="tr-cta">
          <button type="button" className="tr-submit buy" onClick={() => { setForm(f => ({ ...f, side: 'buy' })); setOrderSheet(true) }}>Buy</button>
          <button type="button" className="tr-submit sell" onClick={() => { setForm(f => ({ ...f, side: 'sell' })); setOrderSheet(true) }}>Sell</button>
        </div>
      )}

      {instSheet && <Sheet title="Instruments" onClose={() => setInstSheet(false)} tall>{wl}</Sheet>}
      {orderSheet && mobile && <Sheet title={`Trade ${sel}`} onClose={() => setOrderSheet(false)}>{oe}</Sheet>}

      {toast && <div className="tr-toast" role="status" key={toast.id}><span>{toast.msg}</span><IconButton icon="x" label="Dismiss" size="sm" onClick={() => setToast(null)} /></div>}
    </div>
  )
}

function Sheet({ title, onClose, children, tall }: { title: string; onClose: () => void; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.backdrop,.popover')) onClose() }
    document.addEventListener('keydown', k)
    ref.current?.focus()
    return () => { document.removeEventListener('keydown', k); prev?.focus() }
  }, [onClose])
  return (
    <div className="tr-sheet-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} tabIndex={-1} className={`tr-sheet ${tall ? 'tall' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="tr-sheet-grab" aria-hidden="true" />
        <div className="tr-sheet-h"><b>{title}</b><IconButton icon="x" label="Close" onClick={onClose} /></div>
        <div className="tr-sheet-b">{children}</div>
      </div>
    </div>
  )
}
