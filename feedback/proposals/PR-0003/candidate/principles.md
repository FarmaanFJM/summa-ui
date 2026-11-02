# Candidate principles P27 to P31 (DRAFT, not approved)

Text for `PRINCIPLES.md`, in its voice and format. Numbering follows the candidate list from PR-0002 (P23 to P26); the owner may renumber or insert them before the Meta-Principle. Evidence: FB-0047 to FB-0051 (CaissaTrainer application layout pass). Machine form: `principles.json` next to this file. Nothing here is approved and nothing in `guidance/` changed.

## 27. Application Continuity

Consistency is not only reusing the same buttons, cards, colours and tokens. It is structural. When a person moves between the parts of one application, it must still feel like one application, never like a different website that happened to load.

- Persistent navigation stays put and keeps its shape. A destination changes the content region, not the frame around it.
- The content region starts in a predictable place. Pages of one family share one horizontal origin, one top offset and one maximum width. A page does not start 100px further left or right than its neighbour.
- Page titles and primary content follow predictable placement. The title is in the same corner, in the same type, with the same actions placement and the same spacing below it.
- Secondary tools appear in predictable regions: a trail above the title, page actions on the title line, supporting content in one optional side column that drops below the body when space runs out.
- Similar pages use similar page structures, the same surface levels and the same rhythm between sections.
- This is not "make every page identical". Applications have a small family of intentional shells, and every page belongs to one of them:
  1. **Content page** for catalogues, hubs, lists, settings and account pages.
  2. **Reading page** for articles, books, wikis and courses: a narrower measure, same origin and frame.
  3. **Dense tool** for pages where the content dominates the window and article margins would waste it.
  4. **Primary-object workspace** (principle 31) for pages built around one dominant interactive object.
  A new page picks a shell. It does not invent a fifth.
- A page that changes shell while it is open (a lobby that becomes a game) says so, and the application frame follows. It never keeps the wrong shell for one of its states.
- Hierarchy and local navigation stay inside the content region. A secondary context never adds a second full height sidebar beside the first (principle 14); a back or breadcrumb trail is one quiet component reused everywhere, not a bespoke button per page.
- Surfaces have roles, used the same way on every page: application background, navigation, content surface, interactive card, elevated popover, selected state. Do not alternate between no surface, a darker surface, a bordered panel and a rule for the same job.

## 28. One Home for Every Control

A function has one obvious place in the interface. Do not repeat it in a second control unless there is a concrete usability reason, and state the reason.

- If a direct manipulation control exists (a resize handle, a zoom control, a slider), its commands do not also appear in a settings menu.
- A menu holds preferences about the thing it is attached to, not a copy of controls that live elsewhere and not unrelated commands. Group related items and keep the menu narrow.
- Navigation controls (previous, next, undo, redo) appear once, next to the content they move through.
- A deliberate duplicate is allowed when one of the two is unreachable for a class of users (a keyboard shortcut for a pointer control, a touch fallback for hover). Name the reason in the code or the documentation.

## 29. Labels Are Not Clutter When They Resolve Ambiguity

Principle 5 removes information that adds no understanding. It does not remove labels that prevent a wrong reading.

- A bare value whose meaning is not obvious from its position needs a concise label: "Depth 16" and "Lines 2", not two unlabeled numbers.
- Do not remove a label to save space. Make the arrangement more compact (two labelled controls in one row) instead.
- Remove text that only restates what the control, the layout or the heading already says ("Saves automatically", "Your private notes", a status line for the absence of something).
- Test: if removing the text leaves a reasonable person unsure what a value or control means, it is a label and stays. If it leaves them unaffected, it is clutter and goes.

## 30. Hierarchy Before Separators

Structure comes from layout, spacing, typography, grouping and surface contrast. A horizontal rule is a last resort, not the default between regions, rows and groups.

- Try spacing first (principle 12), then a heading, then a surface step. Add a rule only when those leave two regions ambiguous.
- A page with a rule under every heading and between every row has a weak hierarchy that the rules are hiding. Fix the hierarchy.
- Repeated rows are cards or plain rows separated by space, not a stack of lines.
- A header that needs a rule to separate it from the body is a sign the body has no surface or the spacing is too small.

## 31. Primary-Object Layouts

When a page has one dominant interactive object, such as a chessboard, a canvas, a map or a document page, design the workspace around that object and let it grow toward the edges of the window.

- Nothing is permanently placed above or below the object that reduces its available scaling area: no header, status bar, banner or toolbar. Status that nothing else reports lives beside the object, in an adjacent panel or as a temporary message.
- Controls about the object (resize, settings) float beside it and appear on hover or focus. They have no container panel and take no permanent space. Devices without hover show them, because touch has no hover.
- Information that belongs to the object's edge (an evaluation bar, a ruler) is placed against that edge, sized with the object, and is absent, not blank, when it is off.
- Side panels have a clear vertical hierarchy: state and configuration at the top, the main data in the middle taking the spare height, the one primary action at the foot.
- A failure or fallback is reported in the control that can act on it or in a temporary message, never in a permanent strip over the object.
- Exception: when the task itself needs information next to the object to be performed (the clocks and players of a live game, the answer controls of a drill), that information may sit above or below it. Say so.
