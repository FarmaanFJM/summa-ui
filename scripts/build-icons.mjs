// Regenerates the ICONS record in src/ui/icons.tsx from guidance/icons/catalog.json and svg/*.svg.
// Usage: node scripts/build-icons.mjs   (npm run icons:build)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'guidance/icons/catalog.json'), 'utf8'))

const entries = catalog.icons.map(icon => {
  const svg = fs.readFileSync(path.join(root, 'guidance', icon.file), 'utf8')
  const m = svg.match(/^<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/)
  if (!m) throw new Error(`Cannot parse ${icon.file}`)
  const inner = m[1].trim()
  if (inner.includes('`') || inner.includes('${')) throw new Error(`Unsafe markup in ${icon.file}`)
  const key = /^[a-z_][a-z0-9_]*$/.test(icon.name) ? icon.name : `'${icon.name}'`
  return `  ${key}: \`${inner}\`,`
})

const out = `// GENERATED FILE. Do not edit by hand.
// Source: guidance/icons/catalog.json + guidance/icons/svg/*.svg (Lucide, ISC). Regenerate with: npm run icons:build
import type { SVGProps } from 'react'

export const ICONS = {
${entries.join('\n')}
} as const

export type IconName = keyof typeof ICONS

type IconProps = { name: IconName; size?: number; fill?: boolean } & Omit<SVGProps<SVGSVGElement>, 'name' | 'fill'>

/** Lucide stroke icons (24px grid, ${catalog.stroke.width} stroke). All apps use this single set (Principle 7). */
export function Icon({ name, size = 16, fill, ...rest }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={${catalog.stroke.width}} strokeLinecap="${catalog.stroke.linecap}" strokeLinejoin="${catalog.stroke.linejoin}" aria-hidden="true" focusable="false" {...rest}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}
`
fs.writeFileSync(path.join(root, 'src/ui/icons.tsx'), out)
console.log(`Wrote src/ui/icons.tsx with ${entries.length} icons`)
