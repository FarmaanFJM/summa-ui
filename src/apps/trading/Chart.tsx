import { useCallback, useEffect, useRef, useState } from 'react'
import { IconButton, MenuButton, Tabs } from '../../ui'
import { TFS, type Candle, type TF } from './engine'

function useSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const ref = useCallback((n: T | null) => setEl(n), [])
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return { ref, el, ...size }
}

function niceTicks(lo: number, hi: number, count: number) {
  const raw = (hi - lo) / count || 1, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
  const t: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-12; v += step) t.push(v)
  return t
}
const sma = (c: Candle[], n: number) => c.map((_, i) => (i < n - 1 ? null : c.slice(i - n + 1, i + 1).reduce((s, x) => s + x.c, 0) / n))
const pad2 = (n: number) => String(n).padStart(2, '0')
const timeLabel = (t: number, tf: TF) => { const d = new Date(t); return tf === '1D' ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCDate()}` : `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}` }
const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0))

export type Indicators = { sma20: boolean; sma50: boolean; volume: boolean }

export function Chart({ candles, tf, onTf, dec, ind, onInd }: { candles: Candle[]; tf: TF; onTf: (t: TF) => void; dec: number; ind: Indicators; onInd: (i: Indicators) => void }) {
  const { ref, el, w, h } = useSize<HTMLDivElement>()
  const [cnt, setCnt] = useState<number | null>(null)
  const [off, setOff] = useState(0)
  const [cross, setCross] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ x: number; off: number } | null>(null)
  const defCount = w < 520 ? 44 : 80
  const count = cnt ?? defCount
  const setCount = (f: number | ((c: number) => number)) => setCnt(typeof f === 'function' ? f(count) : f)
  const n = candles.length
  const ml = 6, mr = 62, mt = 8, mb = 22
  const pw = Math.max(10, w - ml - mr), ph = Math.max(10, h - mt - mb)
  const slot = pw / count
  const end = Math.max(1, n - off), start = Math.max(0, end - count)
  const vis = candles.slice(start, end)
  const volH = ind.volume ? ph * 0.18 : 0
  const priceH = ph - volH - (ind.volume ? 6 : 0)

  useEffect(() => { setOff(0); setCnt(null) }, [tf])
  const defCountRef = useRef(defCount)
  defCountRef.current = defCount
  useEffect(() => {
    if (!el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      setCnt(c => Math.round(Math.max(20, Math.min(160, (c ?? defCountRef.current) * (e.deltaY > 0 ? 1.12 : 0.89)))))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [el])

  const s20 = ind.sma20 ? sma(candles, 20) : null, s50 = ind.sma50 ? sma(candles, 50) : null
  let lo = Infinity, hi = -Infinity, vmax = 0
  vis.forEach(c => { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); vmax = Math.max(vmax, c.v) })
  const pad = (hi - lo) * 0.08 || hi * 0.001
  lo -= pad; hi += pad
  const Y = (v: number) => mt + priceH - ((v - lo) / (hi - lo)) * priceH
  const X = (k: number) => ml + pw - (end - 1 - k + 0.5) * slot
  const ticks = niceTicks(lo, hi, Math.max(3, Math.floor(priceH / 54)))
  const last = candles[n - 1]
  const idxAt = (x: number) => Math.max(start, Math.min(end - 1, end - 1 - Math.round((ml + pw - x) / slot - 0.5)))
  const hov = cross ? candles[idxAt(cross.x)] : null
  const shown = hov ?? last
  const up = shown.c >= shown.o
  const chg = ((shown.c - shown.o) / shown.o) * 100
  const bw = Math.max(1, Math.min(14, slot * 0.66))
  const lblEvery = Math.max(1, Math.ceil(90 / slot))

  const down = (e: React.PointerEvent<SVGSVGElement>) => { drag.current = { x: e.clientX, off }; e.currentTarget.setPointerCapture(e.pointerId) }
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (drag.current) {
      const d = Math.round((e.clientX - drag.current.x) / slot)
      setOff(Math.max(0, Math.min(n - 10, drag.current.off + d)))
      if (e.pointerType !== 'mouse') return
    }
    setCross({ x: e.clientX - r.left, y: e.clientY - r.top })
  }
  const upEv = () => { drag.current = null }
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setOff(o => Math.min(n - 10, o + 5))
    if (e.key === 'ArrowRight') setOff(o => Math.max(0, o - 5))
    if (e.key === '+' || e.key === '=') setCount(c => Math.max(20, Math.round(c * 0.8)))
    if (e.key === '-') setCount(c => Math.min(160, Math.round(c * 1.25)))
  }

  const smaPath = (arr: (number | null)[]) => {
    let d = ''
    for (let k = start; k < end; k++) { const v = arr[k]; if (v === null || v === undefined) continue; d += `${d ? 'L' : 'M'}${X(k).toFixed(1)} ${Y(v).toFixed(1)}` }
    return d
  }
  const f = (v: number) => v.toFixed(dec)

  return (
    <div className="tr-chart">
      <div className="tr-chart-bar">
        <Tabs label="Timeframe" items={TFS.map(t => ({ value: t, label: t }))} value={tf} onChange={onTf} />
        <MenuButton icon="sliders" label="Indicators" placement="bottom-start" items={[
          { type: 'heading', label: 'Indicators' },
          { label: 'SMA 20', checked: ind.sma20, onSelect: () => onInd({ ...ind, sma20: !ind.sma20 }) },
          { label: 'SMA 50', checked: ind.sma50, onSelect: () => onInd({ ...ind, sma50: !ind.sma50 }) },
          { label: 'Volume', checked: ind.volume, onSelect: () => onInd({ ...ind, volume: !ind.volume }) },
        ]} />
        {(off > 0 || cnt !== null) && <IconButton icon="refresh" label="Reset zoom" size="sm" onClick={() => { setOff(0); setCnt(null) }} />}
        <div className="tr-ohlc num" aria-live="off">
          <span className="faint">O</span> {f(shown.o)} <span className="faint">H</span> {f(shown.h)} <span className="faint">L</span> {f(shown.l)} <span className="faint">C</span> <span className={up ? 'tr-up' : 'tr-down'}>{f(shown.c)}</span>
          <span className={up ? 'tr-up' : 'tr-down'}>{chg >= 0 ? '+' : '−'}{Math.abs(chg).toFixed(2)}%</span>
          <span className="faint">Vol</span> {compact(shown.v)}
        </div>
      </div>
      <div ref={ref} className="tr-chart-body">
        {w > 0 && h > 0 && (
          <svg width={w} height={h} tabIndex={0} role="img" aria-label="Candlestick chart. Drag to pan, scroll to zoom, arrow keys to pan." className="tr-svg"
            onPointerDown={down} onPointerMove={move} onPointerUp={upEv} onPointerCancel={upEv} onPointerLeave={() => setCross(null)} onKeyDown={key}>
            {ticks.map(t => (
              <g key={t}>
                <line x1={ml} x2={ml + pw} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
                <text x={w - mr + 8} y={Y(t)} dominantBaseline="middle" className="tr-axis">{f(t)}</text>
              </g>
            ))}
            {vis.map((c, j) => {
              const k = start + j, x = X(k), u = c.c >= c.o, col = u ? 'var(--accent)' : 'var(--danger)'
              const y1 = Y(Math.max(c.o, c.c)), y2 = Y(Math.min(c.o, c.c))
              return (
                <g key={c.t}>
                  {ind.volume && <rect x={x - bw / 2} width={bw} y={mt + ph - (c.v / (vmax || 1)) * volH} height={(c.v / (vmax || 1)) * volH} fill={col} opacity="0.3" />}
                  <line x1={x} x2={x} y1={Y(c.h)} y2={Y(c.l)} stroke={col} strokeWidth="1" />
                  <rect x={x - bw / 2} width={bw} y={y1} height={Math.max(1, y2 - y1)} fill={col} />
                </g>
              )
            })}
            {s20 && <path d={smaPath(s20)} fill="none" stroke="var(--text)" strokeWidth="1.25" opacity="0.8" />}
            {s50 && <path d={smaPath(s50)} fill="none" stroke="var(--warn)" strokeWidth="1.25" opacity="0.9" />}
            {vis.filter((_, j) => (end - 1 - (start + j)) % lblEvery === 0).map((c) => (
              <text key={c.t} x={X(candles.indexOf(c))} y={h - 6} textAnchor="middle" className="tr-axis">{timeLabel(c.t, tf)}</text>
            ))}
            {off === 0 && (
              <g pointerEvents="none">
                <line x1={ml} x2={ml + pw} y1={Y(last.c)} y2={Y(last.c)} stroke={last.c >= last.o ? 'var(--accent)' : 'var(--danger)'} strokeDasharray="2 3" opacity="0.7" />
                <rect x={w - mr + 2} y={Y(last.c) - 9} width={mr - 4} height={18} rx="4" fill={last.c >= last.o ? 'var(--accent)' : 'var(--danger)'} />
                <text x={w - mr + 8} y={Y(last.c)} dominantBaseline="middle" className="tr-tag">{f(last.c)}</text>
              </g>
            )}
            {cross && hov && cross.y < mt + priceH && (
              <g pointerEvents="none">
                <line x1={X(candles.indexOf(hov))} x2={X(candles.indexOf(hov))} y1={mt} y2={mt + ph} stroke="var(--text-3)" strokeDasharray="3 3" />
                <line x1={ml} x2={ml + pw} y1={cross.y} y2={cross.y} stroke="var(--text-3)" strokeDasharray="3 3" />
                <rect x={w - mr + 2} y={cross.y - 9} width={mr - 4} height={18} rx="4" fill="var(--s4)" />
                <text x={w - mr + 8} y={cross.y} dominantBaseline="middle" className="tr-tag" style={{ fill: 'var(--text)' }}>{f(lo + ((mt + priceH - cross.y) / priceH) * (hi - lo))}</text>
              </g>
            )}
            {cross && hov && cross.y >= mt + priceH && (
              <line x1={X(candles.indexOf(hov))} x2={X(candles.indexOf(hov))} y1={mt} y2={mt + ph} stroke="var(--text-3)" strokeDasharray="3 3" pointerEvents="none" />
            )}
          </svg>
        )}
        {cross && hov && <div className="tr-xtime" style={{ left: Math.min(Math.max(X(candles.indexOf(hov)), 30), w - mr - 30) }}>{timeLabel(hov.t, tf)}</div>}
      </div>
    </div>
  )
}
