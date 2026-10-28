import './travel.css'
import { useEffect, useRef, useState } from 'react'
import { Button, Dialog, Icon, IconButton, Menu, useAnchored, useMedia, type MenuEntry } from '../../ui'
import { BookPage } from './Book'
import { RATES, destById, stayById, type Currency, type Locale } from './data'
import { Landing } from './Landing'
import { StayTile } from './parts'
import { Results } from './Results'
import { StayPage } from './Stay'
import { TripsPage } from './Trips'
import { TravelProvider, go, useTravel } from './store'

function Header() {
  const { cur, setCur, loc, setLoc, trips, saved, route } = useTravel()
  const money = useAnchored(), acct = useAnchored()
  const [savedOpen, setSavedOpen] = useState(false)
  const narrow = useMedia('(max-width: 720px)')
  const active = trips.filter(t => t.status === 'confirmed').length

  const regional: MenuEntry[] = [
    { type: 'heading', label: 'Currency' },
    ...(Object.keys(RATES) as Currency[]).map(c => ({ label: { GBP: 'Pound sterling (GBP)', EUR: 'Euro (EUR)', USD: 'US dollar (USD)' }[c], checked: cur === c, onSelect: () => setCur(c) })),
    { type: 'sep' },
    { type: 'heading', label: 'Language and dates' },
    ...([['en-GB', 'English (UK), day first'], ['en-US', 'English (US), month first']] as [Locale, string][]).map(([l, label]) => ({ label, checked: loc === l, onSelect: () => setLoc(l) })),
  ]
  const account: MenuEntry[] = [
    { label: 'Trips', icon: 'calendar', onSelect: () => go('/trips') },
    { label: `Saved stays (${saved.length})`, icon: 'heart', onSelect: () => setSavedOpen(true) },
  ]
  return (
    <header className="tv-header">
      <div className="tv-wrap tv-header-in">
        <a href="#/travel" className="tv-logo" aria-label="Wayfarer, home"><span className="brand-mark"><Icon name="flag" size={13} strokeWidth={2.4} /></span><span>Wayfarer</span></a>
        <nav className="tv-header-end" aria-label="Account">
          <Button variant="ghost" icon="calendar" className={`tv-trips-btn ${route.page === 'trips' ? 'on' : ''}`} aria-current={route.page === 'trips' ? 'page' : undefined} onClick={() => go('/trips')}>
            Trips{active > 0 && <span className="tv-count-dot num">{active}</span>}
          </Button>
          <Button ref={money.ref} variant="ghost" aria-haspopup="menu" aria-expanded={money.open} aria-label={`Currency and language, ${cur}`} onClick={money.toggle}>
            <Icon name="cloud" size={15} />{!narrow && <span className="num">{cur} · {loc === 'en-GB' ? 'UK' : 'US'}</span>}
          </Button>
          <Menu anchor={money.el} open={money.open} onClose={money.close} items={regional} label="Currency and language" width={250} />
          <IconButton ref={acct.ref} icon="user" label="Account menu" aria-haspopup="menu" aria-expanded={acct.open} onClick={acct.toggle} />
          <Menu anchor={acct.el} open={acct.open} onClose={acct.close} items={account} label="Account" />
        </nav>
      </div>
      <Dialog open={savedOpen} onClose={() => setSavedOpen(false)} title="Saved stays" width={560} footer={<Button onClick={() => setSavedOpen(false)} data-autofocus>Close</Button>}>
        {saved.length === 0 ? <p className="muted" style={{ margin: '4px 0 12px' }}>Tap the heart on a stay to save it here.</p> : (
          <div className="tv-saved" onClick={() => setSavedOpen(false)}>{saved.map(id => { const s = stayById(id); return s ? <StayTile key={id} s={s} q={{ dest: s.dest, checkIn: '2026-11-20', checkOut: '2026-11-24', adults: 2, children: 0, rooms: 1 }} /> : null })}</div>
        )}
      </Dialog>
    </header>
  )
}

function Pages() {
  const { route } = useTravel()
  const sc = useRef<HTMLDivElement>(null)
  useEffect(() => { sc.current?.scrollTo({ top: 0 }) }, [route.page, route.id])
  useEffect(() => {
    const dest = destById(route.q.dest)
    const s = stayById(route.id)
    const t = { home: 'Wayfarer', results: `${dest?.name ?? 'Stays'} stays`, stay: s?.name ?? 'Stay', book: 'Book your stay', trips: 'Trips' }[route.page]
    document.title = `${t} · Wayfarer`
  }, [route])
  return (
    <div className="tv-scroll scroll" ref={sc}>
      {route.page === 'home' && <Landing q={route.q} />}
      {route.page === 'results' && <Results q={route.q} />}
      {route.page === 'stay' && <StayPage id={route.id} q={route.q} room={route.params.get('room')} />}
      {route.page === 'book' && <BookPage id={route.id} q={route.q} roomId={route.params.get('room')} />}
      {route.page === 'trips' && <TripsPage />}
    </div>
  )
}

export default function TravelApp() {
  return (
    <TravelProvider>
      <div className="tv-root">
        <Header />
        <Pages />
      </div>
    </TravelProvider>
  )
}
