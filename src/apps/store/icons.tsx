import type { SVGProps } from 'react'
import { Icon, type IconName } from '../../ui'

const C = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
const P = (d: string) => `<path d="${d}"/>`
/** App-local additions drawn in the same 24px / 1.75 stroke style as the shared set. */
const EXTRA = {
  bag: P('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0'),
  truck: P('M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14') + C(7, 18, 2) + C(17, 18, 2),
  'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/>' + P('M2 10h20'),
  refresh2: P('M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5'),
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
