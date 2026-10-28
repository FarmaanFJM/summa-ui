import { useId, useMemo, type ReactNode } from 'react'

/* Procedural, deterministic imagery for Tidepool. Colour here is CONTENT; the chrome stays neutral. */
export type Pal = { sky: [string, string, string]; sun: string; far: string; mid: string; near: string; ink: string }
export type PalKey = 'tide' | 'ember' | 'moss' | 'plum' | 'bone' | 'ochre' | 'glacier'
export const PALS: Record<PalKey, Pal> = {
  tide:    { sky: ['#17252d', '#3b5f6e', '#a3c3c6'], sun: '#eef0e2', far: '#7ea3ab', mid: '#3f6a78', near: '#1c3340', ink: '#101c23' },
  ember:   { sky: ['#2a2030', '#8a5a58', '#e0a97f'], sun: '#f4d2a4', far: '#d39a74', mid: '#8a5148', near: '#4b2f38', ink: '#241a22' },
  moss:    { sky: ['#1f2b27', '#4a6050', '#aab99a'], sun: '#e4e7c9', far: '#86a083', mid: '#4d6a55', near: '#24352b', ink: '#16201b' },
  plum:    { sky: ['#241f2d', '#5f4d70', '#c7a8b8'], sun: '#f1d9d0', far: '#9a82a8', mid: '#65507a', near: '#2e2638', ink: '#1b1722' },
  bone:    { sky: ['#2c2a28', '#827a6e', '#ddd4c2'], sun: '#f6efdf', far: '#cfc5b2', mid: '#9a907f', near: '#4a463f', ink: '#23211e' },
  ochre:   { sky: ['#2b2418', '#80622f', '#e0be7e'], sun: '#f7e4b4', far: '#d2aa66', mid: '#9a7438', near: '#4a3718', ink: '#231c10' },
  glacier: { sky: ['#1d2b36', '#56717f', '#b4c6cb'], sun: '#eaeee9', far: '#94acb6', mid: '#5b7889', near: '#233443', ink: '#16212b' },
}
export type Motif = 'sea' | 'dunes' | 'peaks' | 'arch' | 'forest' | 'dusk' | 'tide' | 'tiles'
export type Media = { m: Motif; s: number; p: PalKey }

export function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const f = (n: number) => Math.round(n * 10) / 10
const W = 800, H = 600

type Ctx = { r: () => number; p: Pal; id: string }
const Sky = ({ c, to = 1 }: { c: Ctx; to?: number }) => (
  <>
    <defs><linearGradient id={c.id + 'k'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.p.sky[0]} /><stop offset={0.55 * to} stopColor={c.p.sky[1]} /><stop offset={to} stopColor={c.p.sky[2]} /></linearGradient></defs>
    <rect width={W} height={H} fill={`url(#${c.id}k)`} />
  </>
)
const Sun = ({ c, x, y, r }: { c: Ctx; x: number; y: number; r: number }) => (
  <>
    <defs><radialGradient id={c.id + 's'}><stop offset="0" stopColor={c.p.sun} stopOpacity=".55" /><stop offset="1" stopColor={c.p.sun} stopOpacity="0" /></radialGradient></defs>
    <circle cx={x} cy={y} r={r * 5} fill={`url(#${c.id}s)`} />
    <circle cx={x} cy={y} r={r} fill={c.p.sun} opacity=".95" />
  </>
)
const sines = (r: () => number, base: number, amp: number, k = 3) => {
  const ps = Array.from({ length: k }, (_, i) => ({ a: (amp / (i + 1)) * (0.6 + r() * 0.6), f: ((i + 1) * (0.8 + r() * 0.9) * Math.PI * 1.2) / W, p: r() * 6.28 }))
  return (x: number) => base + ps.reduce((s, q) => s + q.a * Math.sin(q.f * x + q.p), 0)
}
const fill = (fn: (x: number) => number, step = 16) => { let d = `M0,${H}`; for (let x = 0; x <= W; x += step) d += `L${x},${f(fn(x))}`; return d + `L${W},${H}Z` }
const jag = (r: () => number, base: number, amp: number) => {
  let d = `M0,${H}L0,${f(base)}`; let x = 0
  while (x < W) { x += 40 + r() * 70; d += `L${f(Math.min(x, W))},${f(base - r() * amp)}` }
  return d + `L${W},${H}Z`
}
const mixHex = (a: string, b: string, t: number) => {
  const x = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), y = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`
}

function draw(m: Motif, c: Ctx): ReactNode {
  const { r, p } = c
  switch (m) {
    case 'sea': {
      const sx = 220 + r() * 360, hy = 330 + r() * 40
      const far = sines(r, hy - 8, 10, 2)
      return (
        <>
          <Sky c={c} to={0.9} /><Sun c={c} x={sx} y={hy - 50 - r() * 40} r={26 + r() * 10} />
          <path d={fill(far)} fill={p.far} opacity=".6" />
          <defs><linearGradient id={c.id + 'w'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.far} /><stop offset="1" stopColor={p.near} /></linearGradient></defs>
          <rect y={hy} width={W} height={H - hy} fill={`url(#${c.id}w)`} />
          {Array.from({ length: 46 }, (_, i) => { const y = hy + 6 + Math.pow(r(), 1.6) * (H - hy - 90); const w = 20 + (y - hy) * 0.45 * r(); return <rect key={i} x={f(sx - w / 2 + (r() - 0.5) * (y - hy) * 0.5)} y={f(y)} width={f(w)} height={2 + (y - hy) / 80} rx="1" fill={p.sun} opacity={0.12 + r() * 0.35} /> })}
          <path d={`M0,${H}L0,${f(H - 60 - r() * 40)}Q${f(120 + r() * 80)},${f(H - 130)} ${f(260 + r() * 60)},${f(H - 70)}Q${f(330)},${H - 40} ${f(400)},${H}Z`} fill={p.ink} />
        </>
      )
    }
    case 'dunes': {
      const layers = [0.38, 0.52, 0.68, 0.84].map((b, i) => ({ fn: sines(r, H * b, 36 - i * 4, 3), col: mixHex(p.far, p.near, i / 3) }))
      return (
        <>
          <Sky c={c} to={0.8} /><Sun c={c} x={160 + r() * 480} y={170 + r() * 70} r={32} />
          {layers.map((l, i) => <g key={i}><path d={fill(l.fn, 12)} fill={l.col} /><path d={fill(l.fn, 12).replace(/^M0,\d+/, 'M0,' + H)} fill="none" /></g>)}
        </>
      )
    }
    case 'peaks': {
      const bases = [300, 380, 460]
      return (
        <>
          <Sky c={c} to={0.85} /><Sun c={c} x={200 + r() * 400} y={160 + r() * 60} r={24} />
          {bases.map((b, i) => <path key={i} d={jag(r, b + 40, 150 - i * 20)} fill={mixHex(p.far, p.near, (i + 0.5) / 3)} />)}
          <defs><linearGradient id={c.id + 'f'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[2]} stopOpacity="0" /><stop offset=".6" stopColor={p.sky[2]} stopOpacity=".26" /><stop offset="1" stopColor={p.sky[2]} stopOpacity="0" /></linearGradient></defs>
          <rect y={280} width={W} height={200} fill={`url(#${c.id}f)`} />
          <path d={jag(r, 560, 70)} fill={p.ink} />
        </>
      )
    }
    case 'arch': {
      const n = 3, w = 190, gap = 40, x0 = (W - (n * w + (n - 1) * gap)) / 2
      return (
        <>
          <Sky c={c} to={1} /><Sun c={c} x={560 + r() * 100} y={170} r={46} />
          <rect y={440} width={W} height={160} fill={p.mid} />
          {Array.from({ length: n }, (_, i) => {
            const x = x0 + i * (w + gap), top = 130 + r() * 120, rr = w / 2 - 30
            return (
              <g key={i}>
                <path d={`M${x},440V${top}H${x + w}V440Z`} fill={mixHex(p.far, p.sky[2], 0.3)} />
                <path d={`M${x + w},${top}l36,-22V420l-36,20Z`} fill={p.mid} />
                <path d={`M${x + 30},440V${top + 110}a${rr},${rr} 0 0 1 ${rr * 2},0V440Z`} fill={p.ink} />
                <path d={`M${x + 30 + rr},440V${top + 110}`} stroke={p.near} strokeWidth="1" opacity=".0" />
                <rect x={x + 30} y={420} width={rr * 2} height={20} fill={p.near} opacity=".5" />
              </g>
            )
          })}
          <rect y={440} width={W} height={10} fill={p.near} opacity=".35" />
        </>
      )
    }
    case 'forest': {
      const rows = [330, 400, 470, 560]
      return (
        <>
          <Sky c={c} to={0.9} /><Sun c={c} x={520 + r() * 100} y={190} r={30} />
          {rows.map((y, ri) => (
            <g key={ri}>
              {Array.from({ length: 16 - ri * 2 }, (_, i) => {
                const x = (i + r() * 0.8) * (W / (15 - ri * 2)) - 20, h = 90 + ri * 40 + r() * 60, w = 30 + ri * 14 + r() * 14
                return <path key={i} d={`M${f(x)},${y}l${f(w / 2)},${-h}l${f(w / 2)},${h}ZM${f(x - 6)},${y - h * 0.35}l${f(w / 2 + 6)},${f(-h * 0.7)}l${f(w / 2 + 6)},${f(h * 0.7)}Z`} fill={mixHex(p.far, p.ink, (ri + 0.4) / 4)} />
              })}
              <rect y={y - 6} width={W} height={H} fill={mixHex(p.far, p.ink, (ri + 0.4) / 4)} />
              {ri < 3 && <rect y={y - 60} width={W} height={80} fill={p.sky[2]} opacity={0.1} />}
            </g>
          ))}
        </>
      )
    }
    case 'dusk': {
      const lit = p.sun
      return (
        <>
          <Sky c={c} to={1} /><Sun c={c} x={200 + r() * 400} y={330} r={40} />
          {[0, 1].map(layer => {
            let x = -10; const els: ReactNode[] = []
            while (x < W) {
              const w = 40 + r() * 70, h = (layer ? 120 : 190) + r() * (layer ? 140 : 190), y = H - h
              els.push(<rect key={x} x={f(x)} y={f(y)} width={f(w)} height={h} fill={layer ? p.ink : p.mid} />)
              if (layer) for (let wy = y + 14; wy < H - 14; wy += 20) for (let wx = x + 8; wx < x + w - 10; wx += 14) if (r() > 0.72) els.push(<rect key={`${x}-${wx}-${wy}`} x={f(wx)} y={f(wy)} width="6" height="9" fill={lit} opacity={0.5 + r() * 0.45} />)
              x += w + 4 + r() * 6
            }
            return <g key={layer}>{els}</g>
          })}
        </>
      )
    }
    case 'tide': {
      return (
        <>
          <defs>
            <linearGradient id={c.id + 'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.near} /><stop offset="1" stopColor={p.ink} /></linearGradient>
            <linearGradient id={c.id + 'p'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[2]} /><stop offset="1" stopColor={p.sky[1]} /></linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${c.id}b)`} />
          {Array.from({ length: 34 }, (_, i) => <circle key={i} cx={f(r() * W)} cy={f(r() * H)} r={f(6 + r() * 30)} fill={mixHex(p.near, p.mid, r() * 0.7)} opacity=".7" />)}
          {Array.from({ length: 3 }, (_, i) => {
            const cx = 160 + i * 240 + r() * 60, cy = 200 + r() * 200, rx = 90 + r() * 70, ry = rx * (0.5 + r() * 0.2)
            return (
              <g key={i}>
                <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx + 12)} ry={f(ry + 10)} fill={p.ink} opacity=".8" />
                <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx)} ry={f(ry)} fill={`url(#${c.id}p)`} />
                {[0.7, 0.45, 0.22].map((k, j) => <ellipse key={j} cx={f(cx + (r() - 0.5) * 14)} cy={f(cy)} rx={f(rx * k)} ry={f(ry * k)} fill="none" stroke={p.sun} strokeWidth="1.5" opacity=".35" />)}
                <circle cx={f(cx - rx * 0.3)} cy={f(cy - ry * 0.3)} r={f(5 + r() * 6)} fill={p.far} />
              </g>
            )
          })}
        </>
      )
    }
    case 'tiles': {
      const cols = [p.far, p.sun, p.near, p.sky[2], p.sky[1], p.mid]
      const T = 200
      return (
        <>
          <rect width={W} height={H} fill={p.sky[0]} />
          {Array.from({ length: 12 }, (_, i) => {
            const x = (i % 4) * T, y = Math.floor(i / 4) * T, a = cols[Math.floor(r() * cols.length)], b = cols[Math.floor(r() * cols.length)], k = Math.floor(r() * 4)
            const flip = Math.floor(r() * 4) * 90
            return (
              <g key={i} transform={`rotate(${flip} ${x + T / 2} ${y + T / 2})`}>
                <rect x={x} y={y} width={T} height={T} fill={b} />
                {k === 0 && <path d={`M${x},${y}h${T}a${T},${T} 0 0 1 -${T},${T}Z`} fill={a} />}
                {k === 1 && <circle cx={x + T / 2} cy={y + T / 2} r={T * 0.34} fill={a} />}
                {k === 2 && <path d={`M${x},${y + T}A${T / 2},${T / 2} 0 0 1 ${x + T},${y + T}Z`} fill={a} />}
                {k === 3 && Array.from({ length: 4 }, (_, j) => <rect key={j} x={x + 16 + j * 44} y={y + 16} width="24" height={T - 32} rx="12" fill={a} />)}
              </g>
            )
          })}
        </>
      )
    }
  }
}

const LABEL: Record<Motif, string> = { sea: 'Sea at the horizon', dunes: 'Rolling dunes', peaks: 'Mountain ridges', arch: 'Arched buildings', forest: 'Forest in mist', dusk: 'City skyline at dusk', tide: 'Rock pools at low tide', tiles: 'Geometric tile print' }

export function Scene({ m, s, p, label }: Media & { label?: string }) {
  const id = useId().replace(/[^a-z0-9]/gi, '')
  const body = useMemo(() => draw(m, { r: rng(s * 7919 + m.length * 131), p: PALS[p], id }), [m, s, p, id])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label ?? LABEL[m]} width="100%" height="100%" style={{ display: 'block' }}>
      {body}
    </svg>
  )
}
