export type Status = 'thinking' | 'streaming' | 'done' | 'stopped'
export type Msg = { id: string; role: 'user' | 'assistant'; text: string; shown: number; status: Status; files?: string[] }
export type Conv = { id: string; title: string; pinned: boolean; updated: number; messages: Msg[] }

/** Fixed "today" for the whole prototype. */
export const NOW = new Date(2026, 9, 27, 14, 20).getTime()
const H = 3600_000, D = 24 * H

export const MODELS = [
  { value: 'fast', label: 'Atlas Fast', meta: 'Quick answers' },
  { value: 'pro', label: 'Atlas Pro', meta: 'Balanced' },
  { value: 'deep', label: 'Atlas Deep', meta: 'Long reasoning' },
]

export const STARTERS: { icon: 'code' | 'file-text' | 'list-check' | 'sparkle'; text: string }[] = [
  { icon: 'code', text: 'Write a debounce hook for a search input in React' },
  { icon: 'list-check', text: 'Plan a two-week launch checklist for a small SaaS release' },
  { icon: 'file-text', text: 'Draft a friendly email announcing a pricing change' },
  { icon: 'sparkle', text: 'Explain the difference between latency and throughput' },
]

const b = (s: string) => s.replace(/¦/g, '`')

const CODE = b(`Here is a small, typed debounce hook that works well for search inputs. It delays updating a value until the user has stopped typing for a given interval, so you do not fire a request on every keystroke.

¦¦¦ts
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
¦¦¦

Using it is a matter of keeping the raw input in state and reading the debounced copy where the expensive work happens:

¦¦¦tsx
const [query, setQuery] = useState('')
const debounced = useDebouncedValue(query, 300)

useEffect(() => {
  if (!debounced) return
  const ctrl = new AbortController()
  fetch('/api/search?q=' + encodeURIComponent(debounced), { signal: ctrl.signal })
  return () => ctrl.abort()
}, [debounced])
¦¦¦

A few things worth knowing:

- The cleanup function cancels the pending timer, so only the last value inside the window wins.
- Aborting the previous request stops slow, stale responses from overwriting newer results.
- Keep the delay between 200 and 400 ms. Shorter feels jittery, longer feels broken.

If you also want to search immediately when the user presses Enter, skip the hook for that path and call the search function directly with the current ¦query¦.`)

const CODE_ALT = b(`A debounced callback is often simpler than a debounced value when you only need to trigger a side effect. This version keeps the latest function in a ref so the timer never goes stale.

¦¦¦ts
import { useCallback, useEffect, useRef } from 'react'

export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 250) {
  const latest = useRef(fn)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  latest.current = fn

  useEffect(() => () => clearTimeout(timer.current), [])

  return useCallback((...args: A) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latest.current(...args), delay)
  }, [delay])
}
¦¦¦

Call it from your input handler and the request only goes out once typing pauses:

- Memoise the returned function if you pass it to child components.
- Clear the timer on unmount, as above, to avoid updates on unmounted components.`)

const PLAN = b(`A two-week launch is tight but realistic if you decide up front what is out of scope. Here is a structure that has worked well for small teams.

**Week one: make it safe to ship**

1. Freeze scope on Monday and write down what is explicitly not in this release.
2. Finish the remaining blockers and run a full regression pass on staging.
3. Set up error tracking, a rollback path and a simple status dashboard.
4. Invite five to ten friendly customers to a private beta and collect feedback daily.

**Week two: make it worth noticing**

1. Fix the top three issues from the beta and re-test only what changed.
2. Prepare the announcement, changelog and help-centre updates.
3. Brief support on the known limitations and the escalation path.
4. Ship on a Tuesday morning, monitor for the first four hours, then send the announcement.

Two things tend to slip: documentation and support readiness. Put them on the calendar as real tasks with owners rather than leaving them as a vague last-minute step.

If you tell me the team size and whether there is a paid tier involved, I can turn this into a dated checklist.`)

const EMAIL = b(`Here is a draft you can adapt. It leads with the change, explains the reason in one sentence and gives people a clear date and a way to ask questions.

**Subject: An update to Meridian pricing from 1 December**

Hi there,

Starting 1 December, the Team plan will move from $24 to $29 per seat each month. Annual plans keep their current price until renewal.

Over the past year we have added audit logs, scheduled exports and a much faster dashboard. This change lets us keep investing in that work and in the support you rely on.

You do not need to do anything. If you would like to lock in today's price, you can switch to annual billing from Settings before 30 November.

If you have questions, just reply to this email and a real person will get back to you.

Thank you for building with us,
The Meridian team

I kept it short on purpose. If your audience is mostly finance teams, add a line about invoices and tax receipts; for developers, mention that API limits are unchanged.`)

const EXPLAIN = b(`Latency and throughput describe different things, and optimising one often costs you the other.

**Latency** is how long a single request takes from start to finish. It is what a user feels when they click a button and wait. It is measured in milliseconds and usually reported as percentiles, because the slowest 1% of requests matter far more than the average.

**Throughput** is how much work the system completes per unit of time, for example requests per second. It tells you about capacity rather than individual experience.

A road makes a good analogy. Latency is how long one car takes to get from A to B; throughput is how many cars pass a point each minute. Adding lanes raises throughput without making any single trip faster.

The trade-off shows up in batching. Grouping 100 writes into one database call increases throughput dramatically, but each write now waits for the batch to fill, so its latency goes up.

When you are deciding what to optimise, ask who is waiting. Interactive paths usually need low tail latency; background pipelines usually need high throughput.`)

const GENERAL = b(`Happy to help with that. Based on what you have shared, here is how I would approach it.

Start by writing down the outcome you want in one sentence. Most of the confusion in a task like this comes from solving a slightly different problem than the one you actually have, and a clear sentence makes the trade-offs much easier to see.

From there, I would break the work into small steps you can check independently:

- Gather the facts you already have and note what is still unknown.
- Pick the simplest option that satisfies the outcome, even if it is not the most elegant.
- Try it on a small example before committing to it everywhere.
- Write down what you learned so the next iteration starts further along.

If you can share more detail, such as constraints, deadlines or examples of what good looks like, I can be much more specific and suggest a concrete first step.`)

const GENERAL_ALT = b(`Sure. Here is a shorter take.

Define the outcome in one sentence, choose the simplest approach that meets it, and test it on a small case before rolling it out. If something does not work, change one variable at a time so you can tell what made the difference.

Share a few more details and I will tailor this to your situation.`)

export function pickReply(prompt: string, salt = 0): string {
  const p = prompt.toLowerCase()
  const pick = (a: string[]) => a[salt % a.length]
  if (/debounce|react|hook|function|code|typescript|javascript|bug|regex|sql|script|api/.test(p)) return pick([CODE, CODE_ALT])
  if (/plan|launch|roadmap|checklist|steps|onboard|prioriti|schedule/.test(p)) return PLAN
  if (/email|draft|announce|newsletter|reply|letter/.test(p)) return EMAIL
  if (/explain|difference|why|how does|compare|latency|summar|what is/.test(p)) return EXPLAIN
  return pick([GENERAL, GENERAL_ALT])
}

const u = (id: string, text: string): Msg => ({ id, role: 'user', text, shown: text.length, status: 'done' })
const a = (id: string, text: string): Msg => ({ id, role: 'assistant', text, shown: text.length, status: 'done' })

export const SEED: Conv[] = [
  { id: 'c1', title: 'Debounce a search input in React', pinned: true, updated: NOW - 2 * H, messages: [u('m1', 'Write a debounce hook for a search input in React'), a('m2', CODE)] },
  { id: 'c2', title: 'Launch checklist for the v3 release', pinned: true, updated: NOW - 3 * D, messages: [u('m3', 'Plan a two-week launch checklist for a small SaaS release'), a('m4', PLAN)] },
  { id: 'c3', title: 'Latency vs throughput', pinned: false, updated: NOW - 5 * H, messages: [u('m5', 'Explain the difference between latency and throughput'), a('m6', EXPLAIN)] },
  { id: 'c4', title: 'Pricing change announcement', pinned: false, updated: NOW - 9 * H, messages: [u('m7', 'Draft a friendly email announcing a pricing change'), a('m8', EMAIL)] },
  { id: 'c5', title: 'Quarterly OKR wording', pinned: false, updated: NOW - 1 * D - 3 * H, messages: [u('m9', 'Help me reword three OKRs so they are measurable'), a('m10', GENERAL)] },
  { id: 'c6', title: 'Postgres index for slow report query', pinned: false, updated: NOW - 1 * D - 6 * H, messages: [u('m11', 'My report query on a 40M row table takes 12 seconds, where do I start?'), a('m12', GENERAL_ALT)] },
  { id: 'c7', title: 'Onboarding email sequence', pinned: false, updated: NOW - 3 * D - 2 * H, messages: [u('m13', 'Outline a five-step onboarding email sequence'), a('m14', PLAN)] },
  { id: 'c8', title: 'Summarise customer interviews', pinned: false, updated: NOW - 4 * D, messages: [u('m15', 'Summarise the main themes from these customer interviews'), a('m16', EXPLAIN)] },
  { id: 'c9', title: 'Regex for invoice numbers', pinned: false, updated: NOW - 6 * D, messages: [u('m17', 'Regex for invoice numbers like INV-2026-00418'), a('m18', CODE_ALT)] },
  { id: 'c10', title: 'Trip itinerary for Lisbon', pinned: false, updated: NOW - 12 * D, messages: [u('m19', 'Plan three days in Lisbon with a focus on food'), a('m20', PLAN)] },
  { id: 'c11', title: 'Naming ideas for the analytics module', pinned: false, updated: NOW - 18 * D, messages: [u('m21', 'Give me naming ideas for our analytics module'), a('m22', GENERAL)] },
]

export function groupOf(updated: number): string {
  const sod = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
  const diff = Math.round((sod(NOW) - sod(updated)) / D)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff <= 7) return 'Previous 7 days'
  return 'Earlier'
}
export const GROUP_ORDER = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days', 'Earlier']
