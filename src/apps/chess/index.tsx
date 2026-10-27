import './chess.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Icon, IconButton, useMedia } from '../../ui'
import { HeroGame } from './Game'
import { CLUB, UPCOMING } from './data'
import { Events } from './Events'
import { JoinDialog, Membership, type Joined } from './Membership'
import { Band } from './parts'
import { PuzzleBoard } from './Puzzle'
import { Standings } from './Standings'
import { Tournaments, spotsLeft, type Signups } from './Tournaments'

const LINKS = [
  { id: 'play', label: 'Play' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'standings', label: 'Standings' },
  { id: 'events', label: 'Events' },
  { id: 'membership', label: 'Membership' },
]
const SECTION_ORDER = ['play', 'puzzle', 'tournaments', 'standings', 'events', 'membership', 'contact']
const GROUP: Record<string, string> = { puzzle: 'play', contact: 'membership' }

export default function ChessClub() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState('play')
  const [menu, setMenu] = useState(false)
  const [signups, setSignups] = useState<Signups>({})
  const [joined, setJoined] = useState<Joined | null>(null)
  const [join, setJoin] = useState<{ open: boolean; tier: string }>({ open: false, tier: 'member' })
  const joinCount = useRef(0)
  const compact = useMedia('(max-width: 860px)')

  const goTo = useCallback((id: string, smooth = true) => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`#${id}`)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' })
    history.replaceState(null, '', `#/chess${id === 'play' ? '' : '/' + id}`)
    setMenu(false)
  }, [])

  // Deep link on load and on manual hash edits
  useEffect(() => {
    const sub = location.hash.split('/')[2]
    if (sub) requestAnimationFrame(() => goTo(sub, false))
    const h = () => { const s = location.hash.split('/')[2]; if (location.hash.startsWith('#/chess') && s) goTo(s) }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [goTo])

  // Current section for the nav
  useEffect(() => {
    const sc = scrollRef.current
    if (!sc) return
    let raf = 0
    const calc = () => {
      raf = 0
      let cur = SECTION_ORDER[0]
      const top = sc.getBoundingClientRect().top
      for (const id of SECTION_ORDER) {
        const el = sc.querySelector<HTMLElement>(`#${id}`)
        if (el && el.getBoundingClientRect().top - top <= 140) cur = id
      }
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) cur = 'contact'
      setActive(GROUP[cur] ?? cur)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(calc) }
    sc.addEventListener('scroll', on, { passive: true })
    calc()
    return () => { sc.removeEventListener('scroll', on); if (raf) cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => { if (!compact) setMenu(false) }, [compact])

  const t1 = UPCOMING.find(t => t.id === 't1')!
  const left1 = spotsLeft(t1, signups)
  const openJoin = (tier?: string) => setJoin({ open: true, tier: tier ?? joined?.tier ?? 'member' })

  return (
    <div className="cc-root">
      <div className="cc-scroll scroll" ref={scrollRef}>
        <header className="cc-nav">
          <div className="cc-wrap cc-nav-in">
            <a className="cc-logo" href="#/chess" onClick={e => { e.preventDefault(); goTo('play') }} aria-label="Northgate Chess Club, home">
              <span className="brand-mark"><Icon name="circle-dot" size={13} strokeWidth={2.4} /></span>
              <span>Northgate</span>
            </a>
            <nav className="cc-links" aria-label="Sections">
              {LINKS.map(l => (
                <a key={l.id} href={`#/chess/${l.id}`} className="cc-link" aria-current={active === l.id ? 'true' : undefined} onClick={e => { e.preventDefault(); goTo(l.id) }}>{l.label}</a>
              ))}
            </nav>
            <div className="cc-nav-end">
              {joined
                ? <Button icon="check" onClick={() => goTo('membership')}>Member</Button>
                : <Button variant="primary" onClick={() => openJoin()}>Join</Button>}
              <IconButton icon={menu ? 'x' : 'menu'} label={menu ? 'Close menu' : 'Open menu'} className="cc-burger" aria-expanded={menu} aria-controls="cc-sheet" onClick={() => setMenu(m => !m)} />
            </div>
          </div>
        </header>

        {menu && <Sheet active={active} onGo={goTo} onClose={() => setMenu(false)} />}

        <main>
          <Band id="play" tone="a" className="cc-hero"><div className="cc-hero-grid"><HeroGame /></div></Band>

          <div className="cc-news">
            <div className="cc-wrap cc-news-in">
              <span className="muted">Autumn Rapid Open on Saturday 14 November. {left1 > 0 ? `${left1} places left.` : 'Now full.'}</span>
              <Button variant="ghost" onClick={() => goTo('tournaments')} icon="arrow-right">Tournaments</Button>
            </div>
          </div>

          <Band id="puzzle" tone="b"><PuzzleBoard /></Band>
          <Tournaments signups={signups} setSignup={(id, v) => setSignups(s => ({ ...s, [id]: v }))} />
          <Standings />
          <Events />
          <Membership joined={joined} openJoin={openJoin} />
        </main>

        <footer id="contact" className="cc-footer">
          <div className="cc-wrap cc-footer-in">
            <div>
              <div className="cc-logo static"><span className="brand-mark"><Icon name="circle-dot" size={13} strokeWidth={2.4} /></span><span>{CLUB.name}</span></div>
              <address className="muted cc-address">{CLUB.address.map(l => <div key={l}>{l}</div>)}</address>
            </div>
            <div>
              <div className="eyebrow">Opening hours</div>
              <dl className="cc-hours">{CLUB.hours.map(([d, h]) => <div key={d}><dt className="muted">{d}</dt><dd>{h}</dd></div>)}</dl>
            </div>
            <div>
              <div className="eyebrow">Contact</div>
              <div className="cc-contact"><span>{CLUB.email}</span><span className="num muted">{CLUB.phone}</span></div>
            </div>
          </div>
          <div className="cc-wrap cc-legal faint">2026 Northgate Chess Club. Registered amateur sports club.</div>
        </footer>
      </div>

      <JoinDialog open={join.open} tierId={join.tier} onClose={() => setJoin(j => ({ ...j, open: false }))} onJoin={j => { joinCount.current++; setJoined(j) }} count={joinCount.current} />
    </div>
  )
}

function Sheet({ active, onGo, onClose }: { active: string; onGo: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('a')?.focus()
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <>
      <div className="cc-scrim" onClick={onClose} />
      <div className="cc-sheet" id="cc-sheet" ref={ref} role="dialog" aria-label="Menu">
        {LINKS.map(l => (
          <a key={l.id} href={`#/chess/${l.id}`} className="cc-sheet-link" aria-current={active === l.id ? 'true' : undefined} onClick={e => { e.preventDefault(); onGo(l.id) }}>{l.label}</a>
        ))}
      </div>
    </>
  )
}
