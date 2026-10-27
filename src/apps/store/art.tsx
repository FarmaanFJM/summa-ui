import { useId } from 'react'

/* Procedural studio renders for Oak & Ember. Colour here is CONTENT: muted, matte, soft light from the upper left. */
export type Kind = 'mug' | 'cup' | 'vase' | 'bowl' | 'lamp' | 'dome' | 'pendant' | 'desklamp' | 'chair' | 'stool' | 'notebook' | 'penpot' | 'tray' | 'tote' | 'backpack' | 'satchel' | 'cushion' | 'throw' | 'plant'
export type Look = { kind: Kind; color: string; accent?: string; frame?: string; seed: number; variant?: number }

export function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const hex = (v: number[]) => '#' + v.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')
const mix = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)) }
const lighten = (h: string, t: number) => mix(h, '#ffffff', t)
const darken = (h: string, t: number) => mix(h, '#000000', t)
export const lum = (h: string) => { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 }
const f = (n: number) => Math.round(n * 10) / 10

const LIGHT_BG = ['#d5cec0', '#cfd2cb', '#d8cdc0', '#cdd1d4']
const DARK_BG = ['#8f8b82', '#868d86', '#918678', '#8a9095']
export function backdrop(l: Look) { const pool = lum(l.color) > 0.5 ? DARK_BG : LIGHT_BG; return pool[l.seed % pool.length] }

type Ctx = { id: string; c: string; a: string; fr: string; r: () => number; v: number }
const cylG = (id: string, base: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor={lighten(base, 0.04)} /><stop offset=".22" stopColor={lighten(base, 0.2)} /><stop offset=".55" stopColor={base} /><stop offset="1" stopColor={darken(base, 0.34)} />
  </linearGradient>
)
const vertG = (id: string, top: string, bot: string) => <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient>
const Shadow = ({ id, cx = 400, cy = 600, rx = 170, ry = 20, o = 0.3 }: { id: string; cx?: number; cy?: number; rx?: number; ry?: number; o?: number }) => (
  <>
    <defs><filter id={id + 'bl'} x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="10" /></filter></defs>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity={o} filter={`url(#${id}bl)`} />
  </>
)
const Gloss = ({ x, y, w, h, o = 0.22 }: { x: number; y: number; w: number; h: number; o?: number }) => <rect x={x} y={y} width={w} height={h} rx={w / 2} fill="#fff" opacity={o} />

function Mug({ id, c, r, kind }: Ctx & { kind: 'mug' | 'cup' }) {
  const small = kind === 'cup'
  const body = 'M290 380 L290 560 Q290 600 330 600 L470 600 Q510 600 510 560 L510 380 Z'
  return (
    <g transform={small ? 'translate(400 600) scale(.74) translate(-400 -600)' : undefined}>
      <Shadow id={id} rx={small ? 200 : 180} />
      <defs>{cylG(id + 'g', c)}<clipPath id={id + 'c'}><path d={body} /></clipPath></defs>
      <path d="M502 430 C 592 424 592 548 496 552" stroke={darken(c, 0.14)} strokeWidth="30" fill="none" strokeLinecap="round" />
      <path d="M504 436 C 580 432 580 540 500 544" stroke={lighten(c, 0.08)} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".5" />
      <path d={body} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>{Array.from({ length: 46 }, (_, i) => <circle key={i} cx={f(290 + r() * 220)} cy={f(380 + r() * 220)} r={f(1 + r() * 2.4)} fill={darken(c, 0.5)} opacity={0.18 + r() * 0.25} />)}</g>
      <ellipse cx="400" cy="380" rx="110" ry="26" fill={lighten(c, 0.1)} />
      <ellipse cx="400" cy="382" rx="97" ry="19" fill={darken(c, 0.5)} />
      <ellipse cx="400" cy="388" rx="90" ry="12" fill={darken(c, 0.62)} opacity=".6" />
      <Gloss x={316} y={402} w={11} h={168} />
    </g>
  )
}

function Vase({ id, c, a, r, v }: Ctx) {
  const shape = v % 3
  const body = shape === 1
    ? 'M365 230 L365 290 C365 330 290 350 290 450 C290 540 330 600 400 600 C470 600 510 540 510 450 C510 350 435 330 435 290 L435 230 Z'
    : shape === 2
      ? 'M375 250 L375 330 C375 350 340 360 340 420 L340 560 Q340 600 380 600 L420 600 Q460 600 460 560 L460 420 C460 360 425 350 425 330 L425 250 Z'
      : 'M360 280 L360 320 C360 350 255 380 255 480 C255 560 310 600 400 600 C490 600 545 560 545 480 C545 380 440 350 440 320 L440 280 Z'
  const topY = shape === 1 ? 230 : shape === 2 ? 250 : 280, nr = shape === 1 ? 35 : shape === 2 ? 25 : 40
  const stems = v % 2 === 0
  return (
    <g>
      <Shadow id={id} rx={shape === 0 ? 220 : 160} />
      {stems && Array.from({ length: 4 }, (_, i) => {
        const x1 = 400 + (i - 1.5) * 44 + (r() - 0.5) * 20, y1 = topY - 160 - r() * 70
        return (
          <g key={i} stroke={darken(a, 0.2)} fill="none" strokeLinecap="round">
            <path d={`M${400 + (i - 1.5) * 10},${topY + 6} Q${f((400 + x1) / 2 + (r() - 0.5) * 50)},${f(topY - 90)} ${f(x1)},${f(y1)}`} strokeWidth="5" />
            {Array.from({ length: 5 }, (_, j) => <ellipse key={j} cx={f(x1 + (j % 2 ? 9 : -9))} cy={f(y1 + 14 + j * 22)} rx="6" ry="13" fill={mix(a, '#6c7a56', 0.4)} stroke="none" transform={`rotate(${j % 2 ? 40 : -40} ${f(x1 + (j % 2 ? 9 : -9))} ${f(y1 + 14 + j * 22)})`} />)}
          </g>
        )
      })}
      <defs>{cylG(id + 'g', c)}</defs>
      <path d={body} fill={`url(#${id}g)`} />
      {v % 3 === 2 && Array.from({ length: 5 }, (_, i) => <rect key={i} x={355 + i * 22} y={355} width="3" height="235" fill={darken(c, 0.3)} opacity=".25" />)}
      <ellipse cx="400" cy={topY} rx={nr} ry="9" fill={lighten(c, 0.1)} /><ellipse cx="400" cy={topY + 1} rx={nr - 8} ry="6" fill={darken(c, 0.55)} />
      <Gloss x={shape === 0 ? 290 : 350} y={shape === 0 ? 430 : 400} w={12} h={shape === 0 ? 110 : 150} o={0.2} />
    </g>
  )
}

function Bowl({ id, c, r, v }: Ctx) {
  const wide = v % 2 === 0
  const rx = wide ? 175 : 150, top = wide ? 420 : 380
  const body = `M${400 - rx} ${top} C${400 - rx} ${top + 120} ${400 - rx * 0.55} 598 400 598 C${400 + rx * 0.55} 598 ${400 + rx} ${top + 120} ${400 + rx} ${top} Z`
  return (
    <g>
      <Shadow id={id} rx={rx + 30} />
      <defs>{cylG(id + 'g', c)}<clipPath id={id + 'c'}><path d={body} /></clipPath></defs>
      <rect x="330" y="586" width="140" height="14" rx="5" fill={darken(c, 0.35)} />
      <path d={body} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>{Array.from({ length: 36 }, (_, i) => <circle key={i} cx={f(400 - rx + r() * rx * 2)} cy={f(top + r() * 190)} r={f(1 + r() * 2.2)} fill={darken(c, 0.5)} opacity={0.15 + r() * 0.25} />)}</g>
      <ellipse cx="400" cy={top} rx={rx} ry="34" fill={lighten(c, 0.1)} />
      <ellipse cx="400" cy={top + 3} rx={rx - 13} ry="26" fill={darken(c, 0.42)} />
      <ellipse cx="392" cy={top + 14} rx={rx - 60} ry="12" fill={darken(c, 0.55)} opacity=".5" />
    </g>
  )
}

function Lamp({ id, c, a, v, kind }: Ctx & { kind: 'lamp' | 'dome' }) {
  const shade = lighten('#efe4cd', 0.1)
  return (
    <g>
      <defs><radialGradient id={id + 'gl'}><stop offset="0" stopColor="#ffe2a6" stopOpacity=".42" /><stop offset="1" stopColor="#ffe2a6" stopOpacity="0" /></radialGradient>{cylG(id + 'g', c)}{vertG(id + 's', lighten(shade, 0.05), mix(shade, '#e7a85e', 0.35))}</defs>
      <circle cx="400" cy="300" r="330" fill={`url(#${id}gl)`} />
      <Shadow id={id} rx={150} />
      {kind === 'lamp' ? (
        <>
          <ellipse cx="400" cy="598" rx="96" ry="12" fill={darken(c, 0.3)} />
          <path d="M310 592 Q310 556 400 552 Q490 556 490 592 Q490 600 480 600 L320 600 Q310 600 310 592Z" fill={`url(#${id}g)`} />
          <rect x="390" y="330" width="20" height="230" rx="9" fill={`url(#${id}g)`} />
        </>
      ) : (
        <>
          <path d="M330 600 Q300 600 296 520 Q296 420 400 410 Q504 420 504 520 Q500 600 470 600 Z" fill={`url(#${id}g)`} />
          <ellipse cx="400" cy="414" rx="40" ry="8" fill={darken(c, 0.4)} />
          <Gloss x={322} y={450} w={12} h={100} o={0.2} />
          <rect x="392" y="340" width="16" height="76" rx="7" fill={darken(c, 0.2)} />
        </>
      )}
      {v % 2 === 0 || kind === 'dome' ? (
        <>
          <path d={kind === 'dome' ? 'M318 345 L482 345 L452 210 L348 210 Z' : 'M300 350 L500 350 L450 190 L350 190 Z'} fill={`url(#${id}s)`} />
          <ellipse cx="400" cy={kind === 'dome' ? 345 : 350} rx={kind === 'dome' ? 82 : 100} ry="14" fill={mix(shade, '#e7a85e', 0.5)} />
          <ellipse cx="400" cy={kind === 'dome' ? 210 : 190} rx={kind === 'dome' ? 52 : 50} ry="7" fill={darken(shade, 0.15)} />
        </>
      ) : (
        <>
          <path d="M290 350 C 290 230 350 170 400 170 C 450 170 510 230 510 350 Z" fill={`url(#${id}s)`} />
          <ellipse cx="400" cy="350" rx="110" ry="14" fill={mix(shade, '#e7a85e', 0.5)} />
        </>
      )}
      <circle cx="400" cy="350" r="0" fill={a} />
    </g>
  )
}

function Pendant({ id, c, v }: Ctx) {
  const dome = v % 2 === 0
  return (
    <g>
      <defs>
        <radialGradient id={id + 'gl'} cx=".5" cy="0" r="1"><stop offset="0" stopColor="#ffe2a6" stopOpacity=".5" /><stop offset="1" stopColor="#ffe2a6" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + 'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={lighten(c, 0.2)} /><stop offset=".5" stopColor={c} /><stop offset="1" stopColor={darken(c, 0.38)} /></linearGradient>
      </defs>
      <path d="M340 430 L460 430 L640 800 L160 800 Z" fill={`url(#${id}gl)`} />
      <rect x="397" y="0" width="6" height="250" fill="#2a2a29" />
      <rect x="386" y="240" width="28" height="26" rx="5" fill={darken(c, 0.55)} />
      {dome ? (
        <path d="M250 440 C250 330 320 262 400 262 C480 262 550 330 550 440 Z" fill={`url(#${id}g)`} />
      ) : (
        <path d="M352 266 L448 266 L560 440 L240 440 Z" fill={`url(#${id}g)`} />
      )}
      <ellipse cx={400} cy={440} rx={dome ? 150 : 160} ry="18" fill="#f6dba1" /><ellipse cx={400} cy={440} rx={dome ? 120 : 130} ry="11" fill="#fff1c9" />
      <Gloss x={dome ? 292 : 330} y={dome ? 320 : 300} w={10} h={70} o={0.22} />
    </g>
  )
}

function DeskLamp({ id, c, a, v }: Ctx) {
  void v
  return (
    <g>
      <defs><radialGradient id={id + 'gl'}><stop offset="0" stopColor="#ffe2a6" stopOpacity=".5" /><stop offset="1" stopColor="#ffe2a6" stopOpacity="0" /></radialGradient>{cylG(id + 'g', c)}</defs>
      <ellipse cx="540" cy="520" rx="220" ry="140" fill={`url(#${id}gl)`} />
      <Shadow id={id} rx={160} />
      <path d="M300 600 L300 576 Q300 566 312 566 L408 566 Q420 566 420 576 L420 600 Z" fill={`url(#${id}g)`} />
      <path d="M360 568 L300 380" stroke={darken(c, 0.12)} strokeWidth="14" strokeLinecap="round" />
      <path d="M300 380 L440 270" stroke={c} strokeWidth="12" strokeLinecap="round" />
      <circle cx="360" cy="568" r="12" fill={darken(c, 0.3)} /><circle cx="300" cy="380" r="11" fill={darken(c, 0.3)} />
      <g transform="rotate(24 450 275)">
        <path d="M392 262 Q450 196 520 262 L538 340 L374 340 Z" fill={`url(#${id}g)`} />
        <ellipse cx="456" cy="340" rx="82" ry="12" fill="#f6dba1" /><ellipse cx="456" cy="341" rx="62" ry="7" fill="#fff1c9" />
      </g>
      <circle cx="440" cy="270" r="10" fill={a} opacity=".001" />
    </g>
  )
}

function Chair({ id, c, fr, v }: Ctx) {
  const slat = v % 2 === 1
  return (
    <g>
      <Shadow id={id} rx={230} ry={22} />
      <defs>{cylG(id + 'f', fr)}{vertG(id + 's', lighten(c, 0.14), c)}{vertG(id + 'b', lighten(c, 0.08), darken(c, 0.12))}</defs>
      {/* rear legs and back posts */}
      <rect x="296" y="196" width="18" height="400" rx="6" fill={darken(fr, 0.28)} /><rect x="486" y="196" width="18" height="400" rx="6" fill={darken(fr, 0.28)} />
      {slat
        ? Array.from({ length: 4 }, (_, i) => <rect key={i} x="296" y={216 + i * 42} width="208" height="26" rx="5" fill={`url(#${id}f)`} />)
        : <rect x="286" y="206" width="228" height="170" rx="26" fill={`url(#${id}b)`} />}
      {/* seat */}
      <polygon points="262,446 538,446 508,398 292,398" fill={`url(#${id}s)`} />
      <rect x="262" y="446" width="276" height="44" rx="9" fill={slat ? `url(#${id}f)` : c} />
      <rect x="262" y="446" width="276" height="8" rx="4" fill="#fff" opacity=".12" />
      {/* front legs */}
      <polygon points="272,490 302,490 292,600 266,600" fill={`url(#${id}f)`} /><polygon points="498,490 528,490 534,600 508,600" fill={`url(#${id}f)`} />
      <rect x="302" y="530" width="196" height="10" rx="4" fill={darken(fr, 0.2)} opacity=".6" />
    </g>
  )
}

function Stool({ id, c, fr, v }: Ctx) {
  const tall = v % 2 === 1, top = tall ? 330 : 400
  return (
    <g>
      <Shadow id={id} rx={180} />
      <defs>{cylG(id + 'f', fr)}{cylG(id + 's', c)}</defs>
      <path d={`M400 ${top + 40} L400 600`} stroke={darken(fr, 0.3)} strokeWidth="18" strokeLinecap="round" />
      <path d={`M330 ${top + 30} L292 598`} stroke={`url(#${id}f)`} strokeWidth="22" strokeLinecap="round" />
      <path d={`M470 ${top + 30} L508 598`} stroke={fr} strokeWidth="22" strokeLinecap="round" />
      <path d={`M ${tall ? 324 : 318} ${tall ? 500 : 520} L${tall ? 476 : 482} ${tall ? 500 : 520}`} stroke={darken(fr, 0.15)} strokeWidth="9" strokeLinecap="round" />
      <path d={`M250 ${top} L250 ${top + 34} Q250 ${top + 62} 400 ${top + 66} Q550 ${top + 62} 550 ${top + 34} L550 ${top} Z`} fill={`url(#${id}s)`} />
      <ellipse cx="400" cy={top} rx="150" ry="36" fill={lighten(c, 0.12)} />
      <ellipse cx="400" cy={top} rx="132" ry="28" fill={c} opacity=".5" />
      <Gloss x={270} y={top + 6} w={9} h={30} o={0.2} />
    </g>
  )
}

function Notebook({ id, c, a, v }: Ctx) {
  const s = v % 2 === 1 ? 0.86 : 1
  return (
    <g transform={`translate(400 600) scale(${s}) translate(-400 -600) rotate(-4 400 400)`}>
      <Shadow id={id} cx={410} cy={600} rx={170} ry={16} o={0.34} />
      <defs>{vertG(id + 'g', lighten(c, 0.1), darken(c, 0.14))}</defs>
      <rect x="280" y="180" width="264" height="418" rx="8" fill="#e9e1cf" /><rect x="286" y="186" width="258" height="412" rx="8" fill="#f1ead9" opacity=".7" />
      <rect x="270" y="170" width="260" height="420" rx="10" fill={`url(#${id}g)`} />
      <rect x="270" y="170" width="30" height="420" rx="10" fill={darken(c, 0.16)} /><rect x="292" y="170" width="3" height="420" fill="#000" opacity=".12" />
      {Array.from({ length: 26 }, (_, i) => <rect key={i} x="300" y={196 + i * 15} width="230" height="1" fill="#fff" opacity=".05" />)}
      <rect x="478" y="170" width="16" height="420" fill={a} />
      <rect x="478" y="170" width="3" height="420" fill="#fff" opacity=".14" />
      <rect x="330" y="236" width="116" height="74" rx="4" fill={lighten(c, 0.62)} />
      <rect x="344" y="254" width="70" height="6" rx="3" fill={darken(c, 0.4)} opacity=".65" /><rect x="344" y="270" width="48" height="5" rx="2.5" fill={darken(c, 0.4)} opacity=".4" />
      <polygon points="424,586 424,636 436,624 448,636 448,586" fill={a} />
    </g>
  )
}

function PenPot({ id, c, a, r }: Ctx) {
  const pens = [['#2b2c2c', 0], ['#b6674a', 1], ['#d9ccb4', 2], ['#5d6b50', 3]] as const
  return (
    <g>
      <Shadow id={id} rx={170} />
      <defs>{cylG(id + 'g', c)}</defs>
      {pens.map(([col, i]) => {
        const x = 350 + i * 33, tilt = (i - 1.5) * 9 + (r() - 0.5) * 4, len = 250 + r() * 70
        return <g key={i} transform={`rotate(${tilt} ${x} 420)`}><rect x={x - 7} y={420 - len} width="14" height={len} rx="4" fill={col} /><rect x={x - 7} y={420 - len} width="14" height="18" rx="4" fill={lighten(col, 0.25)} /><rect x={x - 2} y={420 - len + 22} width="3" height={len * 0.5} fill="#fff" opacity=".2" /></g>
      })}
      <path d="M320 400 L320 580 Q320 600 340 600 L460 600 Q480 600 480 580 L480 400 Z" fill={`url(#${id}g)`} />
      <ellipse cx="400" cy="400" rx="80" ry="16" fill={lighten(c, 0.1)} /><ellipse cx="400" cy="402" rx="70" ry="11" fill={darken(c, 0.5)} />
      <rect x="338" y="425" width="8" height="150" rx="4" fill="#fff" opacity=".16" />
      <rect x="320" y="520" width="160" height="3" fill={a} opacity=".6" />
    </g>
  )
}

function Tray({ id, c, a }: Ctx) {
  return (
    <g>
      <Shadow id={id} rx={250} ry={22} o={0.34} />
      <defs>{vertG(id + 'g', lighten(c, 0.14), c)}</defs>
      <rect x="190" y="540" width="420" height="52" rx="12" fill={darken(c, 0.28)} />
      <path d="M205 470 Q205 452 225 452 L575 452 Q595 452 595 470 L616 548 L184 548 Z" fill={`url(#${id}g)`} />
      <path d="M232 474 L568 474 L584 530 L216 530 Z" fill={darken(c, 0.3)} />
      <path d="M232 474 L568 474 L572 486 L228 486 Z" fill="#000" opacity=".18" />
      <rect x="395" y="476" width="10" height="54" fill={darken(c, 0.08)} />
      <rect x="260" y="486" width="110" height="10" rx="5" fill={a} transform="rotate(-6 260 486)" />
      <rect x="440" y="498" width="90" height="16" rx="3" fill={lighten(a, 0.3)} />
      <circle cx="318" cy="512" r="12" fill={darken(a, 0.2)} />
    </g>
  )
}

function Tote({ id, c, a, r }: Ctx) {
  return (
    <g>
      <Shadow id={id} rx={190} />
      <defs>{vertG(id + 'g', lighten(c, 0.08), darken(c, 0.18))}<pattern id={id + 'p'} width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="1" fill="#000" opacity=".08" /><rect width="1" height="6" fill="#fff" opacity=".05" /></pattern></defs>
      <path d="M335 304 C335 156 475 156 475 304" stroke={darken(c, 0.25)} strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d="M270 302 L530 302 L552 586 Q552 600 538 600 L262 600 Q248 600 248 586 Z" fill={`url(#${id}g)`} />
      <path d="M270 302 L530 302 L552 586 Q552 600 538 600 L262 600 Q248 600 248 586 Z" fill={`url(#${id}p)`} />
      <path d="M335 304 C335 190 465 190 465 304" stroke={c} strokeWidth="18" fill="none" strokeLinecap="round" />
      <rect x="270" y="302" width="260" height="14" fill="#000" opacity=".12" />
      <rect x="296" y="450" width="208" height="112" rx="8" fill={darken(c, 0.1)} />
      <rect x="304" y="458" width="192" height="96" rx="5" fill="none" stroke={lighten(c, 0.35)} strokeWidth="2" strokeDasharray="6 5" opacity=".8" />
      <rect x="372" y="356" width="56" height="30" rx="3" fill={a} opacity={0.9 - r() * 0.1} />
    </g>
  )
}

function Backpack({ id, c, a }: Ctx) {
  return (
    <g>
      <Shadow id={id} rx={180} />
      <defs>{cylG(id + 'g', c)}</defs>
      <path d="M355 232 C355 150 445 150 445 232" stroke={darken(c, 0.3)} strokeWidth="16" fill="none" strokeLinecap="round" />
      <rect x="262" y="360" width="30" height="190" rx="15" fill={darken(c, 0.35)} /><rect x="508" y="360" width="30" height="190" rx="15" fill={darken(c, 0.35)} />
      <path d="M290 600 Q276 600 276 560 L276 300 Q276 214 400 214 Q524 214 524 300 L524 560 Q524 600 510 600 Z" fill={`url(#${id}g)`} />
      <path d="M276 312 Q400 276 524 312" stroke={darken(c, 0.35)} strokeWidth="3" fill="none" />
      <path d="M276 312 Q400 276 524 312" stroke={a} strokeWidth="2" strokeDasharray="2 7" fill="none" strokeLinecap="round" transform="translate(0 6)" />
      <rect x="306" y="410" width="188" height="150" rx="34" fill={darken(c, 0.12)} />
      <path d="M318 436 L482 436" stroke={darken(c, 0.4)} strokeWidth="3" />
      <rect x="378" y="428" width="44" height="16" rx="8" fill={a} />
      <rect x="330" y="548" width="140" height="6" rx="3" fill="#000" opacity=".16" />
      <rect x="296" y="330" width="14" height="40" rx="3" fill={a} opacity=".9" /><rect x="490" y="330" width="14" height="40" rx="3" fill={a} opacity=".9" />
    </g>
  )
}

function Satchel({ id, c, a, v }: Ctx) {
  const brass = '#b69a63'
  void v
  return (
    <g>
      <Shadow id={id} rx={220} ry={18} />
      <defs>{vertG(id + 'g', lighten(c, 0.1), darken(c, 0.2))}{vertG(id + 'f', lighten(c, 0.16), darken(c, 0.06))}</defs>
      <path d="M262 366 C262 160 538 160 538 366" stroke={darken(c, 0.3)} strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d="M236 382 Q236 360 258 360 L542 360 Q564 360 564 382 L564 572 Q564 600 536 600 L264 600 Q236 600 236 572 Z" fill={`url(#${id}g)`} />
      <path d="M236 388 Q236 360 262 360 L538 360 Q564 360 564 388 L564 470 Q400 534 236 470 Z" fill={`url(#${id}f)`} />
      <path d="M248 392 Q248 374 264 374 L536 374 Q552 374 552 392 L552 462 Q400 520 248 462 Z" fill="none" stroke={lighten(c, 0.4)} strokeWidth="2" strokeDasharray="6 5" opacity=".75" />
      <rect x="378" y="466" width="44" height="52" rx="7" fill={brass} /><rect x="388" y="478" width="24" height="28" rx="4" fill={darken(brass, 0.3)} />
      <rect x="300" y="540" width="60" height="8" rx="3" fill={a} opacity=".9" />
    </g>
  )
}

function Cushion({ id, c, a, v, r }: Ctx) {
  const stripes = v % 2 === 1
  const d = 'M240 330 Q400 298 560 330 Q590 460 560 580 Q400 612 240 580 Q210 460 240 330 Z'
  return (
    <g>
      <Shadow id={id} cy={598} rx={210} ry={16} />
      <defs><radialGradient id={id + 'g'} cx=".38" cy=".3" r="1"><stop offset="0" stopColor={lighten(c, 0.2)} /><stop offset=".6" stopColor={c} /><stop offset="1" stopColor={darken(c, 0.3)} /></radialGradient><clipPath id={id + 'c'}><path d={d} /></clipPath></defs>
      <path d={d} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>
        {stripes ? Array.from({ length: 6 }, (_, i) => <rect key={i} x={230 + i * 62} y="290" width="22" height="330" fill={a} opacity=".55" />) : Array.from({ length: 70 }, (_, i) => <circle key={i} cx={f(230 + r() * 340)} cy={f(310 + r() * 290)} r={f(1 + r() * 1.6)} fill={darken(c, 0.4)} opacity=".18" />)}
        <path d="M240 332 Q400 360 560 332" stroke="#000" strokeWidth="14" fill="none" opacity=".1" />
        <path d="M400 306 Q380 460 400 604" stroke="#000" strokeWidth="26" fill="none" opacity=".05" />
        <path d="M250 340 Q330 330 390 340" stroke="#fff" strokeWidth="10" fill="none" opacity=".12" strokeLinecap="round" />
      </g>
    </g>
  )
}

function Throw({ id, c, a, r }: Ctx) {
  const layers = [{ x: 235, y: 538, w: 330, h: 62 }, { x: 225, y: 482, w: 350, h: 58 }, { x: 242, y: 428, w: 316, h: 56 }]
  return (
    <g>
      <Shadow id={id} rx={250} ry={18} />
      <defs>{vertG(id + 'g', lighten(c, 0.14), darken(c, 0.1))}</defs>
      {layers.map((l, i) => {
        const col = i === 1 ? mix(c, a, 0.25) : c
        return (
          <g key={i}>
            <rect x={l.x} y={l.y} width={l.w} height={l.h} rx="14" fill={col} />
            <rect x={l.x} y={l.y} width={l.w} height={l.h * 0.5} rx="14" fill="#fff" opacity=".07" />
            {i === 2 && [0.3, 0.38, 0.62, 0.7].map((p, j) => <rect key={j} x={l.x + l.w * p} y={l.y} width={j % 2 ? 6 : 14} height={l.h} fill={a} opacity=".8" />)}
            {Array.from({ length: 14 }, (_, k) => <rect key={k} x={l.x + l.w - 2} y={l.y + 4 + k * (l.h - 8) / 13} width={f(14 + r() * 10)} height="2" rx="1" fill={darken(col, 0.1)} />)}
            <rect x={l.x} y={l.y + l.h - 6} width={l.w} height="6" rx="3" fill="#000" opacity=".12" />
          </g>
        )
      })}
    </g>
  )
}

function Plant({ id, c, a, r, v }: Ctx) {
  void a
  const style = v % 3
  const leaf = (i: number, base: string) => mix(base, '#1f3326', 0.15 + (i % 3) * 0.12)
  const green = '#6f8a62'
  return (
    <g>
      <Shadow id={id} rx={150} />
      <defs>{cylG(id + 'g', c)}</defs>
      {style === 0 && Array.from({ length: 9 }, (_, i) => {
        const x = 330 + i * 17 + (r() - 0.5) * 12, h = 200 + r() * 210, bend = (i - 4) * 18 + (r() - 0.5) * 24, w = 26 + r() * 14
        return <path key={i} d={`M${f(x)} 450 Q${f(x + bend * 0.3)} ${f(450 - h * 0.5)} ${f(x + bend)} ${f(450 - h)} Q${f(x + bend + w * 0.5)} ${f(450 - h * 0.5)} ${f(x + w)} 450 Z`} fill={leaf(i, green)} />
      })}
      {style === 1 && (
        <>
          <path d="M400 450 Q392 330 410 190" stroke="#5a4a38" strokeWidth="9" fill="none" strokeLinecap="round" />
          {Array.from({ length: 11 }, (_, i) => {
            const t = i / 10, y = 430 - t * 230, side = i % 2 ? 1 : -1, x = 400 + side * (50 + (1 - t) * 40), rot = side * (50 - t * 20)
            return <ellipse key={i} cx={f(x)} cy={f(y)} rx={f(46 - t * 12)} ry={f(24 - t * 6)} fill={leaf(i, '#4f6a4a')} transform={`rotate(${f(rot)} ${f(x)} ${f(y)})`} />
          })}
        </>
      )}
      {style === 2 && Array.from({ length: 34 }, (_, i) => {
        const ang = -78 + (i / 33) * 156 + (r() - 0.5) * 8, len = 120 + r() * 120
        return <ellipse key={i} cx="400" cy={f(450 - len / 2)} rx={f(10 + r() * 7)} ry={f(len / 2)} fill={leaf(i, '#6f8f5a')} transform={`rotate(${f(ang)} 400 450)`} opacity={0.92} />
      })}
      <path d="M335 440 L465 440 L452 584 Q450 600 432 600 L368 600 Q350 600 348 584 Z" fill={`url(#${id}g)`} />
      <ellipse cx="400" cy="440" rx="66" ry="14" fill={lighten(c, 0.1)} /><ellipse cx="400" cy="442" rx="56" ry="9" fill="#2b241d" />
      <Gloss x={350} y={462} w={9} h={100} o={0.18} />
    </g>
  )
}

export function ProductObject({ look, id }: { look: Look; id: string }) {
  const r = rng(look.seed * 31 + 7)
  const c = look.color, ctx: Ctx = { id, c, a: look.accent ?? darken(c, 0.35), fr: look.frame ?? '#8a6a4b', r, v: look.variant ?? look.seed }
  switch (look.kind) {
    case 'mug': case 'cup': return <Mug {...ctx} kind={look.kind} />
    case 'vase': return <Vase {...ctx} />
    case 'bowl': return <Bowl {...ctx} />
    case 'lamp': case 'dome': return <Lamp {...ctx} kind={look.kind} />
    case 'pendant': return <Pendant {...ctx} />
    case 'desklamp': return <DeskLamp {...ctx} />
    case 'chair': return <Chair {...ctx} />
    case 'stool': return <Stool {...ctx} />
    case 'notebook': return <Notebook {...ctx} />
    case 'penpot': return <PenPot {...ctx} />
    case 'tray': return <Tray {...ctx} />
    case 'tote': return <Tote {...ctx} />
    case 'backpack': return <Backpack {...ctx} />
    case 'satchel': return <Satchel {...ctx} />
    case 'cushion': return <Cushion {...ctx} />
    case 'throw': return <Throw {...ctx} />
    case 'plant': return <Plant {...ctx} />
  }
}

/** Matte studio backdrop. `floor` is the y of the table plane. */
export function Stage({ id, bg, w = 800, h = 800, floor = 600 }: { id: string; bg: string; w?: number; h?: number; floor?: number }) {
  return (
    <>
      <defs>
        <linearGradient id={id + 'w'} x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stopColor={lighten(bg, 0.1)} /><stop offset="1" stopColor={darken(bg, 0.07)} /></linearGradient>
        <linearGradient id={id + 'fl'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={darken(bg, 0.14)} /><stop offset="1" stopColor={darken(bg, 0.03)} /></linearGradient>
        <radialGradient id={id + 'v'} cx=".4" cy=".35" r=".85"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".22" /></radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}w)`} />
      <rect y={floor} width={w} height={h - floor} fill={`url(#${id}fl)`} />
      <rect y={floor - 1} width={w} height="3" fill="#fff" opacity=".07" />
      <rect width={w} height={h} fill={`url(#${id}v)`} />
    </>
  )
}

const ZOOM: Partial<Record<Kind, number>> = { mug: 1.45, cup: 1.6, bowl: 1.3, vase: 1.12, penpot: 1.2, tray: 1.4, cushion: 1.15, throw: 1.25, notebook: 1.05, dome: 1.05 }
const zoomFor = (l: Look) => { const z = ZOOM[l.kind] ?? 1; return z === 1 ? undefined : `translate(400 600) scale(${z}) translate(-400 -600)` }

/** One product render. `view` 0 is the hero angle; 1 is a close crop; 2 is a quieter context; 3 is mirrored light on a deeper tone. */
export function ProductArt({ look, view = 0, label }: { look: Look; view?: number; label?: string }) {
  const id = useId().replace(/[^a-z0-9]/gi, '')
  let bg = backdrop(look), tf: string | undefined
  if (view === 1) tf = 'translate(400 420) scale(1.7) translate(-400 -420)'
  if (view === 2) { bg = lum(bg) > 0.55 ? mix(bg, '#7c7466', 0.4) : mix(bg, '#d8d0c2', 0.5); tf = 'translate(400 600) scale(.78) translate(-400 -600)' }
  if (view === 3) { bg = mix(bg, '#3a3b3a', 0.35); tf = 'translate(800 0) scale(-1 1)' }
  return (
    <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label ?? 'Product image'} width="100%" height="100%" style={{ display: 'block' }}>
      <Stage id={id} bg={bg} />
      <g transform={tf}><g transform={zoomFor(look)}><ProductObject look={look} id={id + 'o'} /></g></g>
    </svg>
  )
}

/** Wide hero composition: three pieces on a shelf. */
export function HeroArt({ looks }: { looks: Look[] }) {
  const id = useId().replace(/[^a-z0-9]/gi, '')
  const spots = [{ c: 790, s: 0.82 }, { c: 1030, s: 0.92 }, { c: 1260, s: 0.7 }]
  return (
    <svg viewBox="0 0 1400 700" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A lamp, a vase and a mug on a shelf" width="100%" height="100%" style={{ display: 'block' }}>
      <Stage id={id} bg="#cdc3b2" w={1400} h={700} floor={560} />
      {looks.slice(0, 3).map((l, i) => (
        <g key={i} transform={`translate(${spots[i].c - 400 * spots[i].s} ${560 - 600 * spots[i].s}) scale(${spots[i].s})`}><ProductObject look={l} id={id + 'h' + i} /></g>
      ))}
    </svg>
  )
}
