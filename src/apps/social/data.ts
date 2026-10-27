import { rng, type Media, type Motif, type PalKey } from './art'

export const TODAY = Date.parse('2026-10-27T14:20:00')
export const ME = 'ines'

export type User = { handle: string; name: string; bio: string; loc: string; link?: string; pal: PalKey; banner: Motif; seed: number; followers: number; following: number; joined: string }
export type Poll = { opts: { t: string; v: number }[]; ends: string }
export type LinkCard = { title: string; domain: string; desc: string; m: Media }
export type Post = {
  id: string; by: string; ago: number; text: string; media?: Media[]; link?: LinkCard; poll?: Poll; quote?: string
  repostedBy?: string; likes: number; reposts: number; replies: number; mine?: boolean
}
export type Comment = { id: string; postId: string; by: string; ago: number; text: string; to: string; likes: number; mine?: boolean }
export type Notif = { id: string; type: 'like' | 'reply' | 'follow' | 'mention' | 'repost'; by: string; post?: string; ago: number; extra?: string }

const U = (handle: string, name: string, bio: string, loc: string, pal: PalKey, banner: Motif, seed: number, followers: number, following: number, joined: string, link?: string): User =>
  ({ handle, name, bio, loc, link, pal, banner, seed, followers, following, joined })

export const USERS: User[] = [
  U('ines', 'Ines Calloway', 'Tide pool watcher. Notes on slow design, long walks and things that wash up.', 'Lisbon, Portugal', 'tide', 'sea', 11, 1284, 312, 'March 2023', 'inescalloway.example'),
  U('marenko', 'Maren Okafor', 'Photographer. Light, edges, weather. Prints open twice a year.', 'Accra, Ghana', 'ember', 'dunes', 21, 18420, 406, 'January 2022', 'marenko.example'),
  U('tobias.reed', 'Tobias Reed', 'Baker, mostly rye. Sourdough diary and the odd rant about proofing times.', 'Leeds, UK', 'bone', 'tiles', 31, 6310, 521, 'June 2022'),
  U('halden', 'Halden Fjeld', 'Field geologist. Rocks have been trying to tell us things for four billion years.', 'Tromso, Norway', 'glacier', 'peaks', 41, 9875, 210, 'August 2021', 'haldenfjeld.example'),
  U('june', 'June Aoyama', 'Illustrator and riso printer. Three colours is plenty.', 'Osaka, Japan', 'plum', 'tiles', 51, 12090, 388, 'April 2022', 'juneaoyama.example'),
  U('priya_n', 'Priya Nambiar', 'Data engineer. Pipelines, postmortems, strong opinions about retries.', 'Pune, India', 'glacier', 'dusk', 61, 4720, 640, 'November 2022'),
  U('theo', 'Theo Marchetti', 'Cook in a small kitchen. Recipes that survive a Tuesday.', 'Turin, Italy', 'ochre', 'dunes', 71, 8230, 297, 'February 2023', 'theomarchetti.example'),
  U('wrenwood', 'Wren Whitlock', 'Woodworker. Walnut, ash, and the occasional regret.', 'Asheville, USA', 'ochre', 'peaks', 81, 3540, 412, 'September 2022'),
  U('odalys', 'Odalys Ferreira', 'Marine biologist. I talk to anemones so you do not have to.', 'Madeira, Portugal', 'tide', 'sea', 91, 7160, 355, 'May 2022', 'odalysferreira.example'),
  U('kofi', 'Kofi Mensah-Rhodes', 'Architect. Climate first, then everything else.', 'Kumasi, Ghana', 'bone', 'dusk', 101, 5480, 489, 'July 2021', 'fieldnotes.kofi.studio'),
  U('lila', 'Lila Brandt', 'Poet. New chapbook, Salt Light, out this winter.', 'Gothenburg, Sweden', 'plum', 'sea', 111, 2910, 275, 'October 2022'),
  U('tidepool', 'Tidepool', 'Product updates and small announcements from the people who build Tidepool.', 'Everywhere', 'moss', 'tide', 121, 94100, 12, 'January 2021'),
  U('sam.vega', 'Samira Vega', 'Climber, coach, perpetual project haver.', 'Granada, Spain', 'ember', 'peaks', 131, 6820, 330, 'March 2022'),
  U('bram', 'Bram Dekker', 'Solo dev making a small game about crabs. Devlogs on Fridays.', 'Utrecht, Netherlands', 'moss', 'forest', 141, 5260, 701, 'December 2022', 'crabgame.example'),
  U('noor', 'Noor Haddad', 'Urbanist. Buses, benches and the politics of crossings.', 'Amman, Jordan', 'bone', 'arch', 151, 8740, 450, 'August 2022'),
  U('eliot', 'Eliot Strand', 'Gardener. Zone 8, clay soil, endless optimism.', 'Portland, USA', 'moss', 'forest', 161, 2680, 365, 'January 2023'),
  U('cass', 'Cass Whitfield', 'Ceramicist. Wheel, kiln, repeat.', 'Hobart, Australia', 'ember', 'tiles', 171, 4390, 398, 'May 2023', 'casswhitfield.example'),
]
export const userOf = (h: string) => USERS.find(u => u.handle === h) ?? USERS[0]
export const INITIAL_FOLLOWS = ['marenko', 'june', 'odalys', 'tobias.reed', 'kofi', 'halden', 'cass']

const M = (m: Motif, s: number, p: PalKey): Media => ({ m, s, p })
const mk = (id: number, by: string, ago: number, text: string, likes: number, reposts: number, replies: number, extra: Partial<Post> = {}): Post =>
  ({ id: 'p' + id, by, ago, text, likes, reposts, replies, ...extra })

export const POSTS: Post[] = [
  mk(1, 'odalys', 4, 'Low tide at 6:40 this morning and the pools were glassy. Found a nudibranch the size of a thumbnail, bright orange, entirely unbothered by me. #tidepooling', 412, 38, 5, { media: [M('tide', 1, 'tide'), M('sea', 2, 'glacier')] }),
  mk(2, 'tobias.reed', 12, 'Day three of the rye starter. It smells like green apples and a little like a pub. I think that means it is ready.', 188, 9, 4),
  mk(3, 'halden', 25, 'Basalt columns are the most satisfying thing geology ever did. Cooling rate sets the width, so the thinner the column, the faster the lava gave up. Field trip thread soon. #geology', 936, 141, 6, { media: [M('peaks', 3, 'glacier'), M('peaks', 4, 'bone'), M('peaks', 5, 'plum'), M('peaks', 6, 'ochre')] }),
  mk(4, 'priya_n', 41, 'Honest question for people who run data pipelines: how long do you let a flaky test live before you delete it?', 96, 12, 7, { poll: { opts: [{ t: 'Until the next sprint', v: 18 }, { t: 'A week, tops', v: 46 }, { t: 'It has been 2 years', v: 33 }, { t: 'Delete on sight', v: 61 }], ends: '19 hours left' } }),
  mk(5, 'kofi', 55, 'Wrote up why I keep arguing for smaller windows in tropical housing. Shade, cross-breeze and a good overhang beat a glass wall every time. #architecture', 521, 87, 3, { link: { title: 'The case for the smaller window', domain: 'fieldnotes.kofi.studio', desc: 'Notes from eleven houses in Kumasi on shade, airflow and why the cheapest cooling is geometry.', m: M('arch', 8, 'bone') } }),
  mk(6, 'june', 80, 'Finished the cover for @lila\'s new chapbook. Three colours, one very patient riso printer. #illustration', 1204, 163, 4, { media: [M('tiles', 12, 'plum')] }),
  mk(7, 'lila', 95, 'I cried a little at this. Thank you @june, it looks exactly the way the book sounds.', 342, 21, 2, { quote: 'p6' }),
  mk(8, 'noor', 130, 'Hot take: the best public space in any city is a bench with a roof and a view of a crossing. Nothing else needed. #urbanism', 764, 92, 6),
  mk(9, 'wrenwood', 150, 'Sanded the walnut stool seat for four hours and it finally feels like a river stone. The grain on this board is ridiculous.', 279, 14, 3, { media: [M('dunes', 14, 'ochre')] }),
  mk(10, 'cass', 190, 'Kiln opened. Eleven of fourteen survived, and one of the casualties turned into a better shape than I planned. Calling that a win. #ceramics', 633, 40, 5, { media: [M('tiles', 15, 'ember'), M('tide', 16, 'bone')] }),
  mk(11, 'sam.vega', 215, 'Sent the project I have been working on since March. Four attempts today, the last one on pure spite. Thank you to everyone who held the rope.', 1488, 71, 7),
  mk(12, 'bram', 250, 'Devlog 42: the crabs now path around puddles instead of through them. Took two weeks. Players will never notice. I will know. #gamedev', 407, 33, 4, { media: [M('tide', 18, 'moss')] }),
  mk(13, 'eliot', 300, 'First frost warning tonight. Bringing in the lemon tree, wrapping the fig, and leaving the kale because kale thrives on spite.', 321, 11, 3),
  mk(14, 'theo', 360, 'Settle this for the group chat: what goes in a proper carbonara?', 154, 8, 6, { poll: { opts: [{ t: 'Guanciale, pecorino, egg', v: 71 }, { t: 'Bacon and cream', v: 9 }, { t: 'Whatever is in the fridge', v: 20 }], ends: '2 days left' } }),
  mk(15, 'tidepool', 420, 'We are rolling out a quieter notifications page: grouped by day, a single mark all as read, and a Mentions filter. Tell us what you think. #product', 889, 152, 7),
  mk(16, 'marenko', 480, 'Golden hour on the dunes outside town. Shot on a 40 year old lens that flares like it has opinions. #photography', 2210, 230, 4, { media: [M('dunes', 22, 'ember')] }),
  mk(17, 'ines', 540, 'Notes from the week: walked the long way home four times, read half a novel, fixed one squeaky hinge. Good week.', 94, 3, 3),
  mk(18, 'halden', 610, 'The thing nobody tells you about fieldwork is how much of it is waiting for a cloud to move. Worth it for the ten minutes of light.', 540, 49, 2, { repostedBy: 'june' }),
  mk(19, 'kofi', 700, 'Thanks @ines for the long walk through Alfama yesterday. Stairs as street furniture is the best idea nobody planned.', 77, 2, 2),
  mk(20, 'odalys', 790, 'Reminder that the ocean is not a metaphor for anything. It is a very large, very busy neighbourhood. #marinebiology', 1330, 205, 5),
  mk(21, 'tobias.reed', 900, 'Crumb shot from this morning\'s batch. Hydration 78 percent, overnight cold proof, a hot Dutch oven and a lot of faith.', 702, 36, 4, { media: [M('dunes', 23, 'bone'), M('tiles', 24, 'ochre'), M('arch', 25, 'bone'), M('tide', 26, 'ochre')] }),
  mk(22, 'priya_n', 1020, 'Postmortem rule I keep coming back to: if the fix is "be more careful", the real fix has not been found yet.', 1015, 178, 5),
  mk(23, 'noor', 1160, 'Crossed the same road in three cities this month. One had a countdown timer, one had a cat, one had neither and a lot of faith. Guess which felt safest.', 468, 38, 4),
  mk(24, 'cass', 1320, 'Glaze test tiles from the weekend. Left column is the ash glaze, right is the shino. One of these is going on every mug I make this winter.', 291, 17, 3, { media: [M('tiles', 28, 'ember')] }),
  mk(25, 'lila', 1500, 'Writing is mostly rearranging furniture in a room you are not allowed to leave. #poetry', 856, 101, 3),
  mk(26, 'bram', 1700, 'Friday devlog: I have been told the crab hat system "does not need to be this deep". It is now 14 hats deep.', 603, 47, 6, { quote: 'p12' }),
  mk(27, 'sam.vega', 2000, 'Rest day. Making coffee, taping fingers, watching other people fall off things on video. Highly recommend. #climbing', 245, 6, 2),
  mk(28, 'eliot', 2300, 'Planted 40 garlic cloves today. Future me will either be very happy or extremely garlic. #gardening', 188, 7, 2, { media: [M('forest', 30, 'moss')] }),
  mk(29, 'ines', 2600, 'Found a glass float on the beach at Cascais after the storm. Lime green, no markings, thumb sized chip near the neck. Keeping it on the windowsill. #tidepooling', 311, 12, 4, { media: [M('sea', 32, 'tide')] }),
  mk(30, 'theo', 3000, 'Tomato sauce is a patience exercise disguised as a recipe. Forty minutes, a pinch of sugar, and do not touch it.', 574, 29, 4),
  mk(31, 'marenko', 3400, 'Print sale opens Friday at 9. Twelve images, edition of 40 each, no restocks. I will post the list tomorrow.', 1760, 188, 5, { link: { title: 'Autumn print sale', domain: 'marenko.example', desc: 'Twelve photographs from Accra, Lagos and the northern road. Edition of 40.', m: M('dusk', 34, 'ember') } }),
  mk(32, 'halden', 3900, 'Standing in a glacial valley that was ice-filled when my grandfather was born. The landscape does not forget. We do.', 2105, 296, 7, { media: [M('peaks', 35, 'glacier'), M('peaks', 36, 'plum')] }),
  mk(33, 'kofi', 4500, 'Question for architects: do you still sketch the first idea by hand? I am trying to decide whether I am nostalgic or correct.', 149, 5, 6, { poll: { opts: [{ t: 'Always by hand', v: 54 }, { t: 'Mix of both', v: 38 }, { t: 'Straight to the model', v: 8 }], ends: 'Final results' } }),
  mk(34, 'june', 5200, 'Riso tip: always print your lightest colour first. I learned this by ruining a stack of forty posters.', 733, 82, 3),
  mk(35, 'wrenwood', 6100, 'Hand-cut dovetails, take twelve. The first eleven are now very expensive kindling. #woodworking', 402, 19, 4, { media: [M('dusk', 38, 'ochre')] }),
  mk(36, 'tidepool', 7400, 'Small thing: you can now long-press the heart to choose a different reaction. Nothing changes if you just tap.', 1104, 140, 6),
  mk(37, 'odalys', 8600, 'New paper is out! Seven years of counting sea stars along one stretch of coast, and the story is more hopeful than I expected. Thread to follow. #science', 2870, 410, 6, { link: { title: 'Seven years on one stretch of coast', domain: 'coastalecology.example', desc: 'A long-term survey of sea star populations after the wasting event, and what recovery looks like.', m: M('tide', 40, 'glacier') } }),
]

export const NEW_POSTS_BASE = POSTS.length

/* ---------------------------------------------------------------- comments */
const POOL = [
  'This is lovely.', 'Saving this for later.', 'Okay, but where was this taken?', 'Disagree, but I respect the commitment.', 'I needed to read this today.',
  'Same, every single time.', 'Genuinely the best thing on my feed this week.', 'Can you share more about how you did it?', 'Ha, this made my morning.',
  'Following this thread closely.', 'The detail in this is wild.', 'Not sure I agree, but I am curious to hear more.', 'Seconded.', 'More of this please.',
  'I would buy this immediately.', 'This is the kind of post I come here for.', 'Wait, really? I had no idea.', 'Quietly the best take of the day.',
  'Okay, now I have to try it.', 'Thank you for writing this down.', 'This tracks with everything I have seen.', 'Beautiful work.', 'I did not expect to feel anything about this and yet.',
]

export function genComments(posts: Post[]): Record<string, Comment[]> {
  const out: Record<string, Comment[]> = {}
  posts.forEach((p, pi) => {
    const r = rng(pi * 977 + 13), list: Comment[] = []
    const pool = USERS.filter(u => u.handle !== p.by)
    for (let i = 0; i < p.replies; i++) {
      const by = pool[Math.floor(r() * pool.length)].handle
      const prior = list.length && r() > 0.55 ? list[Math.floor(r() * list.length)] : null
      const to = prior && prior.by !== by ? prior.by : p.by
      list.push({
        id: `${p.id}c${i + 1}`, postId: p.id, by, to, text: POOL[Math.floor(r() * POOL.length)],
        ago: Math.max(1, Math.round(p.ago * (1 - (i + 1) / (p.replies + 1)))), likes: Math.floor(r() * 40),
      })
    }
    out[p.id] = list
  })
  return out
}

export const NOTIFS: Notif[] = [
  { id: 'n1', type: 'reply', by: 'kofi', post: 'p17', ago: 6, extra: 'A long walk is the correct amount of walking.' },
  { id: 'n2', type: 'like', by: 'marenko', post: 'p29', ago: 22 },
  { id: 'n3', type: 'follow', by: 'noor', ago: 48 },
  { id: 'n4', type: 'mention', by: 'kofi', post: 'p19', ago: 700, extra: 'Thanks @ines for the long walk through Alfama yesterday.' },
  { id: 'n5', type: 'repost', by: 'odalys', post: 'p29', ago: 130 },
  { id: 'n6', type: 'like', by: 'june', post: 'p17', ago: 190 },
  { id: 'n7', type: 'mention', by: 'june', post: 'p6', ago: 80, extra: 'Finished the cover for @lila\'s new chapbook.' },
  { id: 'n8', type: 'follow', by: 'eliot', ago: 1520 },
  { id: 'n9', type: 'like', by: 'tobias.reed', post: 'p29', ago: 1700 },
  { id: 'n10', type: 'reply', by: 'cass', post: 'p29', ago: 2000, extra: 'Keep it on the windowsill. It will catch the evening light.' },
  { id: 'n11', type: 'repost', by: 'halden', post: 'p17', ago: 2900 },
  { id: 'n12', type: 'follow', by: 'sam.vega', ago: 3300 },
  { id: 'n13', type: 'like', by: 'theo', post: 'p29', ago: 4400 },
  { id: 'n14', type: 'mention', by: 'tidepool', post: 'p36', ago: 7400, extra: 'Thanks to @ines and a few hundred others for the early feedback.' },
]

export const TRENDING = [
  { tag: '#tidepooling', n: '2,431 posts', cat: 'Nature' },
  { tag: '#geology', n: '1,208 posts', cat: 'Science' },
  { tag: '#riso', n: '864 posts', cat: 'Art' },
  { tag: '#urbanism', n: '752 posts', cat: 'Cities' },
  { tag: '#ceramics', n: '640 posts', cat: 'Craft' },
  { tag: '#gamedev', n: '591 posts', cat: 'Games' },
  { tag: '#sourdough', n: '503 posts', cat: 'Food' },
]

/* ---------------------------------------------------------------- time */
export function fmtAgo(m: number) {
  if (m < 1) return 'now'
  if (m < 60) return `${Math.round(m)}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  if (m < 7 * 1440) return `${Math.floor(m / 1440)}d`
  return new Date(TODAY - m * 60000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export function fmtFull(m: number) {
  const d = new Date(TODAY - m * 60000)
  return `${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
export function dayGroup(m: number) {
  const nowMin = new Date(TODAY).getHours() * 60 + new Date(TODAY).getMinutes()
  if (m <= nowMin) return 'Today'
  if (m <= nowMin + 1440) return 'Yesterday'
  return 'Earlier this week'
}
export const compact = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}K` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n)
