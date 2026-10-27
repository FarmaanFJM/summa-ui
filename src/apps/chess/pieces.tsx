import { memo, type ReactNode } from 'react'

/* A hand-drawn piece set. Each piece is one merged silhouette (outline pass under a fill pass),
   plus a few detail strokes. Drawn on a 45 x 45 grid, readable down to about 32px. */

const BASE = <rect x="11" y="35" width="23" height="4" rx="1.4" />

type Def = { shape: ReactNode; detail?: ReactNode; round?: ReactNode }

const DEFS: Record<number, Def> = {
  1: {
    shape: (
      <>
        <circle cx="22.5" cy="13" r="5.3" />
        <path d="M18.8 19.4h7.4c.5 4.3 3.7 7.1 4.8 10.2.6 1.8.8 3.4.8 5.4H13.2c0-2 .2-3.6.8-5.4 1.1-3.100 4.300-5.900 4.800-10.200z" />
        {BASE}
      </>
    ),
    detail: <path d="M16.2 30.600h12.600" />,
  },
  2: {
    shape: (
      <>
        <path d="M13.800 35c-.5-5.800 1.600-10 5.200-13.600 2-2 4.200-3.800 4.100-6.200-2.400.8-4 3-6.200 4.200-1.500.8-3.200.4-4.200-.8l-1.600-1.800c-.2-.8 0-1.600.6-2.400l4.400-6-.2-3.400 3.400 1.800c1.600-1.200 4.200-1.600 6.200-.8C31.200 9.500 35.200 16 35.200 25c0 4.600-.8 6.600-.8 10z" />
        {BASE}
      </>
    ),
    detail: (
      <>
        <circle cx="19.400" cy="14.200" r="1.300" fill="currentColor" stroke="none" />
        <path d="M26 10.800c3.400 2.400 5.600 7.200 5.200 14M14.600 20.400l2.600-1.200" />
      </>
    ),
  },
  3: {
    shape: (
      <>
        <path d="M16 35c0-3 1.500-4.400 3-6-2-1.600-3.500-4.200-3.500-7.600 0-4.600 3.200-8.200 7-10.200 3.800 2 7 5.600 7 10.200 0 3.400-1.500 6-3.500 7.600 1.500 1.600 3 3 3 6z" />
        <circle cx="22.500" cy="8.800" r="2.800" />
        {BASE}
      </>
    ),
    detail: <path d="M19.400 20.600l6.200-5.600M17.400 29.400h10.200" />,
  },
  4: {
    shape: (
      <>
        <path d="M13.600 19.400V11h4.200v2.800h3V11h3.600v2.800h3V11h4.200v8.400z" />
        <path d="M16.600 19.400h11.800l.4 10.400H16.200z" />
        <path d="M14.200 35l2-5.400h12.600l2 5.400z" />
        {BASE}
      </>
    ),
    detail: <path d="M15.200 19.400h14.600M16.400 29.600h12.200" />,
  },
  5: {
    shape: (
      <>
        <path d="M13.200 35 10.800 17.400l5.800 8.600 1-13.600 3.800 12.400 1.100-14.800 1.100 14.800 3.800-12.400 1 13.600 5.800-8.600L31.800 35z" />
        <circle cx="10.800" cy="15.600" r="2.200" />
        <circle cx="17.600" cy="10.800" r="2.200" />
        <circle cx="22.500" cy="8.600" r="2.300" />
        <circle cx="27.400" cy="10.800" r="2.200" />
        <circle cx="34.200" cy="15.600" r="2.200" />
        {BASE}
      </>
    ),
    detail: <path d="M14.400 31.200h16.200" />,
  },
  6: {
    shape: (
      <>
        <rect x="21" y="3.600" width="3" height="11" rx="1" />
        <rect x="17.400" y="7.400" width="10.200" height="3" rx="1" />
        <path d="M13.200 35c-2.200-6-1.700-12.600 2.800-15.800 2-1.400 4.400-1.800 6.500-1.800s4.500.4 6.500 1.800c4.500 3.200 5 9.800 2.800 15.800z" />
        {BASE}
      </>
    ),
    detail: <path d="M14.600 30.600h15.800M18.800 19.600c2.200 1.200 5.200 1.200 7.400 0" />,
  },
}

const SKIN = {
  w: { fill: '#f1ede4', line: '#1b1b1d', detail: 'rgba(27,27,29,0.62)' },
  b: { fill: '#2b2b2f', line: '#0c0c0d', detail: 'rgba(222,219,210,0.55)' },
}

export const PIECE_NAMES = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
export const pieceLabel = (p: number) => `${p > 0 ? 'white' : 'black'} ${PIECE_NAMES[Math.abs(p)]}`

/** Piece for a signed board value (positive = white). */
export const Piece = memo(function Piece({ p, className }: { p: number; className?: string }) {
  const d = DEFS[Math.abs(p)]
  const k = SKIN[p > 0 ? 'w' : 'b']
  return (
    <svg className={className} viewBox="0 0 45 45" aria-hidden="true" focusable="false" style={{ width: '100%', height: '100%', display: 'block' }}>
      <g fill={k.line} stroke={k.line} strokeWidth="3.2" strokeLinejoin="round">{d.shape}</g>
      <g fill={k.fill} stroke="none">{d.shape}</g>
      <g fill="none" stroke={k.detail} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: k.detail }}>{d.detail}</g>
    </svg>
  )
})
