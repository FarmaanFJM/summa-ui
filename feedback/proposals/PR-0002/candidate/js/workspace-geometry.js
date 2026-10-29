/* Generated from src/ui/workspaceGeometry.ts (types stripped, wrapped as a classic script so examples work from file://).
   Regenerate: see feedback/proposals/PR-0002/candidate/README.md. scripts/test-workspace.mjs checks it matches the TypeScript. */
(function (root) {
/**
 * Workspace geometry: pure arithmetic, no DOM, no framework.
 * Reference implementation of docs/WORKSPACE_PATTERN.md (a framework-neutral port of
 * the CaissaTrainer model; same API and constants, so a Vue, React or plain app can share the numbers).
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
 *     first; panels then grow into what is left, up to their preferred width. A
 *     panel that cannot dock at its minimum leaves the layout and becomes an
 *     on-demand drawer. It is never destroyed.
 *  3. Both flanks reserve the same width, so a lone panel does not push the
 *     primary region off-center.
 *  4. A narrow workspace stacks: primary region full width, panels below.
 *  5. A user's chosen size is a preference, not a measurement. It is clamped
 *     for display and never rewritten because the window got smaller.
 *  6. A control rail attached to the region (resize handle, options menu) takes
 *     `rail` px beside it. The reserve is counted on BOTH sides, so the equal
 *     reserve and the centering survive. Beside panels only; stacked it sits below.
 *
 * The equal-reserve idea (the same width on both sides keeps the primary region
 * centered) is shared with the MIT-licensed Chess Zen Mode extension's layout math.
 * Only the idea is shared. This code is independent: that extension steers a third
 * party page's CSS grid and does not size a primary region itself.
 */

                            
                                        
                      
                                                                               
                
 

                                                                  

                                 
                                                       
                  
                                                        
                   
                                       
                    
                                                             
                
       
                                                                                                 
                                                                                                 
                                                                                           
       
                  
                                                                                                        
                    
                           
                            
                      
                       
                                                                                    
                             
 

                                    
                             
                                                            
                 
                    
                    
                        
                        
                         
                                                                                                            
                      
                       
                                                                   
                    
                                                                                       
                 
                   
                   
                       
 

/** Narrowest primary region a user can pick, and the smallest the layout will ever fall back to. */
const PRIMARY_MIN = 280;
/** Hard floor when the space is even smaller than PRIMARY_MIN (the page then scrolls). */
const PRIMARY_FLOOR = 240;
/** Largest responsive default; "medium" is deliberately below the maximum. */
const DEFAULT_CAP = 640;
/** Smallest responsive default on a roomy screen. */
const DEFAULT_FLOOR = 320;
/** The default occupies this share of the largest size that fits beside the panels. */
const DEFAULT_FILL = 0.88;
/** Below this workspace width the layout stacks. */
const STACK_BREAKPOINT = 640;
/** Keyboard and button resize step, in px. */
const SIZE_STEP = 40;
/** Sizes snap to this grid so squares land on whole pixels (an 8-step grid keeps a square divisible). */
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

/**
 * Width of each flank available beside a primary region of `size`, using the
 * equal-reserve rule: both flanks are as wide as the space left over, halved.
 */
function flankFor(size        , availW        , gap        )         {
    return Math.max(0, (availW - size) / 2 - gap);
}

function computeWorkspace(input                )                    {
    const { padding, chromeY } = input;
    const baseGap = input.gap;
    const gap = baseGap + (input.rail ?? 0);
    const availW = Math.max(0, input.width - padding * 2);
    const availH = Math.max(0, input.height - padding * 2 - chromeY);
    const left = isOpenPanel(input.left, input.leftOpen) ? input.left : null;
    const right = isOpenPanel(input.right, input.rightOpen) ? input.right : null;

    // Stack when the workspace is narrow, or when the open panels cannot dock beside even a
    // minimum-size primary region. Stacked panels stay visible (below the primary region);
    // nothing the person needs is hidden behind a drawer just because the screen is small.
    const openMin = Math.max(left ? left.min : 0, right ? right.min : 0);
    const stacked = input.width < STACK_BREAKPOINT
        || (openMin > 0 && availW < PRIMARY_MIN + 2 * (openMin + gap));

    // Largest primary size at which a panel at `width(spec)` still docks beside it.
    const maxBeside = (widthOf                          )         => {
        const need = Math.max(left ? widthOf(left) : 0, right ? widthOf(right) : 0);
        return need > 0 ? availW - 2 * (need + gap) : availW;
    };
    const heightCap = Math.max(PRIMARY_FLOOR, availH);
    const widthCap = Math.max(PRIMARY_FLOOR, availW);
    const fullMax = snapDown(Math.min(heightCap, widthCap));

    // Responsive default: medium. Panels yield first: the region is sized against the panels'
    // MINIMUM widths, and the panels then grow into what remains, up to their preferred width.
    // (Sizing against preferred widths left laptop regions small while panels sat wide.)
    let fits = Math.min(availH, maxBeside((p) => p.min));
    if (fits < PRIMARY_MIN) fits = Math.min(availH, availW);
    if (stacked) fits = Math.min(availH, availW);
    // The default never pushes panels out: its floor is what still docks at the panels' minimum
    // widths (not below a usable region), so a medium default cannot be the reason a panel
    // becomes a drawer.
    const dockable = stacked ? fullMax : Math.min(availH, maxBeside((p) => p.min));
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

    if (stacked) {
        const state = (spec                  , present         , open         )            =>
            !present ? 'absent' : spec === null || !open ? 'hidden' : 'docked';
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
            gapX: baseGap,
            atMin: size <= minSize,
            atMax: size >= maxSize,
            isDefault: input.preferred === null,
        };
    }

    const flank = flankFor(size, availW, gap);
    const dock = (spec                  , present         )                                     => {
        if (!present) return { dock: 'absent', width: 0 };
        if (spec === null) return { dock: 'hidden', width: 0 };
        if (flank >= spec.min) return { dock: 'docked', width: Math.floor(Math.min(spec.preferred, flank)) };
        return { dock: 'drawer', width: 0 };
    };
    const l = dock(left, input.left !== null);
    const r = dock(right, input.right !== null);

    const reserve = Math.max(l.width, r.width);
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
        reserve,
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

  root.SummaWorkspace = { PRIMARY_MIN, PRIMARY_FLOOR, DEFAULT_CAP, DEFAULT_FLOOR, DEFAULT_FILL, STACK_BREAKPOINT, SIZE_STEP, SIZE_SNAP, clamp, snap, computeWorkspace, stepSize, dragSize };
})(typeof window !== "undefined" ? window : globalThis);
