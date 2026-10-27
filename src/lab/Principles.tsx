import { PROTOTYPES } from '../registry'
import { Icon } from '../ui'
import './lab.css'

/** Separate review view. Nothing here appears inside the prototypes themselves. */

type Exception = { app: string; what: string; why: string }
type Note = { app: string; text: string }

const APPLIED: { n: number; title: string; how: string }[] = [
  { n: 1, title: 'No borders within borders', how: 'Inputs, rows, cards and panels are filled surfaces; the only outlines are focus rings, checkbox boxes and one outline on overlays (menus, dialogs).' },
  { n: 2, title: 'Dark to light', how: 'Page --s0, main panel --s1, controls and cards --s2, selected/raised --s3, overlays --s4. Dialog content surfaces step lighter again.' },
  { n: 3, title: 'No decorative left borders', how: 'Not used anywhere. Selection is a fill; emphasis is type weight.' },
  { n: 4, title: 'Functional tags', how: 'Tags appear only for task labels (filterable), unsaved-state failure and active filters. No status badges, no "Saved".' },
  { n: 5, title: 'Information earns its place', how: 'No helper text. Empty states are one line; shortcuts live in menus; counts are muted numerals.' },
  { n: 6, title: 'Few colours', how: 'Neutrals + emerald. Other hues only in data: chart deltas, label dots, overdue dates, media imagery.' },
  { n: 7, title: 'One visual language', how: 'All six apps share tokens.css, base.css, one icon set and the same Menu, Dropdown, Dialog, Tabs, Button and AppShell implementations.' },
  { n: 8, title: 'Familiarity', how: 'Sidebar + panel, breadcrumbs, context menus, slash menu, Cmd-K style hotkeys, standard select/multi-select behaviour.' },
  { n: 9, title: 'Simplicity over cleverness', how: 'Plain lists and tables; one primary action per view; no custom controls where a standard one fits.' },
  { n: 10, title: 'Minimalism over prevalence', how: 'Label creation lives inside the label dropdown. Send becomes Stop (with an arming guard). Selection replaces the header with a bulk bar. Row and message actions appear on hover/focus.' },
  { n: 11, title: 'Rectangle Rule', how: 'Muted headings with body on the same left edge. Folder navigation uses breadcrumbs and a flat list, never an indented tree. Lists are flat.' },
  { n: 12, title: 'Dividers secondary', how: 'Only under table headers, inside tooltips/menus, and between menu groups. Spacing does the rest.' },
]

const EXCEPTIONS: Exception[] = [
  { app: 'AI Workspace', what: 'List markers hang in the left gutter of message text.', why: 'Bullets need a marker gutter; the text column itself keeps one left edge.' },
  { app: 'Project Manager', what: '1px vertical line between the task list and the detail pane.', why: 'Two independent regions of similar elevation; elevation alone was too faint to read.' },
  { app: 'Project Manager', what: 'Label colour dots and red overdue dates.', why: 'Colour here is data (label identity, urgency), not decoration.' },
  { app: 'Project Manager', what: 'Inset accent ring on the keyboard cursor row.', why: 'A keyboard position indicator is a focus affordance.' },
  { app: 'Document Editor', what: 'Task-list checkboxes use a ring; lists have a 1.5em / 30px marker gutter.', why: 'A checkbox needs a visible affordance; markers need a gutter.' },
  { app: 'Document Editor', what: 'A permanent Write / Source toggle in the topbar.', why: 'The brief asked for it; it is the one always-visible mode switch.' },
  { app: 'Analytics Dashboard', what: 'Chart gridlines use the divider colour.', why: 'Gridlines are data furniture needed to read values, not layout dividers.' },
  { app: 'Analytics Dashboard', what: 'Emerald/danger for deltas and chart series.', why: 'Good/bad and series identity are meaning-carrying colour.' },
  { app: 'File Manager', what: 'Thin accent inset ring on selected grid cards and drop targets.', why: 'Fills alone are weak in a dense grid; the state needs a boundary.' },
  { app: 'File Manager', what: 'Hue gradients as image thumbnails and previews.', why: 'Placeholder media content, not chrome.' },
  { app: 'File Manager', what: 'Header hairline in the list table.', why: 'Separates sticky column headers from scrolling rows.' },
  { app: 'Media Library', what: '2px accent ring on the currently playing tile.', why: 'Now-playing is state that must be findable in a wall of imagery.' },
  { app: 'Media Library', what: 'Lightbox backdrop is near-black, darker than the page.', why: 'The image has to dominate; the details drawer inside it is still lighter than its surround.' },
]

const AMBIGUITIES: Note[] = [
  { app: 'All', text: 'Hover-revealed controls conflict with touch. Rule used: hover/focus on pointer devices; one always-visible overflow button on touch and ≤820px.' },
  { app: 'AI Workspace', text: '"Esc stops focus" was read as blur; it deliberately does not stop generation, so it cannot bypass the Send→Stop guard.' },
  { app: 'Project Manager', text: 'No submenu primitive exists; the Filter control is a two-step popover (category, then options).' },
  { app: 'Document Editor', text: 'Rectangle Rule vs nested lists: nested lists are unsupported on purpose rather than indenting.' },
  { app: 'Analytics Dashboard', text: 'Borders vs density: panels are separated purely by elevation; whether that holds at higher density is for review.' },
  { app: 'File Manager', text: 'Hierarchy without indentation relies on breadcrumbs + a flat quick-access list; deep trees are harder to survey.' },
  { app: 'File Manager', text: 'The selection bar replaces the header from 2 selected items so a plain click does not swap the header.' },
  { app: 'Media Library', text: 'Principle 6 (few colours) vs rich imagery: imagery colour treated as content, chrome kept neutral + emerald.' },
]

export default function Principles() {
  return (
    <div className="pr-page scroll">
      <div className="pr-wrap">
        <a className="btn btn-ghost pr-back" href="#/lab"><Icon name="chevron-left" /> Laboratory</a>
        <h1 className="pr-h1">Principles applied</h1>
        <p className="muted pr-lede">Review notes for the six prototypes. These notes live outside the apps on purpose.</p>

        <section>
          <h2 className="eyebrow">How each principle was applied</h2>
          <dl className="pr-list">
            {APPLIED.map(p => (
              <div key={p.n} className="pr-row">
                <dt>{p.n}. {p.title}</dt>
                <dd className="muted">{p.how}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="eyebrow">Deliberate exceptions</h2>
          <dl className="pr-list">
            {EXCEPTIONS.map((e, i) => (
              <div key={i} className="pr-row">
                <dt>{e.app}</dt>
                <dd><span>{e.what}</span> <span className="muted">{e.why}</span></dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="eyebrow">Ambiguous or hard to apply</h2>
          <dl className="pr-list">
            {AMBIGUITIES.map((e, i) => (
              <div key={i} className="pr-row"><dt>{e.app}</dt><dd className="muted">{e.text}</dd></div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="eyebrow">Standalone routes</h2>
          <dl className="pr-list">
            {PROTOTYPES.map(p => (
              <div key={p.id} className="pr-row"><dt>{p.name}</dt><dd><a className="pr-link" href={`#/${p.id}`}>#/{p.id}</a></dd></div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
