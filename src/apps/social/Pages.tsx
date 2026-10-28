import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Menu, MenuButton, SearchInput, Tabs, useAnchored, type MenuEntry } from '../../ui'
import { SI, type SIconName } from './icons'
import { Scene } from './art'
import { Composer } from './Composer'
import { CommentItem, Face, PostCard, PostDetail, PostSkeleton, Rich } from './Post'
import { ME, NOTIFS, TRENDING, USERS, compact, dayGroup, fmtAgo, userOf, type Notif, type Post, type User } from './data'
import { useSocial, userFor } from './state'
import { go, href } from './router'

/* ---------------------------------------------------------------- shared */
export function PageHead({ title, sub, back, children }: { title: string; sub?: string; back?: boolean; children?: React.ReactNode }) {
  return (
    <div className="so-pagehead">
      {back && <button type="button" className="icon-btn" aria-label="Back" onClick={() => (history.length > 1 ? history.back() : go(href.home))}><SI name="chevron-left" size={18} /></button>}
      <div className="grow"><h1>{title}</h1>{sub && <div className="muted so-sm">{sub}</div>}</div>
      {children}
    </div>
  )
}

export function FollowButton({ u, size, quiet }: { u: User; size?: 'lg'; quiet?: boolean }) {
  const { follows, toggleFollow, mute, block, muted, blocked, say } = useSocial()
  const on = follows.includes(u.handle)
  const items: MenuEntry[] = [
    { label: `Unfollow @${u.handle}`, icon: 'x', onSelect: () => toggleFollow(u.handle) },
    { label: muted.includes(u.handle) ? `Unmute @${u.handle}` : `Mute @${u.handle}`, icon: 'volume', onSelect: () => mute(u.handle) },
    { label: blocked.includes(u.handle) ? `Unblock @${u.handle}` : `Block @${u.handle}`, icon: 'circle-x', danger: true, onSelect: () => block(u.handle) },
  ]
  const a = useAnchored()
  if (u.handle === ME) return null
  return on ? (
    <>
      <Button ref={a.ref} variant="secondary" size={size} aria-haspopup="menu" aria-expanded={a.open} onClick={a.toggle}>Following<SI name="chevron-down" size={14} /></Button>
      <Menu anchor={a.el} open={a.open} onClose={a.close} items={items} label="Following options" />
    </>
  ) : <Button variant={quiet ? 'secondary' : 'primary'} size={size} onClick={() => toggleFollow(u.handle)}>Follow</Button>
}

export function PersonRow({ u, bio }: { u: User; bio?: boolean }) {
  return (
    <div className="so-person">
      <a href={href.profile(u.handle)} aria-label={u.name}><Face u={u} size={40} /></a>
      <a className="so-person-t" href={href.profile(u.handle)}>
        <strong className="truncate">{u.name}</strong>
        <span className="muted truncate">@{u.handle}</span>
        {bio && <span className="muted so-clamp2 so-sm">{u.bio}</span>}
      </a>
      <FollowButton u={u} quiet />
    </div>
  )
}

/* ---------------------------------------------------------------- right rail */
export function Rail() {
  const { follows } = useSocial()
  const suggest = USERS.filter(u => u.handle !== ME && u.handle !== 'tidepool' && !follows.includes(u.handle)).slice(0, 4)
  return (
    <aside className="so-rail" aria-label="Trending and suggestions">
      <section className="so-rail-block">
        <h2 className="eyebrow">Trending</h2>
        {TRENDING.slice(0, 5).map(t => (
          <a key={t.tag} className="so-trend" href={href.explore(t.tag)}>
            <span className="faint so-sm">{t.cat}</span><strong>{t.tag}</strong><span className="muted so-sm">{t.n}</span>
          </a>
        ))}
      </section>
      <section className="so-rail-block">
        <h2 className="eyebrow">Who to follow</h2>
        {suggest.length === 0 && <div className="muted">You follow everyone here.</div>}
        {suggest.map(u => <PersonRow key={u.handle} u={u} />)}
      </section>
      <div className="faint so-sm so-fine">Tidepool is a fictional network. Everyone here is made up.</div>
    </aside>
  )
}

/* ---------------------------------------------------------------- feed */
const PAGE = 8
export function Feed({ list, empty }: { list: Post[]; empty: string }) {
  const [n, setN] = useState(PAGE)
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const more = n < list.length
  useEffect(() => { setN(PAGE) }, [list.length === 0])
  useEffect(() => {
    const el = sentinel.current
    if (!el || !more) return
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting && !loading) {
        setLoading(true)
        window.setTimeout(() => { setN(v => v + PAGE); setLoading(false) }, 650)
      }
    }, { rootMargin: '240px' })
    io.observe(el)
    return () => io.disconnect()
  }, [more, loading, n])
  if (!list.length) return <div className="so-empty"><strong>Nothing here yet</strong><span className="muted">{empty}</span></div>
  return (
    <div>
      {list.slice(0, n).map(p => <PostCard key={p.id} post={p} />)}
      {more && (
        <div ref={sentinel}>
          {loading ? <><PostSkeleton /><PostSkeleton /></> : <div className="so-loadmore"><Button variant="ghost" onClick={() => setN(v => v + PAGE)}>Load more</Button></div>}
        </div>
      )}
      {!more && <div className="so-end muted">You are all caught up</div>}
    </div>
  )
}

export function Home() {
  const { posts, follows, muted, blocked } = useSocial()
  const [tab, setTab] = useState<'you' | 'following'>('you')
  const visible = useMemo(() => posts.filter(p => !blocked.includes(p.by) && !muted.includes(p.by)), [posts, blocked, muted])
  const list = tab === 'you' ? visible : visible.filter(p => follows.includes(p.by) || p.by === ME)
  return (
    <>
      <div className="so-tabbar"><Tabs flat label="Feed" items={[{ value: 'you', label: 'For you' }, { value: 'following', label: 'Following' }]} value={tab} onChange={setTab} /></div>
      <div className="so-composer-wrap"><Composer /></div>
      <Feed list={list} empty="Follow a few people and their posts will land here." />
    </>
  )
}

/* ---------------------------------------------------------------- explore */
export function Explore({ q }: { q: string }) {
  const { posts, blocked } = useSocial()
  const [val, setVal] = useState(q)
  const [tab, setTab] = useState<'trending' | 'people' | 'photos'>('trending')
  useEffect(() => setVal(q), [q])
  const term = q.trim().toLowerCase()
  const res = term ? posts.filter(p => !blocked.includes(p.by) && (p.text.toLowerCase().includes(term) || userOf(p.by).name.toLowerCase().includes(term))) : []
  const people = USERS.filter(u => u.handle !== ME && (!term || u.name.toLowerCase().includes(term.replace('#', '')) || u.handle.includes(term.replace('#', '')) || u.bio.toLowerCase().includes(term.replace('#', ''))))
  const photos = posts.filter(p => p.media).flatMap(p => p.media!.map((m, i) => ({ p, m, i })))
  return (
    <>
      <PageHead title="Explore" />
      <form className="so-searchrow" onSubmit={e => { e.preventDefault(); go(href.explore(val.trim())) }}>
        <SearchInput value={val} onChange={e => setVal(e.target.value)} placeholder="Search posts and people" aria-label="Search Tidepool" />
      </form>
      {term ? (
        <>
          <div className="so-sect eyebrow">Results for {q}</div>
          {people.length > 0 && people.slice(0, 2).map(u => <PersonRow key={u.handle} u={u} bio />)}
          {res.length ? res.map(p => <PostCard key={p.id} post={p} />) : <div className="so-empty"><strong>No posts for “{q}”</strong><span className="muted">Check the spelling or try a broader term.</span></div>}
        </>
      ) : (
        <>
          <div className="so-tabbar"><Tabs flat label="Explore" items={[{ value: 'trending', label: 'Trending' }, { value: 'people', label: 'People' }, { value: 'photos', label: 'Photos' }]} value={tab} onChange={setTab} /></div>
          {tab === 'trending' && TRENDING.map((t, i) => (
            <a key={t.tag} className="so-trend big" href={href.explore(t.tag)}>
              <span className="faint so-sm">{i + 1} · {t.cat}</span><strong>{t.tag}</strong><span className="muted so-sm">{t.n}</span>
            </a>
          ))}
          {tab === 'people' && people.map(u => <PersonRow key={u.handle} u={u} bio />)}
          {tab === 'photos' && (
            <div className="so-photos">
              {photos.map(({ p, m, i }) => <a key={p.id + i} href={href.post(p.id)} aria-label={`Photo by ${userOf(p.by).name}`}><Scene {...m} /></a>)}
            </div>
          )}
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- notifications */
const NICON: Record<Notif['type'], SIconName> = { like: 'heart', reply: 'message', follow: 'user-plus', mention: 'at', repost: 'repeat' }
const NVERB: Record<Notif['type'], string> = { like: 'liked your post', reply: 'replied to your post', follow: 'followed you', mention: 'mentioned you', repost: 'reposted your post' }

export function Notifications() {
  const { read, markRead, markAllRead, unread, byId } = useSocial()
  const [tab, setTab] = useState<'all' | 'mentions'>('all')
  const list = NOTIFS.filter(n => tab === 'all' || n.type === 'mention').sort((a, b) => a.ago - b.ago)
  const groups = ['Today', 'Yesterday', 'Earlier this week'].map(g => ({ g, items: list.filter(n => dayGroup(n.ago) === g) })).filter(x => x.items.length)
  return (
    <>
      <PageHead title="Notifications">
        <Button variant="ghost" disabled={unread === 0} onClick={markAllRead}>Mark all read</Button>
      </PageHead>
      <div className="so-tabbar"><Tabs flat label="Notification filter" items={[{ value: 'all', label: 'All' }, { value: 'mentions', label: 'Mentions' }]} value={tab} onChange={setTab} /></div>
      {groups.length === 0 && <div className="so-empty"><strong>No mentions yet</strong><span className="muted">When someone mentions you, it will show up here.</span></div>}
      {groups.map(({ g, items }) => (
        <section key={g}>
          <h2 className="so-sect eyebrow">{g}</h2>
          {items.map(n => {
            const u = userOf(n.by), post = n.post ? byId(n.post) : undefined, isRead = read.has(n.id)
            const open = () => { markRead(n.id); go(n.type === 'follow' ? href.profile(n.by) : href.post(n.post!)) }
            return (
              <button key={n.id} type="button" className="so-notif" data-unread={!isRead} onClick={open} aria-label={`${u.name} ${NVERB[n.type]}${isRead ? '' : ', unread'}`}>
                <span className="so-nicon"><SI name={NICON[n.type]} size={17} fill={n.type === 'like'} /></span>
                <span className="so-notif-body">
                  <span className="row" style={{ gap: 8 }}><Face u={u} size={28} /><span className="grow"><strong>{u.name}</strong> <span className="muted">{NVERB[n.type]}</span></span><span className="faint so-sm">{fmtAgo(n.ago)}</span></span>
                  {(n.extra || post) && n.type !== 'follow' && <span className="muted so-clamp2 so-notif-text">{n.extra ?? post!.text}</span>}
                </span>
                {!isRead && <span className="so-dot" aria-hidden="true" />}
              </button>
            )
          })}
        </section>
      ))}
    </>
  )
}

/* ---------------------------------------------------------------- profile */
export function Profile({ handle }: { handle: string }) {
  const { me, posts, allComments, follows, ps, editMe, say, blocked } = useSocial()
  const base = USERS.find(u => u.handle === handle)
  const [tab, setTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts')
  const [edit, setEdit] = useState(false)
  useEffect(() => setTab('posts'), [handle])
  if (!base) return <><PageHead title="Profile" back /><div className="so-empty"><strong>This account does not exist</strong><span className="muted">Try searching for another name.</span></div></>
  const u = userFor(handle, me)
  const own = handle === ME
  const mine = posts.filter(p => p.by === handle)
  const replies = allComments.filter(c => c.by === handle)
  const media = mine.filter(p => p.media)
  const likes = own ? posts.filter(p => ps(p.id).reaction) : posts.filter((p, i) => p.by !== handle && ((i * 7 + handle.length) % 4 === 0))
  const followers = u.followers + (follows.includes(handle) && !own ? 1 : 0)
  const MenuBtn = () => <MenuButton icon="more-h" label="Profile options" items={[
    { label: 'Copy profile link', icon: 'link', onSelect: async () => { try { await navigator.clipboard.writeText(location.origin + location.pathname + href.profile(handle)) } catch { /* ignore */ } say('Profile link copied') } },
    ...(!own ? [{ label: 'Send a message', icon: 'message' as const, onSelect: () => say('Messages are not part of this prototype') }] : []),
  ]} />
  return (
    <>
      <PageHead title={u.name} sub={`${mine.length} posts`} back />
      <div className="so-banner"><Scene m={u.banner} s={u.seed} p={u.pal} label={`${u.name} banner`} /></div>
      <div className="so-profile">
        <div className="so-profile-top">
          <span className="so-profile-av"><Face u={u} size={88} /></span>
          <span className="grow" />
          <MenuBtn />
          {own ? <Button variant="secondary" onClick={() => setEdit(true)}>Edit profile</Button> : <FollowButton u={u} size="lg" />}
        </div>
        <h2 className="so-pname">{u.name}</h2>
        <div className="muted">@{u.handle}</div>
        <p className="so-bio"><Rich text={u.bio} /></p>
        <div className="muted so-meta">
          <span><SI name="cloud" size={14} /> {u.loc}</span>
          {u.link && <span><SI name="link" size={14} /> {u.link}</span>}
          <span><SI name="calendar" size={14} /> Joined {u.joined}</span>
        </div>
        <div className="so-stats"><span><strong className="num">{compact(u.following)}</strong> <span className="muted">Following</span></span><span><strong className="num">{compact(followers)}</strong> <span className="muted">Followers</span></span></div>
        {blocked.includes(handle) && <div className="muted so-sm">You blocked this account. Their posts are hidden from your feeds.</div>}
      </div>
      <div className="so-tabbar"><Tabs flat label="Profile sections" items={[{ value: 'posts', label: 'Posts' }, { value: 'replies', label: 'Replies' }, { value: 'media', label: 'Media' }, { value: 'likes', label: 'Likes' }]} value={tab} onChange={setTab} /></div>
      {tab === 'posts' && (mine.length ? mine.map(p => <PostCard key={p.id} post={p} />) : <Empty t="No posts yet" s="When they post, it will show up here." />)}
      {tab === 'replies' && (replies.length ? replies.map(c => <div className="so-post" key={c.id}><div className="muted so-sm">On <a className="so-link" href={href.post(c.postId)}>{userOf(posts.find(p => p.id === c.postId)?.by ?? ME).name}'s post</a></div><CommentItem c={c} /></div>) : <Empty t="No replies yet" s="Replies to other posts will show up here." />)}
      {tab === 'media' && (media.length ? <div className="so-photos">{media.flatMap(p => p.media!.map((m, i) => <a key={p.id + i} href={href.post(p.id)} aria-label="Open post"><Scene {...m} /></a>))}</div> : <Empty t="No media yet" s="Photos and images they share will show up here." />)}
      {tab === 'likes' && (likes.length ? likes.map(p => <PostCard key={p.id} post={p} />) : <Empty t="No likes yet" s={own ? 'Posts you react to will show up here.' : 'Posts they like will show up here.'} />)}
      {edit && <EditProfile u={u} onClose={() => setEdit(false)} onSave={p => { editMe(p); setEdit(false); say('Profile updated') }} />}
    </>
  )
}
const Empty = ({ t, s }: { t: string; s: string }) => <div className="so-empty"><strong>{t}</strong><span className="muted">{s}</span></div>

import { Dialog } from '../../ui'
function EditProfile({ u, onClose, onSave }: { u: User; onClose: () => void; onSave: (p: Partial<User>) => void }) {
  const [name, setName] = useState(u.name), [bio, setBio] = useState(u.bio), [loc, setLoc] = useState(u.loc)
  return (
    <Dialog open onClose={onClose} title="Edit profile" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), bio, loc })}>Save</Button></>}>
      <form className="col" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), bio, loc }) }}>
        <label className="col" style={{ gap: 4 }}><span className="eyebrow">Name</span><input className="input" data-autofocus value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="col" style={{ gap: 4 }}><span className="eyebrow">Bio</span><textarea className="input" style={{ height: 84, padding: 8, resize: 'none' }} maxLength={160} value={bio} onChange={e => setBio(e.target.value)} /></label>
        <label className="col" style={{ gap: 4 }}><span className="eyebrow">Location</span><input className="input" value={loc} onChange={e => setLoc(e.target.value)} /></label>
      </form>
    </Dialog>
  )
}

/* ---------------------------------------------------------------- post page */
export function PostPage({ id }: { id: string }) {
  const { byId } = useSocial()
  const p = byId(id)
  return (
    <>
      <PageHead title="Post" back />
      {p ? <PostDetail post={p} /> : <Empty t="This post is not available" s="It may have been removed." />}
    </>
  )
}
