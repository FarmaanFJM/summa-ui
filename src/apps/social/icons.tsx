import type { SVGProps } from 'react'
import { Icon, type IconName } from '../../ui'


export type SIconName = IconName
type Props = { name: SIconName; size?: number; fill?: boolean } & Omit<SVGProps<SVGSVGElement>, 'name' | 'fill'>

export function SI({ name, size = 16, fill, ...rest }: Props) {
  return <Icon name={name} size={size} fill={fill} {...rest} />
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
