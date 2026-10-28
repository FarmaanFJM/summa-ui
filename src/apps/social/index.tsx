import './social.css'
import { useEffect, useRef, useState } from 'react'
import { Dialog, Menu, useAnchored, useMedia, type MenuEntry } from '../../ui'
import { SI, type SIconName } from './icons'
import { Composer } from './Composer'
import { Face } from './Post'
import { Explore, Home, Notifications, PostPage, Profile, Rail } from './Pages'
import { SocialProvider, useSocial } from './state'
import { go, href, useSocialRoute, type Route } from './router'
import { Viewer } from './Viewer'

const NAV: { key: Route['name']; label: string; icon: SIconName; to: string }[] = [
  { key: 'home', label: 'Home', icon: 'home', to: href.home },
  { key: 'explore', label: 'Explore', icon: 'search', to: href.explore() },
  { key: 'notifications', label: 'Notifications', icon: 'bell', to: href.notifications },
]

function TopBar({ route }: { route: Route }) {
  const { me, unread, openCompose, say } = useSocial()
  const menu = useAnchored()
  const [q, setQ] = useState('')
  const profileActive = route.name === 'profile' && route.handle === me.handle
  const items: MenuEntry[] = [
    { label: 'View profile', icon: 'user', onSelect: () => go(href.profile(me.handle)) },
    { label: 'Copy profile link', icon: 'link', onSelect: async () => { try { await navigator.clipboard.writeText(location.origin + location.pathname + href.profile(me.handle)) } catch { /* ignore */ } say('Profile link copied') } },
  ]
  return (
    <header className="so-top">
      <a className="so-logo" href={href.home} aria-label="Tidepool home">
        <span className="brand-mark"><SI name="layers" size={13} strokeWidth={2.4} /></span><span className="so-logo-t">Tidepool</span>
      </a>
      <nav className="so-nav" aria-label="Primary">
        {NAV.map(n => (
          <a key={n.key} href={n.to} className="so-navitem" aria-label={n.label} aria-current={route.name === n.key ? 'page' : undefined}>
            <SI name={n.icon} size={16} /><span>{n.label}</span>
            {n.key === 'notifications' && unread > 0 && <span className="so-badge num" aria-label={`${unread} unread`}>{unread}</span>}
          </a>
        ))}
        <a href={href.profile(me.handle)} className="so-navitem" aria-label="Profile" aria-current={profileActive ? 'page' : undefined}><SI name="user" size={16} /><span>Profile</span></a>
      </nav>
      <div className="so-top-right">
        <form className="search so-topsearch" onSubmit={e => { e.preventDefault(); if (q.trim()) { go(href.explore(q.trim())); setQ('') } }}>
          <SI name="search" size={15} />
          <input className="input" type="search" placeholder="Search" aria-label="Search Tidepool" value={q} onChange={e => setQ(e.target.value)} />
        </form>
        <a className="icon-btn so-searchicon" href={href.explore()} aria-label="Search"><SI name="search" size={17} /></a>
        <button type="button" className="btn btn-primary so-postbtn" onClick={() => openCompose()}>Post</button>
        <button ref={menu.ref} type="button" className="so-avbtn" aria-label="Account menu" aria-haspopup="menu" aria-expanded={menu.open} onClick={menu.toggle}><Face u={me} size={32} /></button>
        <Menu anchor={menu.el} open={menu.open} onClose={menu.close} items={items} label="Account" />
      </div>
    </header>
  )
}

function BottomBar({ route }: { route: Route }) {
  const { me, unread, openCompose } = useSocial()
  const t = (key: Route['name'], label: string, icon: SIconName, to: string, active = route.name === key) => (
    <a href={to} className="so-tab" aria-current={active ? 'page' : undefined} aria-label={label}>
      <SI name={icon} size={22} />{key === 'notifications' && unread > 0 && <span className="so-tabdot" aria-label={`${unread} unread`} />}
    </a>
  )
  return (
    <nav className="so-bottom" aria-label="Primary">
      {t('home', 'Home', 'home', href.home)}
      {t('explore', 'Explore', 'search', href.explore())}
      <button type="button" className="so-fab" aria-label="New post" onClick={() => openCompose()}><SI name="plus" size={22} strokeWidth={2.2} /></button>
      {t('notifications', 'Notifications', 'bell', href.notifications)}
      {t('profile', 'Profile', 'user', href.profile(me.handle), route.name === 'profile' && route.handle === me.handle)}
    </nav>
  )
}

function Shell() {
  const route = useSocialRoute()
  const { compose, closeCompose, toast } = useSocial()
  const scroll = useRef<HTMLDivElement>(null)
  const wide = useMedia('(min-width: 1060px)')
  const key = route.name + ('handle' in route ? route.handle : 'id' in route ? route.id : 'q' in route ? route.q : '')
  useEffect(() => { scroll.current?.scrollTo(0, 0) }, [key])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !/INPUT|TEXTAREA/.test(t.tagName) && !document.querySelector('[role=dialog]')) { e.preventDefault(); document.querySelector<HTMLButtonElement>('.so-postbtn, .so-fab')?.click() }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return (
    <div className="so-root">
      <TopBar route={route} />
      <div className="so-scroll scroll" ref={scroll}>
        <div className="so-wrap">
          <main className="so-col" id="so-main" aria-label="Feed">
            {route.name === 'home' && <Home />}
            {route.name === 'explore' && <Explore q={route.q} />}
            {route.name === 'notifications' && <Notifications />}
            {route.name === 'profile' && <Profile handle={route.handle} />}
            {route.name === 'post' && <PostPage id={route.id} />}
          </main>
          {wide && <Rail />}
        </div>
      </div>
      <BottomBar route={route} />
      <Dialog open={!!compose} onClose={closeCompose} title={compose?.quote ? 'Quote post' : 'New post'}>
        {compose && <Composer key={compose.quote ?? 'new'} dialog draft={compose} onDone={closeCompose} />}
      </Dialog>
      <Viewer />
      <div className="so-toast" role="status" aria-live="polite">{toast && <span>{toast}</span>}</div>
    </div>
  )
}

export default function Social() {
  return <SocialProvider><Shell /></SocialProvider>
}
