import type { Kind, Look } from './art'
import { rng } from './art'

export const TODAY = new Date('2026-10-27T12:00:00')

export const COLORS: Record<string, string> = {
  Oat: '#d9ccb4', Sand: '#c8ab82', Terracotta: '#b3654a', Sage: '#8c9c7d', Moss: '#5d6c51', Slate: '#66727d', Charcoal: '#3b3c3c', Walnut: '#6f4c36',
}
export const COLOR_NAMES = Object.keys(COLORS)

export type Cat = { id: string; name: string; blurb: string; kinds: { kind: Kind; label: string }[] }
export const CATS: Cat[] = [
  { id: 'lighting', name: 'Lighting', blurb: 'Warm, low light for desks, shelves and corners.', kinds: [{ kind: 'lamp', label: 'Table lamps' }, { kind: 'dome', label: 'Ceramic lamps' }, { kind: 'desklamp', label: 'Desk lamps' }, { kind: 'pendant', label: 'Pendants' }] },
  { id: 'ceramics', name: 'Ceramics', blurb: 'Wheel-thrown stoneware, glazed by hand in small batches.', kinds: [{ kind: 'mug', label: 'Mugs' }, { kind: 'cup', label: 'Cups' }, { kind: 'bowl', label: 'Bowls' }, { kind: 'vase', label: 'Vases' }] },
  { id: 'seating', name: 'Seating', blurb: 'Chairs and stools built to be sat in for years.', kinds: [{ kind: 'chair', label: 'Chairs' }, { kind: 'stool', label: 'Stools' }] },
  { id: 'desk', name: 'Desk', blurb: 'Notebooks and small tools for a clear working surface.', kinds: [{ kind: 'notebook', label: 'Notebooks' }, { kind: 'penpot', label: 'Pen pots' }, { kind: 'tray', label: 'Trays' }] },
  { id: 'bags', name: 'Bags', blurb: 'Carry-alls in waxed canvas, linen and vegetable-tanned leather.', kinds: [{ kind: 'tote', label: 'Totes' }, { kind: 'backpack', label: 'Backpacks' }, { kind: 'satchel', label: 'Satchels' }] },
  { id: 'living', name: 'Textiles & Plants', blurb: 'Soft layers and easy greenery for the rest of the room.', kinds: [{ kind: 'cushion', label: 'Cushions' }, { kind: 'throw', label: 'Throws' }, { kind: 'plant', label: 'Plants' }] },
]
export const catOf = (id: string) => CATS.find(c => c.id === id)
export const kindLabel = (k: Kind) => CATS.flatMap(c => c.kinds).find(x => x.kind === k)?.label ?? k

export type Product = {
  id: string; name: string; cat: string; kind: Kind; price: number; colors: string[]; material: string; rating: number; reviews: number; stock: boolean
  desc: string; details: string[]; materials: string; sizes?: { label: string; delta: number }[]; frame?: string; seed: number; order: number
}

const SIZES = {
  nb: [{ label: 'A6', delta: 0 }, { label: 'A5', delta: 6 }], plant: [{ label: 'Small', delta: 0 }, { label: 'Medium', delta: 16 }, { label: 'Large', delta: 38 }],
  cushion: [{ label: '45 x 45 cm', delta: 0 }, { label: '60 x 60 cm', delta: 14 }], throw: [{ label: 'Throw', delta: 0 }, { label: 'Large', delta: 34 }],
  mug: [{ label: '300 ml', delta: 0 }, { label: '400 ml', delta: 4 }],
}

let n = 0
function P(id: string, name: string, cat: string, kind: Kind, price: number, colors: string[], material: string, rating: number, reviews: number, desc: string, extra: Partial<Product> = {}): Product {
  n += 1
  return {
    id, name, cat, kind, price, colors, material, rating, reviews, stock: true, desc, seed: n * 3 + 1, order: n,
    details: extra.details ?? ['Made in small batches', 'Each piece varies slightly', 'Two year guarantee'],
    materials: extra.materials ?? `${material}. Wipe clean with a damp cloth.`, ...extra,
  }
}

export const PRODUCTS: Product[] = [
  // Lighting
  P('ember-table-lamp', 'Ember Table Lamp', 'lighting', 'lamp', 148, ['Sand', 'Charcoal', 'Terracotta'], 'Powder-coated steel', 4.7, 128, 'A slim steel stem with a pleated linen shade that throws a warm, even glow across a desk or side table.', { details: ['Height 46 cm, shade 28 cm', 'Dimmable inline switch', 'E14 bulb included, warm white 2700K', '1.8 m braided cord'], materials: 'Powder-coated steel base, pleated linen shade. Dust with a dry cloth.' }),
  P('ash-pendant', 'Ash Pendant', 'lighting', 'pendant', 189, ['Charcoal', 'Oat', 'Sage'], 'Spun aluminium', 4.6, 74, 'A deep dome pendant with a satin interior that pools light on a table without glare.', { details: ['Diameter 38 cm', 'Adjustable cord to 150 cm', 'E27 fitting, bulb not included'], materials: 'Spun aluminium with a matte powder finish and white enamel interior.' }),
  P('lull-desk-lamp', 'Lull Desk Lamp', 'lighting', 'desklamp', 124, ['Charcoal', 'Oat', 'Moss'], 'Steel and brass', 4.8, 211, 'An articulated arm that holds its position. Counterbalanced, quiet, and tall enough for a monitor.', { details: ['Reach 62 cm', 'Brass pivot joints', 'Touch dimmer, three colour temperatures'], materials: 'Steel arm, solid brass joints, silicone-coated base.' }),
  P('dune-ceramic-lamp', 'Dune Ceramic Lamp', 'lighting', 'dome', 132, ['Oat', 'Terracotta', 'Sage'], 'Glazed stoneware', 4.5, 56, 'A rounded stoneware base glazed by hand, topped with a conical cotton shade.', { details: ['Height 42 cm', 'Hand glazed, no two alike', 'Braided cord with inline dimmer'], materials: 'Stoneware base, cotton shade. Glaze may show natural variation.' }),
  P('kiln-pendant', 'Kiln Pendant', 'lighting', 'pendant', 215, ['Terracotta', 'Oat'], 'Glazed ceramic', 4.4, 31, 'A flared ceramic shade with a hand-brushed finish. Best hung in pairs above a counter.', { details: ['Diameter 34 cm', 'Cord length 120 cm', 'Hardwired install'], materials: 'Glazed ceramic shade, braided cotton cord.' }),
  P('harbor-desk-lamp', 'Harbor Desk Lamp', 'lighting', 'desklamp', 96, ['Slate', 'Sand'], 'Steel', 4.3, 88, 'A compact swing-arm lamp for narrow desks and bedside shelves.', { details: ['Reach 48 cm', 'Clamp-free weighted base', 'USB-C powered'] }),
  P('arc-reading-lamp', 'Arc Reading Lamp', 'lighting', 'lamp', 168, ['Walnut', 'Charcoal'], 'Walnut and linen', 4.6, 42, 'A turned walnut stem and a wide linen shade, made for the chair by the window.', { details: ['Height 138 cm', 'Foot switch', 'Dimmable'], materials: 'Solid walnut, linen shade, steel foot.' }),
  // Ceramics
  P('everyday-mug', 'Everyday Mug', 'ceramics', 'mug', 28, ['Oat', 'Sage', 'Terracotta', 'Slate'], 'Speckled stoneware', 4.8, 642, 'A generous mug with a thumb-sized handle and a glaze that pools beautifully at the rim.', { sizes: SIZES.mug, details: ['Dishwasher and microwave safe', 'Holds 300 ml or 400 ml', 'Stackable'], materials: 'Speckled stoneware with a satin glaze.' }),
  P('tall-latte-mug', 'Tall Latte Mug', 'ceramics', 'mug', 32, ['Charcoal', 'Oat', 'Moss'], 'Stoneware', 4.7, 304, 'Slightly taller and narrower, so milk drinks stay hot to the last sip.', { details: ['Holds 350 ml', 'Dishwasher safe'] }),
  P('espresso-cup', 'Espresso Cup', 'ceramics', 'cup', 22, ['Oat', 'Terracotta', 'Charcoal'], 'Stoneware', 4.6, 117, 'A small thick-walled cup that keeps a shot hot and fits a saucer or a palm.', { details: ['Holds 90 ml', 'Dishwasher safe'] }),
  P('pinch-bowl', 'Pinch Bowl', 'ceramics', 'bowl', 38, ['Sand', 'Sage', 'Slate'], 'Glazed stoneware', 4.7, 190, 'Pressed and pinched by hand for soups, noodles and nights with no plan.', { details: ['Diameter 16 cm', 'Holds 600 ml', 'Dishwasher safe'] }),
  P('serving-bowl', 'Serving Bowl', 'ceramics', 'bowl', 54, ['Oat', 'Charcoal'], 'Glazed stoneware', 4.5, 63, 'A wide, low bowl with a foot ring for salads and pasta at the middle of the table.', { details: ['Diameter 26 cm', 'Holds 2 litres'] }),
  P('ridge-vase', 'Ridge Vase', 'ceramics', 'vase', 64, ['Terracotta', 'Sage', 'Oat'], 'Ridged stoneware', 4.8, 98, 'A vase with vertical ridges that catch the light. Beautiful empty, better with dried stems.', { details: ['Height 24 cm', 'Waterproof glaze inside'] }),
  P('bud-vase', 'Bud Vase', 'ceramics', 'vase', 34, ['Oat', 'Slate', 'Sand'], 'Stoneware', 4.6, 156, 'A small vase for one stem, or three. Fits on a windowsill.', { details: ['Height 14 cm', 'Waterproof glaze inside'] }),
  P('fluted-vase', 'Fluted Vase', 'ceramics', 'vase', 78, ['Charcoal', 'Terracotta'], 'Stoneware', 4.4, 45, 'A tall vase with a narrow neck. Looks considered even with a single branch.', { details: ['Height 32 cm', 'Waterproof glaze inside'] }),
  // Seating
  P('oslo-dining-chair', 'Oslo Dining Chair', 'seating', 'chair', 245, ['Oat', 'Charcoal', 'Sage'], 'Ash and wool', 4.7, 133, 'A curved-back dining chair with a wool seat pad and joinery that does not loosen.', { details: ['Seat height 45 cm', 'Ships assembled', 'Supports 150 kg'], materials: 'Solid ash frame, wool blend upholstery. Vacuum gently.', frame: '#8a6a4b' }),
  P('linden-lounge-chair', 'Linden Lounge Chair', 'seating', 'chair', 420, ['Terracotta', 'Moss', 'Oat'], 'Oak and boucle', 4.8, 67, 'Low and deep, in a soft boucle that begs for a long afternoon.', { details: ['Seat height 40 cm', 'Ships assembled'], materials: 'Solid oak frame, boucle upholstery.', frame: '#a08060' }),
  P('cove-stool', 'Cove Stool', 'seating', 'stool', 96, ['Walnut', 'Sand'], 'Solid wood', 4.6, 81, 'A three-legged stool that works as a side table, a step or a place to sit.', { details: ['Height 46 cm', 'Hand sanded and oiled'], frame: '#6f4c36' }),
  P('fen-counter-stool', 'Fen Counter Stool', 'seating', 'stool', 138, ['Charcoal', 'Sage'], 'Steel and leather', 4.5, 52, 'A tall counter stool with a stitched leather seat and a footrest at just the right height.', { details: ['Seat height 65 cm', 'Non-marking feet'], frame: '#3b3c3c' }),
  P('birch-desk-chair', 'Birch Desk Chair', 'seating', 'chair', 310, ['Oat', 'Slate'], 'Birch and mesh', 4.6, 109, 'A slatted-back chair for long days at a desk, with a seat that adjusts to you.', { details: ['Adjustable height 42 to 52 cm', 'Casters or glides'], frame: '#b9a07a' }),
  P('tern-armless-chair', 'Tern Armless Chair', 'seating', 'chair', 189, ['Sand', 'Walnut', 'Moss'], 'Beech', 4.4, 38, 'A slim armless chair that tucks fully under a table.', { details: ['Seat height 46 cm', 'Stackable to four'], frame: '#8a6a4b' }),
  P('pebble-footstool', 'Pebble Footstool', 'seating', 'stool', 88, ['Oat', 'Terracotta', 'Slate'], 'Wool and beech', 4.7, 72, 'A low, round upholstered stool for feet, books and the occasional cat.', { details: ['Height 34 cm', 'Diameter 38 cm'], frame: '#8a6a4b' }),
  // Desk
  P('grid-notebook', 'Grid Notebook', 'desk', 'notebook', 24, ['Charcoal', 'Sage', 'Terracotta', 'Slate'], 'Linen and paper', 4.8, 410, 'Lay-flat binding, 120 gsm paper that takes a fountain pen, and a ribbon you will actually use.', { sizes: SIZES.nb, details: ['192 pages, 5 mm grid', 'Elastic closure', 'FSC certified paper'], materials: 'Linen-wrapped board cover, acid-free paper.' }),
  P('dot-notebook', 'Dot Notebook', 'desk', 'notebook', 18, ['Oat', 'Moss', 'Walnut'], 'Cloth and paper', 4.7, 276, 'A pocket-friendly dotted notebook that survives bags and back pockets.', { sizes: SIZES.nb, details: ['160 pages, dot grid', 'Rear pocket'] }),
  P('linen-journal', 'Linen Journal', 'desk', 'notebook', 32, ['Sand', 'Slate'], 'Linen and paper', 4.5, 92, 'A stitched journal with thick, creamy paper and a cover that softens with age.', { details: ['208 pages, plain', 'Sewn binding'] }),
  P('weekly-planner', 'Weekly Planner', 'desk', 'notebook', 29, ['Charcoal', 'Terracotta'], 'Cloth and paper', 4.4, 144, 'One week per spread, a ruled notes page, and nothing you do not need.', { details: ['2027 dated, Monday start', '104 pages'] }),
  P('walnut-pen-pot', 'Walnut Pen Pot', 'desk', 'penpot', 34, ['Walnut', 'Sand', 'Charcoal'], 'Turned wood', 4.7, 120, 'A turned pot that holds a surprising number of pens and keeps them upright.', { details: ['Height 11 cm', 'Hand turned and oiled'] }),
  P('slate-desk-tray', 'Slate Desk Tray', 'desk', 'tray', 46, ['Slate', 'Oat', 'Moss'], 'Powder-coated steel', 4.5, 77, 'A shallow tray with felt-lined divisions for clips, cards and the small things.', { details: ['32 x 18 cm', 'Felt-lined base'] }),
  P('cork-desk-tray', 'Cork Desk Tray', 'desk', 'tray', 52, ['Sand', 'Walnut'], 'Cork and oak', 4.3, 29, 'A warm cork tray with an oak rim, for keys, glasses and phone.', { details: ['28 x 20 cm', 'Non-slip base'] }),
  // Bags
  P('field-tote', 'Field Tote', 'bags', 'tote', 58, ['Sand', 'Charcoal', 'Moss', 'Terracotta'], 'Waxed canvas', 4.8, 389, 'A sturdy waxed canvas tote with an internal pocket and handles that sit on the shoulder.', { details: ['Capacity 22 litres', 'Interior zip pocket', 'Shoulder drop 28 cm'], materials: 'Waxed cotton canvas. Spot clean only; the wax patinas over time.' }),
  P('market-tote', 'Market Tote', 'bags', 'tote', 42, ['Oat', 'Sage'], 'Organic cotton', 4.5, 232, 'An everyday tote in heavy organic cotton that folds flat.', { details: ['Capacity 18 litres', 'Machine washable'] }),
  P('roam-backpack', 'Roam Backpack', 'bags', 'backpack', 128, ['Charcoal', 'Moss', 'Sand'], 'Waxed canvas', 4.7, 164, 'A roll-top backpack with a padded laptop sleeve and just enough pockets.', { details: ['Capacity 20 litres', 'Fits 15 inch laptop', 'Padded straps'] }),
  P('harbor-satchel', 'Harbor Satchel', 'bags', 'satchel', 164, ['Walnut', 'Charcoal', 'Terracotta'], 'Vegetable-tanned leather', 4.8, 98, 'A structured satchel with a brass buckle and a strap that is as long as you need.', { details: ['Fits a tablet and a book', 'Adjustable strap'], materials: 'Vegetable-tanned leather, brass hardware. Condition twice a year.' }),
  P('commuter-backpack', 'Commuter Backpack', 'bags', 'backpack', 142, ['Slate', 'Charcoal'], 'Recycled nylon', 4.6, 201, 'A weatherproof backpack with a clean exterior and a well organised interior.', { details: ['Capacity 24 litres', 'Water-resistant zips'] }),
  P('crossbody-satchel', 'Crossbody Satchel', 'bags', 'satchel', 96, ['Sand', 'Moss'], 'Leather and canvas', 4.4, 61, 'A small satchel for the essentials, worn across the body.', { details: ['Capacity 4 litres', 'Magnetic closure'] }),
  P('everyday-pouch', 'Everyday Pouch', 'bags', 'satchel', 38, ['Oat', 'Terracotta', 'Slate'], 'Cotton canvas', 4.5, 118, 'A zip pouch for cables, pens and bits that live loose in bags.', { details: ['22 x 14 cm', 'Machine washable'] }),
  // Textiles & Plants
  P('wool-throw', 'Wool Throw', 'living', 'throw', 118, ['Oat', 'Charcoal', 'Terracotta'], 'Merino wool', 4.9, 266, 'A dense, weighty merino throw with a fringe at each end.', { sizes: SIZES.throw, details: ['130 x 180 cm', 'Made in Scotland'], materials: '100 percent merino wool. Dry clean or hand wash cold.' }),
  P('linen-cushion', 'Linen Cushion', 'living', 'cushion', 46, ['Oat', 'Sage', 'Terracotta', 'Slate'], 'Stonewashed linen', 4.7, 312, 'A cushion cover in stonewashed linen that softens with every wash.', { sizes: SIZES.cushion, details: ['Includes feather insert', 'Hidden zip'] }),
  P('stripe-cushion', 'Stripe Cushion', 'living', 'cushion', 52, ['Sand', 'Moss'], 'Cotton and linen', 4.5, 96, 'A woven stripe cushion that adds a little rhythm to a plain sofa.', { sizes: SIZES.cushion, details: ['Includes insert', 'Hidden zip'] }),
  P('waffle-throw', 'Waffle Throw', 'living', 'throw', 86, ['Sage', 'Sand'], 'Cotton', 4.6, 141, 'A lightweight waffle-weave throw for three seasons of the year.', { details: ['130 x 170 cm', 'Machine washable'] }),
  P('snake-plant', 'Snake Plant', 'living', 'plant', 42, ['Terracotta', 'Slate', 'Oat'], 'Live plant, ceramic pot', 4.8, 187, 'The easiest houseplant there is. Tall, upright and nearly impossible to overwater by accident.', { sizes: SIZES.plant, details: ['Low light tolerant', 'Water every two to three weeks', 'Pet note: toxic if eaten'], materials: 'Live plant in a glazed ceramic pot with a drainage plate.' }),
  P('rubber-plant', 'Rubber Plant', 'living', 'plant', 68, ['Terracotta', 'Charcoal'], 'Live plant, ceramic pot', 4.5, 74, 'Big glossy leaves and a confident shape. Likes a bright spot out of direct sun.', { sizes: SIZES.plant, details: ['Bright indirect light', 'Water weekly'] }),
  P('boston-fern', 'Boston Fern', 'living', 'plant', 36, ['Sand', 'Slate'], 'Live plant, ceramic pot', 4.2, 51, 'A full, arching fern for a shelf or stand. Likes humidity, and the occasional mist.', { details: ['Medium light', 'Keep soil lightly moist'] }),
  P('olive-plant', 'Tabletop Olive', 'living', 'plant', 48, ['Terracotta', 'Oat'], 'Live plant, ceramic pot', 4.3, 33, 'A small olive tree for a bright windowsill.', { sizes: SIZES.plant.slice(0, 2), details: ['Full sun', 'Water when dry'] }),
]
PRODUCTS.forEach((p, i) => { if (i % 11 === 6) p.stock = false })

export const byId = (id: string) => PRODUCTS.find(p => p.id === id)
export const looksFor = (p: Product, color: string): Look => ({ kind: p.kind, color: COLORS[color] ?? COLORS.Oat, accent: accentFor(color), frame: p.frame, seed: p.seed, variant: p.seed + (p.colors.indexOf(color) < 0 ? 0 : 0) })
function accentFor(color: string) { return ({ Oat: '#8d6b4b', Sand: '#5d6b50', Terracotta: '#e0c9a7', Sage: '#c9b891', Moss: '#d8cdb0', Slate: '#d0b48b', Charcoal: '#b3654a', Walnut: '#c8ab82' } as Record<string, string>)[color] ?? '#8d6b4b' }
export const priceOf = (p: Product, size?: string) => p.price + (p.sizes?.find(s => s.label === size)?.delta ?? 0)
export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
export const money2 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
export const MATERIALS = ['Ceramic', 'Wood', 'Metal', 'Leather', 'Textile', 'Paper', 'Cork', 'Plant']
export function family(p: Product) {
  const m = p.material.toLowerCase()
  if (/plant/.test(m)) return 'Plant'
  if (/stoneware|ceramic/.test(m)) return 'Ceramic'
  if (/leather/.test(m)) return 'Leather'
  if (/paper|cloth/.test(m)) return 'Paper'
  if (/cork/.test(m)) return 'Cork'
  if (/wood|walnut|oak|ash|birch|beech/.test(m)) return 'Wood'
  if (/steel|aluminium|brass/.test(m)) return 'Metal'
  return 'Textile'
}

/* ---------------------------------------------------------------- reviews */
const REV_NAMES = ['Anneke V.', 'Marcus O.', 'Priya S.', 'Joanna L.', 'Daniel R.', 'Hana K.', 'Tomas B.', 'Isabel M.', 'Colm F.', 'Yuki T.', 'Rosa D.', 'Ned A.']
const REV_TITLES = ['Exactly what I hoped for', 'Better in person', 'Quietly excellent', 'Worth the wait', 'Good, with one note', 'A daily favourite', 'Solid and lovely', 'Gift that landed']
const REV_BODY = [
  'Arrived well packed and looks even better than the photos. The finish is lovely and it feels properly made.',
  'I have used it every day for a month. No complaints, and a few small things I did not expect to love.',
  'Colour is true to the picture, maybe a touch warmer in the evening. Very happy with it.',
  'Bought one, then immediately ordered a second for my sister. That should say enough.',
  'Slightly smaller than I imagined from the dimensions, but the quality makes up for it.',
  'Quality is clearly a step above what I usually find. Delivery was quick too.',
  'It has become the thing guests ask about. Simple, well proportioned, and sturdy.',
  'Took a day to get used to, now I cannot imagine the room without it.',
]
export type Review = { id: string; name: string; stars: number; title: string; body: string; days: number; variant: string }
export function reviewsFor(p: Product): Review[] {
  const r = rng(p.seed * 13)
  return Array.from({ length: Math.min(10, p.reviews) }, (_, i) => {
    const stars = r() < (p.rating - 3.2) / 2 ? 5 : r() < 0.7 ? 4 : r() < 0.6 ? 3 : 2
    return { id: p.id + i, name: REV_NAMES[Math.floor(r() * REV_NAMES.length)], stars, title: REV_TITLES[Math.floor(r() * REV_TITLES.length)], body: REV_BODY[Math.floor(r() * REV_BODY.length)], days: 2 + Math.floor(r() * 150), variant: p.colors[Math.floor(r() * p.colors.length)] }
  })
}
export function breakdown(p: Product) {
  const w = [Math.max(0.02, (p.rating - 3.5) * 0.7), Math.max(0.04, 0.42 - (p.rating - 4) * 0.2), 0.08, 0.03, 0.02]
  const s = w.reduce((a, b) => a + b, 0)
  const counts = w.map(x => Math.round((x / s) * p.reviews))
  counts[0] += p.reviews - counts.reduce((a, b) => a + b, 0)
  return counts // index 0 = 5 stars
}

/* ---------------------------------------------------------------- promo + shipping */
export const PROMOS: Record<string, { label: string; pct?: number; freeShip?: boolean }> = { EMBER10: { label: '10% off', pct: 0.1 }, WELCOME15: { label: '15% off', pct: 0.15 }, FREESHIP: { label: 'Free standard delivery', freeShip: true } }
export const SHIPPING = [
  { id: 'standard', label: 'Standard', eta: '3 to 5 business days', price: 8, freeOver: 120, days: 5 },
  { id: 'express', label: 'Express', eta: '1 to 2 business days', price: 16, days: 2 },
  { id: 'nextday', label: 'Next day', eta: 'Order before 2 pm', price: 28, days: 1 },
]
export function addDays(d: number) { const x = new Date(TODAY); let k = d; while (k > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) k -= 1 } return x }
export const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
