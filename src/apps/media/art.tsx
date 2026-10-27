import { useId, useMemo, type ReactNode } from 'react'

/* Procedural, deterministic imagery. Colour here is CONTENT (muted, harmonious palettes). */
export type Pal = { sky: [string, string, string]; sun: string; far: string; near: string; ink: string }
export const PALS: Record<string, Pal> = {
  ember:   { sky: ['#2a2030', '#8a5a58', '#e0a97f'], sun: '#f4d2a4', far: '#d39a74', near: '#4b2f38', ink: '#241a22' },
  glacier: { sky: ['#1d2b36', '#56717f', '#b4c6cb'], sun: '#eaeee9', far: '#94acb6', near: '#233443', ink: '#16212b' },
  moss:    { sky: ['#1f2b27', '#4a6050', '#aab99a'], sun: '#e4e7c9', far: '#86a083', near: '#24352b', ink: '#16201b' },
  tide:    { sky: ['#17252d', '#3b5f6e', '#a3c3c6'], sun: '#eef0e2', far: '#7ea3ab', near: '#1c3340', ink: '#101c23' },
  bone:    { sky: ['#2c2a28', '#827a6e', '#ddd4c2'], sun: '#f6efdf', far: '#cfc5b2', near: '#4a463f', ink: '#23211e' },
  plum:    { sky: ['#241f2d', '#5f4d70', '#c7a8b8'], sun: '#f1d9d0', far: '#9a82a8', near: '#2e2638', ink: '#1b1722' },
  ochre:   { sky: ['#2b2418', '#80622f', '#e0be7e'], sun: '#f7e4b4', far: '#d2aa66', near: '#4a3718', ink: '#231c10' },
}

export type Motif =
  | 'dunes' | 'mountains' | 'ocean' | 'architecture' | 'forest' | 'nightcity' | 'road' | 'window'
  | 'orbit' | 'tide' | 'arcs' | 'slats' | 'tiles'

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const h2 = (h: string) => h[0] === 'r' ? (h.match(/\d+/g) as string[]).map(Number) : [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mix = (a: string, b: string, t: number) => { const x = h2(a), y = h2(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})` }
const f = (n: number) => Math.round(n * 10) / 10

type Ctx = { r: () => number; W: number; H: number; p: Pal; id: string }
type Stop = [number, string, number?]
const Grad = ({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: Stop[]; x2?: number; y2?: number }) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>{stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}</linearGradient>
)
const Sky = ({ c, to = 1 }: { c: Ctx; to?: number }) => (
  <>
    <defs><Grad id={c.id + 'sky'} stops={[[0, c.p.sky[0]], [0.55 * to, c.p.sky[1]], [to, c.p.sky[2]]]} /></defs>
    <rect width={c.W} height={c.H} fill={`url(#${c.id}sky)`} />
  </>
)
const Sun = ({ c, x, y, rad }: { c: Ctx; x: number; y: number; rad: number }) => (
  <>
    <defs><radialGradient id={c.id + 'sun'}><stop offset="0" stopColor={c.p.sun} stopOpacity=".55" /><stop offset="1" stopColor={c.p.sun} stopOpacity="0" /></radialGradient></defs>
    <circle cx={x} cy={y} r={rad * 5} fill={`url(#${c.id}sun)`} />
    <circle cx={x} cy={y} r={rad} fill={c.p.sun} opacity=".95" />
  </>
)

function ridge(r: () => number, W: number, base: number, amp: number, rough = 0.52, k = 7): number[] {
  const n = 2 ** k, ys = new Array(n + 1).fill(0)
  ys[0] = (r() - 0.5) * amp; ys[n] = (r() - 0.5) * amp
  let step = n, a = amp
  while (step > 1) {
    const half = step / 2
    for (let i = half; i < n; i += step) ys[i] = (ys[i - half] + ys[i + half]) / 2 + (r() - 0.5) * a
    a *= rough; step = half
  }
  return ys.map(v => base + v)
}
const area = (ys: number[], W: number, H: number) => `M0,${H} ` + ys.map((y, i) => `L${f((i / (ys.length - 1)) * W)},${f(y)}`).join(' ') + ` L${W},${H}Z`

/* ----------------------------------------------------------- landscapes */
function Dunes(c: Ctx) {
  const { r, W, H, p, id } = c
  const sx = W * (0.2 + 0.6 * r()), layers = 5, out: ReactNode[] = []
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1), base = H * (0.5 + i * 0.105), amp = H * (0.14 - i * 0.012), ph = r() * 6, k = 0.7 + r() * 0.6 + i * 0.18, ph2 = r() * 6
    const pts: string[] = []
    for (let x = 0; x <= W; x += 10) {
      const crest = 1 - Math.pow(Math.abs(Math.sin((x / W) * Math.PI * k + ph)), 0.7)
      pts.push(`${x},${f(base - amp * (0.75 * crest + 0.25 * Math.sin((x / W) * 5 + ph2)))}`)
    }
    const d = `M0,${H} L${pts.join(' L')} L${W},${H}Z`, col = mix(p.far, p.near, 0.12 + t * 0.88)
    out.push(
      <g key={i}>
        <defs><Grad id={`${id}d${i}`} stops={[[0, col], [1, mix(col, p.ink, 0.45)]]} /><Grad id={`${id}e${i}`} x2={1} y2={0} stops={[[0, p.ink, 0], [0.55, p.ink, 0.0], [1, p.ink, 0.28]]} /></defs>
        <path d={d} fill={`url(#${id}d${i})`} /><path d={d} fill={`url(#${id}e${i})`} />
        <path d={`M${pts.join(' L')}`} fill="none" stroke={p.sun} strokeOpacity={0.22 - t * 0.12} strokeWidth="1.5" />
      </g>)
  }
  return <><Sky c={c} />{<Sun c={c} x={sx} y={H * (0.24 + 0.1 * r())} rad={H * 0.075} />}{out}</>
}

function Mountains(c: Ctx) {
  const { r, W, H, p, id } = c, out: ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    const t = i / 4, base = H * (0.46 + i * 0.1), amp = H * (0.5 - i * 0.07), ys = ridge(r, W, base, amp, 0.55, 7).map(y => Math.min(y, H * 0.97))
    const col = mix(p.far, p.near, 0.1 + t * 0.9)
    out.push(
      <g key={i}>
        <defs><Grad id={`${id}m${i}`} stops={[[0, mix(col, p.sky[2], 0.18)], [1, col]]} /><Grad id={`${id}h${i}`} stops={[[0, p.sky[2], 0], [1, p.sky[2], 0.5 - t * 0.25]]} /></defs>
        <path d={area(ys, W, H)} fill={`url(#${id}m${i})`} />
        <rect y={base - amp * 0.35} width={W} height={amp * 0.6 + H * 0.12} fill={`url(#${id}h${i})`} />
      </g>)
  }
  return <><Sky c={c} />{r() > 0.35 && <Sun c={c} x={W * (0.15 + 0.7 * r())} y={H * 0.26} rad={H * 0.05} />}{out}</>
}

function Ocean(c: Ctx) {
  const { r, W, H, p, id } = c, hz = H * (0.52 + 0.08 * r()), sx = W * (0.3 + 0.4 * r())
  const bands = Array.from({ length: 16 }, (_, i) => { const t = i / 15, y = hz + 4 + t * t * (H - hz - 4), w = 30 + t * 340 + r() * 40; return <rect key={i} x={sx - w / 2} y={y} width={w} height={2 + t * 5} rx="2" fill={p.sun} opacity={0.5 - t * 0.35} /> })
  const waves = Array.from({ length: 26 }, (_, i) => { const t = r(), y = hz + 8 + t * t * (H - hz - 10), w = 60 + t * 260; return <rect key={i} x={r() * W - w / 2} y={y} width={w} height={1 + t * 2} fill={p.sky[2]} opacity={0.12 + t * 0.1} /> })
  const head = ridge(r, W, hz - H * 0.015, H * 0.05, 0.5, 6).map((y, i, a) => (i < a.length * 0.45 ? Math.min(y, hz) : hz))
  return (
    <>
      <Sky c={c} to={Math.min(1, hz / H + 0.12)} />
      <Sun c={c} x={sx} y={hz - H * 0.05} rad={H * 0.06} />
      <path d={area(head, W, hz)} fill={mix(p.far, p.near, 0.55)} opacity=".85" />
      <defs><Grad id={id + 'sea'} stops={[[0, mix(p.sky[1], p.sky[2], 0.5)], [0.35, p.sky[1]], [1, p.near]]} /></defs>
      <rect y={hz} width={W} height={H - hz} fill={`url(#${id}sea)`} />
      {bands}{waves}
    </>
  )
}

function Architecture(c: Ctx) {
  const { r, W, H, p, id } = c, ground = H * 0.9, out: ReactNode[] = []
  const n = 4 + Math.floor(r() * 2)
  const slabs = Array.from({ length: n }, (_, i) => ({ i, d: r(), w: W * (0.2 + r() * 0.22), x: (i / n) * W * 0.85 + (r() - 0.2) * 70, h: H * (0.34 + r() * 0.46) })).sort((a, b) => a.d - b.d)
  slabs.forEach(({ i, d, w, x, h }) => {
    const y = ground - h, lit = w * (0.55 + r() * 0.15), haze = 0.45 * (1 - d), floors = Math.floor(h / 40)
    const base = mix(p.far, p.sky[2], haze)
    out.push(
      <g key={i}>
        <defs>
          <Grad id={`${id}l${i}`} stops={[[0, mix(base, p.sun, 0.25)], [1, mix(base, p.near, 0.35 + 0.2 * d)]]} />
          <Grad id={`${id}s${i}`} stops={[[0, mix(p.near, p.far, 0.3 + haze)], [1, mix(p.near, p.ink, 0.5)]]} />
        </defs>
        <rect x={x} y={y} width={lit} height={h} fill={`url(#${id}l${i})`} />
        <rect x={x + lit} y={y} width={w - lit} height={h} fill={`url(#${id}s${i})`} />
        {Array.from({ length: floors }, (_, k) => (k % 3 === 2 ? null : <rect key={k} x={x + 10} y={y + 16 + k * 40} width={lit - 20} height="7" fill={p.ink} opacity={0.38 + 0.2 * d} />))}
        {Array.from({ length: floors }, (_, k) => <rect key={'b' + k} x={x} y={y + 40 + k * 40} width={w} height="1.5" fill={p.ink} opacity=".1" />)}
        <rect x={x + lit - 1} y={y} width="2" height={h} fill={p.sun} opacity=".18" />
      </g>)
  })
  return (
    <>
      <Sky c={c} /><Sun c={c} x={W * (0.6 + 0.3 * r())} y={H * 0.17} rad={H * 0.04} />
      {out}
      <defs><Grad id={id + 'gr'} stops={[[0, mix(p.near, p.ink, 0.35)], [1, p.ink]]} /><Grad id={id + 'sh'} x2={1} y2={0} stops={[[0, p.ink, 0.55], [1, p.ink, 0]]} /><Grad id={id + 'hz'} stops={[[0, p.sky[2], 0], [1, p.sky[2], 0.28]]} /></defs>
      <rect y={H * 0.45} width={W} height={ground - H * 0.45} fill={`url(#${id}hz)`} />
      <rect y={ground} width={W} height={H - ground} fill={`url(#${id}gr)`} />
      <polygon points={`0,${ground} ${W * 0.5},${ground} ${W * 0.16},${H} 0,${H}`} fill={`url(#${id}sh)`} />
    </>
  )
}

function Forest(c: Ctx) {
  const { r, W, H, p, id } = c, out: ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    const t = i / 4, base = H * (0.58 + i * 0.1), th = H * (0.2 + t * 0.2), sp = 46 - i * 6, col = mix(p.far, p.near, 0.15 + t * 0.85), trees: ReactNode[] = []
    for (let x = -20; x < W + 20; x += sp * (0.7 + r() * 0.6)) {
      const h = th * (0.7 + r() * 0.5), w = h * 0.34, y = base + r() * 8
      trees.push(<polygon key={x} points={`${f(x)},${f(y - h)} ${f(x + w * 0.5)},${f(y - h * 0.5)} ${f(x + w * 0.25)},${f(y - h * 0.5)} ${f(x + w * 0.6)},${f(y - h * 0.18)} ${f(x + w * 0.1)},${f(y - h * 0.18)} ${f(x + w * 0.1)},${f(y)} ${f(x - w * 0.1)},${f(y)} ${f(x - w * 0.1)},${f(y - h * 0.18)} ${f(x - w * 0.6)},${f(y - h * 0.18)} ${f(x - w * 0.25)},${f(y - h * 0.5)} ${f(x - w * 0.5)},${f(y - h * 0.5)}`} />)
    }
    out.push(
      <g key={i}>
        <rect y={base - th * 0.4} width={W} height={H} fill={col} />
        <g fill={col}>{trees}</g>
        <defs><Grad id={`${id}f${i}`} stops={[[0, p.sky[2], 0], [0.5, p.sky[2], 0.42 - t * 0.2], [1, p.sky[2], 0.05]]} /></defs>
        <rect y={base - th * 1.1} width={W} height={th * 1.7} fill={`url(#${id}f${i})`} />
      </g>)
  }
  return <><Sky c={c} /><Sun c={c} x={W * (0.3 + 0.4 * r())} y={H * 0.22} rad={H * 0.05} />{out}</>
}

/* ----------------------------------------------------------- film-only scenes */
function NightCity(c: Ctx) {
  const { r, W, H, p, id } = c, hz = H * 0.74, out: ReactNode[] = []
  for (let l = 0; l < 2; l++) {
    let x = -10
    while (x < W) {
      const w = 36 + r() * 70, h = H * (0.14 + r() * (0.32 - l * 0.12)), col = mix(p.near, p.ink, l ? 0.7 : 0.35)
      out.push(<g key={`${l}-${x}`}><rect x={x} y={hz - h} width={w} height={h} fill={col} />
        {Array.from({ length: Math.floor((w / 12) * (h / 16) * 0.18) }, (_, k) => <rect key={k} x={x + 5 + Math.floor(r() * (w / 10)) * 9} y={hz - h + 8 + Math.floor(r() * (h / 14)) * 12} width="4" height="5" fill={p.sun} opacity={0.35 + r() * 0.5} />)}</g>)
      x += w + r() * 6
    }
  }
  return (
    <>
      <Sky c={c} to={0.8} /><Sun c={c} x={W * 0.78} y={H * 0.2} rad={H * 0.045} />
      {out}
      <defs><Grad id={id + 'w'} stops={[[0, p.ink], [1, p.near]]} /></defs>
      <rect y={hz} width={W} height={H - hz} fill={`url(#${id}w)`} />
      {Array.from({ length: 30 }, (_, i) => <rect key={i} x={r() * W} y={hz + 4 + r() * (H - hz - 8)} width={10 + r() * 60} height="1.5" fill={p.sun} opacity={0.08 + r() * 0.14} />)}
    </>
  )
}

function Road(c: Ctx) {
  const { r, W, H, p, id } = c, hz = H * 0.52, vx = W * (0.46 + r() * 0.08), hills = ridge(r, W, hz - H * 0.04, H * 0.1, 0.55, 7).map(y => Math.min(y, hz))
  return (
    <>
      <Sky c={c} to={hz / H + 0.1} /><Sun c={c} x={vx} y={hz - H * 0.07} rad={H * 0.06} />
      <path d={area(hills, W, hz + 2)} fill={mix(p.far, p.near, 0.6)} />
      <defs><Grad id={id + 'g'} stops={[[0, mix(p.near, p.far, 0.2)], [1, p.ink]]} /><Grad id={id + 'r'} stops={[[0, mix(p.ink, p.far, 0.25)], [1, p.ink]]} /></defs>
      <rect y={hz} width={W} height={H - hz} fill={`url(#${id}g)`} />
      <polygon points={`${vx - 5},${hz} ${vx + 5},${hz} ${W * 0.98},${H} ${W * 0.02},${H}`} fill={`url(#${id}r)`} />
      {Array.from({ length: 7 }, (_, i) => { const t = (i + 1) / 8, y = hz + (H - hz) * t * t, w = 2 + t * t * 18, hh = 4 + t * t * 56; return <polygon key={i} points={`${vx - w / 2},${y} ${vx + w / 2},${y} ${vx + w / 2 + 1},${y + hh} ${vx - w / 2 - 1},${y + hh}`} fill={p.sun} opacity={0.55 * t + 0.2} /> })}
      {Array.from({ length: 6 }, (_, i) => { const t = (i + 1) / 7, y = hz + (H - hz) * t * t, x = vx + (W * 0.5) * t * t * 1.05 + 8; return <rect key={i} x={x} y={y - 60 * t * t - 6} width={2 + 4 * t * t} height={60 * t * t + 6} fill={p.ink} /> })}
    </>
  )
}

function Window(c: Ctx) {
  const { r, W, H, p, id } = c, wx = W * (0.14 + r() * 0.1), ww = W * 0.34, wy = H * 0.1, wh = H * 0.62
  return (
    <>
      <defs>
        <Grad id={id + 'wall'} x2={1} y2={0.4} stops={[[0, mix(p.far, p.ink, 0.45)], [1, mix(p.near, p.ink, 0.35)]]} />
        <Grad id={id + 'lt'} stops={[[0, p.sun, 0.55], [1, p.sun, 0.04]]} />
        <Grad id={id + 'fl'} stops={[[0, mix(p.near, p.ink, 0.4)], [1, p.ink]]} />
      </defs>
      <rect width={W} height={H} fill={`url(#${id}wall)`} />
      <rect y={H * 0.78} width={W} height={H * 0.22} fill={`url(#${id}fl)`} />
      <polygon points={`${wx},${wy + wh} ${wx + ww},${wy + wh} ${wx + ww * 1.9},${H} ${wx + ww * 0.5},${H}`} fill={`url(#${id}lt)`} opacity=".7" />
      <rect x={wx - 10} y={wy - 10} width={ww + 20} height={wh + 20} fill={p.ink} />
      <Grad id={id + 'ws'} stops={[[0, p.sky[1]], [1, p.sky[2]]]} />
      <rect x={wx} y={wy} width={ww} height={wh} fill={`url(#${id}ws)`} />
      <rect x={wx + ww / 2 - 4} y={wy} width="8" height={wh} fill={p.ink} /><rect x={wx} y={wy + wh * 0.45} width={ww} height="8" fill={p.ink} />
    </>
  )
}

/* ----------------------------------------------------------- album art */
function Orbit(c: Ctx) {
  const { r, W, p, id } = c, cx = W * (0.4 + r() * 0.2), cy = W * (0.4 + r() * 0.2)
  return (
    <>
      <defs><Grad id={id + 'bg'} stops={[[0, p.sky[0]], [1, mix(p.sky[1], p.near, 0.3)]]} /></defs>
      <rect width={W} height={W} fill={`url(#${id}bg)`} />
      {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={cx + i * 9} cy={cy - i * 6} r={W * (0.42 - i * 0.055)} fill={mix(p.far, p.near, i / 7)} opacity={0.9 - i * 0.04} />)}
      <circle cx={cx + 66} cy={cy - 44} r={W * 0.07} fill={p.sun} />
    </>
  )
}
function Tide(c: Ctx) {
  const { r, W, p, id } = c
  return (
    <>
      <defs><Grad id={id + 'bg'} stops={[[0, p.sky[0]], [1, p.sky[1]]]} /></defs>
      <rect width={W} height={W} fill={`url(#${id}bg)`} />
      {Array.from({ length: 9 }, (_, i) => {
        const y = W * (0.18 + i * 0.1), ph = r() * 6, a = 14 + r() * 26, pts: string[] = []
        for (let x = 0; x <= W; x += 20) pts.push(`${x},${f(y + Math.sin(x / 140 + ph) * a)}`)
        return <path key={i} d={`M0,${W} L${pts.join(' L')} L${W},${W}Z`} fill={mix(p.sky[2], p.near, i / 8)} opacity={0.9} />
      })}
    </>
  )
}
function Arcs(c: Ctx) {
  const { r, W, p, id } = c, cx = W / 2, cy = W * 0.72
  return (
    <>
      <defs><Grad id={id + 'bg'} stops={[[0, mix(p.near, p.ink, 0.3)], [1, p.near]]} /></defs>
      <rect width={W} height={W} fill={`url(#${id}bg)`} />
      {Array.from({ length: 6 }, (_, i) => { const rad = W * (0.14 + i * 0.075); return <path key={i} d={`M${cx - rad},${cy} A${rad},${rad} 0 0 1 ${cx + rad},${cy}`} fill="none" stroke={mix(p.sky[2], p.far, i / 6)} strokeWidth={W * 0.04} strokeOpacity={0.95 - i * 0.08} /> })}
      <circle cx={cx + (r() - 0.5) * 80} cy={cy - W * 0.04} r={W * 0.06} fill={p.sun} />
      <rect y={cy} width={W} height={W - cy} fill={p.ink} opacity=".55" />
    </>
  )
}
function Slats(c: Ctx) {
  const { r, W, p, id } = c
  return (
    <>
      <defs><Grad id={id + 'bg'} stops={[[0, p.sky[0]], [0.6, p.sky[1]], [1, p.sky[2]]]} /></defs>
      <rect width={W} height={W} fill={`url(#${id}bg)`} />
      <circle cx={W / 2} cy={W * (0.52 + r() * 0.08)} r={W * 0.26} fill={p.sun} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} y={W * 0.5 + i * W * 0.045} width={W} height={W * (0.006 + i * 0.004)} fill={mix(p.sky[1], p.near, i / 12)} />)}
      <rect y={W * 0.82} width={W} height={W * 0.18} fill={p.near} />
    </>
  )
}
function Tiles(c: Ctx) {
  const { r, W, p, id } = c, n = 4, s = W / n
  return (
    <>
      <rect width={W} height={W} fill={mix(p.ink, p.near, 0.4)} />
      {Array.from({ length: n * n }, (_, i) => {
        const x = (i % n) * s, y = Math.floor(i / n) * s, t = r()
        return <rect key={i} x={x + 8} y={y + 8} width={s - 16} height={s - 16} rx={r() > 0.5 ? s * 0.5 : 10} fill={mix(p.far, p.sky[2], t)} opacity={0.35 + r() * 0.6} />
      })}
      <defs><Grad id={id + 'v'} stops={[[0, p.sky[0], 0.5], [1, p.ink, 0]]} /></defs>
      <rect width={W} height={W} fill={`url(#${id}v)`} />
    </>
  )
}

const SCENES: Record<Motif, (c: Ctx) => ReactNode> = {
  dunes: Dunes, mountains: Mountains, ocean: Ocean, architecture: Architecture, forest: Forest, nightcity: NightCity, road: Road, window: Window,
  orbit: Orbit, tide: Tide, arcs: Arcs, slats: Slats, tiles: Tiles,
}

export function Art({ motif, pal, seed, ratio, vignette, className }: { motif: Motif; pal: string; seed: number; ratio: number; vignette?: boolean; className?: string }) {
  const raw = useId(), id = 'a' + raw.replace(/[^a-z0-9]/gi, '')
  const W = 1000, H = Math.round(W / ratio)
  const scene = useMemo(() => SCENES[motif]({ r: rng(seed), W, H, p: PALS[pal], id }), [motif, pal, seed, H, id])
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false">
      {scene}
      {vignette && <><defs><radialGradient id={id + 'vg'} cx=".5" cy=".5" r=".75"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".42" /></radialGradient></defs><rect width={W} height={H} fill={`url(#${id}vg)`} /></>}
    </svg>
  )
}
