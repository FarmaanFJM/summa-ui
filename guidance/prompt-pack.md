# Summa-UI design guidance (pack v0.1.0)

Follow these rules when producing or changing any user interface. They are defaults: break one only for a concrete usability reason and state the reason. Do not require any particular framework or library; the CSS tokens and class presets work with plain HTML.

## Principles

### P01 No Borders Within Borders
Do not place bordered elements inside other bordered elements.
- Express hierarchy with background elevation, spacing, typography and subtle section dividers.
- A border marks a meaningful boundary, not the existence of an element.
- Inputs and rows inside panels are filled surfaces, not outlined boxes.
- Exceptions: A single outline on a floating overlay (menu, dialog) is allowed. Checkbox and radio boxes need a visible boundary.

### P02 Dark Themes Move From Dark to Light
In dark themes each elevated surface is lighter than its parent.
- Page is darkest (--s0), main panels --s1, cards and inputs --s2, selected and raised --s3, overlays --s4.
- Never make a nested or elevated surface darker than its parent.
- Elevation should read without borders.
- Exceptions: A media lightbox backdrop may be darker than the page so the image dominates.

### P03 No Arbitrary Left-Border Decoration
Do not use a thicker left border to make an element stand out.
- Do not use a thick left border for cards, alerts, active items, info panels, categories or emphasis.
- Use fill, type weight or spacing for emphasis instead.
- Exceptions: The product or user explicitly requires it. It has an established semantic meaning in that interface (blockquote, diff gutter).

### P04 Tags Must Be Functional, Not Decorative
Tags exist only when users recognize, filter, group or interact with a category or state.
- Default tag: one background color, no border, optional icon, short text.
- Never create status tags for information that need not be shown (for example 'Automatically saved').
- Do not scatter tags to add visual variety.
- Exceptions: Label tags that filter or group tasks; a failure state that needs attention.

### P05 Information Must Earn Its Place
Show the minimum information needed for the current task.
- Do not explain familiar concepts because space is available.
- Prefer familiar patterns, clear naming, predictable position, progressive disclosure and contextual help over permanent explanation.
- A small learning curve beats permanent information overload.
- Exceptions: Legal or safety text that must be shown. A one-time first-use hint that can be dismissed.

### P06 Use as Few Colors as Possible
Color is a limited communication resource.
- Rely on neutral surfaces, typography, spacing, shape and hierarchy.
- Accent colors communicate meaning, interaction, identity or state.
- If removing a color does not reduce comprehension, remove it.
- Exceptions: Data visualisation, media imagery and market movement legitimately need hues.

### P07 One Visual Language
All Summa products share one design language.
- Share spacing logic, typography, surfaces, interaction states, iconography, corner treatment, controls, menus, navigation patterns and motion.
- Theme: matte, restrained, slightly glassy, reusable, consistent.
- Applications differ in content and workflow, not in design language.

### P08 Familiarity Is a Feature
Prefer established interaction conventions.
- Do not make users relearn dropdowns, menus, tabs, navigation, search, dialogs, selection, keyboard behavior or editor interactions.
- Innovate on workflow, not on controls users already understand.

### P09 Simplicity Beats Cleverness
Prefer the simpler design when two solve the problem.
- Do not add controls, containers, states, visual treatments or terminology without meaningful user value.
- Complexity requires justification; simplicity does not.

### P10 Minimalism Over Prevalence
Do not show every possible action at once.
- Prefer contextual and dynamic controls.
- Put 'Create' inside the dropdown where it becomes relevant, not beside it.
- Show Send before generation and Stop during it, never both.
- When a control turns into its opposite (Send to Stop), add an interaction guard against accidental double clicks.
- Exceptions: Two actions that can genuinely be used at the same moment may both be visible.

### P11 The Rectangle Rule
Organize information in clean rectangular regions.
- Do not use indentation as the primary hierarchy mechanism.
- Express hierarchy with typography, text color, weight, size and spacing; body content starts at the same left edge as its heading.
- Prefer flat lists, breadcrumbs and a single-level sidebar to indented trees.
- Exceptions: List marker gutters and table cell padding are not indentation.

### P12 Dividers Are Secondary Structure
Use subtle horizontal dividers only to support an existing hierarchy.
- Prefer spacing first.
- Add a divider only when spacing alone leaves two regions ambiguous.
- Avoid excessive divider lines.
- Exceptions: Repeated rows (feed posts, cart lines, review rows) may use one hairline each.

### P13 No Em Dashes
No em dashes in user-facing interface copy.
- Use commas, colons, periods, parentheses or a rewritten sentence.
- Applies to headings, descriptions, labels, notifications, empty states and demo content.
- Leave empty table cells empty instead of filling them with a dash.

### P14 No Sidebar Stacking
Never answer sidebar navigation with another full navigation sidebar beside it.
- Secondary context: replace the sidebar content with a back chevron, or split the sidebar into upper and lower regions, or use the primary content region for details.
- Editors, inspectors, order books and detail panels are content panes and are allowed.
- The rule targets redundant navigation structures only.
- Exceptions: Content panes (watchlist, filters, inspectors) are not navigation sidebars.

### P15 Monochromatic Selection and Focus
Ordinary selection, hover, focus and active navigation are neutral.
- Do not use the emerald accent for focus rings, selected cards, selected nav entries or text input outlines.
- Prefer neutral surface changes or neutral outlines.
- Keep accessible focus visibility.
- Keep semantic colors where they carry meaning (market movement, destructive actions).
- Use emerald sparingly: brand, the primary action of a view, meaningful state.
- Exceptions: Semantic colors for trading movement, KPI deltas and destructive actions.

### P16 Layout Diversity
No universal left-sidebar/right-content structure.
- Choose layout from the task, user expectations and information architecture.
- Support dashboards, public sites, feeds, dense data workspaces, catalogs and form-based experiences.
- Variety comes from the task, never from novelty; familiarity remains essential.

### P17 Subtle Focus and Selection
Neutral focus and selection must also be light in visual weight.
- Avoid thick, high-contrast or dominant outlines for ordinary input focus, selected content and active controls.
- Use 1px to 1.5px neutral rings and quiet fills.
- Keyboard focus indicators must still reach at least 3:1 contrast against their surface.
- Invisible focus is not tasteful minimalism.
- Exceptions: Windows high-contrast or forced-colors modes should use system focus styles.

### P18 Mobile Navigation Breathing Room
Do not compress navigation, headings, filters and actions into dense vertical stacks on mobile.
- Leave clear spacing between navigation and primary content.
- Do not trade readability and rhythm for more information above the fold.
- Scrolling is preferable to compression.
- Move secondary controls into a sheet or menu instead of stacking rows.

### P19 No Washed-Out Destructive Buttons
Destructive buttons are solid and readable, or neutral.
- Avoid translucent, low-contrast tinted ghost buttons, especially pale red text on dark red tint.
- Use a restrained solid destructive button with readable text, or a neutral treatment when appropriate.
- Do not rely on color alone: use a clear verb and an icon where helpful.
- Exceptions: Destructive menu items use danger-colored text plus an icon and sit last after a separator.

### P20 No Decorative Placeholder Identity
Do not invent avatars when no meaningful avatar exists.
- No circular initials, generated placeholder avatars or artificial profile-picture indicators by default.
- Plain names and relevant metadata are often enough.
- Introduce an avatar only when identity imagery helps distinguish entities or represents real content.
- Exceptions: Social platforms where users have real profile images.

### P21 Remove Before Adding
Meta-principle: when an interface feels unclear, subtract first.
- Ask whether something can be removed, merged, relocated, hidden contextually, represented through hierarchy or revealed only when needed before adding a component.

### P22 Exception Rule
Principles are defaults, not absolute prohibitions.
- A principle may be broken only for a concrete usability requirement, when the alternative interacts worse, deliberately, and with an explainable reason.
- 'Because it looks nicer' is not sufficient justification.
- Document every exception.

## Tokens

Use CSS custom properties from tokens.css. Roles:

- --s0 (surface): Page background. Darkest layer.
- --s1 (surface): Main panels and cards on the page.
- --s2 (surface): Inputs, hovered rows, nested cards on a panel.
- --s3 (surface): Raised controls, selected rows (neutral), dialogs.
- --s4 (surface): Menus, popovers, toasts, pressed states.
- --line (border): The only divider and hairline color.
- --line-strong (border): Single outline on floating overlays.
- --text (text): Primary text.
- --text-2 (text): Secondary text, headings that are muted.
- --text-3 (text): Tertiary text, placeholders, disabled.
- --accent (accent): Brand and the single primary action of a view. Not for focus or selection.
- --accent-hover (accent): Hover of the primary action.
- --accent-ink (accent): Text on accent fills.
- --accent-soft (accent): Meaningful state tint only (never ordinary selection).
- --accent-text (accent): Accent colored text for meaningful state (for example positive delta).
- --focus (state): Keyboard focus ring and input outline. Neutral, 1px to 1.5px, at least 3:1 contrast.
- --select (state): Selected row, card or item. Quiet neutral fill.
- --select-strong (state): Stronger neutral fill for pressed or range selection.
- --danger (semantic): Danger text and icons, destructive menu items, negative movement.
- --danger-soft (semantic): Subtle danger surface for non-button banners. Never for buttons.
- --danger-solid (semantic): Destructive button background (solid).
- --danger-solid-hover (semantic): Destructive button hover.
- --danger-ink (semantic): Text on destructive solid fills.
- --warn (semantic): Warning icons and amber data series.

## Icons

Use only the curated 164 icons (Lucide 1.62.0, ISC), 24px grid, stroke 1.75. Rules:

- Use only these icons. Never mix in another icon family or hand-drawn paths.
- One stroke weight everywhere: 1.75 on the 24px grid. Do not restyle per icon.
- Render at 14, 16, 18 or 20px. 16 is the default; use 20 for prominent controls.
- Pair the icon with a text label when the action is ambiguous or destructive.
- Icon-only controls need aria-label (and a title tooltip). Decorative icons need aria-hidden="true".
- Icons inherit currentColor. Do not tint icons for decoration; colour only for meaning (state, trading movement, destructive).
- Filled variants are for state only: play, pause, stop, active like or favourite. Never fill an icon for emphasis.
- Do not use an icon beside every label. If removing it loses no meaning, remove it.
- Need a new icon? Add it to the catalog from Lucide, with a stable Summa name; never rename an existing name.

Names: plus, minus, x, check, search, copy, clipboard, pencil, trash, refresh, undo, redo, download, upload, share, external, more-h, more-v, filter, sort, sliders, move, scissors, archive, save, send, zap, sparkle, maximize, minimize, expand, chevron-down, chevron-up, chevron-left, chevron-right, chevrons-left, chevrons-right, arrow-up, arrow-down, arrow-left, arrow-right, arrow-up-right, arrow-down-right, corner-down-left, menu, home, panel, compass, log-in, log-out, link, hash, at, info, circle-check, circle-x, circle-alert, warning, help, circle, circle-dot, circle-half, circle-dashed, loader, bell, bell-off, flag, ban, shield, eye, eye-off, lock, unlock, heart, star, thumbs-up, bold, italic, underline, strike, code, heading, quote, list, list-ordered, list-check, table, align-left, align-center, align-right, type, paperclip, mic, folder, folder-open, file, file-text, file-image, image, drive, cloud, inbox, play, pause, stop, skip-back, skip-forward, shuffle, repeat, volume, volume-off, music, film, message, message-plus, mail, phone, bookmark, repost, bag, cart, credit-card, truck, package, store, tag, trending-up, trending-down, dollar, wallet, candles, user, users, user-plus, settings, key, globe, map-pin, sun, moon, command, trophy, bar-chart, line-chart, pie-chart, activity, grid, rows, columns, layers, layout, sidebar-right, clock, calendar, history, timer, plane, bed, terminal, wifi, monitor, smartphone, bug, power

## Checks

Objective checks an evaluator can run (see checks/rules.json):

- CHK-001 [objective, error] Bordered container inside bordered container (P01, P12)
- CHK-002 [objective, error] Thick left border on non-quote elements (P03)
- CHK-003 [objective, error] Translucent tinted destructive button (P19, P10)
- CHK-004 [objective, error] Accent color used for focus, selection or input outline (P15, P17)
- CHK-005 [heuristic, warning] Decorative pill tags and status pills (P04)
- CHK-006 [objective, error] Placeholder initials avatar (P20)
- CHK-007 [heuristic, warning] Excessive mobile vertical density (P18)
- CHK-008 [objective, error] Send and Stop visible together (P10)
- CHK-009 [heuristic, warning] Create button adjacent to a selection dropdown (P10, P08)
- CHK-010 [heuristic, warning] Unnecessary explanatory copy (P05)
- CHK-011 [objective, error] More than one navigation sidebar (P14, P16)
- CHK-012 [heuristic, warning] Accent color overuse (P06, P15)
- CHK-013 [objective, error] Decorative gradients and glow (P06, P07)
- CHK-014 [heuristic, warning] Indentation used for hierarchy (P11)
- CHK-015 [heuristic, warning] Redundant card containers (P09, P01)
- CHK-016 [heuristic, warning] Excessive visible controls (P10, P05, P18)
- CHK-017 [objective, error] Em dash in user-facing copy (P13)
- CHK-018 [objective, error] Keyboard focus indicator contrast (P17, P15)
- CHK-019 [objective, error] Destructive button text contrast (P19)
- CHK-020 [objective, error] Touch target size on mobile (P18)
- CHK-021 [objective, error] Horizontal overflow (P18)
- CHK-022 [objective, error] Focus outline removed without replacement (P17, P15)

Needs human judgment:

- HJ-001 Does the screen feel calm? Is anything competing for attention that should not?
- HJ-002 Is hierarchy readable without borders, using elevation, spacing and type?
- HJ-003 Do selection and focus read clearly but quietly (not dominant, not invisible)?
- HJ-004 On mobile, does the layout breathe, or does it feel compressed? Would more scrolling help?
- HJ-005 Does the layout suit the task and match user expectations for this kind of product?
- HJ-006 Are copy and labels natural, concise and free of needless explanation?
- HJ-007 Do destructive actions look serious and readable, and differ from neutral ones without relying on color alone?
- HJ-008 Does every identity element (avatar, initials, picture) represent real content?
- HJ-009 Do all screens feel like one product family (spacing, controls, corners, motion)?
- HJ-010 Are semantic colors (movement, error, success) used where meaning requires them and nowhere else?
