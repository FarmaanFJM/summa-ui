import type { SVGProps } from 'react'

const R = (x: number, y: number, w: number, h: number, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`
const C = (cx: number, cy: number, r: number, fill = false) => `<circle cx="${cx}" cy="${cy}" r="${r}"${fill ? ' fill="currentColor"' : ''}/>`
const P = (d: string) => `<path d="${d}"/>`

export const ICONS = {
  plus: P('M5 12h14M12 5v14'),
  x: P('M18 6 6 18M6 6l12 12'),
  search: C(11, 11, 7) + P('m21 21-4.3-4.3'),
  check: P('M20 6 9 17l-5-5'),
  'chevron-down': P('m6 9 6 6 6-6'),
  'chevron-up': P('m18 15-6-6-6 6'),
  'chevron-right': P('m9 18 6-6-6-6'),
  'chevron-left': P('m15 18-6-6 6-6'),
  'more-h': C(12, 12, 1, true) + C(19, 12, 1, true) + C(5, 12, 1, true),
  'more-v': C(12, 12, 1, true) + C(12, 5, 1, true) + C(12, 19, 1, true),
  menu: P('M4 6h16M4 12h16M4 18h16'),
  'arrow-up': P('m5 12 7-7 7 7M12 19V5'),
  'arrow-down': P('M12 5v14m7-7-7 7-7-7'),
  'arrow-right': P('M5 12h14m-7-7 7 7-7 7'),
  stop: R(6, 6, 12, 12, 2.5).replace('/>', ' fill="currentColor"/>'),
  copy: R(8, 8, 14, 14) + P('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'),
  refresh: P('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5'),
  pencil: P('M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'),
  trash: P('M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'),
  folder: P('M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'),
  file: P('M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z') + P('M14 2v4a2 2 0 0 0 2 2h4'),
  'file-text': P('M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z') + P('M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8'),
  image: R(3, 3, 18, 18) + C(9, 9, 2) + P('m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21'),
  play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
  pause: R(14, 4, 4, 16, 1).replace('/>', ' fill="currentColor"/>') + R(6, 4, 4, 16, 1).replace('/>', ' fill="currentColor"/>'),
  'skip-back': '<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/>' + P('M5 19V5'),
  'skip-forward': '<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/>' + P('M19 5v14'),
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' + P('M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14'),
  shuffle: P('m18 14 4 4-4 4M18 2l4 4-4 4M2 18h1.97a4 4 0 0 0 3.3-1.76L12 9.75a4 4 0 0 1 3.3-1.75H22M2 6h1.97a4 4 0 0 1 3.3 1.76M22 18h-6.7a4 4 0 0 1-3.3-1.76'),
  repeat: P('m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3'),
  sliders: P('M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'),
  home: P('m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10'),
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  clock: C(12, 12, 9) + '<polyline points="12 7 12 12 15.5 14"/>',
  bold: P('M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z'),
  italic: P('M19 4h-9M14 20H5M15 4 9 20'),
  strike: P('M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16'),
  code: P('m16 18 6-6-6-6M8 6l-6 6 6 6'),
  link: P('M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'),
  list: P('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
  'list-ordered': P('M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'),
  'list-check': P('m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8'),
  quote: P('M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z'),
  table: R(3, 3, 18, 18) + P('M3 9h18M3 15h18M12 3v18'),
  heading: P('M6 12h12M6 20V4M18 20V4'),
  circle: C(12, 12, 9),
  'circle-dot': C(12, 12, 9) + C(12, 12, 3, true),
  'circle-half': C(12, 12, 9) + P('M12 3a9 9 0 0 1 0 18z').replace('/>', ' fill="currentColor"/>'),
  'circle-check': C(12, 12, 9) + P('m8.5 12.5 2.5 2.5 4.5-5'),
  'circle-x': C(12, 12, 9) + P('m15 9-6 6M9 9l6 6'),
  'circle-dashed': P('M10.1 2.18a10 10 0 0 1 3.8 0M17.6 3.71a10 10 0 0 1 2.69 2.7M21.82 10.1a10 10 0 0 1 0 3.8M20.29 17.6a10 10 0 0 1-2.7 2.69M13.9 21.82a10 10 0 0 1-3.8 0M6.4 20.29a10 10 0 0 1-2.69-2.7M2.18 13.9a10 10 0 0 1 0-3.8M3.71 6.4a10 10 0 0 1 2.7-2.69'),
  tag: P('M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z') + C(7.5, 7.5, 0.5, true),
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  calendar: P('M8 2v4M16 2v4') + R(3, 4, 18, 18) + P('M3 10h18'),
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  download: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3'),
  upload: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'),
  share: P('M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13'),
  message: P('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
  'message-plus': P('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM12 7v6M9 10h6'),
  sparkle: P('M9.94 14.06 4 12l5.94-2.06L12 4l2.06 5.94L20 12l-5.94 2.06L12 20zM19 3v4M17 5h4'),
  grid: R(3, 3, 7, 7, 1) + R(14, 3, 7, 7, 1) + R(14, 14, 7, 7, 1) + R(3, 14, 7, 7, 1),
  rows: R(3, 3, 18, 7, 1.5) + R(3, 14, 18, 7, 1.5),
  columns: R(3, 3, 7, 18, 1.5) + R(14, 3, 7, 18, 1.5),
  info: C(12, 12, 9) + P('M12 16v-4M12 8h.01'),
  music: P('M9 18V5l12-2v13') + C(6, 18, 3) + C(18, 16, 3),
  film: R(3, 3, 18, 18) + P('M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4'),
  heart: P('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'),
  user: P('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2') + C(12, 7, 4),
  users: P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75') + C(9, 7, 4),
  cloud: P('M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'),
  drive: P('M22 12H2m3.45-6.89L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11zM6 16h.01M10 16h.01'),
  archive: R(2, 3, 20, 5, 1) + P('M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4'),
  inbox: P('M22 12h-6l-2 3h-4l-2-3H2') + P('M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'),
  flag: P('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7'),
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/>' + '<polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  eye: P('M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z') + C(12, 12, 3),
  move: P('M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20'),
  scissors: C(6, 6, 3) + C(6, 18, 3) + P('M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12'),
  lock: R(3, 11, 18, 11) + P('M7 11V7a5 5 0 0 1 10 0v4'),
  command: P('M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3'),
  paperclip: P('m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'),
  panel: R(3, 3, 18, 18) + P('M9 3v18'),
  sort: P('m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16'),
  external: P('M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'),
  minus: P('M5 12h14'),
  hash: P('M4 9h16M4 15h16M10 3 8 21M16 3l-2 18'),
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  maximize: P('M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3'),
  mic: P('M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3'),
} as const

export type IconName = keyof typeof ICONS

type IconProps = { name: IconName; size?: number; fill?: boolean } & Omit<SVGProps<SVGSVGElement>, 'name' | 'fill'>

/** Stroke icon set (24px grid, 1.75 stroke). All apps use this single set (Principle 7). */
export function Icon({ name, size = 16, fill, ...rest }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}
