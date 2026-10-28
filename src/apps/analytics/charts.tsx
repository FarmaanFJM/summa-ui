import { useCallback, useEffect, useState } from 'react'
import { dayStr, type Fmt, type Pt } from './data'

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

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}
export function niceTicks(lo: number, hi: number, count = 4) {
  if (hi - lo < 1e-9) { hi = lo + 1 }
  const step = niceStep((hi - lo) / count)
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step
  const t: number[] = []
  for (let v = a; v <= b + step / 2; v += step) t.push(+v.toFixed(10))
  return t
}

const Tip = ({ x, y, w, children }: { x: number; y: number; w: number; children: React.ReactNode }) => {
  const flip = x > w * 0.6
  return <div className="an-tip" style={{ left: x, top: y, transform: `translate(${flip ? 'calc(-100% - 12px)' : '12px'}, 0)` }}>{children}</div>
}

/* ------------------------------------------------------------------ Line / area */
export function LineChart({ cur, prev, fmt, label, labelPrev }: { cur: Pt[]; prev?: Pt[]; fmt: Fmt; label: string; labelPrev: string }) {
  const { ref, w, h } = useSize<HTMLDivElement>()
  const [hi, setHi] = useState<number | null>(null)
  const n = cur.length
  const ml = w < 480 ? 44 : 52, mr = 12, mt = 10, mb = 24
  const pw = Math.max(10, w - ml - mr), ph = Math.max(10, h - mt - mb)
  const all = [...cur, ...(prev ?? [])].map(p => p.v)
  const mn = Math.min(...all), mx = Math.max(...all)
  const pad = (mx - mn || mx * 0.1 || 1) * 0.12
  const ticks = niceTicks(Math.max(0, mn - pad), mx + pad, h < 240 ? 3 : 4)
  const y0 = ticks[0], y1 = ticks[ticks.length - 1]
  const X = (i: number) => ml + (n === 1 ? pw / 2 : (i / (n - 1)) * pw)
  const Y = (v: number) => mt + ph - ((v - y0) / (y1 - y0)) * ph
  const line = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('')
  const nl = Math.max(2, Math.min(7, Math.floor(pw / 84)))
  const xi = n < 2 ? [0] : Array.from(new Set(Array.from({ length: Math.min(nl, n) }, (_, k) => Math.round((k * (n - 1)) / (Math.min(nl, n) - 1)))))
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = n === 1 ? 0 : Math.round(((e.clientX - r.left - ml) / pw) * (n - 1))
    setHi(Math.max(0, Math.min(n - 1, i)))
  }
  const c = hi !== null ? cur[hi] : null, p = hi !== null && prev ? prev[hi] : null
  const rng = (q: Pt) => (q.from === q.to ? dayStr(q.from) : `${dayStr(q.from)} – ${dayStr(q.to)}`)
  const delta = c && p ? ((c.v - p.v) / p.v) * 100 : null

  return (
    <div ref={ref} className="an-chart">
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${label} over time`} tabIndex={0}
          onPointerMove={move} onPointerDown={move} onPointerLeave={e => { if (e.pointerType === 'mouse') setHi(null) }}
          onBlur={() => setHi(null)}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); setHi(i => Math.max(0, (i ?? n) - 1)) }
            if (e.key === 'ArrowRight') { e.preventDefault(); setHi(i => Math.min(n - 1, (i ?? -1) + 1)) }
            if (e.key === 'Escape') setHi(null)
          }}>
          <defs>
            <linearGradient id="an-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map(t => (
            <g key={t}>
              <line x1={ml} x2={w - mr} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
              <text x={ml - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="an-axis">{fmt(t, true)}</text>
            </g>
          ))}
          {xi.map((i, k) => (
            <text key={i} x={X(i)} y={h - 6} textAnchor={k === 0 && xi.length > 1 ? 'start' : k === xi.length - 1 && xi.length > 1 ? 'end' : 'middle'} className="an-axis">{dayStr(cur[i].from)}</text>
          ))}
          {n > 1 && <path d={`${line(cur)}L${X(n - 1)} ${Y(y0)}L${X(0)} ${Y(y0)}Z`} fill="url(#an-area)" />}
          {prev && n > 1 && <path d={line(prev)} fill="none" stroke="var(--text-3)" strokeWidth={1.5} strokeDasharray="4 4" strokeLinejoin="round" />}
          {n > 1 && <path d={line(cur)} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {hi !== null && c && (
            <g pointerEvents="none">
              <line x1={X(hi)} x2={X(hi)} y1={mt} y2={mt + ph} stroke="var(--text-3)" strokeDasharray="2 3" />
              {p && <circle cx={X(hi)} cy={Y(p.v)} r={3.5} fill="var(--s2)" stroke="var(--text-2)" strokeWidth={1.5} />}
              <circle cx={X(hi)} cy={Y(c.v)} r={4} fill="var(--s2)" stroke="var(--accent)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hi !== null && c && (
        <Tip x={X(hi)} y={Math.max(4, Y(c.v) - 36)} w={w}>
          <div className="an-tip-h">{rng(c)}</div>
          <div className="an-tip-r"><i style={{ background: 'var(--accent)' }} />{label}<b>{fmt(c.v)}</b></div>
          {p && <div className="an-tip-r"><i className="dash" />{labelPrev}<b>{fmt(p.v)}</b></div>}
          {delta !== null && <div className="an-tip-f">{delta >= 0 ? '+' : '−'}{Math.abs(delta).toFixed(1)}% vs. {rng(p!)}</div>}
        </Tip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Grouped bars */
export function BarChart({ cats, cur, prev, fmt, label }: { cats: string[]; cur: number[]; prev?: number[]; fmt: Fmt; label: string }) {
  const { ref, w, h } = useSize<HTMLDivElement>()
  const [hi, setHi] = useState<number | null>(null)
  const ml = w < 480 ? 44 : 52, mr = 4, mt = 18, mb = 24
  const pw = Math.max(10, w - ml - mr), ph = Math.max(10, h - mt - mb)
  const mx = Math.max(...cur, ...(prev ?? [0]))
  const ticks = niceTicks(0, mx, h < 240 ? 3 : 4)
  const y1 = ticks[ticks.length - 1]
  const Y = (v: number) => mt + ph - (v / y1) * ph
  const gw = pw / cats.length
  const bw = Math.min(prev ? 22 : 36, (gw - 16) / (prev ? 2 : 1)), gap = prev ? 3 : 0
  const groupW = bw * (prev ? 2 : 1) + gap
  return (
    <div ref={ref} className="an-chart">
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label={label} onPointerLeave={e => { if (e.pointerType === 'mouse') setHi(null) }}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={ml} x2={w - mr} y1={Y(t)} y2={Y(t)} stroke="var(--line)" />
              <text x={ml - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="an-axis">{fmt(t, true)}</text>
            </g>
          ))}
          {cats.map((c, i) => {
            const cx = ml + gw * i + gw / 2, x0 = cx - groupW / 2
            return (
              <g key={c} onPointerMove={() => setHi(i)} onPointerDown={() => setHi(i)}>
                <rect x={ml + gw * i} y={mt} width={gw} height={ph} fill={hi === i ? 'var(--s3)' : 'transparent'} opacity={0.6} rx={6} />
                {prev && <rect x={x0} y={Y(prev[i])} width={bw} height={Math.max(1, mt + ph - Y(prev[i]))} rx={3} fill="var(--text-3)" opacity={0.55} />}
                <rect x={x0 + (prev ? bw + gap : 0)} y={Y(cur[i])} width={bw} height={Math.max(1, mt + ph - Y(cur[i]))} rx={3} fill="var(--accent)" />
                {!prev && <text x={cx} y={Y(cur[i]) - 6} textAnchor="middle" className="an-val">{fmt(cur[i], true)}</text>}
                <text x={cx} y={h - 6} textAnchor="middle" className="an-axis">{c}</text>
              </g>
            )
          })}
        </svg>
      )}
      {hi !== null && (
        <Tip x={ml + gw * hi + gw / 2} y={Math.max(4, Y(Math.max(cur[hi], prev?.[hi] ?? 0)) - 20)} w={w}>
          <div className="an-tip-h">{cats[hi]}</div>
          <div className="an-tip-r"><i style={{ background: 'var(--accent)' }} />Current<b>{fmt(cur[hi])}</b></div>
          {prev && <div className="an-tip-r"><i style={{ background: 'var(--text-3)' }} />Previous<b>{fmt(prev[hi])}</b></div>}
        </Tip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Horizontal breakdown */
export function HBars({ rows, fmt, label }: { rows: { name: string; v: number }[]; fmt: Fmt; label: string }) {
  const { ref, w, h } = useSize<HTMLDivElement>()
  const total = rows.reduce((a, r) => a + r.v, 0)
  const mx = Math.max(...rows.map(r => r.v))
  const rh = Math.max(28, Math.min(48, h / rows.length))
  const lw = w < 360 ? 100 : 114, vw = w < 360 ? 84 : 104
  const bx = lw + 6, bwid = Math.max(20, w - bx - vw - 8)
  return (
    <div ref={ref} className="an-chart an-hbars">
      {w > 0 && (
        <svg width={w} height={rh * rows.length} role="img" aria-label={label}>
          {rows.map((r, i) => {
            const cy = rh * i + rh / 2
            return (
              <g key={r.name}>
                <title>{`${r.name}: ${fmt(r.v)} (${((r.v / total) * 100).toFixed(1)}%)`}</title>
                <text x={0} y={cy} dy="0.32em" className="an-cat">{r.name}</text>
                <rect x={bx} y={cy - 5} width={bwid} height={10} rx={5} fill="var(--s3)" />
                <rect x={bx} y={cy - 5} width={Math.max(6, (r.v / mx) * bwid)} height={10} rx={5} fill="var(--accent)" opacity={i === 0 ? 1 : 0.8} />
                <text x={w - 40} y={cy} dy="0.32em" textAnchor="end" className="an-num">{fmt(r.v, true)}</text>
                <text x={w} y={cy} dy="0.32em" textAnchor="end" className="an-share">{((r.v / total) * 100).toFixed(0)}%</text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Sparkline */
export function Sparkline({ pts, active }: { pts: number[]; active?: boolean }) {
  const W = 64, H = 24
  const mn = Math.min(...pts), mx = Math.max(...pts), span = mx - mn || 1
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${((i / Math.max(1, pts.length - 1)) * W).toFixed(1)} ${(H - 2 - ((v - mn) / span) * (H - 4)).toFixed(1)}`).join('')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="an-spark">
      <path d={d} fill="none" stroke={active ? 'var(--accent)' : 'var(--text-3)'} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

