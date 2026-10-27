import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' } | { name: 'category'; id: string; type: string } | { name: 'product'; id: string } | { name: 'search'; q: string }
  | { name: 'checkout' } | { name: 'order'; ref: string } | { name: 'wishlist' }

export const href = {
  home: '#/store', cat: (id: string, type = '') => `#/store/c/${id}${type ? `?type=${type}` : ''}`, product: (id: string) => `#/store/p/${id}`,
  search: (q: string) => `#/store/search?q=${encodeURIComponent(q)}`, checkout: '#/store/checkout', order: (ref: string) => `#/store/order/${ref}`, wishlist: '#/store/wishlist',
}
export const go = (h: string) => { location.hash = h }

function parse(): Route {
  const raw = location.hash.replace(/^#\/?store\/?/, '')
  const [path, query = ''] = raw.split('?')
  const q = new URLSearchParams(query)
  const seg = path.split('/').filter(Boolean)
  if (seg[0] === 'c' && seg[1]) return { name: 'category', id: seg[1], type: q.get('type') ?? '' }
  if (seg[0] === 'p' && seg[1]) return { name: 'product', id: seg[1] }
  if (seg[0] === 'search') return { name: 'search', q: q.get('q') ?? '' }
  if (seg[0] === 'checkout') return { name: 'checkout' }
  if (seg[0] === 'order' && seg[1]) return { name: 'order', ref: seg[1] }
  if (seg[0] === 'wishlist') return { name: 'wishlist' }
  return { name: 'home' }
}

export function useStoreRoute() {
  const [r, setR] = useState<Route>(parse)
  useEffect(() => {
    const f = () => { if (/^#\/?store/.test(location.hash)) setR(parse()) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}
