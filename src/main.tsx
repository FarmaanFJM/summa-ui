import { StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import { PROTOTYPES } from './registry'
import Lab from './lab/Lab'
import Principles from './lab/Principles'

function useRoute() {
  const get = () => location.hash.replace(/^#\/?/, '')
  const [r, setR] = useState(get)
  useEffect(() => {
    const f = () => setR(get())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}

function Root() {
  const route = useRoute()
  const [head, tail] = route.split('/')
  // Standalone prototypes: no laboratory chrome at all.
  const proto = PROTOTYPES.find(p => p.id === head)
  useEffect(() => { document.title = proto ? `${proto.name} · Summa-UI` : 'Summa-UI Laboratory' }, [proto])
  if (proto) return <Suspense fallback={null}><proto.Component /></Suspense>
  if (head === 'principles') return <Principles />
  return <Lab current={head === 'lab' && tail ? tail : PROTOTYPES[0].id} />
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>)
