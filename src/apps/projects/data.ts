import type { IconName } from '../../ui'

export type Status = 'backlog' | 'todo' | 'progress' | 'review' | 'done'
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type Member = { id: string; name: string }
export type Label = { id: string; name: string; color: string }
export type Project = { id: string; name: string; key: string; seq: number }
export type Act = { id: string; who: string; at: string; kind: 'comment' | 'event'; text: string }
export type Task = {
  id: string; num: number; pid: string; title: string; desc: string; status: Status; priority: Priority
  assignee: string | null; labels: string[]; due: string | null; order: number; act: Act[]
}

export const TODAY = '2026-10-27'
export const ME = 'amara'

export const STATUSES: { value: Status; label: string; icon: IconName }[] = [
  { value: 'backlog', label: 'Backlog', icon: 'circle-dashed' },
  { value: 'todo', label: 'Todo', icon: 'circle' },
  { value: 'progress', label: 'In progress', icon: 'circle-half' },
  { value: 'review', label: 'In review', icon: 'circle-dot' },
  { value: 'done', label: 'Done', icon: 'circle-check' },
]
export const PRIORITIES: { value: Priority; label: string; rank: number }[] = [
  { value: 'urgent', label: 'Urgent', rank: 0 },
  { value: 'high', label: 'High', rank: 1 },
  { value: 'medium', label: 'Medium', rank: 2 },
  { value: 'low', label: 'Low', rank: 3 },
  { value: 'none', label: 'No priority', rank: 4 },
]
export const MEMBERS: Member[] = [
  { id: 'amara', name: 'Amara Okafor' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'priya', name: 'Priya Raman' },
  { id: 'mateo', name: 'Mateo Alvarez' },
  { id: 'hana', name: 'Hana Kobayashi' },
  { id: 'liam', name: "Liam O'Connell" },
]
/** Small fixed muted palette for label colours (label colour is data). */
export const LABEL_PALETTE = ['#c4796d', '#c89a5b', '#8ea36a', '#6aa39a', '#6f93b8', '#9a85b8', '#b8829f']

export const SEED_LABELS: Label[] = [
  { id: 'bug', name: 'Bug', color: LABEL_PALETTE[0] },
  { id: 'feature', name: 'Feature', color: LABEL_PALETTE[4] },
  { id: 'design', name: 'Design', color: LABEL_PALETTE[5] },
  { id: 'infra', name: 'Infrastructure', color: LABEL_PALETTE[3] },
  { id: 'perf', name: 'Performance', color: LABEL_PALETTE[1] },
  { id: 'docs', name: 'Docs', color: LABEL_PALETTE[2] },
]

export const SEED_PROJECTS: Project[] = [
  { id: 'core', name: 'Summa Core', key: 'SUM', seq: 151 },
  { id: 'mobile', name: 'Mobile app', key: 'MOB', seq: 48 },
  { id: 'dsys', name: 'Design system', key: 'DSY', seq: 33 },
  { id: 'billing', name: 'Billing', key: 'BIL', seq: 21 },
]

export const dayOffset = (n: number) => {
  const d = new Date(TODAY + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}
export const fmtDue = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

type Row = [pid: string, num: number, title: string, status: Status, pr: Priority, who: string | null, labels: string[], due: number | null, desc?: string]
const ROWS: Row[] = [
  ['core', 142, 'Workspace switcher drops focus after selecting a team', 'progress', 'high', 'amara', ['bug'], 2, 'After picking a workspace from the switcher, keyboard focus returns to the document body instead of the trigger. Screen reader users lose their place.'],
  ['core', 141, 'Bulk invite members from a CSV file', 'todo', 'medium', 'jonas', ['feature'], 9, 'Admins want to paste or upload a CSV of email addresses and roles. Show a preview with row-level validation before sending.'],
  ['core', 140, 'Cache permission checks per request', 'review', 'high', 'priya', ['perf', 'infra'], 1, 'Permission lookups hit the database up to 14 times on the project overview. Memoise per request and add a short TTL cache for role grants.'],
  ['core', 139, 'Audit log export times out above 50k rows', 'progress', 'urgent', 'mateo', ['bug', 'perf'], -2, 'Exports above roughly 50k rows exceed the gateway timeout. Stream the response and move large exports to a background job.'],
  ['core', 138, 'Rewrite onboarding checklist copy', 'todo', 'low', 'hana', ['docs'], 6],
  ['core', 137, 'Single sign-on: map IdP groups to roles', 'backlog', 'medium', null, ['feature'], null, 'Map SAML group claims to workspace roles with a default fallback. Needs a settings screen and a dry-run mode.'],
  ['core', 136, 'Keyboard shortcut sheet', 'backlog', 'low', null, ['feature', 'design'], null],
  ['core', 135, 'Upgrade Postgres to 16 on staging', 'done', 'medium', 'liam', ['infra'], -6],
  ['core', 134, 'Empty states use the wrong illustration weight', 'done', 'low', 'hana', ['design'], -9],
  ['core', 133, 'Webhook retries ignore Retry-After header', 'review', 'medium', 'jonas', ['bug'], 3],
  ['core', 132, 'Dark mode contrast on disabled buttons', 'todo', 'medium', 'amara', ['design', 'bug'], 5],
  ['core', 131, 'Migrate email templates to the new layout engine', 'backlog', 'low', 'priya', ['infra'], null],
  ['core', 130, 'Rate limit dashboard for API keys', 'done', 'high', 'mateo', ['feature'], -12],
  ['mobile', 47, 'Pull to refresh stutters on long lists', 'progress', 'high', 'amara', ['perf'], 2, 'On lists above 200 items the refresh indicator jumps. Likely caused by re-measuring every row on scroll.'],
  ['mobile', 46, 'Offline queue for comments', 'todo', 'medium', 'liam', ['feature'], 12],
  ['mobile', 45, 'Push notification deep links open the home tab', 'review', 'urgent', 'jonas', ['bug'], 0],
  ['mobile', 44, 'Biometric unlock on resume', 'backlog', 'medium', null, ['feature'], null],
  ['mobile', 43, 'Tablet layout for the task detail screen', 'backlog', 'low', 'hana', ['design'], null],
  ['mobile', 42, 'Crash on rotating during image upload', 'done', 'urgent', 'priya', ['bug'], -4],
  ['mobile', 41, 'Reduce cold start time below 1.5s', 'todo', 'high', 'amara', ['perf'], 8],
  ['mobile', 40, 'Haptics for destructive confirmations', 'done', 'low', 'hana', ['design'], -10],
  ['dsys', 32, 'Document the focus ring across components', 'progress', 'medium', 'hana', ['docs', 'design'], 4],
  ['dsys', 31, 'Dropdown: creation inside the list', 'review', 'high', 'amara', ['feature'], 1, 'Typing a name with no match should offer to create it in place, so there is no separate create button next to the control.'],
  ['dsys', 30, 'Spacing scale audit', 'todo', 'low', 'jonas', ['design'], 10],
  ['dsys', 29, 'Tabs: arrow-key navigation', 'done', 'medium', 'mateo', ['feature'], -7],
  ['dsys', 28, 'Icon set: remove duplicates', 'done', 'low', 'priya', ['design'], -14],
  ['dsys', 27, 'Date picker accessibility pass', 'backlog', 'high', null, ['bug'], null],
  ['dsys', 26, 'Publish tokens as CSS variables', 'done', 'medium', 'liam', ['infra', 'docs'], -20],
  ['billing', 20, 'Proration is wrong when downgrading mid-cycle', 'progress', 'urgent', 'jonas', ['bug'], -1, 'Customers who downgrade on day 3 of a cycle are credited for the wrong number of days. Reproduced with the 30-day and 31-day month fixtures.'],
  ['billing', 19, 'Invoice PDF: add VAT number', 'todo', 'high', 'priya', ['feature'], 4],
  ['billing', 18, 'Retry failed payments after 3 and 7 days', 'review', 'medium', 'mateo', ['feature'], 2],
  ['billing', 17, 'Tax settings copy is confusing', 'backlog', 'low', 'hana', ['docs'], null],
  ['billing', 16, 'Dunning emails', 'done', 'medium', 'liam', ['feature'], -8],
  ['billing', 15, 'Seat counts lag by a few minutes', 'backlog', 'medium', null, ['bug', 'perf'], null],
]

const KEY: Record<string, string> = Object.fromEntries(SEED_PROJECTS.map(p => [p.id, p.key]))
const COMMENTS: Record<string, [string, string, string][]> = {
  'SUM-142': [['jonas', '2d ago', 'I can reproduce this on Safari and Firefox. Chrome keeps focus because the trigger is re-mounted with the same key.'], ['amara', '1d ago', 'Found it: we unmount the popover before restoring focus. Moving the restore into the close handler.']],
  'SUM-139': [['mateo', '3d ago', 'The slow path is the CSV serialiser. Streaming rows brings memory flat, but we still need a job for the biggest exports.']],
  'MOB-45': [['priya', '5h ago', 'Universal links work on iOS. Android still resolves to the launcher activity.']],
  'BIL-20': [['liam', '1d ago', 'Added fixtures for 28, 30 and 31 day months.'], ['jonas', '6h ago', 'Credit looks correct for monthly plans. Annual plans next.']],
}
const WHEN = ['3w ago', '3w ago', '2w ago', '1w ago']

export const SEED_TASKS: Task[] = ROWS.map(([pid, num, title, status, priority, who, labels, due, desc], i) => {
  const id = `${KEY[pid]}-${num}`
  const act: Act[] = [{ id: id + 'a0', who: who ?? 'liam', at: WHEN[i % WHEN.length], kind: 'event', text: 'created this task' }]
  if (who && status !== 'backlog') act.push({ id: id + 'a1', who, at: '1w ago', kind: 'event', text: 'moved this to ' + STATUSES.find(s => s.value === (status === 'done' ? 'progress' : status))!.label })
  ;(COMMENTS[id] ?? []).forEach(([w, at, text], j) => act.push({ id: id + 'c' + j, who: w, at, kind: 'comment', text }))
  return {
    id, num, pid, title, status, priority, assignee: who, labels, due: due === null ? null : dayOffset(due), order: num, act,
    desc: desc ?? '',
  }
})

export const memberName = (id: string | null) => MEMBERS.find(m => m.id === id)?.name ?? 'Unassigned'
