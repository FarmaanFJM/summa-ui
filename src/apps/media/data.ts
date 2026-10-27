import type { Motif } from './art'

export type Kind = 'photo' | 'music' | 'film'
export type Asset = {
  id: string; kind: Kind; title: string; by: string; year: number; motif: Motif; pal: string; seed: number
  ratio: number; dur: number; added: number; fav: boolean; cols: string[]; note?: string
}
export type Collection = { id: string; name: string }

export const TODAY = '2026-10-27'

const P = (id: string, title: string, by: string, year: number, motif: Motif, pal: string, ratio: number, added: number, fav = false, cols: string[] = []): Asset =>
  ({ id, kind: 'photo', title, by, year, motif, pal, seed: hash(id), ratio, dur: 0, added, fav, cols })
const M = (id: string, title: string, by: string, year: number, motif: Motif, pal: string, dur: number, added: number, fav = false, cols: string[] = []): Asset =>
  ({ id, kind: 'music', title, by, year, motif, pal, seed: hash(id), ratio: 1, dur, added, fav, cols })
const F = (id: string, title: string, by: string, year: number, motif: Motif, pal: string, dur: number, added: number, fav = false, cols: string[] = []): Asset =>
  ({ id, kind: 'film', title, by, year, motif, pal, seed: hash(id), ratio: 2.39, dur, added, fav, cols })

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

export const SEED_COLLECTIONS: Collection[] = [
  { id: 'desert', name: 'Desert Series' },
  { id: 'night', name: 'Night Drive' },
  { id: 'mood', name: 'Moodboard: Salt House' },
]

export const SEED_ASSETS: Asset[] = [
  P('p01', 'Low Sun, Erg Chebbi', 'Morocco', 2024, 'dunes', 'ember', 1.5, 3, true, ['desert', 'mood']),
  P('p02', 'Slipface', 'Namib-Naukluft', 2023, 'dunes', 'ochre', 0.8, 40, false, ['desert']),
  P('p03', 'Windline', 'Wadi Rum', 2025, 'dunes', 'bone', 1.33, 12, false, ['desert']),
  P('p04', 'Kvíárjökull Ridge', 'Iceland', 2022, 'mountains', 'glacier', 1.5, 61, true),
  P('p05', 'Blue Hour, Tre Cime', 'Dolomites', 2024, 'mountains', 'plum', 0.8, 9),
  P('p06', 'Cloud Inversion', 'Lauterbrunnen', 2025, 'mountains', 'tide', 1.78, 6, false, ['mood']),
  P('p07', 'Horizon, Portland Bill', 'Dorset', 2023, 'ocean', 'tide', 1.78, 28, true, ['mood']),
  P('p08', 'Slack Water', 'Hebrides', 2024, 'ocean', 'plum', 1.0, 22),
  P('p09', 'Last Light, Étretat', 'Normandy', 2021, 'ocean', 'ember', 1.5, 80, false, ['night']),
  P('p10', 'Concrete Stair', 'Barbican, London', 2024, 'architecture', 'bone', 0.8, 2, false, ['mood']),
  P('p11', 'Brise-soleil', 'Marseille', 2023, 'architecture', 'ochre', 1.0, 17),
  P('p12', 'Atrium, Late', 'Kyoto Station', 2025, 'architecture', 'plum', 0.75, 5, true),
  P('p13', 'Fog Line, Hoh', 'Washington', 2022, 'forest', 'moss', 0.8, 33),
  P('p14', 'Cedar Morning', 'Hokkaido', 2024, 'forest', 'glacier', 1.5, 8),
  P('p15', 'Ridge Pines', 'Dolomites', 2023, 'forest', 'moss', 1.33, 45, false, ['mood']),
  P('p16', 'Terraced Dusk', 'Yunnan', 2025, 'mountains', 'ember', 1.78, 1, true),
  M('m01', 'Salt Meridian', 'Marlow Ines', 2025, 'orbit', 'ember', 252, 4, true, ['desert']),
  M('m02', 'Glass Hours', 'Aster Field', 2024, 'tide', 'tide', 197, 11, false, ['night']),
  M('m03', 'Low Tide Choir', 'North Quay', 2023, 'arcs', 'plum', 284, 30),
  M('m04', 'Paper Lanterns', 'Marlow Ines', 2025, 'slats', 'ochre', 176, 7, false, ['night']),
  M('m05', 'Quiet Machinery', 'Aster Field', 2022, 'tiles', 'glacier', 233, 52),
  M('m06', 'Night Ferry', 'North Quay', 2024, 'tide', 'plum', 301, 14, true, ['night']),
  M('m07', 'Slow Burn Horizon', 'Lumen Tide', 2025, 'slats', 'ember', 215, 2),
  M('m08', 'Inland Sea', 'Lumen Tide', 2023, 'orbit', 'moss', 268, 26),
  M('m09', 'Resin', 'Aster Field', 2024, 'tiles', 'bone', 158, 19),
  M('m10', 'Meridian Two', 'Marlow Ines', 2025, 'arcs', 'glacier', 242, 3, false, ['desert']),
  M('m11', 'Ash Season', 'North Quay', 2022, 'orbit', 'ochre', 289, 70),
  M('m12', 'Harbour Light', 'Lumen Tide', 2026, 'tide', 'ember', 204, 1, true),
  F('f01', 'Route 9, Last Light', 'Dir. Ilse Martens', 2025, 'road', 'ember', 112, 6, true, ['night']),
  F('f02', 'The Glass House', 'Dir. Tomas Reyes', 2024, 'window', 'bone', 98, 15),
  F('f03', 'Nocturne for a Quiet City', 'Dir. Yui Hayashi', 2023, 'nightcity', 'plum', 134, 10, true, ['night']),
  F('f04', 'Salt Flats', 'Dir. Ilse Martens', 2022, 'dunes', 'bone', 87, 38, false, ['desert']),
  F('f05', 'Winter Kitchen', 'Dir. Tomas Reyes', 2025, 'window', 'glacier', 105, 21),
  F('f06', 'Harbour Notes', 'Dir. Yui Hayashi', 2024, 'ocean', 'tide', 92, 13),
  F('f07', 'Overpass', 'Dir. Ilse Martens', 2023, 'nightcity', 'glacier', 120, 2, false, ['night']),
  F('f08', 'Cedar Country', 'Dir. Noor Haddad', 2026, 'forest', 'moss', 143, 1),
]

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const BODIES = ['Leica M10-R', 'Fujifilm GFX 50S II', 'Sony A7R V', 'Hasselblad X2D']
const LENSES = ['35mm f/2', '50mm f/1.4', '90mm f/2.5', '24mm f/3.5']
const KEYS = ['A minor', 'D dorian', 'F lydian', 'C major', 'E minor', 'G mixolydian']
export function details(a: Asset): [string, string][] {
  const h = a.seed
  if (a.kind === 'photo') return [['Camera', BODIES[h % 4]], ['Lens', LENSES[(h >> 3) % 4]], ['Exposure', `f/${[5.6, 8, 11, 4][(h >> 5) % 4]} · 1/${[125, 250, 500, 60][(h >> 7) % 4]}s · ISO ${[64, 100, 200, 400][(h >> 9) % 4]}`], ['Dimensions', a.ratio >= 1 ? '6240 × ' + Math.round(6240 / a.ratio) : Math.round(6240 * a.ratio) + ' × 6240']]
  if (a.kind === 'music') return [['Tempo', `${58 + (h % 34)} BPM`], ['Key', KEYS[(h >> 4) % 6]], ['Format', '24-bit / 96 kHz FLAC'], ['Length', fmtTime(a.dur)]]
  return [['Runtime', fmtTime(a.dur)], ['Aspect', '2.39 : 1'], ['Format', 'Super 35 · ProRes 4444'], ['Grade', ['Warm print', 'Bleach bypass', 'Neutral', 'Cool teal'][(h >> 3) % 4]]]
}
