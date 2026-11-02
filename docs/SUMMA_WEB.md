# Summa-UI Web

Status: draft contribution, not approved guidance. It formalizes the website discipline found while redesigning CaissaTrainer (`FB-0052` to `FB-0057`). Nothing in `guidance/` or `PRINCIPLES.md` changed. The candidate rules (W1 to W10) travel in `feedback/proposals/PR-0004`; only the owner can approve them into a later release. Implementing them in CaissaTrainer is a provisional use of a draft, not an approval of any rule.

## Profiles

Summa-UI has one philosophy and, if the owner approves, two profiles:

| | Summa-UI Desktop (approved v0.1.0) | Summa-UI Web (this draft) |
| --- | --- | --- |
| For | compact productivity tools, dense workspaces | content websites: catalogues, libraries, editorial and learning products |
| Shared foundation | surfaces `--s0` to `--s4`, neutral focus and selection, charcoal, emerald as action accent, no em dashes, no borders in borders, remove before adding | the same, unchanged |
| Adds | none | editorial voice, warm palette, display type scale, purpose built cards, structured asymmetry, brand rules |

A Web rule never loosens a Desktop rule inside a dense tool. A dense workspace (an analysis board, a data table, an editor) stays Desktop even inside a Web product: no display type, no feature cards, no warm inserts in the way of the work.

## Relationship to PR-0003

Candidate P27 to P31 (`feedback/proposals/PR-0003`) are drafts and are not approved. Web builds on them and does not restate them: P27 (application continuity, the shell family) is the frame inside which W1 (structured asymmetry) composes a content page; P28 to P30 apply unchanged; P31 (primary object layouts) is why the analysis workspace is not a Web page. If PR-0003 is rejected or changed, W1 keeps its own wording of the continuity requirement (it names it) so nothing here silently depends on it.

## W1 Structured asymmetry

One underlying column grid; deliberately unequal compositions on it. Cards differ in width, height, visual weight, surface, type hierarchy, image proportion and density, and every edge still lands on the grid. Rules:

- Asymmetry is intentional: a decision about what matters most, never random gaps or off grid alignment.
- It is not a regular grid with different sized cards in it. A contrasting feature (an editorial insert, a featured recommendation) occupies part of the page, and the surrounding content flows beside it and then reclaims the width beneath it. Do not reserve a whole empty column for a small insert (use row spanning, not a fixed side column).
- Reading order stays sensible in the DOM and for assistive technology; the desktop composition has a deliberate mobile order, not a collapsed column.
- Applies to catalogue, hub and landing pages. Never to a primary object workspace or a dense tool.

## W2 Rectangular surfaces

Square or subtly rounded corners (2px to 8px); no pills as containers (functional tags stay as P04 says). Hierarchy by surface step, type and whitespace, with the P12 and candidate P30 stance on rules. A card is purpose built (a module card, a book, a game, an article, a feature); do not render every kind of content in one generic card. Do not build one component with dozens of flags: share behaviour, allow compositional difference.

## W3 Colour: charcoal, emerald, warm

Charcoal stays the foundation. Emerald means action, active interaction and progress. Warm (cream, parchment, caramel, wood) means editorial, educational and historical material, featured recommendations and contrasting surfaces. They are not interchangeable and not every card is coloured. A warm surface is an insert in a charcoal page, never the page. Text on a warm surface is ink, and focus on it is a dark ring (W6). This needs an explicit decision against P06 (see `conflicts-and-decisions.md`).

Reference values (derived from the Figma Make Train page, contrast measured): cream `#e7dcc4`, parchment `#d8c9a8`, caramel `#ba9569`, wood `#806343` (3.4:1 on parchment, decoration and large type only), ink `#231b12` (10.4:1 on parchment), ink 2 `#5a4630` (5.5:1), light paper `#ece8df`, warm focus `rgba(35, 27, 18, 0.75)`.

## W4 Typography

Two faces, self hosted, no third party font fetch. A functional sans (Inter) for navigation, controls, tools and body. An editorial serif (Playfair Display) for the wordmark, editorial display headings, feature cards and educational or historical content; never in a dense tool. Scale roles: display, title, section, card title, body, support, metadata, eyebrow (small uppercase tracked label, emerald or warm), editorial display, editorial card, long form reading. Reference tokens: `candidate/tokens-web.css`. Tight tracking at display sizes, balanced wrapping on titles, no more than two families and few weights.

## W5 Action hierarchy

Primary (solid emerald, one dominant action per region), secondary (raised neutral), tertiary (quiet text action with an arrow for link like steps), ink (solid dark action for light or warm surfaces), outline, icon only, destructive (solid, P19), branded integration (a third party identity, W8). An action looks like what it is; not every action is a charcoal rectangle with a chevron and not every action is emerald.

## W6 Focus and hover

Restrained default borders, subtle hover (a surface step), pointer interaction never draws a large ring. Keyboard focus is `:focus-visible`, 1px to 1.5px, at least 3:1 against the surface it sits on, so a light neutral ring on charcoal and a dark ring on a warm surface. No thick or emerald rings, glows, expanding borders or nested outlines. This is P15 and P17 with the warm surface case added.

## W7 Selection

A selected navigation item or card is a subtle surface step and heavier type. No coloured curved or straight left stripe. (Settles the P03 reading for selection.)

## W8 Third party identity

A third party entry (an integration, a data source) may use a light contrasting surface and the third party's mark where its terms permit. No decorative label that only says it is third party, no wording that implies partnership, endorsement or official status without one, one action that opens the integration. The mark is shown as supplied.

## W9 Imagery

Imagery is real and meaningful to the content (a board position, a cover, a typographic cover), never unrelated stock photography. Content that does not exist is not fabricated to make an empty state look full; an empty state is a deliberate, consistent surface.

## W10 Responsive composition

Define desktop, tablet and mobile deliberately. Mobile order puts main content before supporting editorial features where that serves the task. Local navigation becomes a compact selector. Touch targets follow the approved rule. No horizontal overflow.

## Brand lockup

A product wordmark is a deliberate composition: here Caissa in bold emerald sans and Trainer in a flowing parchment italic serif, one continuous word with no space, sized and kerned against each other, beside the pictorial mark. The mark is supplied artwork resized only. The two colour treatment is a brand element, not a heading style. Compact presentations show the mark alone. A favicon may use a variant derived from the supplied pixels (here the knight without the arcs); no other variants of the mark.

## Reference implementation

CaissaTrainer `frontend/src/assets/styles/base/web.css`, `components/brand/BrandLockup.vue`, `AppPage`, `LinkCardComponent`, the Train and Education pages, measured by `frontend/e2e/applicationShell.mjs` and the Web visual checks.
