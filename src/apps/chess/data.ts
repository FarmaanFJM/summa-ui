/* Hardcoded club content. "Today" is Tuesday 27 October 2026. */
export const TODAY = '2026-10-27'

export const CLUB = {
  name: 'Northgate Chess Club',
  address: ['The Old Corn Exchange', '22 Foundry Row', 'Ardenvale AV2 4NR'],
  email: 'play@northgatechess.example',
  phone: '(0555) 014 2290',
  hours: [
    ['Tuesday', 'Club night, 19:00 to 22:30'],
    ['Thursday', 'Training night, 19:00 to 22:00'],
    ['Saturday', 'Junior lessons, 10:00 to 12:30'],
    ['Sunday', 'Open play, 14:00 to 18:00'],
  ] as [string, string][],
}

/* ------------------------------------------------------------------ Tournaments */
export type Tournament = { id: string; name: string; date: string; time: string; format: string; control: string; entry: number; capacity: number; registered: number; winner?: string; section: string }

export const UPCOMING: Tournament[] = [
  { id: 't1', name: 'Autumn Rapid Open', date: '2026-11-14', time: '10:00', format: 'Swiss, 6 rounds', control: '15 minutes + 5 seconds', entry: 15, capacity: 48, registered: 41, section: 'Open' },
  { id: 't2', name: 'Club Championship 2026/27', date: '2026-11-10', time: '19:00', format: 'Swiss, 7 rounds, weekly', control: '90 minutes + 30 seconds', entry: 20, capacity: 40, registered: 27, section: 'Open' },
  { id: 't3', name: 'Junior Rapid Cup', date: '2026-11-21', time: '10:00', format: 'Swiss, 5 rounds', control: '10 minutes + 5 seconds', entry: 5, capacity: 32, registered: 29, section: 'Junior' },
  { id: 't4', name: 'Winter Blitz Arena', date: '2026-12-04', time: '19:30', format: 'Arena, 90 minutes', control: '3 minutes + 2 seconds', entry: 8, capacity: 36, registered: 19, section: 'Open' },
  { id: 't5', name: 'Christmas Quickplay', date: '2026-12-19', time: '11:00', format: 'Double round robin, 8 players', control: '20 minutes + 10 seconds', entry: 10, capacity: 8, registered: 8, section: 'Open' },
  { id: 't6', name: 'Women’s Rapid Invitational', date: '2027-01-09', time: '10:00', format: 'Swiss, 5 rounds', control: '15 minutes + 5 seconds', entry: 10, capacity: 24, registered: 11, section: 'Women' },
]

export const PAST: Tournament[] = [
  { id: 'p1', name: 'Autumn Blitz', date: '2026-10-10', time: '19:30', format: 'Arena, 90 minutes', control: '3 minutes + 2 seconds', entry: 8, capacity: 36, registered: 33, winner: 'Marcus Hale', section: 'Open' },
  { id: 'p2', name: 'Junior Blitz Cup', date: '2026-09-19', time: '10:00', format: 'Swiss, 7 rounds', control: '5 minutes + 3 seconds', entry: 5, capacity: 32, registered: 26, winner: 'Arlo Whitcombe', section: 'Junior' },
  { id: 'p3', name: 'Summer Rapid Open', date: '2026-08-15', time: '10:00', format: 'Swiss, 6 rounds', control: '15 minutes + 5 seconds', entry: 15, capacity: 48, registered: 44, winner: 'Tomasz Wieczorek', section: 'Open' },
  { id: 'p4', name: 'Club Championship 2025/26', date: '2026-06-23', time: '19:00', format: 'Swiss, 7 rounds, weekly', control: '90 minutes + 30 seconds', entry: 20, capacity: 40, registered: 36, winner: 'Priya Venkataraman', section: 'Open' },
  { id: 'p5', name: 'Spring Open', date: '2026-04-11', time: '10:00', format: 'Swiss, 6 rounds', control: '15 minutes + 5 seconds', entry: 15, capacity: 48, registered: 47, winner: 'Elias Brandt', section: 'Open' },
]

/* ------------------------------------------------------------------ Standings */
export type Section = 'Open' | 'Junior' | 'Women'
export type Player = { id: string; name: string; rating: number; w: number; d: number; l: number; section: Section; form: string; age?: number; since: number }

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const RAW: [string, number, Section, number][] = [
  ['Marcus Hale', 2104, 'Open', 2009], ['Tomasz Wieczorek', 2018, 'Open', 2012], ['Elias Brandt', 1984, 'Open', 2015], ['Daniel Okafor', 1942, 'Open', 2018],
  ['Rui Fernandes', 1893, 'Open', 2019], ['Callum Reid', 1851, 'Open', 2011], ['Samir Haddad', 1812, 'Open', 2021], ['Walter Doyle', 1760, 'Open', 2004],
  ['Oliver Trent', 1724, 'Open', 2022], ['Kofi Mensah', 1688, 'Open', 2020], ['Gareth Pryce', 1631, 'Open', 2016], ['Jonas Eklund', 1594, 'Open', 2023],
  ['Stefan Novak', 1522, 'Open', 2024],
  ['Priya Venkataraman', 2061, 'Women', 2013], ['Hannah Lindqvist', 1911, 'Women', 2017], ['Ines Moreau', 1874, 'Women', 2019], ['Adaeze Nwosu', 1790, 'Women', 2021],
  ['Maren Solberg', 1702, 'Women', 2022], ['Yuki Tanaka', 1655, 'Women', 2023], ['Beatrice Lang', 1580, 'Women', 2024],
  ['Arlo Whitcombe', 1870, 'Junior', 2020], ['Mei Zhang', 1810, 'Junior', 2021], ['Noor Rahman', 1744, 'Junior', 2022], ['Felix Bauer', 1655, 'Junior', 2022],
  ['Tilly Ashworth', 1502, 'Junior', 2023], ['Ravi Kapoor', 1480, 'Junior', 2024], ['Sofia Marchetti', 1390, 'Junior', 2025], ['Leo Park', 1275, 'Junior', 2025],
]

export const PLAYERS: Player[] = RAW.map(([name, rating, section, since], i) => {
  const r = rng(i * 7919 + 13)
  const games = 18 + Math.floor(r() * 22)
  const strength = Math.min(0.78, Math.max(0.3, 0.3 + (rating - 1250) / 1900))
  let w = 0, d = 0, l = 0
  const seq: string[] = []
  for (let g = 0; g < games; g++) {
    const x = r()
    const res = x < strength - 0.1 ? 'W' : x < strength + 0.12 ? 'D' : 'L'
    if (res === 'W') w++; else if (res === 'D') d++; else l++
    seq.push(res)
  }
  return { id: 'pl' + i, name, rating, w, d, l, section, since, form: seq.slice(-5).join(' ') }
})

/** Twelve monthly ratings ending at the current rating (deterministic). */
export function ratingHistory(p: Player): { label: string; value: number }[] {
  const r = rng(p.name.length * 977 + p.rating)
  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  const vals = [p.rating]
  for (let i = 1; i < 12; i++) vals.unshift(Math.round(vals[0] + (r() - 0.46) * 34))
  return months.map((label, i) => ({ label, value: vals[i] }))
}

/* ------------------------------------------------------------------ Events */
export type EventType = 'club' | 'lesson' | 'simul'
export type ClubEvent = { id: string; date: string; start: string; end: string; title: string; type: EventType; host: string; room: string; going: number; cap: number | null; note?: string }

const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const dow = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay()

function buildEvents(): ClubEvent[] {
  const out: ClubEvent[] = []
  const r = rng(404)
  const end = '2026-12-31'
  for (let day = TODAY; day <= end; day = addDays(day, 1)) {
    const w = dow(day)
    if (w === 2) out.push({ id: 'e-' + day + '-c', date: day, start: '19:00', end: '22:30', title: 'Tuesday Club Night', type: 'club', host: 'Duty captain: Walter Doyle', room: 'Main hall', going: 14 + Math.floor(r() * 12), cap: 40 })
    if (w === 4) out.push({ id: 'e-' + day + '-t', date: day, start: '19:00', end: '22:00', title: 'Thursday Training Night', type: 'club', host: 'Hosted by Daniel Okafor', room: 'Library room', going: 8 + Math.floor(r() * 8), cap: 24 })
    if (w === 6) out.push({ id: 'e-' + day + '-j', date: day, start: '10:00', end: '12:30', title: 'Junior Lessons', type: 'lesson', host: 'Coach Imani Clarke', room: 'Library room', going: 9 + Math.floor(r() * 6), cap: 20 })
  }
  const specials: Omit<ClubEvent, 'id'>[] = [
    { date: '2026-11-04', start: '19:00', end: '21:00', title: 'Endgame Essentials', type: 'lesson', host: 'FM Rafael Ortiz', room: 'Library room', going: 12, cap: 18 },
    { date: '2026-11-08', start: '15:00', end: '18:00', title: 'Simultaneous Exhibition', type: 'simul', host: 'IM Elena Voss, 20 boards', room: 'Main hall', going: 17, cap: 20, note: 'Bring a friend to play board 20.' },
    { date: '2026-11-18', start: '19:00', end: '21:00', title: 'Tactics Workshop', type: 'lesson', host: 'Coach Imani Clarke', room: 'Library room', going: 10, cap: 18 },
    { date: '2026-11-28', start: '15:00', end: '18:00', title: 'Simultaneous Exhibition', type: 'simul', host: 'FM Rafael Ortiz, 16 boards', room: 'Main hall', going: 11, cap: 16 },
    { date: '2026-12-02', start: '19:00', end: '21:00', title: 'Opening Repertoire Clinic', type: 'lesson', host: 'IM Elena Voss', room: 'Library room', going: 7, cap: 18 },
    { date: '2026-12-12', start: '14:00', end: '17:30', title: 'Christmas Simul', type: 'simul', host: 'Club champion Priya Venkataraman', room: 'Main hall', going: 19, cap: 24 },
    { date: '2026-10-31', start: '15:00', end: '17:00', title: 'Halloween Beginners Afternoon', type: 'lesson', host: 'Coach Imani Clarke', room: 'Main hall', going: 6, cap: 20 },
  ]
  specials.forEach((s, i) => out.push({ ...s, id: 'e-sp' + i }))
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
}
export const EVENTS: ClubEvent[] = buildEvents()

/* ------------------------------------------------------------------ Membership */
export type Tier = { id: string; name: string; monthly: number; yearly: number; blurb: string }
export const TIERS: Tier[] = [
  { id: 'casual', name: 'Casual', monthly: 6, yearly: 60, blurb: 'Drop in when you can.' },
  { id: 'member', name: 'Member', monthly: 14, yearly: 140, blurb: 'The full club year.' },
  { id: 'performance', name: 'Performance', monthly: 28, yearly: 280, blurb: 'Coaching and league play.' },
]
export const FEATURES: { label: string; values: (boolean | string)[] }[] = [
  { label: 'Club nights', values: ['2 per month', 'Unlimited', 'Unlimited'] },
  { label: 'Rated ladder place', values: [false, true, true] },
  { label: 'Tournament entry', values: ['Standard fee', '20% off', 'Free for club events'] },
  { label: 'Group lessons', values: [false, true, true] },
  { label: 'Simul exhibitions', values: ['Spectate', 'Play', 'Priority boards'] },
  { label: 'League team selection', values: [false, true, true] },
  { label: 'Private coaching', values: [false, false, '2 sessions per month'] },
  { label: 'Guest passes', values: [false, '1 per month', '3 per month'] },
]

/* ------------------------------------------------------------------ Dates */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const monthName = (m: number) => MONTHS[m]
export const dayName = (iso: string, short = false) => (short ? DAYS[dow(iso)].slice(0, 3) : DAYS[dow(iso)])
export const fmtDate = (iso: string, withDay = true) => { const [y, m, d] = iso.split('-').map(Number); return `${withDay ? DAYS[dow(iso)].slice(0, 3) + ' ' : ''}${d} ${MONTHS[m - 1].slice(0, 3)}${y !== 2026 ? ' ' + y : ''}` }
export const gbp = (n: number) => `£${n}`

/** Build an iCalendar file for one or more events. */
export function toICS(events: ClubEvent[]): string {
  const stamp = (d: string, t: string) => d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00'
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Northgate Chess Club//Events//EN', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT', `UID:${e.id}@northgatechess.example`, 'DTSTAMP:20261027T090000Z',
      `DTSTART:${stamp(e.date, e.start)}`, `DTEND:${stamp(e.date, e.end)}`,
      `SUMMARY:${e.title}`, `DESCRIPTION:${e.host}`, `LOCATION:${e.room}\\, The Old Corn Exchange\\, 22 Foundry Row\\, Ardenvale`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function download(name: string, text: string, type = 'text/calendar') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
