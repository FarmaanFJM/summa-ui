import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Menu, MenuButton, useAnchored, type MenuEntry } from '../../ui'
import { SI, type SIconName } from './icons'
import { Scene, PALS, rng, type Media } from './art'
import { ME, USERS, compact, fmtAgo, fmtFull, userOf, type Comment, type Post, type User } from './data'
import { REACTIONS, useSocial, userFor, type ReactionId } from './state'
import { go, href } from './router'

/* ---------------------------------------------------------------- bits */
/* Purely graphic generated avatar art: abstract procedural shapes from the user's palette and seed. No letters. */
export function Face({ u, size = 40 }: { u: User; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const body = useMemo(() => {
    const p = PALS[u.pal]
    const r = rng(u.seed * 2654435 + 17)
    const cols = [p.far, p.mid, p.sun, p.near]
    const shapes = Array.from({ length: 3 }, (_, i) => {
      const cx = 8 + r() * 48, cy = 8 + r() * 48, rad = 14 + r() * 22
      return <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={rad.toFixed(1)} fill={cols[Math.floor(r() * cols.length)]} opacity={0.55 + r() * 0.4} />
    })
    const a = r() * 40
    return { p, shapes, a }
  }, [u.pal, u.seed])
  const { p, shapes, a } = body
  return (
    <svg className="so-face" aria-hidden="true" width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <clipPath id={`${uid}c`}><circle cx="32" cy="32" r="32" /></clipPath>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.sky[2]} /><stop offset="1" stopColor={p.mid} /></linearGradient>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect width="64" height="64" fill={`url(#${uid}g)`} />
        {shapes}
        <path d={`M0 ${(44 + a / 4).toFixed(1)} Q 32 ${(30 + a / 2).toFixed(1)} 64 ${(46 - a / 4).toFixed(1)} V64 H0 Z`} fill={p.near} opacity="0.75" />
      </g>
    </svg>
  )
}

export function Rich({ text }: { text: string }) {
  const parts = text.split(/([#@][\w.]*\w)/g)
  return (
    <>
      {parts.map((s, i) => {
        if (s[0] === '#' && s.length > 1) return <a key={i} className="so-link" href={href.explore(s)} onClick={e => e.stopPropagation()}>{s}</a>
        if (s[0] === '@' && USERS.some(u => u.handle === s.slice(1))) return <a key={i} className="so-link" href={href.profile(s.slice(1))} onClick={e => e.stopPropagation()}>{s}</a>
        return <Fragment key={i}>{s}</Fragment>
      })}
    </>
  )
}

export function MediaGrid({ media, onOpen }: { media: Media[]; onOpen: (i: number) => void }) {
  return (
    <div className="so-media" data-n={media.length}>
      {media.map((m, i) => (
        <button key={i} type="button" className="so-media-cell" aria-label={`Open image ${i + 1} of ${media.length}`} onClick={e => { e.stopPropagation(); onOpen(i) }}>
          <Scene {...m} />
        </button>
      ))}
    </div>
  )
}

function LinkCard({ post }: { post: Post }) {
  const { say } = useSocial()
  const l = post.link!
  return (
    <button type="button" className="so-linkcard" onClick={e => { e.stopPropagation(); say('Link opened in a new tab (simulated)') }}>
      <div className="so-linkcard-img"><Scene {...l.m} /></div>
      <div className="so-linkcard-text">
        <span className="faint so-sm">{l.domain}</span>
        <strong>{l.title}</strong>
        <span className="muted so-clamp2">{l.desc}</span>
      </div>
    </button>
  )
}

function PollView({ post }: { post: Post }) {
  const { ps, vote } = useSocial()
  const poll = post.poll!, s = ps(post.id)
  const closed = poll.ends === 'Final results'
  const show = s.vote !== null || closed
  const total = poll.opts.reduce((a, o) => a + o.v, 0) + (s.vote !== null ? 1 : 0)
  return (
    <div className="so-poll" role="group" aria-label="Poll" onClick={e => e.stopPropagation()}>
      {poll.opts.map((o, i) => {
        const v = o.v + (s.vote === i ? 1 : 0), pct = total ? Math.round((v / total) * 100) : 0
        return (
          <button key={i} type="button" className="so-opt" disabled={show} data-mine={s.vote === i} onClick={() => vote(post.id, i)}
            aria-label={show ? `${o.t}, ${pct} percent${s.vote === i ? ', your vote' : ''}` : o.t}>
            {show && <span className="so-opt-bar" style={{ width: `${pct}%` }} />}
            <span className="so-opt-t">{o.t}{s.vote === i && <SI name="check" size={14} />}</span>
            {show && <span className="so-opt-p num">{pct}%</span>}
          </button>
        )
      })}
      <div className="faint so-sm">{total.toLocaleString()} votes{poll.ends ? `, ${poll.ends.toLowerCase()}` : ''}</div>
    </div>
  )
}

function Quote({ id }: { id: string }) {
  const { byId } = useSocial()
  const q = byId(id)
  if (!q) return null
  const u = userOf(q.by)
  return (
    <div className="so-quote link" role="link" tabIndex={0} aria-label={`Quoted post by ${u.name}`} onClick={e => { if ((e.target as HTMLElement).closest('a')) return; e.stopPropagation(); go(href.post(q.id)) }}
      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); go(href.post(q.id)) } }}>
      <span className="row" style={{ gap: 8 }}><Face u={u} size={20} /><strong>{u.name}</strong><span className="muted so-sm">@{u.handle} · {fmtAgo(q.ago)}</span></span>
      <span className="so-clamp3"><Rich text={q.text} /></span>
      {q.media && <span className="so-quote-img"><Scene {...q.media[0]} /></span>}
    </div>
  )
}

/* ---------------------------------------------------------------- actions */
function Act({ icon, label, count, on, fill, children, ...rest }: { icon: SIconName; label: string; count?: number; on?: boolean; fill?: boolean; children?: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button type="button" className="so-act" data-on={on ? 'true' : undefined} aria-label={label} title={label} {...rest}>
      <SI name={icon} size={18} fill={fill && on} />
      {count !== undefined && count > 0 && <span className="num">{compact(count)}</span>}
      {children}
    </button>
  )
}

function ReactionButton({ post }: { post: Post }) {
  const { ps, setReaction } = useSocial()
  const s = ps(post.id)
  const [open, setOpen] = useState(false)
  const t = useRef(0), long = useRef(false), wrap = useRef<HTMLSpanElement>(null)
  const cur = REACTIONS.find(r => r.id === s.reaction)
  const clear = () => window.clearTimeout(t.current)
  const openLater = (ms: number) => { clear(); t.current = window.setTimeout(() => setOpen(true), ms) }
  const closeLater = () => { clear(); t.current = window.setTimeout(() => setOpen(false), 260) }
  useEffect(() => clear, [])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); wrap.current?.querySelector<HTMLElement>('.so-act')?.focus() } }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open])
  const count = post.likes + (s.reaction ? 1 : 0)
  const pick = (id: ReactionId) => { setReaction(post.id, s.reaction === id ? null : id); setOpen(false) }
  return (
    <span className="so-react" ref={wrap} onMouseEnter={() => openLater(420)} onMouseLeave={closeLater}
      onBlur={e => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <Act icon={cur?.icon ?? 'heart'} label={cur ? `${cur.label}, tap to remove` : 'Like, hold for more reactions'} count={count} on={!!s.reaction} fill={cur?.id !== 'agree'}
        aria-haspopup="menu" aria-expanded={open}
        onPointerDown={e => { long.current = false; if (e.pointerType !== 'mouse') { clear(); t.current = window.setTimeout(() => { long.current = true; setOpen(true) }, 450) } else { clear(); t.current = window.setTimeout(() => { long.current = true; setOpen(true) }, 450) } }}
        onPointerUp={() => { if (!long.current) clear() }} onPointerCancel={clear}
        onContextMenu={e => e.preventDefault()}
        onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => wrap.current?.querySelector<HTMLElement>('.so-picker button')?.focus()) } }}
        onClick={e => { e.stopPropagation(); if (long.current) { long.current = false; return } setReaction(post.id, s.reaction ? null : 'like'); setOpen(false) }} />
      {open && (
        <span className="so-picker" role="menu" aria-label="Reactions" onMouseEnter={clear} onClick={e => e.stopPropagation()}
          onKeyDown={e => {
            const b = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button')), i = b.indexOf(document.activeElement as HTMLElement)
            if (e.key === 'ArrowRight') { e.preventDefault(); b[(i + 1) % b.length].focus() }
            if (e.key === 'ArrowLeft') { e.preventDefault(); b[(i - 1 + b.length) % b.length].focus() }
          }}>
          {REACTIONS.map(r => (
            <button key={r.id} type="button" role="menuitemradio" aria-checked={s.reaction === r.id} aria-label={r.label} title={r.label} data-on={s.reaction === r.id} onClick={() => pick(r.id)}>
              <SI name={r.icon} size={20} fill={r.id !== 'agree'} />
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

export function ActionRow({ post, onReply, replies }: { post: Post; onReply: () => void; replies: number }) {
  const { ps, toggleRepost, toggleBookmark, openCompose, say } = useSocial()
  const s = ps(post.id)
  const rp = useAnchored(), sh = useAnchored()
  const url = () => location.origin + location.pathname + href.post(post.id)
  const copy = async (text: string, msg: string) => { try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ } say(msg) }
  const repostItems: MenuEntry[] = [
    { label: s.reposted ? 'Undo repost' : 'Repost', icon: 'repeat', onSelect: () => toggleRepost(post.id) },
    { label: 'Quote', icon: 'quote', onSelect: () => openCompose({ text: '', quote: post.id }) },
  ]
  const shareItems: MenuEntry[] = [
    { label: 'Copy link', icon: 'link', onSelect: () => copy(url(), 'Link copied') },
    { label: 'Copy text', icon: 'copy', onSelect: () => copy(post.text, 'Text copied') },
    { label: 'Open in new tab', icon: 'external', onSelect: () => window.open(url(), '_blank') },
  ]
  return (
    <div className="so-actions" onClick={e => e.stopPropagation()}>
      <Act icon="message" label={`Reply, ${replies} replies`} count={replies} onClick={onReply} />
      <Act ref={rp.ref} icon="repeat" label="Repost options" count={post.reposts + (s.reposted ? 1 : 0)} on={s.reposted} aria-haspopup="menu" aria-expanded={rp.open} onClick={rp.toggle} />
      <Menu anchor={rp.el} open={rp.open} onClose={rp.close} items={repostItems} label="Repost options" placement="bottom-start" />
      <ReactionButton post={post} />
      <span className="grow" />
      <Act icon="bookmark" label={s.bookmarked ? 'Remove bookmark' : 'Bookmark'} on={s.bookmarked} fill onClick={() => toggleBookmark(post.id)} />
      <Act ref={sh.ref} icon="share" label="Share" aria-haspopup="menu" aria-expanded={sh.open} onClick={sh.toggle} />
      <Menu anchor={sh.el} open={sh.open} onClose={sh.close} items={shareItems} label="Share" placement="bottom-end" />
    </div>
  )
}

/* ---------------------------------------------------------------- comments */
export function CommentItem({ c }: { c: Comment }) {
  const { me, commentLiked, toggleCommentLike } = useSocial()
  const u = userFor(c.by, me), liked = commentLiked(c.id)
  const [reply, setReply] = useState(false)
  return (
    <div className="so-comment">
      <div className="so-ph">
        <a href={href.profile(u.handle)} aria-label={u.name}><Face u={u} size={32} /></a>
        <div className="so-who">
          <a className="so-name" href={href.profile(u.handle)}>{u.name}</a>
          <span className="muted">@{u.handle} · {fmtAgo(c.ago)}</span>
        </div>
      </div>
      <div className="muted so-sm">Replying to <a className="so-link" href={href.profile(c.to)}>@{c.to}</a></div>
      <div className="so-text"><Rich text={c.text} /></div>
      <div className="so-actions sm">
        <Act icon="heart" label={liked ? 'Unlike reply' : 'Like reply'} count={c.likes + (liked ? 1 : 0)} on={liked} fill onClick={() => toggleCommentLike(c.id)} />
        <Act icon="message" label="Reply to this comment" onClick={() => setReply(r => !r)} on={reply} />
      </div>
      {reply && <CommentComposer postId={c.postId} to={u.handle} autoFocus onDone={() => setReply(false)} />}
    </div>
  )
}

export function CommentComposer({ postId, to, autoFocus, onDone, inputRef }: { postId: string; to: string; autoFocus?: boolean; onDone?: () => void; inputRef?: React.Ref<HTMLTextAreaElement> }) {
  const { me, addComment } = useSocial()
  const [t, setT] = useState('')
  const submit = () => { if (!t.trim()) return; addComment(postId, to, t.trim()); setT(''); onDone?.() }
  return (
    <form className="so-cc" onSubmit={e => { e.preventDefault(); submit() }} onClick={e => e.stopPropagation()}>
      <Face u={me} size={32} />
      <textarea ref={inputRef} className="input so-cc-input" rows={1} value={t} autoFocus={autoFocus} maxLength={280} placeholder={`Reply to @${to}`} aria-label={`Reply to @${to}`}
        onChange={e => setT(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} />
      <Button variant="secondary" type="submit" disabled={!t.trim()}>Reply</Button>
    </form>
  )
}

export function Thread({ post, limit, focus }: { post: Post; limit?: number; focus?: boolean }) {
  const { comments } = useSocial()
  const list = comments(post.id)
  const shown = limit ? list.filter((c, i) => i < limit || c.mine) : list
  return (
    <div className="so-thread" onClick={e => e.stopPropagation()}>
      {shown.map(c => <CommentItem key={c.id} c={c} />)}
      {limit && list.filter(c => !c.mine).length > limit && <a className="so-more" href={href.post(post.id)}>View all {list.length} replies</a>}
      <CommentComposer postId={post.id} to={post.by} autoFocus={focus} />
    </div>
  )
}

/* ---------------------------------------------------------------- post */
export function PostCard({ post, detail }: { post: Post; detail?: boolean }) {
  const { me, comments, openViewer, mute, block, say } = useSocial()
  const u = userFor(post.by, me)
  const [open, setOpen] = useState(false)
  const replies = comments(post.id).length
  const rb = post.repostedBy ? userOf(post.repostedBy) : null
  const items: MenuEntry[] = [
    { label: 'Copy link', icon: 'link', onSelect: async () => { try { await navigator.clipboard.writeText(location.origin + location.pathname + href.post(post.id)) } catch { /* ignore */ } say('Link copied') } },
    ...(post.by !== ME ? [{ type: 'sep' } as MenuEntry, { label: `Mute @${post.by}`, icon: 'volume' as const, onSelect: () => mute(post.by) }, { label: `Block @${post.by}`, icon: 'circle-x' as const, danger: true, onSelect: () => block(post.by) }] : []),
  ]
  const nav = (e: React.MouseEvent) => {
    if (detail) return
    if ((e.target as HTMLElement).closest('button,a,input,textarea,[role=menu]')) return
    go(href.post(post.id))
  }
  return (
    <article className="so-post" data-detail={detail ? 'true' : undefined} onClick={nav} aria-label={`Post by ${u.name}`}>
      {rb && <div className="so-ctx muted so-sm"><SI name="repeat" size={13} /> {rb.name} reposted</div>}
      <header className="so-ph">
        <a href={href.profile(u.handle)} aria-label={`${u.name} profile`}><Face u={u} size={detail ? 48 : 40} /></a>
        <div className="so-who">
          <a className="so-name" href={href.profile(u.handle)}>{u.name}</a>
          <span className="muted">@{u.handle}{!detail && <> · <a className="so-time" href={href.post(post.id)}>{fmtAgo(post.ago)}</a></>}</span>
        </div>
        <PostMenu items={items} />
      </header>
      <div className="so-text"><Rich text={post.text} /></div>
      {post.media && <MediaGrid media={post.media} onOpen={i => openViewer(post.media!, i)} />}
      {post.link && <LinkCard post={post} />}
      {post.poll && <PollView post={post} />}
      {post.quote && <Quote id={post.quote} />}
      {detail && <div className="muted so-sm so-full">{fmtFull(post.ago)}</div>}
      <ActionRow post={post} replies={replies} onReply={() => (detail ? document.querySelector<HTMLTextAreaElement>('.so-cc-input')?.focus() : setOpen(o => !o))} />
      {!detail && open && <Thread post={post} limit={3} focus />}
    </article>
  )
}

function PostMenu({ items }: { items: MenuEntry[] }) {
  return <span onClick={e => e.stopPropagation()}><MenuButton icon="more-h" label="More options" size="sm" items={items} /></span>
}

export function PostSkeleton() {
  return (
    <div className="so-post" aria-hidden="true">
      <div className="so-ph"><span className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /><div className="so-who"><span className="skeleton" style={{ width: 140, height: 12 }} /><span className="skeleton" style={{ width: 90, height: 10, marginTop: 6 }} /></div></div>
      <div className="skeleton" style={{ height: 12, width: '92%' }} /><div className="skeleton" style={{ height: 12, width: '70%' }} />
      <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
    </div>
  )
}

export function PostDetail({ post }: { post: Post }) {
  return (
    <>
      <PostCard post={post} detail />
      <Thread post={post} />
    </>
  )
}
