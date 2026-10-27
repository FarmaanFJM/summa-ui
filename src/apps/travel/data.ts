/* Wayfarer: deterministic stay data. "Today" is 2026-10-27. Prices are stored in GBP. */
export const TODAY = '2026-10-27'

export type Motif = 'coast' | 'alpine' | 'city' | 'nightcity' | 'desert' | 'islands' | 'forest' | 'room' | 'detail'
export type Destination = { id: string; name: string; country: string; motif: Motif; pal: string; blurb: string }

export const DESTINATIONS: Destination[] = [
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', motif: 'city', pal: 'ember', blurb: 'Tiled hillsides and tram bells' },
  { id: 'amalfi', name: 'Amalfi Coast', country: 'Italy', motif: 'coast', pal: 'tide', blurb: 'Lemon terraces above the sea' },
  { id: 'chamonix', name: 'Chamonix', country: 'France', motif: 'alpine', pal: 'glacier', blurb: 'Glaciers, chalets and long ski days' },
  { id: 'marrakech', name: 'Marrakech', country: 'Morocco', motif: 'desert', pal: 'ochre', blurb: 'Riads, spice markets and the Atlas' },
  { id: 'santorini', name: 'Santorini', country: 'Greece', motif: 'islands', pal: 'bone', blurb: 'Whitewashed cliffs on the caldera' },
  { id: 'blackforest', name: 'Black Forest', country: 'Germany', motif: 'forest', pal: 'moss', blurb: 'Fir valleys, lakes and thermal spas' },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', motif: 'nightcity', pal: 'plum', blurb: 'Harbour lights and quiet design' },
  { id: 'algarve', name: 'Algarve', country: 'Portugal', motif: 'coast', pal: 'ochre2', blurb: 'Golden cliffs and calm coves' },
]

export type PropType = 'Hotel' | 'Apartment' | 'Villa' | 'Guesthouse' | 'Resort'
export type Room = { id: string; name: string; beds: string; sleeps: number; mult: number; left: number }
export type Review = { by: string; when: string; score: number; text: string }
export type Stay = {
  id: string; dest: string; name: string; type: PropType; stars: number; price: number; rating: number; reviews: number
  area: string; amenities: string[]; cancel: boolean; seed: number; description: string; highlights: string[]; rooms: Room[]; quotes: Review[]
}

type Raw = [string, string, PropType, number, number, number, number, string, string[], boolean]
const RAW: Raw[] = [
  ['lisbon', 'Casa do Largo', 'Hotel', 4, 128, 9.0, 612, 'Alfama', ['Wifi', 'Breakfast', 'Air conditioning', 'Bar'], true],
  ['lisbon', 'Rua Nova Apartments', 'Apartment', 3, 96, 8.6, 241, 'Baixa', ['Wifi', 'Kitchen', 'Washer', 'Air conditioning'], true],
  ['lisbon', 'Palacete Azul', 'Hotel', 5, 264, 9.5, 388, 'Chiado', ['Wifi', 'Spa', 'Pool', 'Breakfast', 'Bar', 'Gym'], false],
  ['amalfi', 'Villa Limone', 'Villa', 4, 310, 9.3, 174, 'Positano', ['Pool', 'Sea view', 'Breakfast', 'Wifi', 'Parking'], false],
  ['amalfi', 'Hotel Le Terrazze', 'Hotel', 4, 212, 8.9, 520, 'Amalfi town', ['Sea view', 'Breakfast', 'Wifi', 'Bar', 'Air conditioning'], true],
  ['amalfi', 'Casa Marinella', 'Guesthouse', 3, 134, 9.1, 96, 'Atrani', ['Wifi', 'Breakfast', 'Sea view', 'Air conditioning'], true],
  ['chamonix', 'Chalet Aiguille', 'Villa', 5, 420, 9.4, 88, 'Les Praz', ['Sauna', 'Fireplace', 'Wifi', 'Parking', 'Kitchen', 'Ski storage'], false],
  ['chamonix', 'Hotel du Glacier', 'Hotel', 4, 178, 8.8, 703, 'Centre', ['Wifi', 'Breakfast', 'Spa', 'Bar', 'Ski storage'], true],
  ['chamonix', 'Les Bossons Lodge', 'Guesthouse', 3, 112, 8.5, 214, 'Les Bossons', ['Wifi', 'Breakfast', 'Parking', 'Ski storage'], true],
  ['marrakech', 'Riad Safran', 'Guesthouse', 4, 118, 9.2, 457, 'Medina', ['Pool', 'Breakfast', 'Wifi', 'Air conditioning', 'Spa'], true],
  ['marrakech', 'Palmeraie Resort', 'Resort', 5, 286, 9.0, 1204, 'Palmeraie', ['Pool', 'Spa', 'Gym', 'Bar', 'Breakfast', 'Wifi', 'Air conditioning', 'Parking'], true],
  ['marrakech', 'Dar Elias', 'Guesthouse', 3, 74, 8.7, 168, 'Gueliz', ['Wifi', 'Breakfast', 'Air conditioning'], true],
  ['santorini', 'Caldera Suites', 'Hotel', 5, 378, 9.5, 402, 'Oia', ['Pool', 'Sea view', 'Breakfast', 'Wifi', 'Spa', 'Bar'], false],
  ['santorini', 'Oia Stone House', 'Villa', 4, 246, 9.2, 77, 'Imerovigli', ['Sea view', 'Kitchen', 'Wifi', 'Air conditioning', 'Pool'], true],
  ['santorini', 'Kamari Blue', 'Hotel', 3, 102, 8.3, 936, 'Kamari', ['Wifi', 'Pool', 'Breakfast', 'Beach access', 'Air conditioning'], true],
  ['blackforest', 'Waldhaus Tannenhoehe', 'Hotel', 4, 146, 9.1, 322, 'Schluchsee', ['Spa', 'Sauna', 'Breakfast', 'Wifi', 'Parking', 'Restaurant'], true],
  ['blackforest', 'Gasthof Hirschen', 'Guesthouse', 3, 88, 8.8, 261, 'Triberg', ['Breakfast', 'Wifi', 'Parking', 'Restaurant'], true],
  ['blackforest', 'Lakeside Cabin Titisee', 'Villa', 4, 164, 9.3, 59, 'Titisee', ['Kitchen', 'Fireplace', 'Wifi', 'Parking', 'Lake view'], false],
  ['copenhagen', 'Nyhavn Loft', 'Apartment', 4, 188, 9.0, 295, 'Nyhavn', ['Kitchen', 'Wifi', 'Washer', 'Air conditioning'], true],
  ['copenhagen', 'Hotel Kronborg Plads', 'Hotel', 4, 204, 8.9, 811, 'Indre By', ['Breakfast', 'Wifi', 'Bar', 'Gym', 'Restaurant'], true],
  ['copenhagen', 'Vesterbro Rooms', 'Guesthouse', 3, 109, 8.4, 640, 'Vesterbro', ['Wifi', 'Breakfast', 'Bike rental'], true],
  ['algarve', 'Quinta da Falesia', 'Resort', 5, 232, 9.1, 1488, 'Albufeira', ['Pool', 'Beach access', 'Spa', 'Gym', 'Breakfast', 'Wifi', 'Parking', 'Air conditioning'], true],
  ['algarve', 'Casa Sagres', 'Guesthouse', 3, 92, 9.0, 203, 'Sagres', ['Wifi', 'Breakfast', 'Sea view', 'Parking'], true],
  ['algarve', 'Praia Terrace Apartments', 'Apartment', 4, 138, 8.7, 377, 'Lagos', ['Pool', 'Kitchen', 'Wifi', 'Air conditioning', 'Parking'], false],
]

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

const ROOMS: Record<PropType, [string, string, number][]> = {
  Hotel: [['Classic double', '1 double bed', 2], ['Deluxe room', '1 king bed', 3], ['Junior suite', '1 king bed and sofa bed', 4]],
  Apartment: [['Studio', '1 double bed', 2], ['One-bedroom apartment', '1 double bed, 1 sofa bed', 3], ['Two-bedroom apartment', '2 double beds', 4]],
  Villa: [['Garden room', '1 double bed', 2], ['Loft suite', '1 king bed, 1 sofa bed', 3], ['Entire house', '3 bedrooms', 6]],
  Guesthouse: [['Standard room', '1 double bed', 2], ['Superior room', '1 king bed', 2], ['Family room', '1 double and 2 single beds', 4]],
  Resort: [['Garden view room', '1 king bed', 2], ['Pool view room', '1 king bed', 3], ['Family suite', '2 queen beds', 5]],
}
const MULT = [1, 1.32, 1.8]
const LINES: Record<string, string> = {
  lisbon: 'Steps from the tram line and the miradouros, with the river a short walk downhill.',
  amalfi: 'Terraces step down toward the water, and the coast path starts at the front door.',
  chamonix: 'Mont Blanc fills the windows, and the lift station is a few minutes away.',
  marrakech: 'Behind a plain wooden door the courtyard opens up, cool and quiet after the souks.',
  santorini: 'Cave-style rooms face the caldera, and sunset is the main event each evening.',
  blackforest: 'Pine-covered hills surround the property, with marked trails from the garden gate.',
  copenhagen: 'Bikes are the easiest way around, and the harbour baths are a short ride away.',
  algarve: 'Golden cliffs and small coves are close by, with a sheltered beach below.',
}
const NAMES = ['Ines M.', 'Tobias R.', 'Hannah L.', 'Marcus O.', 'Priya V.', 'Daniel K.', 'Sofia A.', 'Callum R.', 'Mei Z.', 'Jonas E.']
const WHEN = ['September 2026', 'August 2026', 'October 2026', 'July 2026', 'June 2026']
const TEXT = [
  'Spotless, quiet and exactly as pictured. Staff remembered our names by the second morning.',
  'Great location and a really comfortable bed. Breakfast was the highlight of each day.',
  'We stayed four nights and would go straight back. Easy check-in and helpful local tips.',
  'Beautiful building with a lot of character. A little noisy on Friday night but worth it.',
  'Very good value for the area. The room was larger than expected and the shower was excellent.',
  'Thoughtful details everywhere, from the welcome drink to the late checkout we asked for.',
]

export const STAYS: Stay[] = RAW.map(([dest, name, type, stars, price, rating, reviews, area, amenities, cancel], i) => {
  const r = rng(hash(name))
  const d = DESTINATIONS.find(x => x.id === dest)!
  const rooms: Room[] = ROOMS[type].map(([n, beds, sleeps], k) => ({ id: `r${k}`, name: n, beds, sleeps, mult: MULT[k], left: 1 + Math.floor(r() * 5) }))
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), dest, name, type, stars, price, rating, reviews, area, amenities, cancel, seed: i + 1,
    description: `${name} is a ${stars}-star ${type.toLowerCase()} in ${area}, ${d.name}. ${LINES[dest]} Rooms are bright and carefully kept, with local materials and plenty of natural light. The team can help with transfers, restaurant bookings and day trips.`,
    highlights: [`${area} location`, amenities[0] ? `${amenities[0]} included` : 'Friendly hosts', cancel ? 'Free cancellation available' : 'Best rate, non-refundable'],
    rooms,
    quotes: [0, 1, 2].map(k => ({ by: NAMES[(i * 3 + k) % NAMES.length], when: WHEN[(i + k) % WHEN.length], score: Math.min(10, Math.round((rating + (r() - 0.4)) * 10) / 10), text: TEXT[(i + k * 2) % TEXT.length] })),
  }
})
export const stayById = (id: string) => STAYS.find(s => s.id === id)
export const destById = (id: string) => DESTINATIONS.find(d => d.id === id)
export const AMENITIES = ['Wifi', 'Breakfast', 'Pool', 'Spa', 'Gym', 'Bar', 'Restaurant', 'Kitchen', 'Washer', 'Parking', 'Air conditioning', 'Sea view', 'Beach access', 'Sauna', 'Fireplace', 'Ski storage']
export const TYPES: PropType[] = ['Hotel', 'Apartment', 'Villa', 'Guesthouse', 'Resort']
export const ratingWord = (r: number) => (r >= 9.3 ? 'Exceptional' : r >= 9 ? 'Excellent' : r >= 8.5 ? 'Very good' : 'Good')

/* ------------------------------------------------------------------ Dates */
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const nightsBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
export const dowOf = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay()
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const monthLong = (m: number) => MONTHS[m]
export type Locale = 'en-GB' | 'en-US'
export const fmtDay = (iso: string, loc: Locale = 'en-GB', withDow = false) => {
  const [, m, d] = iso.split('-').map(Number)
  const core = loc === 'en-GB' ? `${d} ${MON[m - 1]}` : `${MON[m - 1]} ${d}`
  return withDow ? `${DOW[dowOf(iso)]} ${core}` : core
}
export const fmtRange = (a: string, b: string, loc: Locale = 'en-GB') => `${fmtDay(a, loc)} to ${fmtDay(b, loc)}`

/* ------------------------------------------------------------------ Currency */
export type Currency = 'GBP' | 'EUR' | 'USD'
export const RATES: Record<Currency, number> = { GBP: 1, EUR: 1.17, USD: 1.29 }
export const SYMBOL: Record<Currency, string> = { GBP: '£', EUR: '€', USD: '$' }
export const money = (gbp: number, c: Currency) => `${SYMBOL[c]}${Math.round(gbp * RATES[c]).toLocaleString('en-GB')}`

/* ------------------------------------------------------------------ Pricing and availability */
export type Query = { dest: string; checkIn: string; checkOut: string; adults: number; children: number; rooms: number }
export const DEFAULT_Q: Query = { dest: '', checkIn: '2026-11-20', checkOut: '2026-11-24', adults: 2, children: 0, rooms: 1 }

const season = (iso: string) => { const m = Number(iso.slice(5, 7)); return m === 12 ? 1.18 : m === 1 ? 0.9 : m === 11 ? 0.96 : m >= 6 && m <= 8 ? 1.12 : 1 }
export const nightPrice = (s: Stay, room: Room, iso: string) => {
  const dow = dowOf(iso)
  return Math.round(s.price * room.mult * (dow === 5 || dow === 6 ? 1.12 : 1) * season(iso))
}
export const unavailable = (s: Stay, iso: string) => iso < TODAY || hash(s.id + iso) % 100 < 4
export const soldOut = (s: Stay, q: Query) => { for (let d = q.checkIn; d < q.checkOut; d = addDays(d, 1)) if (unavailable(s, d)) return true; return false }

export type Breakdown = { nights: number; rooms: number; nightly: number; subtotal: number; fees: number; taxes: number; total: number; perNight: number }
export function breakdown(s: Stay, room: Room, q: Query): Breakdown {
  const nights = Math.max(1, nightsBetween(q.checkIn, q.checkOut))
  let sum = 0
  for (let k = 0; k < nights; k++) sum += nightPrice(s, room, addDays(q.checkIn, k))
  const subtotal = sum * q.rooms
  const fees = s.type === 'Apartment' || s.type === 'Villa' ? 45 * q.rooms : 0
  const taxes = Math.round(subtotal * 0.09)
  return { nights, rooms: q.rooms, nightly: Math.round(sum / nights), subtotal, fees, taxes, total: subtotal + fees + taxes, perNight: Math.round(sum / nights) }
}
export const guestsOf = (q: Query) => q.adults + q.children
export const cheapestRoom = (s: Stay, q: Query) => s.rooms.find(r => r.sleeps * q.rooms >= guestsOf(q)) ?? s.rooms[s.rooms.length - 1]

/* ------------------------------------------------------------------ Hash routing helpers */
export const qToString = (q: Query, extra: Record<string, string> = {}) => {
  const p = new URLSearchParams({ d: q.dest, in: q.checkIn, out: q.checkOut, a: String(q.adults), c: String(q.children), r: String(q.rooms), ...extra })
  if (!q.dest) p.delete('d')
  return p.toString()
}
export const qFromParams = (p: URLSearchParams): Query => ({
  dest: p.get('d') ?? '', checkIn: p.get('in') ?? DEFAULT_Q.checkIn, checkOut: p.get('out') ?? DEFAULT_Q.checkOut,
  adults: Number(p.get('a') ?? DEFAULT_Q.adults) || 1, children: Number(p.get('c') ?? 0) || 0, rooms: Number(p.get('r') ?? 1) || 1,
})
