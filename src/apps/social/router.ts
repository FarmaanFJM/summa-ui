import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' } | { name: 'explore'; q: string } | { name: 'notifications' }
  | { name: 'profile'; handle: string } | { name: 'post'; id: string }

export const href = {
  home: '#/social', explore: (q = '') => '#/social/explore' + (q ? `?q=${encodeURIComponent(q)}` : ''), notifications: '#/social/notifications',
  profile: (h: string) => `#/social/u/${h}`, post: (id: string) => `#/social/post/${id}`,
}
export const go = (h: string) => { location.hash = h }

function parse(): Route {
  const raw = location.hash.replace(/^#\/?social\/?/, '')
  const [path, query = ''] = raw.split('?')
  const seg = path.split('/').filter(Boolean)
  if (seg[0] === 'explore') return { name: 'explore', q: new URLSearchParams(query).get('q') ?? '' }
  if (seg[0] === 'notifications') return { name: 'notifications' }
  if (seg[0] === 'u' && seg[1]) return { name: 'profile', handle: decodeURIComponent(seg[1]) }
  if (seg[0] === 'post' && seg[1]) return { name: 'post', id: decodeURIComponent(seg[1]) }
  return { name: 'home' }
}

export function useSocialRoute() {
  const [r, setR] = useState<Route>(parse)
  useEffect(() => {
    const f = () => { if (/^#\/?social/.test(location.hash)) setR(parse()) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}
