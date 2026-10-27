import { useId, useMemo, type ReactNode } from 'react'
import type { Motif } from './data'

/* Procedural, deterministic imagery. Colour is content: muted, harmonious palettes per destination. */
type Pal = { sky: [string, string, string]; sun: string; far: string; mid: string; near: string; warm: string; cool: string; ink: string }
const PALS: Record<string, Pal> = {
  ember: { sky: ['#3a2b3a', '#b9776a', '#f0c49a'], sun: '#f7dcae', far: '#c98b78', mid: '#8f5a5c', near: '#4a2f3b', warm: '#e8b78a', cool: '#7d97a1', ink: '#2a1d28' },
  tide: { sky: ['#27414d', '#6f98a2', '#d2dfd0'], sun: '#f5ecd2', far: '#8fb0b2', mid: '#4f7f8c', near: '#2a4a58', warm: '#e6c48c', cool: '#4f86a0', ink: '#16303b' },
  glacier: { sky: ['#243746', '#6e8fa3', '#c9d9de'], sun: '#f2f4ef', far: '#a3bac5', mid: '#6b8798', near: '#2c4252', warm: '#d9b48e', cool: '#9db6c4', ink: '#17252f' },
  ochre: { sky: ['#4a3322', '#c28e55', '#f2d3a1'], sun: '#f9e6bc', far: '#d4a46c', mid: '#b4794a', near: '#6d4430', warm: '#e8c38a', cool: '#7a9a8a', ink: '#32211a' },
  ochre2: { sky: ['#3d3a3a', '#c79a6b', '#f0d9b5'], sun: '#fbeed0', far: '#d8b184', mid: '#b9895b', near: '#5d4638', warm: '#ecc999', cool: '#5f94a6', ink: '#2a211d' },
  bone: { sky: ['#37495c', '#8fa9b8', '#e4e2d8'], sun: '#fbf5e4', far: '#d8d4c6', mid: '#b4ae9f', near: '#6b6a68', warm: '#e9dcc0', cool: '#3f6f94', ink: '#222a33' },
  moss: { sky: ['#2c3a35', '#6e8774', '#c4cdb2'], sun: '#eef0d6', far: '#92a88c', mid: '#587462', near: '#26382f', warm: '#d6c08a', cool: '#6f9aa0', ink: '#16231d' },
  plum: { sky: ['#1f1d33', '#5a4f7c', '#c7a6b7'], sun: '#f4e0d2', far: '#7f6a93', mid: '#4a4062', near: '#241f3a', warm: '#f0c47c', cool: '#6c82a8', ink: '#141226' },
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})` }
const f = (n: number) => Math.round(n * 10) / 10
const W = 400, H = 300

function ridge(r: () => number, base: number, amp: number, rough = 0.55, k = 6): number[] {
  const n = 2 ** k, ys = new Array(n + 1).fill(0)
  ys[0] = (r() - 0.5) * amp; ys[n] = (r() - 0.5) * amp
  let step = n, a = amp
  while (step > 1) { const h = step / 2; for (let i = h; i < n; i += step) ys[i] = (ys[i - h] + ys[i + h]) / 2 + (r() - 0.5) * a; a *= rough; step = h }
  return ys.map(v => base + v)
}
const area = (ys: number[], bottom = H) => `M0,${bottom} ` + ys.map((y, i) => `L${f((i / (ys.length - 1)) * W)},${f(y)}`).join(' ') + ` L${W},${bottom}Z`

type Ctx = { r: () => number; p: Pal; id: string; v: number }

const Sky = ({ c, to = 1 }: { c: Ctx; to?: number }) => (
  <>
    <defs><linearGradient id={c.id + 'sky'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.p.sky[0]} /><stop offset={0.55 * to} stopColor={c.p.sky[1]} /><stop offset={to} stopColor={c.p.sky[2]} /></linearGradient></defs>
    <rect width={W} height={H} fill={`url(#${c.id}sky)`} />
  </>
)
const Sun = ({ c, x, y, rad }: { c: Ctx; x: number; y: number; rad: number }) => (
  <>
    <defs><radialGradient id={c.id + 'sun'}><stop offset="0" stopColor={c.p.sun} stopOpacity=".6" /><stop offset="1" stopColor={c.p.sun} stopOpacity="0" /></radialGradient></defs>
    <circle cx={x} cy={y} r={rad * 4.5} fill={`url(#${c.id}sun)`} />
    <circle cx={x} cy={y} r={rad} fill={c.p.sun} opacity=".95" />
  </>
)
const sunPos = (c: Ctx) => [90 + ((c.v * 97) % 220), 70 + ((c.v * 31) % 40)] as const

function Coast(c: Ctx) {
  const { r, p } = c
  const [sx, sy] = sunPos(c)
  const sea = 150 + (c.v % 3) * 8
  const cliff = ridge(r, 175, 70, 0.5).map((y, i, a) => y - Math.max(0, 1 - i / (a.length * 0.55)) * 90 + (i / a.length) * 40)
  const houses = []
  for (let i = 0; i < 16; i++) {
    const x = 6 + r() * 150, y = 150 + r() * 60 - (150 - x) * 0.1
    const w = 12 + r() * 14, h = 9 + r() * 10
    houses.push(<g key={i}><rect x={f(x)} y={f(y)} width={f(w)} height={f(h)} fill={mix(p.warm, '#ffffff', r() * 0.35)} opacity=".92" /><path d={`M${f(x - 1)},${f(y)} L${f(x + w / 2)},${f(y - 5)} L${f(x + w + 1)},${f(y)}Z`} fill={p.mid} /></g>)
  }
  return (
    <>
      <Sky c={c} /><Sun c={c} x={sx} y={sy} rad={17} />
      <path d={area(ridge(r, 128, 26, 0.5))} fill={p.far} opacity=".7" />
      <defs><linearGradient id={c.id + 'sea'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.cool} /><stop offset="1" stopColor={p.near} /></linearGradient></defs>
      <rect y={sea} width={W} height={H - sea} fill={`url(#${c.id}sea)`} />
      {Array.from({ length: 22 }, (_, i) => { const y = sea + 6 + i * 6.5, w = 14 + r() * 50, x = r() * W; return <rect key={i} x={f(x)} y={f(y)} width={f(w)} height="1.4" rx=".7" fill={p.sun} opacity={f(0.1 + r() * 0.22)} /> })}
      <path d={area(cliff)} fill={p.mid} />
      {houses}
      <path d={area(ridge(r, 262, 16, 0.5).map((y, i, a) => y + (i / a.length) * 10))} fill={p.near} />
      <path d={`M${290 + c.v * 6},${sea + 28} l22,0 l-11,-30z`} fill={p.sun} opacity=".9" /><rect x={f(300 + c.v * 6)} y={sea + 28} width="3" height="8" fill={p.ink} opacity=".0" />
    </>
  )
}

function Alpine(c: Ctx) {
  const { r, p } = c
  const far = ridge(r, 125, 120, 0.6).map((y, i, a) => y - Math.sin((i / a.length) * Math.PI) * 40)
  const mid = ridge(r, 170, 70, 0.58)
  const trees = []
  for (let i = 0; i < 60; i++) {
    const x = r() * W, y = 232 + r() * 56 + (i % 3) * 4, h = 14 + r() * 18
    trees.push(<path key={i} d={`M${f(x)},${f(y)} l${f(h * 0.28)},0 l-${f(h * 0.14)},-${f(h * 0.5)} l${f(h * 0.12)},0 l-${f(h * 0.12 - 0.5)},-${f(h * 0.5)} l-${f(h * 0.14)},${f(h * 0.5)} l${f(h * 0.12)},0z`} fill={mix(p.near, p.ink, r() * 0.6)} />)
  }
  const [sx, sy] = sunPos(c)
  return (
    <>
      <Sky c={c} /><Sun c={c} x={sx} y={sy - 20} rad={14} />
      <path d={area(far)} fill={p.far} />
      <path d={area(far.map(y => y + 11))} fill="#ffffff" opacity=".16" />
      <path d={area(mid)} fill={p.mid} />
      <path d={area(mid.map(y => y + 40))} fill={p.near} opacity=".5" />
      <rect x="0" y="236" width={W} height="70" fill={p.near} />
      {trees}
      <g transform={`translate(${60 + c.v * 40},232)`}><rect width="22" height="12" fill={p.warm} /><path d="M-3,0 L11,-9 L25,0Z" fill={p.ink} /><rect x="14" y="3" width="4" height="4" fill={p.sun} /></g>
    </>
  )
}

function City(c: Ctx, night = false) {
  const { r, p } = c
  const [sx, sy] = sunPos(c)
  const layer = (base: number, fill: string, hMin: number, hMax: number, lit: boolean) => {
    const out: ReactNode[] = []
    let x = -6
    while (x < W) {
      const w = 16 + r() * 28, h = hMin + r() * (hMax - hMin)
      out.push(<rect key={`${base}${x}`} x={f(x)} y={f(base - h)} width={f(w)} height={f(h + 40)} fill={fill} />)
      if (r() > 0.78) out.push(<path key={`d${base}${x}`} d={`M${f(x + 2)},${f(base - h)} q${f(w / 2 - 2)},-${f(w * 0.7)} ${f(w - 4)},0z`} fill={fill} />)
      if (lit) for (let wy = base - h + 8; wy < base - 6; wy += 9) for (let wx = x + 4; wx < x + w - 4; wx += 8) if (r() > (night ? 0.45 : 0.7)) out.push(<rect key={`w${wx}${wy}${base}`} x={f(wx)} y={f(wy)} width="3" height="4" fill={night ? p.warm : p.sun} opacity={night ? 0.85 : 0.35} />)
      x += w + r() * 3
    }
    return out
  }
  return (
    <>
      <Sky c={c} to={night ? 0.9 : 1} />
      {night ? <circle cx={sx} cy={sy - 10} r="13" fill={p.sun} opacity=".92" /> : <Sun c={c} x={sx} y={sy + 20} rad={20} />}
      {night && Array.from({ length: 26 }, (_, i) => <circle key={i} cx={f(r() * W)} cy={f(r() * 110)} r={f(0.5 + r() * 0.9)} fill="#fff" opacity={f(0.3 + r() * 0.5)} />)}
      {layer(215, p.far, 40, 95, false)}
      {layer(248, p.mid, 30, 80, true)}
      <rect y="250" width={W} height="60" fill={p.near} />
      {night && <rect y="250" width={W} height="60" fill={p.cool} opacity=".18" />}
      {!night && Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 52 - 10},300 l24,-${28 + (i % 3) * 8} l30,${28 + (i % 3) * 8}z`} fill={mix(p.warm, p.mid, 0.3 + (i % 3) * 0.2)} opacity=".95" />)}
    </>
  )
}

function Desert(c: Ctx) {
  const { r, p } = c
  const [sx, sy] = sunPos(c)
  const palms = [0, 1, 2].map(i => {
    const x = 40 + r() * 320, y = 232 + r() * 20, h = 40 + r() * 26
    return (
      <g key={i} stroke={p.ink} strokeLinecap="round" fill="none" opacity=".85">
        <path d={`M${f(x)},${f(y)} q${f(r() * 8 - 4)},-${f(h / 2)} ${f(r() * 6 - 3)},-${f(h)}`} strokeWidth="2.4" />
        {Array.from({ length: 6 }, (_, k) => { const a = (k / 5) * Math.PI - Math.PI; return <path key={k} d={`M${f(x)},${f(y - h)} q${f(Math.cos(a) * 14)},${f(Math.sin(a) * 10 - 2)} ${f(Math.cos(a) * 24)},${f(Math.sin(a) * 6 + 12)}`} strokeWidth="1.6" /> })}
      </g>
    )
  })
  return (
    <>
      <Sky c={c} /><Sun c={c} x={sx} y={sy + 25} rad={26} />
      <path d={area(ridge(r, 150, 40, 0.5))} fill={p.far} opacity=".7" />
      <path d={area(ridge(r, 190, 34, 0.5))} fill={p.far} />
      <g fill={p.warm}><rect x="250" y="176" width="40" height="40" /><path d="M250,176 q20,-26 40,0z" /><rect x="296" y="190" width="24" height="26" /><rect x="228" y="196" width="18" height="20" /></g>
      <path d={area(ridge(r, 222, 30, 0.5))} fill={p.mid} />
      <path d={area(ridge(r, 262, 24, 0.5))} fill={p.near} />
      {palms}
    </>
  )
}

function Islands(c: Ctx) {
  const { r, p } = c
  const [sx, sy] = sunPos(c)
  const horizon = 150
  const village = []
  for (let i = 0; i < 20; i++) {
    const x = 210 + r() * 150, y = 150 + r() * 38 + (x - 210) * 0.1, w = 12 + r() * 12, h = 8 + r() * 10
    village.push(<g key={i}><rect x={f(x)} y={f(y)} width={f(w)} height={f(h)} fill="#f4f1ea" /><rect x={f(x)} y={f(y + h - 2)} width={f(w)} height="2" fill={p.far} opacity=".6" />{r() > 0.8 && <path d={`M${f(x + 2)},${f(y)} a${f(w / 2 - 2)},${f(w / 2 - 2)} 0 0 1 ${f(w - 4)},0z`} fill={p.cool} />}</g>)
  }
  return (
    <>
      <Sky c={c} to={0.9} /><Sun c={c} x={sx} y={sy + 10} rad={18} />
      <defs><linearGradient id={c.id + 'sea'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.cool} /><stop offset="1" stopColor={p.sky[0]} /></linearGradient></defs>
      <rect y={horizon} width={W} height={H - horizon} fill={`url(#${c.id}sea)`} />
      {Array.from({ length: 18 }, (_, i) => <rect key={i} x={f(r() * W)} y={f(horizon + 8 + i * 8)} width={f(18 + r() * 60)} height="1.4" rx=".7" fill={p.sun} opacity={f(0.1 + r() * 0.2)} />)}
      <path d={`M40,${horizon} q30,-20 70,-6 q20,6 40,6z`} fill={p.far} opacity=".8" />
      <path d={`M0,${H} L0,200 Q80,170 160,196 Q190,160 260,148 Q330,140 ${W},170 L${W},${H}Z`} fill={p.warm} opacity=".92" />
      <path d={`M${W},${H} L${W},175 Q330,150 270,160 L250,${H}Z`} fill={p.mid} opacity=".5" />
      {village}
      <path d={`M0,${H} L0,252 Q120,232 240,262 Q320,282 ${W},262 L${W},${H}Z`} fill={p.mid} />
      <path d={`M0,${H} L0,282 Q140,268 260,288 Q330,296 ${W},284 L${W},${H}Z`} fill={p.near} />
    </>
  )
}

function Forest(c: Ctx) {
  const { r, p } = c
  const [sx, sy] = sunPos(c)
  const row = (y: number, fill: string, n: number, hMin: number, hMax: number) => Array.from({ length: n }, (_, i) => {
    const x = (i / n) * W + r() * 14, h = hMin + r() * (hMax - hMin), w = h * 0.42
    return <path key={`${y}${i}`} d={`M${f(x)},${y} l${f(w / 2)},-${f(h * 0.45)} l-${f(w * 0.2)},0 l${f(w * 0.2 + 1)},-${f(h * 0.3)} l-${f(w * 0.18)},0 l${f(w * 0.18)},-${f(h * 0.25)} l${f(w * 0.2)},${f(h * 0.25)} l-${f(w * 0.18)},0 l${f(w * 0.2 + 1)},${f(h * 0.3)} l-${f(w * 0.2)},0 l${f(w / 2)},${f(h * 0.45)}z`} fill={fill} />
  })
  return (
    <>
      <Sky c={c} /><Sun c={c} x={sx} y={sy - 8} rad={13} />
      <path d={area(ridge(r, 150, 50, 0.55))} fill={p.far} opacity=".75" />
      <path d={area(ridge(r, 180, 40, 0.55))} fill={mix(p.far, p.mid, 0.5)} />
      {row(205, mix(p.mid, p.far, 0.3), 30, 40, 66)}
      <rect y="214" width={W} height="26" fill={p.cool} opacity=".55" />
      {row(238, p.mid, 26, 56, 92)}
      <rect y="238" width={W} height="70" fill={p.near} />
      {row(300, p.near, 18, 90, 150)}
      {row(300, p.ink, 9, 120, 190)}
    </>
  )
}

function Room(c: Ctx) {
  const { r, p } = c
  const [sx] = sunPos(c)
  return (
    <>
      <rect width={W} height={H} fill={mix(p.far, '#ffffff', 0.3)} />
      <rect y="228" width={W} height="72" fill={mix(p.mid, p.ink, 0.35)} />
      <g transform="translate(120,40)">
        <rect width="160" height="140" fill={p.sky[1]} />
        <rect width="160" height="140" fill={`url(#${c.id}win)`} />
        <circle cx={f(40 + (sx % 90))} cy="44" r="14" fill={p.sun} opacity=".9" />
        <path d={`M0,140 L0,98 Q40,80 80,96 Q120,108 160,90 L160,140Z`} fill={p.mid} />
        <rect x="78" width="4" height="140" fill={mix(p.far, '#fff', 0.5)} /><rect y="68" width="160" height="4" fill={mix(p.far, '#fff', 0.5)} />
        <rect width="160" height="140" fill="none" stroke={mix(p.far, '#fff', 0.5)} strokeWidth="6" />
      </g>
      <defs><linearGradient id={c.id + 'win'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} stopOpacity=".5" /><stop offset="1" stopColor={p.sky[2]} stopOpacity=".1" /></linearGradient></defs>
      <rect x="40" y="206" width="320" height="40" rx="6" fill={mix(p.near, p.ink, 0.2)} />
      <rect x="48" y="176" width="304" height="46" rx="10" fill={mix(p.warm, '#fff', 0.5)} />
      <rect x="54" y="170" width="110" height="26" rx="9" fill="#f4f1ea" /><rect x="172" y="170" width="110" height="26" rx="9" fill="#f4f1ea" />
      <rect x="48" y="196" width="304" height="30" rx="6" fill={p.cool} opacity=".85" />
      <circle cx="372" cy="150" r="30" fill={p.warm} opacity=".25" /><rect x="368" y="160" width="8" height="66" fill={p.ink} opacity=".6" />
    </>
  )
}

function Detail(c: Ctx) {
  const { r, p } = c
  const cols = 5
  return (
    <>
      <rect width={W} height={H} fill={mix(p.far, '#ffffff', 0.25)} />
      {Array.from({ length: cols }, (_, i) => {
        const w = W / cols, x = i * w
        return <g key={i}><path d={`M${f(x + 6)},300 L${f(x + 6)},${f(110 + r() * 10)} a${f(w / 2 - 6)},${f(w / 2 - 6)} 0 0 1 ${f(w - 12)},0 L${f(x + w - 6)},300Z`} fill={mix(p.mid, p.near, i / cols)} /><path d={`M${f(x + 18)},300 L${f(x + 18)},${f(120)} a${f(w / 2 - 18)},${f(w / 2 - 18)} 0 0 1 ${f(w - 36)},0 L${f(x + w - 18)},300Z`} fill={i % 2 ? p.sun : p.warm} opacity=".55" /></g>
      })}
      <rect y="268" width={W} height="32" fill={p.near} />
    </>
  )
}

export function Art({ motif, pal, seed = 1, variant = 0, className, label }: { motif: Motif; pal: string; seed?: number; variant?: number; className?: string; label?: string }) {
  const id = useId().replace(/:/g, '')
  const node = useMemo(() => {
    const c: Ctx = { r: rng(seed * 7919 + variant * 104729 + 17), p: PALS[pal] ?? PALS.tide, id, v: variant + seed }
    switch (motif) {
      case 'coast': return Coast(c)
      case 'alpine': return Alpine(c)
      case 'city': return City(c)
      case 'nightcity': return City(c, true)
      case 'desert': return Desert(c)
      case 'islands': return Islands(c)
      case 'forest': return Forest(c)
      case 'room': return Room(c)
      default: return Detail(c)
    }
  }, [motif, pal, seed, variant, id])
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ display: 'block', width: '100%', height: '100%' }}>
      {node}
    </svg>
  )
}
