import './projects.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell, Brand, Button, Dialog, DrawerToggle, Dropdown, Icon, IconButton, NavItem, SearchInput, Tabs } from '../../ui'
import {
  LABEL_PALETTE, ME, PRIORITIES, SEED_LABELS, SEED_PROJECTS, SEED_TASKS, STATUSES, memberName,
  type Act, type Label, type Priority, type Project, type Status, type Task,
} from './data'
import { Detail } from './Detail'
import {
  EMPTY_FILTERS, FilterButton, FilterChips, MenuTrigger, TaskCard, TaskRow, assigneeItems, priorityItems, statusItems, type Filters,
} from './parts'

type Sort = 'priority' | 'due' | 'newest' | 'title'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'priority', label: 'Priority' }, { value: 'due', label: 'Due date' }, { value: 'newest', label: 'Newest' }, { value: 'title', label: 'Title' },
]
const prioRank = (p: Priority) => PRIORITIES.find(x => x.value === p)!.rank
const sorters: Record<Sort, (a: Task, b: Task) => number> = {
  priority: (a, b) => prioRank(a.priority) - prioRank(b.priority) || b.order - a.order,
  due: (a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || b.order - a.order,
  newest: (a, b) => b.order - a.order,
  title: (a, b) => a.title.localeCompare(b.title),
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
}

export default function ProjectsApp() {
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS)
  const [labels, setLabels] = useState<Label[]>(SEED_LABELS)
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS)
  const [scope, setScope] = useState<string>('core') // project id or 'mine'
  const [view, setView] = useState<'list' | 'board'>('list')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('priority')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(() => {
    const t = location.hash.split('/')[2]; return t && SEED_TASKS.some(x => x.id === t) ? t : null
  })
  const [cursor, setCursor] = useState<string | null>(null)
  const [kbd, setKbd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState(false)
  const [newProject, setNewProject] = useState(false)
  const [deleting, setDeleting] = useState<string[] | null>(null)

  // Skeleton on first load and on every scope switch.
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t) }, [scope])
  useEffect(() => { setSel(new Set()); setCursor(null) }, [scope])
  useEffect(() => { history.replaceState(null, '', '#/projects' + (openId ? '/' + openId : '')) }, [openId])

  const project = projects.find(p => p.id === scope)
  const title = scope === 'mine' ? 'My tasks' : project?.name ?? ''
  const scoped = useMemo(() => tasks.filter(t => scope === 'mine' ? t.assignee === ME && t.status !== 'done' : t.pid === scope), [tasks, scope])
  const hasFilters = Object.values(filters).some(a => a.length) || q.trim() !== ''

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return scoped.filter(t =>
      (!filters.status.length || filters.status.includes(t.status)) &&
      (!filters.priority.length || filters.priority.includes(t.priority)) &&
      (!filters.label.length || t.labels.some(l => filters.label.includes(l))) &&
      (!filters.assignee.length || filters.assignee.includes(t.assignee ?? 'none')) &&
      (!needle || t.title.toLowerCase().includes(needle) || t.id.toLowerCase().includes(needle)),
    ).sort(sorters[sort])
  }, [scoped, filters, q, sort])

  const groups = useMemo(() => STATUSES.map(s => ({ ...s, tasks: visible.filter(t => t.status === s.value) })), [visible])
  const flat = useMemo(() => groups.flatMap(g => g.tasks), [groups])
  const open = tasks.find(t => t.id === openId) ?? null

  /* ---------- mutations ---------- */
  const patch = useCallback((ids: string[], p: Partial<Task>) => {
    setTasks(ts => ts.map(t => {
      if (!ids.includes(t.id)) return t
      const ev: Act[] = []
      const add = (text: string) => ev.push({ id: t.id + Math.random().toString(36).slice(2, 8), who: ME, at: 'just now', kind: 'event', text })
      if (p.status && p.status !== t.status) add('moved this to ' + STATUSES.find(s => s.value === p.status)!.label)
      if (p.priority && p.priority !== t.priority) add('set priority to ' + PRIORITIES.find(x => x.value === p.priority)!.label)
      if ('assignee' in p && p.assignee !== t.assignee) add(p.assignee ? 'assigned this to ' + memberName(p.assignee) : 'removed the assignee')
      if ('due' in p && p.due !== t.due) add(p.due ? 'set the due date' : 'removed the due date')
      return { ...t, ...p, act: ev.length ? [...t.act, ...ev] : t.act }
    }))
  }, [])

  const createLabel = useCallback((name: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + labels.length
    setLabels(ls => [...ls, { id, name, color: LABEL_PALETTE[ls.length % LABEL_PALETTE.length] }])
    return id
  }, [labels.length])

  const addTask = (pid: string, titleText: string, status: Status) => {
    const p = projects.find(x => x.id === pid)!
    const num = p.seq + 1
    setProjects(ps => ps.map(x => x.id === pid ? { ...x, seq: x.seq + 1 } : x))
    const id = `${p.key}-${num}`
    const t: Task = { id, num, pid, title: titleText, desc: '', status, priority: 'none', assignee: ME, labels: [], due: null, order: num,
      act: [{ id: id + 'a0', who: ME, at: 'just now', kind: 'event', text: 'created this task' }] }
    setTasks(ts => [...ts, t]); setCursor(id); setKbd(false)
    if (scope !== pid && scope !== 'mine') setScope(pid)
  }

  const duplicate = (t: Task) => {
    const p = projects.find(x => x.id === t.pid)!
    const num = p.seq + 1
    setProjects(ps => ps.map(x => x.id === p.id ? { ...x, seq: x.seq + 1 } : x))
    const id = `${p.key}-${num}`
    setTasks(ts => [...ts, { ...t, id, num, order: num, title: t.title + ' (copy)', act: [{ id: id + 'a0', who: ME, at: 'just now', kind: 'event', text: 'duplicated ' + t.id }] }])
    setOpenId(id)
  }
  const comment = (id: string, text: string) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, act: [...t.act, { id: id + 'c' + t.act.length + Date.now(), who: ME, at: 'just now', kind: 'comment', text }] } : t))
  const remove = (ids: string[]) => {
    setTasks(ts => ts.filter(t => !ids.includes(t.id)))
    setSel(new Set()); if (openId && ids.includes(openId)) setOpenId(null)
  }
  const copyLink = (id: string) => { try { void navigator.clipboard.writeText(`${location.origin}${location.pathname}#/projects/${id}`) } catch { /* clipboard unavailable */ } }
  const toggleSel = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  /* ---------- keyboard ---------- */
  const keys = useRef<(e: KeyboardEvent) => void>(() => {})
  keys.current = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') {
      if (sel.size) { setSel(new Set()); return }
      if (openId) setOpenId(null)
      return
    }
    if (isTyping(e.target) || document.querySelector('[role=dialog], .popover')) return
    const i = cursor ? flat.findIndex(t => t.id === cursor) : -1
    if (e.key === 'c') { e.preventDefault(); setNewTask(true) }
    else if (e.key === 'j' || e.key === 'k') {
      e.preventDefault()
      const n = Math.max(0, Math.min(flat.length - 1, i + (e.key === 'j' ? 1 : -1)))
      if (flat[n]) { setCursor(flat[n].id); setKbd(true) }
    }
    else if (e.key === 'Enter' && cursor) { e.preventDefault(); setOpenId(cursor) }
    else if (e.key === 'x' && cursor) { e.preventDefault(); toggleSel(cursor) }
  }
  useEffect(() => { const h = (e: KeyboardEvent) => keys.current(e); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [])
  useEffect(() => { if (cursor) document.querySelector(`[data-tid="${cursor}"]`)?.scrollIntoView({ block: 'nearest' }) }, [cursor])

  /* ---------- render ---------- */
  const rowProps = (t: Task) => ({
    task: t, labels, selected: sel.has(t.id), cursor: kbd && cursor === t.id, active: openId === t.id,
    onOpen: () => { setCursor(t.id); setKbd(false); setOpenId(t.id) }, onSelect: () => toggleSel(t.id), onStatus: (s: Status) => patch([t.id], { status: s }),
  })
  const countOf = (pid: string) => tasks.filter(t => t.pid === pid && t.status !== 'done').length
  const myCount = tasks.filter(t => t.assignee === ME && t.status !== 'done').length

  const sidebar = (
    <>
      <Brand name="Northwind" />
      <div className="col" style={{ gap: 2 }}>
        <NavItem icon="circle-check" label="My tasks" count={myCount} current={scope === 'mine'} onClick={() => { setScope('mine'); setOpenId(null) }} />
      </div>
      <div className="pm-side-head">
        <span className="eyebrow">Projects</span>
        <IconButton icon="plus" size="sm" label="Create project" onClick={() => setNewProject(true)} />
      </div>
      <nav className="col scroll grow" style={{ gap: 2 }} aria-label="Projects">
        {projects.map(p => <NavItem key={p.id} icon="folder" label={p.name} count={countOf(p.id)} current={scope === p.id} onClick={() => { setScope(p.id); setOpenId(null) }} />)}
      </nav>
    </>
  )

  const showDetail = !!open
  return (
    <AppShell sidebar={sidebar}>
      <div className="pm-main">
        <div className="pm-list-pane">
          {sel.size > 0 ? (
            <BulkBar count={sel.size} onClear={() => setSel(new Set())}
              onStatus={s => patch([...sel], { status: s })} onPriority={p => patch([...sel], { priority: p })} onAssignee={a => patch([...sel], { assignee: a })}
              onDelete={() => setDeleting([...sel])} />
          ) : (
            <header className="pm-top">
              <DrawerToggle />
              <h1 className="pm-h1 truncate">{title}</h1>
              <span className="grow" />
              <SearchInput className="pm-search" placeholder="Search tasks" aria-label="Search tasks" value={q} onChange={e => setQ(e.target.value)} />
              <FilterButton filters={filters} labels={labels} onChange={setFilters} />
              <MenuTrigger label="Sort" placement="bottom-end" items={SORTS.map(s => ({ label: s.label, checked: s.value === sort, onSelect: () => setSort(s.value) }))}
                render={({ ref, open: o, toggle }) => (
                  <button ref={ref} type="button" className="btn btn-ghost" aria-label={`Sort: ${SORTS.find(s => s.value === sort)!.label}`} aria-haspopup="menu" aria-expanded={o} onClick={toggle}>
                    <Icon name="sort" size={15} /><span className="pm-btn-text">Sort</span>
                  </button>
                )} />
              <div className="pm-tabs"><Tabs label="View" value={view} onChange={setView} items={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} /></div>
              <Button className="pm-new" variant="primary" icon="plus" aria-label="New task" onClick={() => setNewTask(true)}><span className="pm-btn-text">New task</span></Button>
            </header>
          )}
          <FilterChips filters={filters} labels={labels} onChange={setFilters} />

          <div className="pm-scroll scroll" role="list" aria-label="Tasks" aria-busy={loading}>
            {loading ? <Skeleton board={view === 'board'} /> :
              scoped.length === 0 ? (
                <Empty icon="circle-check" title={scope === 'mine' ? 'Nothing assigned to you' : 'No tasks yet'} hint={scope === 'mine' ? 'Tasks assigned to you will appear here.' : 'Create the first task for this project.'}
                  action={scope === 'mine' ? undefined : <Button variant="primary" icon="plus" onClick={() => setNewTask(true)}>New task <span className="kbd">C</span></Button>} />
              ) : flat.length === 0 ? (
                <Empty icon="search" title="No tasks match" hint="Try removing a filter or changing your search."
                  action={hasFilters ? <Button onClick={() => { setFilters(EMPTY_FILTERS); setQ('') }}>Clear filters</Button> : undefined} />
              ) : view === 'list' ? groups.filter(g => g.tasks.length).map(g => (
                <section key={g.value} className="pm-group" aria-label={g.label}>
                  <h2 className="pm-group-h"><span>{g.label}</span><span className="faint num">{g.tasks.length}</span></h2>
                  {g.tasks.map(t => <TaskRow key={t.id} {...rowProps(t)} anySelected={sel.size > 0} />)}
                </section>
              )) : (
                <div className="pm-board">
                  {groups.map(g => (
                    <section key={g.value} className="pm-col" aria-label={g.label}>
                      <h2 className="pm-group-h"><span>{g.label}</span><span className="faint num">{g.tasks.length}</span></h2>
                      {g.tasks.map(t => <TaskCard key={t.id} {...rowProps(t)} />)}
                      {!g.tasks.length && <p className="faint pm-col-empty">No tasks</p>}
                    </section>
                  ))}
                </div>
              )}
          </div>
        </div>

        {showDetail && open && (
          <Detail key={open.id} task={open} project={projects.find(p => p.id === open.pid)!} labels={labels}
            onClose={() => setOpenId(null)} onPatch={p => patch([open.id], p)} onCreateLabel={createLabel}
            onComment={t => comment(open.id, t)} onDuplicate={() => duplicate(open)} onDelete={() => setDeleting([open.id])} onCopyLink={() => copyLink(open.id)} />
        )}
      </div>

      <NewTaskDialog open={newTask} onClose={() => setNewTask(false)} projects={projects} defaultProject={project?.id ?? projects[0].id}
        onCreate={(pid, t, s) => { addTask(pid, t, s); setNewTask(false) }} />
      <NewProjectDialog open={newProject} onClose={() => setNewProject(false)} onCreate={name => {
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + projects.length
        const key = (name.replace(/[^a-z]/gi, '').slice(0, 3) || 'PRJ').toUpperCase()
        setProjects(ps => [...ps, { id, name, key, seq: 0 }]); setScope(id); setNewProject(false); setOpenId(null)
      }} />
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title={deleting && deleting.length > 1 ? `Delete ${deleting.length} tasks?` : 'Delete task?'}
        footer={<><Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={() => { remove(deleting!); setDeleting(null) }}>Delete</Button></>}>
        <p className="muted">{deleting && deleting.length > 1 ? 'These tasks' : 'This task'} and {deleting && deleting.length > 1 ? 'their' : 'its'} activity will be permanently removed.</p>
      </Dialog>
    </AppShell>
  )
}

function BulkBar({ count, onClear, onStatus, onPriority, onAssignee, onDelete }: {
  count: number; onClear: () => void; onStatus: (s: Status) => void; onPriority: (p: Priority) => void; onAssignee: (a: string | null) => void; onDelete: () => void
}) {
  const trig = (icon: 'circle-half' | 'flag' | 'user', text: string) => ({ ref, open, toggle }: { ref: (n: HTMLElement | null) => void; open: boolean; toggle: () => void }) => (
    <button ref={ref} type="button" className="btn btn-ghost" aria-haspopup="menu" aria-expanded={open} aria-label={text} onClick={toggle}><Icon name={icon} size={15} /><span className="pm-btn-text">{text}</span></button>
  )
  return (
    <header className="pm-top pm-bulk" aria-label="Bulk actions">
      <IconButton icon="x" label="Clear selection" onClick={onClear} />
      <span className="pm-h1 num">{count} selected</span>
      <span className="grow" />
      <MenuTrigger label="Set status" items={statusItems(null, onStatus)} render={trig('circle-half', 'Status')} />
      <MenuTrigger label="Set priority" items={priorityItems(null, onPriority)} render={trig('flag', 'Priority')} />
      <MenuTrigger label="Assign to" items={assigneeItems('\0', onAssignee)} placement="bottom-end" render={trig('user', 'Assignee')} />
      <IconButton icon="trash" label="Delete selected" onClick={onDelete} />
    </header>
  )
}

function Empty({ icon, title, hint, action }: { icon: 'search' | 'circle-check'; title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="pm-empty">
      <span className="pm-empty-icon"><Icon name={icon} size={20} /></span>
      <h2>{title}</h2>
      <p className="muted">{hint}</p>
      {action}
    </div>
  )
}

function Skeleton({ board }: { board: boolean }) {
  const w = [62, 48, 71, 55, 66, 44, 58]
  return (
    <div aria-hidden="true" className={board ? 'pm-board' : ''}>
      {(board ? [0, 1, 2] : [0, 1]).map(g => (
        <div key={g} className={board ? 'pm-col' : 'pm-group'}>
          <div className="skeleton pm-sk-h" />
          {w.slice(0, board ? 3 : g ? 3 : 4).map((x, i) => board
            ? <div key={i} className="skeleton pm-sk-card" />
            : <div key={i} className="pm-sk-row"><span className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} /><span className="skeleton" style={{ width: 54, height: 10 }} /><span className="skeleton" style={{ width: `${x}%`, height: 10 }} /></div>)}
        </div>
      ))}
    </div>
  )
}

function NewTaskDialog({ open, onClose, projects, defaultProject, onCreate }: {
  open: boolean; onClose: () => void; projects: Project[]; defaultProject: string; onCreate: (pid: string, title: string, s: Status) => void
}) {
  const [text, setText] = useState(''); const [pid, setPid] = useState(defaultProject); const [st, setSt] = useState<Status>('todo')
  useEffect(() => { if (open) { setText(''); setPid(defaultProject); setSt('todo') } }, [open, defaultProject])
  const submit = () => { if (text.trim()) onCreate(pid, text.trim(), st) }
  return (
    <Dialog open={open} onClose={onClose} title="New task"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!text.trim()} onClick={submit}>Create task</Button></>}>
      <div className="col" style={{ gap: 12 }}>
        <input className="input pm-dlg-title" autoFocus placeholder="Task title" aria-label="Task title" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }} />
        <div className="row">
          <Dropdown label="Project" value={pid} onChange={setPid} options={projects.map(p => ({ value: p.id, label: p.name, meta: p.key }))} />
          <Dropdown label="Status" value={st} onChange={setSt} options={STATUSES.map(s => ({ value: s.value, label: s.label, icon: s.icon }))} />
        </div>
      </div>
    </Dialog>
  )
}

function NewProjectDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  useEffect(() => { if (open) setName('') }, [open])
  const submit = () => { if (name.trim()) onCreate(name.trim()) }
  return (
    <Dialog open={open} onClose={onClose} title="Create project"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={submit}>Create project</Button></>}>
      <input className="input pm-dlg-title" autoFocus placeholder="Project name" aria-label="Project name" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }} />
    </Dialog>
  )
}
