import { useLayoutEffect, useRef, useState } from 'react'
import { Avatar, Dropdown, IconButton, Icon, MenuButton, Tag, type Option } from '../../ui'
import { MEMBERS, PRIORITIES, STATUSES, TODAY, dayOffset, fmtDue, memberName, type Label, type Priority, type Project, type Status, type Task } from './data'

function Autosize({ value, onChange, className, placeholder, label, onEnter }: { value: string; onChange: (v: string) => void; className: string; placeholder?: string; label: string; onEnter?: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => { const el = ref.current; if (!el) return; el.style.height = '0px'; el.style.height = el.scrollHeight + 'px' }, [value])
  return <textarea ref={ref} rows={1} className={className} value={value} placeholder={placeholder} aria-label={label} onChange={e => onChange(e.target.value)}
    onKeyDown={e => { if (onEnter && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnter() } }} />
}

type Props = {
  task: Task; project: Project; labels: Label[]; onClose: () => void
  onPatch: (patch: Partial<Task>) => void; onCreateLabel: (name: string) => string
  onComment: (text: string) => void; onDuplicate: () => void; onDelete: () => void; onCopyLink: () => void
}

export function Detail({ task, project, labels, onClose, onPatch, onCreateLabel, onComment, onDuplicate, onDelete, onCopyLink }: Props) {
  const [draft, setDraft] = useState('')
  const send = () => { const t = draft.trim(); if (t) { onComment(t); setDraft('') } }

  const statusOpts: Option<Status>[] = STATUSES.map(s => ({ value: s.value, label: s.label, icon: s.icon }))
  const prioOpts: Option<Priority>[] = PRIORITIES.map(p => ({ value: p.value, label: p.label, icon: 'flag' }))
  const memberOpts: Option[] = [...MEMBERS.map(m => ({ value: m.id, label: m.name, icon: 'user' as const })), { value: 'none', label: 'Unassigned', icon: 'x' as const }]
  const labelOpts: Option[] = labels.map(l => ({ value: l.id, label: l.name, color: l.color }))
  const dueChoices: [string, string][] = [['Today', TODAY], ['Tomorrow', dayOffset(1)], ['In a week', dayOffset(7)], ['In two weeks', dayOffset(14)]]
  const dueOpts: Option[] = [
    ...(task.due && !dueChoices.some(([, v]) => v === task.due) ? [{ value: task.due, label: fmtDue(task.due), icon: 'calendar' as const }] : []),
    ...dueChoices.map(([l, v]) => ({ value: v, label: l, meta: fmtDue(v), icon: 'calendar' as const })),
    { value: 'none', label: 'No date', icon: 'x' as const },
  ]

  return (
    <section className="pm-detail" aria-label={`Task ${task.id}`}>
      <header className="pm-detail-head">
        <IconButton icon="chevron-left" label="Back to tasks" className="mobile-only" onClick={onClose} />
        <span className="pm-crumb num">{project.name} <span className="faint">/</span> {task.id}</span>
        <span className="grow" />
        <MenuButton label="Task actions" items={[
          { label: 'Copy link', icon: 'link', onSelect: onCopyLink },
          { label: 'Duplicate', icon: 'copy', onSelect: onDuplicate },
          { type: 'sep' },
          { label: 'Delete task', icon: 'trash', danger: true, onSelect: onDelete },
        ]} />
        <IconButton icon="x" label="Close task" className="pm-desk-only" onClick={onClose} />
      </header>

      <div className="pm-detail-body scroll">
        <Autosize className="pm-edit-title" value={task.title} label="Task title" placeholder="Task title" onChange={v => onPatch({ title: v })} onEnter={() => (document.activeElement as HTMLElement)?.blur()} />
        <Autosize className="pm-edit-desc" value={task.desc} label="Description" placeholder="Add a description" onChange={v => onPatch({ desc: v })} />

        <dl className="pm-props">
          <dt>Status</dt>
          <dd><Dropdown quiet label="Status" options={statusOpts} value={task.status} onChange={v => onPatch({ status: v })} /></dd>
          <dt>Priority</dt>
          <dd><Dropdown quiet label="Priority" options={prioOpts} value={task.priority} onChange={v => onPatch({ priority: v })} /></dd>
          <dt>Assignee</dt>
          <dd>
            <Dropdown quiet searchable label="Assignee" options={memberOpts} value={task.assignee ?? 'none'} placeholder="Unassigned"
              onChange={v => onPatch({ assignee: v === 'none' ? null : v })}
              renderValue={() => task.assignee
                ? <><Avatar name={memberName(task.assignee)} /><span className="truncate">{memberName(task.assignee)}</span></>
                : <span className="faint">Unassigned</span>} />
          </dd>
          <dt>Labels</dt>
          <dd>
            <Dropdown multiple quiet searchable label="Labels" createNoun="label" options={labelOpts} value={task.labels} onChange={v => onPatch({ labels: v })}
              onCreate={onCreateLabel}
              renderValue={sel => sel.length
                ? <span className="pm-labels">{sel.slice(0, 3).map(o => <Tag key={o.value} color={o.color}>{o.label}</Tag>)}{sel.length > 3 && <Tag>+{sel.length - 3}</Tag>}</span>
                : <span className="faint">Add labels</span>} />
          </dd>
          <dt>Due date</dt>
          <dd>
            <Dropdown quiet label="Due date" options={dueOpts} value={task.due ?? 'none'} onChange={v => onPatch({ due: v === 'none' ? null : v })}
              renderValue={() => task.due
                ? <><Icon name="calendar" size={15} /><span className={task.due < TODAY && task.status !== 'done' ? 'pm-late' : ''}>{fmtDue(task.due)}</span></>
                : <span className="faint">No date</span>} />
          </dd>
        </dl>

        <h3 className="eyebrow pm-activity-h">Activity</h3>
        <ul className="pm-activity">
          {task.act.map(a => a.kind === 'event' ? (
            <li key={a.id} className="pm-ev"><span className="pm-ev-dot" /><span className="muted"><b>{memberName(a.who).split(' ')[0]}</b> {a.text}</span><span className="faint">{a.at}</span></li>
          ) : (
            <li key={a.id} className="pm-cm">
              <Avatar name={memberName(a.who)} />
              <div className="grow">
                <div className="row"><b>{memberName(a.who)}</b><span className="faint">{a.at}</span></div>
                <p>{a.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form className="pm-composer" onSubmit={e => { e.preventDefault(); send() }}>
        <Autosize className="pm-composer-in" value={draft} onChange={setDraft} label="Write a comment" placeholder="Write a comment" onEnter={send} />
        {draft.trim() && <IconButton icon="arrow-up" label="Send comment" filled type="submit" />}
      </form>
    </section>
  )
}
