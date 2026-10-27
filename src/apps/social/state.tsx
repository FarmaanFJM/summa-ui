import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { INITIAL_FOLLOWS, ME, NOTIFS, POSTS, USERS, genComments, userOf, type Comment, type Post, type User } from './data'
import type { Media } from './art'

export type ReactionId = 'like' | 'spark' | 'wow' | 'star' | 'agree'
export const REACTIONS: { id: ReactionId; label: string; icon: 'heart' | 'sparkle' | 'zap' | 'star' | 'circle-check' }[] = [
  { id: 'like', label: 'Like', icon: 'heart' }, { id: 'spark', label: 'Brilliant', icon: 'sparkle' }, { id: 'wow', label: 'Wow', icon: 'zap' },
  { id: 'star', label: 'Favourite', icon: 'star' }, { id: 'agree', label: 'Agree', icon: 'circle-check' },
]

type PS = { reaction: ReactionId | null; reposted: boolean; bookmarked: boolean; vote: number | null }
const blank: PS = { reaction: null, reposted: false, bookmarked: false, vote: null }

export type Draft = { text: string; media?: Media[]; poll?: string[]; quote?: string }

type Ctx = {
  posts: Post[]; byId: (id: string) => Post | undefined
  ps: (id: string) => PS
  setReaction: (id: string, r: ReactionId | null) => void
  toggleRepost: (id: string) => void; toggleBookmark: (id: string) => void; vote: (id: string, i: number) => void
  comments: (postId: string) => Comment[]; allComments: Comment[]; addComment: (postId: string, to: string, text: string) => void
  commentLiked: (id: string) => boolean; toggleCommentLike: (id: string) => void
  createPost: (d: Draft) => void
  follows: string[]; toggleFollow: (h: string) => void
  muted: string[]; blocked: string[]; mute: (h: string) => void; block: (h: string) => void
  read: Set<string>; markRead: (id: string) => void; markAllRead: () => void; unread: number
  me: User; editMe: (p: Partial<User>) => void
  toast: string | null; say: (s: string) => void
  compose: Draft | null; openCompose: (d?: Draft) => void; closeCompose: () => void
  viewer: { media: Media[]; i: number } | null; openViewer: (media: Media[], i: number) => void; closeViewer: () => void
}
const C = createContext<Ctx>(null as never)
export const useSocial = () => useContext(C)

export function SocialProvider({ children }: { children: ReactNode }) {
  const [mine, setMine] = useState<Post[]>([])
  const [psMap, setPs] = useState<Record<string, PS>>({ p36: { ...blank, reaction: 'like' } })
  const [cm, setCm] = useState<Record<string, Comment[]>>(() => genComments(POSTS))
  const [cLikes, setCLikes] = useState<Set<string>>(new Set())
  const [follows, setFollows] = useState<string[]>(INITIAL_FOLLOWS)
  const [muted, setMuted] = useState<string[]>([])
  const [blocked, setBlocked] = useState<string[]>([])
  const [read, setRead] = useState<Set<string>>(() => new Set(NOTIFS.filter(n => n.ago > 1000).map(n => n.id)))
  const [meEdit, setMeEdit] = useState<Partial<User>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [compose, setCompose] = useState<Draft | null>(null)
  const [viewer, setViewer] = useState<{ media: Media[]; i: number } | null>(null)
  const timer = useRef(0)
  const seq = useRef(1)

  const posts = useMemo(() => [...mine, ...POSTS], [mine])
  const patch = useCallback((id: string, f: (s: PS) => PS) => setPs(m => ({ ...m, [id]: f(m[id] ?? blank) })), [])
  const say = useCallback((s: string) => { setToast(s); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(null), 2200) }, [])

  const value: Ctx = {
    posts, byId: id => posts.find(p => p.id === id),
    ps: id => psMap[id] ?? blank,
    setReaction: (id, r) => patch(id, s => ({ ...s, reaction: r })),
    toggleRepost: id => patch(id, s => ({ ...s, reposted: !s.reposted })),
    toggleBookmark: id => { patch(id, s => ({ ...s, bookmarked: !s.bookmarked })); say(psMap[id]?.bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks') },
    vote: (id, i) => patch(id, s => (s.vote === null ? { ...s, vote: i } : s)),
    comments: id => cm[id] ?? [],
    allComments: Object.values(cm).flat(),
    addComment: (postId, to, text) => setCm(m => ({ ...m, [postId]: [...(m[postId] ?? []), { id: `${postId}u${seq.current++}`, postId, by: ME, to, text, ago: 0, likes: 0, mine: true }] })),
    commentLiked: id => cLikes.has(id),
    toggleCommentLike: id => setCLikes(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }),
    createPost: d => {
      const id = `u${seq.current++}`
      const post: Post = {
        id, by: ME, ago: 0, text: d.text, media: d.media, quote: d.quote, likes: 0, reposts: 0, replies: 0, mine: true,
        poll: d.poll ? { opts: d.poll.map(t => ({ t, v: 0 })), ends: '1 day left' } : undefined,
      }
      setMine(m => [post, ...m]); setCm(m => ({ ...m, [id]: [] })); say('Your post is live')
    },
    follows, toggleFollow: h => setFollows(f => (f.includes(h) ? f.filter(x => x !== h) : [...f, h])),
    muted, blocked,
    mute: h => { setMuted(m => (m.includes(h) ? m.filter(x => x !== h) : [...m, h])); say(muted.includes(h) ? `Unmuted @${h}` : `Muted @${h}`) },
    block: h => { setBlocked(m => (m.includes(h) ? m.filter(x => x !== h) : [...m, h])); setFollows(f => f.filter(x => x !== h)); say(blocked.includes(h) ? `Unblocked @${h}` : `Blocked @${h}`) },
    read, markRead: id => setRead(s => (s.has(id) ? s : new Set(s).add(id))),
    markAllRead: () => setRead(new Set(NOTIFS.map(n => n.id))),
    unread: NOTIFS.filter(n => !read.has(n.id)).length,
    me: { ...userOf(ME), ...meEdit }, editMe: p => setMeEdit(e => ({ ...e, ...p })),
    toast, say,
    compose, openCompose: (d = { text: '' }) => setCompose(d), closeCompose: () => setCompose(null),
    viewer, openViewer: (media, i) => setViewer({ media, i }), closeViewer: () => setViewer(null),
  }
  return <C.Provider value={value}>{children}</C.Provider>
}

export const userFor = (h: string, me: User): User => (h === ME ? me : userOf(h))
export const allUsers = USERS
