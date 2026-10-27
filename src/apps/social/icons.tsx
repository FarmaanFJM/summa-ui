import type { SVGProps } from 'react'
import { Icon, type IconName } from '../../ui'

const C = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
const P = (d: string) => `<path d="${d}"/>`
/** App-local additions drawn in the same 24px / 1.75 stroke style as the shared set. */
const EXTRA = {
  bell: P('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0'),
  bookmark: P('m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'),
  'bar-chart': P('M12 20V10M18 20V4M6 20v-4'),
  send: P('m22 2-7 20-4-9-9-4zM22 2 11 13'),
  'at': C(12, 12, 4) + P('M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8'),
  'user-plus': P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M19 8v6M22 11h-6') + C(9, 7, 4),
  ban: C(12, 12, 9) + P('m4.9 4.9 14.2 14.2'),
  'bell-off': P('M8.7 3A6 6 0 0 1 18 8c0 2.7.5 4.7 1.1 6M17 17H3s3-2 3-9c0-.5.1-1 .2-1.5M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20'),
  settings: C(12, 12, 3) + P('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'),
  'log-out': P('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'),
} as const

export type SIconName = IconName | keyof typeof EXTRA
type Props = { name: SIconName; size?: number; fill?: boolean } & Omit<SVGProps<SVGSVGElement>, 'name' | 'fill'>

export function SI({ name, size = 16, fill, ...rest }: Props) {
  if (name in EXTRA) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}
        dangerouslySetInnerHTML={{ __html: EXTRA[name as keyof typeof EXTRA] }} />
    )
  }
  return <Icon name={name as IconName} size={size} fill={fill} {...rest} />
}

type BtnProps = { icon: SIconName; label: string; size?: 'md' | 'sm'; on?: boolean; className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { ref?: React.Ref<HTMLButtonElement> }
/** IconButton that also accepts the local icons. */
export function SIB({ icon, label, size = 'md', on, className = '', type = 'button', ...rest }: BtnProps) {
  return (
    <button type={type} aria-label={label} title={label} className={`icon-btn ${size === 'sm' ? 'sm' : ''} ${on ? 'on' : ''} ${className}`} {...rest}>
      <SI name={icon} size={size === 'sm' ? 15 : 17} />
    </button>
  )
}
