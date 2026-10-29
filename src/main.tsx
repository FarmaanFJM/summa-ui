import { lazy, StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import './styles/workspace.css'
import { PROTOTYPES } from './registry'
import Lab from './lab/Lab'
import Principles from './lab/Principles'
import GuidanceLayout, { type GuidanceTab } from './lab/guidance/Layout'

const WorkspaceDemo = lazy(() => import('./lab/workspace/WorkspaceDemo'))

const GUIDANCE = {
  antipatterns: lazy(() => import('./lab/guidance/AntiPatterns')),
  icons: lazy(() => import('./lab/guidance/Icons')),
  presets: lazy(() => import('./lab/guidance/Presets')),
} as const

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
  // Standalone pattern demo (docs/WORKSPACE_PATTERN.md). Not a registered prototype and not an approved reference.
  if (head === 'workspace') return <Suspense fallback={null}><WorkspaceDemo /></Suspense>
  if (head === 'principles') return <GuidanceLayout current="principles"><Principles /></GuidanceLayout>
  if (head === 'guidance' && tail && tail in GUIDANCE) {
    const Page = GUIDANCE[tail as keyof typeof GUIDANCE]
    return <GuidanceLayout current={tail as GuidanceTab}><Suspense fallback={null}><Page sub={route.split('/')[2]} /></Suspense></GuidanceLayout>
  }
  return <Lab current={head === 'lab' && tail ? tail : PROTOTYPES[0].id} />
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>)
