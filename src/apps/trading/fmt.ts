export const num = (v: number, dec: number) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
export const usd = (v: number, dec = 2) => `${v < 0 ? '−' : ''}$${num(Math.abs(v), dec)}`
export const sgnUsd = (v: number, dec = 2) => `${v >= 0 ? '+' : '−'}$${num(Math.abs(v), dec)}`
export const sgnPct = (v: number, dec = 2) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(dec)}%`
export const compact = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0))
const p2 = (n: number) => String(n).padStart(2, '0')
export const hms = (t: number) => { const d = new Date(t); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}` }
export const base = (sym: string) => sym.split('/')[0]
