import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Series } from './data'

export function useSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const ref = useCallback((n: T | null) => setEl(n), [])
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return { ref, ...size }
}

function niceTicks(lo: number, hi: number, count = 4) {
  if (hi - lo < 1e-9) hi = lo + 1
  const raw = (hi - lo) / count, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step
  const t: number[] = []
  for (let v = a; v <= b + step / 2; v += step) t.push(+v.toFixed(10))
  return t
}

const Tip = ({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) => (
  <div className="ex-tip" style={{ left: x, top: y, transform: `translate(${x > w * 0.6 ? 'calc(-100% - 14px)' : '14px'}, 0)` }}>{children}</div>
)

/* ------------------------------------------------------------------ Sparkline */
export function Sparkline({ data, w = 76, h = 28 }: { data: number[]; w?: number; h?: number }) {
  if (data.length < 2) return null
  const mn = Math.min(...data), mx = Math.max(...data), rg = mx - mn || 1
  const X = (i: number) => 2 + (i / (data.length - 1)) * (w - 4)
  const Y = (v: number) => 3 + (1 - (v - mn) / rg) * (h - 6)
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="ex-spark">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r="2.2" fill="currentColor" />
    </svg>
  )
}

/* ------------------------------------------------------------------ Trend with plan line and forecast band */
export function TrendChart({ s, fmt, axis, names = ['Actual', 'Plan'], forecastName = 'Forecast', label }: { s: Series; fmt: (v: number) => string; axis: (v: number) => string; names?: [string, string]; forecastName?: string; label: string }) {
  const { ref, w, h } = useSize<HTMLDivElement>()
  const [hi, setHi] = useState<number | null>(null)
  const n = s.labels.length
  const ml = w < 480 ? 46 : 54, mr = 14, mt = 10, mb = 24
  const pw = Math.max(10, w - ml - mr), ph = Math.max(10, h - mt - mb)
  const vals = [...s.actual, ...s.plan, ...(s.lo.filter(x => x !== null) as number[]), ...(s.hi.filter(x => x !== null) as number[])]
  const mn = Math.min(...vals), mx = Math.max(...vals), pad = (mx - mn || 1) * 0.1
  const ticks = niceTicks(mn - pad, mx + pad, h < 240 ? 3 : 4)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const X = (i: number) => ml + (i / (n - 1)) * pw
  const Y = (v: number) => mt + ph - ((v - y0) / (y1 - y0)) * ph
  const path = (arr: (number | null)[], from = 0) => arr.map((v, i) => (v === null || i < from ? '' : `${i === from ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`)).join('')
  const act = s.actual.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('')
  const area = `${act}L${X(s.nA - 1).toFixed(1)} ${Y(y0).toFixed(1)}L${X(0).toFixed(1)} ${Y(y0).toFixed(1)}Z`
  const hasFc = s.fc.some(v => v !== null) && s.nA < n
  const band = hasFc ? s.lo.map((v, i) => (v === null ? '' : `${i === s.nA - 1 ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`)).join('') + [...s.hi.keys()].reverse().map(i => (s.hi[i] === null ? '' : `L${X(i).toFixed(1)} ${Y(s.hi[i]!).toFixed(1)}`)).join('') + 'Z' : ''
  const nl = Math.max(2, Math.min(n, Math.floor(pw / 96)))
  const stepL = Math.max(1, Math.ceil(n / nl))
  const xi = Array.from({ length: n }, (_, i) => i).filter(i => i % stepL === 0)
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHi(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left - ml) / pw) * (n - 1)))))
  }
  const isA = hi !== null && hi < s.nA
  const v = hi === null ? null : isA ? s.actual[hi] : s.fc[hi]
  const pl = hi === null ? null : s.plan[hi]
  const gid = 'trend' + label.replace(/\W/g, '')
  return (
    <div ref={ref} className="ex-chart" role="img" aria-label={label}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} onPointerMove={move} onPointerLeave={() => setHi(null)}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
          </defs>
          {ticks.map(t => (
            <g key={t}>
              <line x1={ml} x2={w - mr} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
              <text x={ml - 8} y={Y(t)} textAnchor="end" dominantBaseline="middle" className="ex-axis">{axis(t)}</text>
            </g>
          ))}
          {xi.map(i => <text key={i} x={X(i)} y={h - 6} textAnchor={i === 0 ? 'start' : 'middle'} className="ex-axis">{s.labels[i]}</text>)}
          {hasFc && <path d={band} fill="var(--accent)" opacity="0.13" />}
          <path d={area} fill={`url(#${gid})`} />
          <path d={s.plan.map((v2, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v2).toFixed(1)}`).join('')} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 4" />
          {hasFc && <path d={path(s.fc, s.nA - 1)} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 3" />}
          <path d={act} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {hi !== null && v !== null && (
            <g pointerEvents="none">
              <line x1={X(hi)} x2={X(hi)} y1={mt} y2={mt + ph} stroke="var(--text-3)" />
              <circle cx={X(hi)} cy={Y(v)} r="4" fill="var(--accent)" stroke="var(--s1)" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {hi !== null && v !== null && pl !== null && (
        <Tip x={X(hi)} y={Math.max(0, Y(v) - 20)} w={w}>
          <div className="ex-tip-h">{s.full[hi]}</div>
          <div className="ex-tip-r"><span>{isA ? names[0] : forecastName}</span><b className="num">{fmt(v)}</b></div>
          <div className="ex-tip-r"><span>{names[1]}</span><b className="num">{fmt(pl)}</b></div>
          {isA && <div className="ex-tip-r"><span>Variance</span><b className="num">{v - pl >= 0 ? '+' : '−'}{fmt(Math.abs(v - pl))}</b></div>}
        </Tip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Horizontal bars with plan marker */
export type BarRow = { name: string; act: number; plan?: number; sub?: string }
export function HBars({ rows, fmt, delta = true, costs }: { rows: BarRow[]; fmt: (v: number) => string; delta?: boolean; costs?: boolean }) {
  const max = Math.max(...rows.map(r => Math.max(r.act, r.plan ?? 0))) * 1.04 || 1
  return (
    <ul className="ex-hbars" role="list">
      {rows.map(r => {
        const d = r.plan ? ((r.act - r.plan) / r.plan) * 100 : null
        const good = d === null ? true : costs ? d <= 0 : d >= 0
        return (
          <li key={r.name} className="ex-hbar">
            <span className="ex-hbar-l truncate">{r.name}</span>
            <svg className="ex-hbar-t" height="14" aria-hidden="true">
              <rect width="100%" height="8" y="3" rx="4" fill="var(--s3)" />
              <rect width={`${(r.act / max) * 100}%`} height="8" y="3" rx="4" fill="var(--accent)" />
              {r.plan !== undefined && <rect x={`${(r.plan / max) * 100}%`} width="2" height="14" rx="1" fill="var(--text)" opacity="0.85" />}
            </svg>
            <span className="ex-hbar-v num">{fmt(r.act)}</span>
            {delta && (
              <span className={`ex-hbar-d num ${d === null ? 'faint' : good ? 'up' : 'down'}`}>
                {d === null ? '' : `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}%`}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------ Headcount line over attrition bars */
export function HeadcountChart({ labels, hc, attr, label }: { labels: string[]; hc: number[]; attr: number[]; label: string }) {
  const { ref, w, h } = useSize<HTMLDivElement>()
  const [hi, setHi] = useState<number | null>(null)
  const n = labels.length
  const ml = w < 480 ? 46 : 54, mr = 14, mt = 8, mb = 22
  const gap = 28
  const bh = Math.max(40, (h - mt - mb) * 0.3), lh = Math.max(40, h - mt - mb - bh - gap)
  const pw = Math.max(10, w - ml - mr)
  const mn = Math.min(...hc), mx = Math.max(...hc), pad = (mx - mn || 1) * 0.15
  const ticks = niceTicks(mn - pad, mx + pad, 3)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const step = pw / n
  const cx = (i: number) => ml + step * (i + 0.5)
  const Y = (v: number) => mt + lh - ((v - y0) / (y1 - y0)) * lh
  const am = Math.max(...attr) * 1.15
  const by = mt + lh + gap
  const line = hc.map((v, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('')
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHi(Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left - ml) / step))))
  }
  return (
    <div ref={ref} className="ex-chart" role="img" aria-label={label}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} onPointerMove={move} onPointerLeave={() => setHi(null)}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={ml} x2={w - mr} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
              <text x={ml - 8} y={Y(t)} textAnchor="end" dominantBaseline="middle" className="ex-axis">{(t / 1000).toFixed(1)}k</text>
            </g>
          ))}
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          {hc.map((v, i) => <circle key={i} cx={cx(i)} cy={Y(v)} r={hi === i ? 4 : 2.5} fill="var(--accent)" />)}
          {attr.map((v, i) => {
            const bhh = (v / am) * bh
            return <rect key={i} x={cx(i) - Math.min(14, step * 0.3)} width={Math.min(28, step * 0.6)} y={by + bh - bhh} height={bhh} rx="3" fill={hi === i ? 'var(--text-2)' : 'var(--s4)'} />
          })}
          <text x={ml - 8} y={by + 4} textAnchor="end" dominantBaseline="middle" className="ex-axis">{am.toFixed(0)}%</text>
          <line x1={ml} x2={w - mr} y1={by + bh} y2={by + bh} stroke="var(--line)" />
          {labels.map((l, i) => (n <= 8 || i % 2 === n % 2 ? <text key={i} x={cx(i)} y={h - 5} textAnchor="middle" className="ex-axis">{l}</text> : null))}
        </svg>
      )}
      {hi !== null && (
        <Tip x={cx(hi)} y={Y(hc[hi]) - 10} w={w}>
          <div className="ex-tip-h">{labels[hi]}</div>
          <div className="ex-tip-r"><span>Headcount</span><b className="num">{Math.round(hc[hi]).toLocaleString('en-US')}</b></div>
          <div className="ex-tip-r"><span>Attrition</span><b className="num">{attr[hi].toFixed(1)}%</b></div>
        </Tip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Signed columns */
export function ColumnChart({ data, fmt, axis, label }: { data: { label: string; full: string; v: number }[]; fmt: (v: number) => string; axis: (v: number) => string; label: string }) {
  const { ref, w, h } = useSize<HTMLDivElement>()
  const [hi, setHi] = useState<number | null>(null)
  const n = data.length
  const ml = w < 480 ? 46 : 54, mr = 14, mt = 10, mb = 24
  const pw = Math.max(10, w - ml - mr), ph = Math.max(10, h - mt - mb)
  const mn = Math.min(0, ...data.map(d => d.v)), mx = Math.max(0, ...data.map(d => d.v))
  const ticks = niceTicks(mn, mx, 4)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const Y = (v: number) => mt + ph - ((v - y0) / (y1 - y0)) * ph
  const step = pw / n
  const bw = Math.min(34, step * 0.6)
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setHi(Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left - ml) / step))))
  }
  return (
    <div ref={ref} className="ex-chart" role="img" aria-label={label}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} onPointerMove={move} onPointerLeave={() => setHi(null)}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={ml} x2={w - mr} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? 'var(--line-strong)' : 'var(--line)'} />
              <text x={ml - 8} y={Y(t)} textAnchor="end" dominantBaseline="middle" className="ex-axis">{axis(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const top = Y(Math.max(0, d.v)), bot = Y(Math.min(0, d.v))
            return <rect key={i} x={ml + step * i + (step - bw) / 2} width={bw} y={top} height={Math.max(1, bot - top)} rx="3" fill={d.v >= 0 ? 'var(--accent)' : 'var(--danger)'} opacity={hi === null || hi === i ? 1 : 0.55} />
          })}
          {data.map((d, i) => (n <= 8 || i % 2 === 0 ? <text key={i} x={ml + step * (i + 0.5)} y={h - 6} textAnchor="middle" className="ex-axis">{d.label}</text> : null))}
        </svg>
      )}
      {hi !== null && (
        <Tip x={ml + step * (hi + 0.5)} y={Math.max(0, Y(Math.max(0, data[hi].v)) - 10)} w={w}>
          <div className="ex-tip-h">{data[hi].full}</div>
          <div className="ex-tip-r"><span>Net cash flow</span><b className="num">{data[hi].v >= 0 ? '+' : '−'}{fmt(Math.abs(data[hi].v))}</b></div>
        </Tip>
      )}
    </div>
  )
}
