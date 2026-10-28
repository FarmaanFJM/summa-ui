import type { SVGProps } from 'react'
import { Icon, type IconName } from '../../ui'


export type SIconName = IconName
type Props = { name: SIconName; size?: number; fill?: boolean } & Omit<SVGProps<SVGSVGElement>, 'name' | 'fill'>

export function SI({ name, size = 16, fill, ...rest }: Props) {
  return <Icon name={name} size={size} fill={fill} {...rest} />
}
