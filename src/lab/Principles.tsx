import { PROTOTYPES } from '../registry'
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
  { n: 13, title: 'No em dashes', how: 'No em dash appears in any UI text or demo content. Empty table cells are left empty.' },
  { n: 14, title: 'No sidebar stacking', how: 'Phase 2 apps have no navigation sidebar at all. Left and right columns are content panes (watchlist, filters, order book, rail).' },
  { n: 15, title: 'Monochromatic selection and focus', how: 'Focus rings, input outlines, selected rows and cards, checkboxes, switches, tabs and active nav are neutral (--focus, --select). Emerald remains for the brand mark, the primary action of a view and meaningful state.' },
  { n: 16, title: 'Layout diversity', how: 'Each Phase 2 app has its own structure, chosen from its task and documented in docs/PHASE2_LAYOUTS.md.' },
  { n: 17, title: 'Subtle focus and selection', how: 'Keyboard focus is a 1.5px neutral ring (4.1 to 4.7:1 on the surfaces); input focus is a 1px ring; selection is a quiet fill. Measured by check CHK-018.' },
  { n: 18, title: 'Mobile navigation breathing room', how: 'Topbars are 56px with 40px targets; wrapped bars get 12px padding and row gaps; secondary controls moved to menus or sheets. Desktop layouts unchanged.' },
  { n: 19, title: 'No washed-out destructive buttons', how: '.btn-danger is solid with white text and a clear verb plus icon. Dense row actions use a neutral button. Destructive menu items keep danger text with an icon, last after a separator.' },
  { n: 20, title: 'No decorative placeholder identity', how: 'Initials circles removed; plain names and metadata instead. Social uses graphic avatar art with no letters. Avatar is opt-in and renders only real imagery or explicit initials.' },
]

const PHASE1_CHANGES = [
  'Focus ring, text input outline, ::selection, caret: emerald to neutral (tokens --focus, --select).',
  'Selected rows and cards in Projects, Files, Documents, plus list-row selection: emerald tint to neutral fill; keyboard cursor and drop-target rings to neutral.',
  'Checkbox, switch, toggled icon button, menu check marks, in-menu create item: emerald to neutral.',
  'Em dashes removed from file names and the empty size cell in Files.',
  'Dialog inputs, secondary buttons and tabs now sit one step lighter than the dialog surface (they were invisible on it).',
  'Kept emerald: brand mark, primary buttons, Send, spinner, starred and favourite markers, analytics and executive deltas, done status.',
]

const LAYOUTS: { app: string; layout: string }[] = [
  { app: 'Executive Dashboard', layout: 'Top bar over a full-width 12-column card grid. Activity is a grid cell.' },
  { app: 'Chess Club', layout: 'Public site: sticky top nav, scrolling bands, playable board as the hero beside its game panel.' },
  { app: 'Social Media', layout: 'One centred 600px feed column, quiet right rail on wide screens, bottom tab bar on mobile.' },
  { app: 'Trading Platform', layout: 'Terminal grid: ticker strip, watchlist, chart with order entry, order book and trades, tabbed positions panel.' },
  { app: 'E-commerce Store', layout: 'Header with category nav; grid beside a filter pane; product page; cart slide-over; focused checkout.' },
  { app: 'Travel Booking', layout: 'Hero search, results with a horizontal filter bar, detail page, stepped reservation with a summary.' },
]

const TENSIONS: Note[] = [
  { app: 'Executive, Trading', text: 'Elevation without borders is faint between --s0 and --s1; cards use an inset top highlight. Principle 6 vs dense financial data: series, severity and candle colours are the few hues the data needs, with signs and arrows alongside.' },
  { app: 'Trading', text: 'Principle 10 vs a terminal that needs many controls visible at once. Principle 5 vs financial completeness: every column is kept, mobile turns tables into cards.' },
  { app: 'Social', text: 'Principle 8 (familiar avatar gutter) vs Principle 11 (no indentation): the Rectangle Rule won, so media and actions align with the author row. Dividers between posts were kept for ambiguity.' },
  { app: 'Social, Chess, Store', text: 'Where the single emerald primary goes is ambiguous on long pages with many actions. Used one per view in the chrome and primaries inside dialogs; Social uses a neutral inverted submit.' },
  { app: 'Store, Travel', text: 'Hairline dividers between repeated rows (cart lines, review rows, price totals) were kept because spacing alone was ambiguous.' },
  { app: 'Chess', text: 'Dark pieces and a warm grey board are content colour; highlights stay neutral. Check uses --danger as meaningful state.' },
  { app: 'Social, Store, Travel', text: 'Hover-only controls (quick add, heart, reaction picker) are always visible in compact form on touch.' },
  { app: 'Shared', text: 'Principle 14 and mobile: a collapsed category menu or drawer is allowed because it replaces inline navigation, it does not sit beside it.' },
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
  { app: 'Chess Club', what: 'Danger-coloured glow on a king in check.', why: 'Check is a meaningful state.' },
  { app: 'Chess Club', what: 'Tabs inside dialogs sit slightly darker than their parent.', why: 'No neutral token kept them legible otherwise (fixed shared-wide afterwards).' },
  { app: 'Trading', what: 'Emerald and danger on candles, depth bars, buy and sell submit; a warm line for the second moving average.', why: 'Market movement is the semantic colour the data needs; a second indicator needs a distinct hue.' },
  { app: 'Trading', what: 'Ticker strip scrolls continuously (pauses on hover, static for reduced motion).', why: 'A movers strip is conventional and scannable.' },
  { app: 'Executive', what: 'Warning amber for severity 2 incidents and dashed plan lines.', why: 'Severity needs more than two states; also written as text.' },
  { app: 'Social', what: 'Notifications keep an icon column; composer keeps the avatar at the left.', why: 'Scanning notification types; inputs are conventionally led by the avatar.' },
  { app: 'Social, Store', what: 'Hairline dividers between posts, cart lines and checkout steps.', why: 'Repeated structures are ambiguous with spacing alone.' },
  { app: 'Store', what: 'A small Sold out label on product images.', why: 'Functional stock state that must be visible in a grid.' },
  { app: 'Travel', what: 'Language menu only switches date format; Add to trips stores the booking.', why: 'A non-translating language switcher would be fake; the storage step follows the brief.' },
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
    <div className="pr-page">
      <div className="pr-wrap">
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
          <h2 className="eyebrow">Phase 2 layouts</h2>
          <dl className="pr-list">
            {LAYOUTS.map(l => (
              <div key={l.app} className="pr-row"><dt>{l.app}</dt><dd className="muted">{l.layout}</dd></div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="eyebrow">Phase 1 changes for neutral selection and focus</h2>
          <dl className="pr-list">
            {PHASE1_CHANGES.map((c, i) => (
              <div key={i} className="pr-row"><dt>Change {i + 1}</dt><dd className="muted">{c}</dd></div>
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
          <h2 className="eyebrow">Phase 2 tensions</h2>
          <dl className="pr-list">
            {TENSIONS.map((e, i) => (
              <div key={i} className="pr-row"><dt>{e.app}</dt><dd className="muted">{e.text}</dd></div>
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
          <h2 className="eyebrow">Guidance galleries</h2>
          <dl className="pr-list">
            <div className="pr-row"><dt>Anti-patterns</dt><dd><a className="pr-link" href="#/guidance/antipatterns">#/guidance/antipatterns</a></dd></div>
            <div className="pr-row"><dt>Icons</dt><dd><a className="pr-link" href="#/guidance/icons">#/guidance/icons</a></dd></div>
            <div className="pr-row"><dt>Presets</dt><dd><a className="pr-link" href="#/guidance/presets">#/guidance/presets</a></dd></div>
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
