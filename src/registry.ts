import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { IconName } from './ui'

export type Proto = { id: string; letter: string; name: string; blurb: string; icon: IconName; Component: LazyExoticComponent<ComponentType> }

export const PROTOTYPES: Proto[] = [
  { id: 'ai', letter: 'A', name: 'AI Workspace', blurb: 'Conversations, composer, model selection', icon: 'message', Component: lazy(() => import('./apps/ai')) },
  { id: 'projects', letter: 'B', name: 'Project Manager', blurb: 'Projects, tasks, labels, filters', icon: 'circle-check', Component: lazy(() => import('./apps/projects')) },
  { id: 'documents', letter: 'C', name: 'Document Editor', blurb: 'Writing canvas, formatting, tables', icon: 'file-text', Component: lazy(() => import('./apps/documents')) },
  { id: 'analytics', letter: 'D', name: 'Analytics Dashboard', blurb: 'KPIs, charts, tables, date ranges', icon: 'trending-up', Component: lazy(() => import('./apps/analytics')) },
  { id: 'files', letter: 'E', name: 'File Manager', blurb: 'Folders, selection, sorting, context menus', icon: 'folder', Component: lazy(() => import('./apps/files')) },
  { id: 'media', letter: 'F', name: 'Media Library', blurb: 'Collections, assets, playback', icon: 'film', Component: lazy(() => import('./apps/media')) },
]
