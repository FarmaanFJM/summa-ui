/* Generated from src/ui/workspaceGeometry.ts (types stripped, wrapped as a classic script so examples work from file://).
   Regenerate: node scripts/build-workspace-candidate.mjs. scripts/test-workspace.mjs checks it matches the TypeScript. */
(function (root) {
/**
 * Workspace geometry: pure arithmetic, no DOM, no framework.
 * Reference implementation of docs/WORKSPACE_PATTERN.md (a framework-neutral port of
 * the CaissaTrainer model, phase 3 geometry; same API and constants, so a Vue, React or plain app can share the numbers).
 * Erasable TypeScript only (no enums), so `node` can run it directly and a tool can strip it to JS.
 *
 * A workspace is a primary region (a square: an image, a canvas, a preview) flanked by two
 * optional information panels. This module decides how much room each part
 * gets from the space that is really available.
 *
 * Rules, in priority order:
 *  1. The primary region is the workspace. It stays square, centered in the
 *     available width, and is never squeezed below PRIMARY_MIN.
 *  2. Panels yield before the primary region does. The responsive default is
 *     sized against the panels' MINIMUM widths, so the region gets its share
 *     first; panels then grow into whatever is left, up to their preferred
 *     width. A panel that cannot dock at its minimum leaves the layout and
 *     becomes an on-demand drawer. It is never destroyed.
 *  3. Only panels that are open and docked take width. A hidden panel, or one that is a
 *     drawer, reserves nothing, and the region plus its open panels are centered as one
 *     group in the available width (with one panel the region sits off the window center,
 *     in the middle of its own area, instead of beside an empty invisible column).
 *  4. The optional (left) panel yields to a drawer before the layout restacks, so opening it
 *     never shrinks the region below COMFORT_MIN. The other panel (the one the person works
 *     against, for example session information) is the last to give way.
 *  5. A narrow workspace stacks: primary region full width, panels below. In a portrait window it
 *     also stacks when stacking gives a much bigger region (a tablet held upright).
 *  6. A user's chosen size is a preference, not a measurement. It is clamped
 *     for display and never rewritten because the window got smaller.
 *  7. A control rail attached to the region (resize handle, options menu) takes `rail` px
 *     beside it, counted on BOTH sides so the region stays centered in its own column.
 *     Beside panels only; stacked it sits below.
 *
 * Chess Zen Mode's layout (MIT) was studied for where it places a central region between its side areas.
 * This code is independent; only that idea is shared.
 */

                            
                                        
                      
                                                                               
                
 

                                                                  

                                 
                                                       
                  
                                                        
                   
                                       
                    
                                                             
                
       
                                                                                    
                                                                                      
                                                                  
       
                  
                                                                                                        
                    
                           
                            
                      
                       
                                                                                    
                             
 

                                    
                             
                                                            
                 
                    
                    
                        
                        
                         
                                                                                               
                      
                       
                                                                                   
                    
                                                                                                                                   
                 
                   
                   
                       
 

/** Narrowest primary region a user can pick, and the smallest the layout will ever fall back to. */
const PRIMARY_MIN = 280;
/** The optional left panel only docks beside a primary region at least this big (rail margin extra); below it, it is a drawer. */
const COMFORT_MIN = 400;
/** Hard floor when the space is even smaller than PRIMARY_MIN (the page then scrolls). */
const PRIMARY_FLOOR = 240;
/** Largest responsive default; "medium" is deliberately below the maximum. */
const DEFAULT_CAP = 720;
/** Smallest responsive default on a roomy screen. */
const DEFAULT_FLOOR = 320;
/** The default occupies this share of the largest size that fits beside the panels. */
const DEFAULT_FILL = 0.92;
/** Below this workspace width the layout stacks. */
const STACK_BREAKPOINT = 640;
/** Keyboard and button resize step, in px. */
const SIZE_STEP = 40;
/** Sizes snap to this grid so squares land on whole pixels (8 files). */
const SIZE_SNAP = 8;

function clamp(n        , lo        , hi        )         {
    return Math.min(hi, Math.max(lo, n));
}

function snap(n        )         {
    return Math.round(n / SIZE_SNAP) * SIZE_SNAP;
}

function snapDown(n        )         {
    return Math.floor(n / SIZE_SNAP) * SIZE_SNAP;
}

function isOpenPanel(spec                  , open         )                    {
    return spec !== null && open;
}

function computeWorkspace(input                )                    {
    const { padding, chromeY } = input;
    const gap = input.gap;
    const rail = input.rail ?? 0;
    const availW = Math.max(0, input.width - padding * 2);
    const availH = Math.max(0, input.height - padding * 2 - chromeY);
    const rawLeft = isOpenPanel(input.left, input.leftOpen) ? input.left : null;
    const right = isOpenPanel(input.right, input.rightOpen) ? input.right : null;

    // Space a panel takes beside the primary region: its width plus the gap to it. A panel that is
    // hidden or a drawer takes none, so the primary region is centered in what is really left.
    const besideOf = (panels             , widthOf                          )         =>
        panels.reduce((sum, p) => sum + widthOf(p) + gap, 0);
    const fitsBeside = (panels             )          =>
        availW - besideOf(panels, (p) => p.min) >= PRIMARY_MIN + 2 * rail;

    // The optional left panel yields first: when both panels cannot sit beside a usable
    // region, it becomes an on-demand drawer instead of forcing the whole layout to restack. The
    // right panel is what the person works against (session information), so it is the last to give way.
    const comfortable = (panels             )          =>
        availW - besideOf(panels, (p) => p.min) >= COMFORT_MIN + 2 * rail;
    const leftDemoted = rawLeft !== null && !comfortable([rawLeft, ...(right ? [right] : [])]) && input.width >= STACK_BREAKPOINT;
    const left = leftDemoted ? null : rawLeft;
    const openPanels = [left, right].filter((p)                 => p !== null);
    const beside = (widthOf                          )         => besideOf(openPanels, widthOf);

    // Stack when the workspace is narrow, when the right panel cannot sit beside a minimum region,
    // or, in a portrait window, when stacking would give a much bigger region (a tablet held upright): then the region comes
    // first and the panels follow under it. Stacked panels stay visible.
    const sideRegion = Math.min(availH, availW - beside((p) => p.min) - 2 * rail);
    const stackRegion = Math.min(availH, availW);
    const stacked = input.width < STACK_BREAKPOINT
        || (openPanels.length > 0 && (!fitsBeside(openPanels) || (availH > availW && sideRegion < 0.7 * stackRegion)));

    // The control rail hangs beside the region on wide layouts, so the margin on both sides of the
    // region keeps room for it (equal margins keep the region centered in its own column).
    const railMargin = stacked ? 0 : 2 * rail;
    const heightCap = Math.max(PRIMARY_FLOOR, availH);
    const widthCap = Math.max(PRIMARY_FLOOR, availW - railMargin);
    const fullMax = snapDown(Math.min(heightCap, widthCap));

    // Responsive default: dominant but not maximal. Panels yield first: the region is sized against
    // the panels' MINIMUM widths, and the panels then grow into what remains, up to their preferred
    // width. Hidden panels reserve nothing.
    const widthAtMin = availW - beside((p) => p.min) - railMargin;
    let fits = Math.min(availH, widthAtMin);
    if (fits < PRIMARY_MIN) fits = Math.min(availH, availW - railMargin);
    if (stacked) fits = Math.min(availH, availW);
    // The default never pushes panels out: its floor is what still docks at the panels' minimum.
    const dockable = stacked ? fullMax : Math.min(availH, widthAtMin);
    const floor = Math.min(DEFAULT_FLOOR, fullMax, Math.max(PRIMARY_MIN, snapDown(dockable)));
    const defaultSize = clamp(
        snapDown(fits * (stacked ? 1 : DEFAULT_FILL)),
        floor,
        Math.min(DEFAULT_CAP, fullMax),
    );

    const minSize = Math.min(PRIMARY_MIN, fullMax);
    const maxSize = Math.max(minSize, fullMax);
    const wanted = input.preferred ?? defaultSize;
    const size = clamp(snap(wanted), minSize, maxSize);

    const state = (spec                  , present         , open         )            =>
        !present ? 'absent' : spec === null || !open ? 'hidden' : 'docked';

    if (stacked) {
        return {
            mode: 'stacked',
            size,
            minSize,
            maxSize,
            defaultSize,
            leftDock: state(input.left, input.left !== null, input.leftOpen),
            rightDock: state(input.right, input.right !== null, input.rightOpen),
            leftWidth: 0,
            rightWidth: 0,
            reserve: 0,
            gapX: gap,
            atMin: size <= minSize,
            atMax: size >= maxSize,
            isDefault: input.preferred === null,
        };
    }

    // Each open panel gets an equal share of what is left beside the region (minus the rail margin
    // and the gaps), up to its preferred width; one that cannot reach its minimum becomes a drawer.
    const free = availW - size - railMargin - gap * openPanels.length;
    const share = openPanels.length > 0 ? free / openPanels.length : 0;
    const dock = (spec                  , present         )                                     => {
        if (!present) return { dock: 'absent', width: 0 };
        if (spec === null) return { dock: 'hidden', width: 0 };
        if (share >= spec.min) return { dock: 'docked', width: Math.floor(Math.min(spec.preferred, share)) };
        return { dock: 'drawer', width: 0 };
    };
    const l = leftDemoted ? { dock: 'drawer'             , width: 0 } : dock(left, input.left !== null);
    const r = dock(right, input.right !== null);

    return {
        mode: 'wide',
        size,
        minSize,
        maxSize,
        defaultSize,
        leftDock: l.dock,
        rightDock: r.dock,
        leftWidth: l.width,
        rightWidth: r.width,
        reserve: 0,
        gapX: gap,
        atMin: size <= minSize,
        atMax: size >= maxSize,
        isDefault: input.preferred === null,
    };
}

/** Next size for a +/- step, snapped and clamped; `direction` is 1 to enlarge, -1 to shrink. */
function stepSize(current        , direction        , geometry                                                )         {
    return clamp(snap(current + direction * SIZE_STEP), geometry.minSize, geometry.maxSize);
}

/**
 * Size implied by dragging a corner handle. The handle sits on the bottom right
 * corner of a region that stays centered, so moving it by `dx` grows the region
 * by 2*dx (both edges move); the vertical drag grows it by `dy`. The larger
 * pull wins, so a diagonal drag feels natural.
 */
function dragSize(startSize        , dx        , dy        , geometry                                                )         {
    const pull = Math.abs(dx * 2) > Math.abs(dy) ? dx * 2 : dy;
    return clamp(snap(startSize + pull), geometry.minSize, geometry.maxSize);
}

  root.SummaWorkspace = { PRIMARY_MIN, COMFORT_MIN, PRIMARY_FLOOR, DEFAULT_CAP, DEFAULT_FLOOR, DEFAULT_FILL, STACK_BREAKPOINT, SIZE_STEP, SIZE_SNAP, clamp, snap, computeWorkspace, stepSize, dragSize };
})(typeof window !== "undefined" ? window : globalThis);
