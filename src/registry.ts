import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { IconName } from './ui'

export type Proto = { id: string; group: 1 | 2; letter: string; name: string; blurb: string; icon: IconName; Component: LazyExoticComponent<ComponentType> }

export const PROTOTYPES: Proto[] = [
  { id: 'ai', group: 1, letter: 'A', name: 'AI Workspace', blurb: 'Conversations, composer, model selection', icon: 'message', Component: lazy(() => import('./apps/ai')) },
  { id: 'projects', group: 1, letter: 'B', name: 'Project Manager', blurb: 'Projects, tasks, labels, filters', icon: 'circle-check', Component: lazy(() => import('./apps/projects')) },
  { id: 'documents', group: 1, letter: 'C', name: 'Document Editor', blurb: 'Writing canvas, formatting, tables', icon: 'file-text', Component: lazy(() => import('./apps/documents')) },
  { id: 'analytics', group: 1, letter: 'D', name: 'Analytics Dashboard', blurb: 'KPIs, charts, tables, date ranges', icon: 'trending-up', Component: lazy(() => import('./apps/analytics')) },
  { id: 'files', group: 1, letter: 'E', name: 'File Manager', blurb: 'Folders, selection, sorting, context menus', icon: 'folder', Component: lazy(() => import('./apps/files')) },
  { id: 'media', group: 1, letter: 'F', name: 'Media Library', blurb: 'Collections, assets, playback', icon: 'film', Component: lazy(() => import('./apps/media')) },
  { id: 'executive', group: 2, letter: 'G', name: 'Executive Dashboard', blurb: 'Top bar and 12-column grid', icon: 'grid', Component: lazy(() => import('./apps/executive')) },
  { id: 'chess', group: 2, letter: 'H', name: 'Chess Club', blurb: 'Public site with a playable board', icon: 'circle-dot', Component: lazy(() => import('./apps/chess')) },
  { id: 'social', group: 2, letter: 'I', name: 'Social Media', blurb: 'Centred feed, profiles, notifications', icon: 'users', Component: lazy(() => import('./apps/social')) },
  { id: 'trading', group: 2, letter: 'J', name: 'Trading Platform', blurb: 'Simulated terminal grid', icon: 'trending-up', Component: lazy(() => import('./apps/trading')) },
  { id: 'store', group: 2, letter: 'K', name: 'E-commerce Store', blurb: 'Catalog, cart, simulated checkout', icon: 'tag', Component: lazy(() => import('./apps/store')) },
  { id: 'travel', group: 2, letter: 'L', name: 'Travel Booking', blurb: 'Search, results, reservation flow', icon: 'cloud', Component: lazy(() => import('./apps/travel')) },
]
