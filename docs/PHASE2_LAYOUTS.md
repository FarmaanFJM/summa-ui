# Phase 2: Layout decisions (defined before implementation)

Phase 1 apps all used a navigation sidebar plus a main panel. That suited them, but Principle 16 says it must not be the default. Each Phase 2 app picks its layout from its task. Shared: tokens, base.css, icons, Menu, Dropdown, Dialog, Tabs, Button, Tag, Avatar.

| App | Primary layout | Why it suits the task |
| --- | --- | --- |
| Executive Dashboard | Top bar (brand, section tabs, period, user) over a full-width 12-column card grid. No sidebar. | Executives scan one wide surface. A grid lets KPIs, charts, operations and activity share a screen with equal reach; the activity feed is a grid cell, not a navigation column. Few top-level sections fit in tabs. |
| Chess Club Website | Public site: sticky top nav, then a vertically scrolling page of full-width bands. A large playable board is the hero, with the game panel beside it. | Public sites are read top to bottom and are linked by section. The board is the product's centre of gravity, so it leads the page and gets most of the width. |
| Social Media Website | Single centred feed column (about 600px) with a top bar and a quiet right rail (trending, suggestions) on wide screens only. Profile and notifications replace the feed in the same column or open as a panel. Bottom tab bar on mobile. | Content-first reading wants one narrow, high-contrast column. Secondary lists are context, so they sit in a rail that disappears first. No left navigation exists to stack. |
| Trading Platform | Terminal grid: ticker strip on top; watchlist, chart + order entry, order book + trades in columns; positions and orders as a bottom tabbed panel. No navigation sidebar. | Traders need many live regions visible at once and compare them. Each column is a content pane (not navigation), allowed by Principle 14. Density and fixed regions beat scrolling. |
| E-commerce Store | Header with search and category links over a page body: product grid with a filter column beside it (content pane), product detail as its own page, cart as a right slide-over, checkout as a focused single column without site navigation. | Shopping is browse, narrow, decide, commit. Filters belong beside the results they change; checkout removes distractions to protect completion. |
| Travel Booking Website | Hero search form on a landing page, then a results page with a horizontal filter bar over card results, a detail page, and a stepped single-column reservation flow with a summary beside it. | Travel is form-led. Dates and destination come first, filters refine a long list, and the booking flow is a linear form where a persistent summary reassures. |

## Rules for these apps
- No navigation sidebar anywhere in Phase 2. Any left column is a content pane (watchlist, filters).
- Neutral selection and focus (Principle 15). Emerald only for brand, primary actions and meaning. Positive/negative market and KPI movement keeps semantic colour.
- No em dashes in any UI text (Principle 13), including demo content.
- Responsive by re-arrangement: grids collapse to stacked regions, filters to a sheet, nav to a menu or bottom bar.
