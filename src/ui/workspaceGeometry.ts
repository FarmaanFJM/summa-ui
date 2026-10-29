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
 *  2. Panels yield before the primary region does. A panel shrinks from its
 *     preferred width to its minimum, then leaves the layout and becomes an
 *     on-demand drawer. It is never destroyed.
 *  3. Both flanks reserve the same width, so a lone panel does not push the
 *     primary region off-center.
 *  4. A narrow workspace stacks: primary region full width, panels below.
 *  5. A user's chosen size is a preference, not a measurement. It is clamped
 *     for display and never rewritten because the window got smaller.
 *
 * The equal-reserve idea (the same width on both sides keeps the primary region
 * centered) is shared with the MIT-licensed Chess Zen Mode extension's layout math.
 * Only the idea is shared. This code is independent: that extension steers a third
 * party page's CSS grid and does not size a primary region itself.
 */

export interface PanelSpec {
    /** Preferred docked width in px. */
    preferred: number;
    /** Narrowest docked width in px; below this the panel becomes a drawer. */
    min: number;
}

export type PanelDock = 'docked' | 'drawer' | 'hidden' | 'absent';

export interface WorkspaceInput {
    /** Measured width of the workspace area, in px. */
    width: number;
    /** Measured height of the workspace area, in px. */
    height: number;
    /** Outer padding on every edge. */
    padding: number;
    /** Gap between the primary region and a docked panel. */
    gap: number;
    /** Vertical px the workspace spends on things other than the primary square (toolbar, captions). */
    chromeY: number;
    left: PanelSpec | null;
    right: PanelSpec | null;
    leftOpen: boolean;
    rightOpen: boolean;
    /** The user's chosen primary size in px, or null for the responsive default. */
    preferred: number | null;
}

export interface WorkspaceGeometry {
    mode: 'wide' | 'stacked';
    /** Effective primary size in px (always an integer). */
    size: number;
    minSize: number;
    maxSize: number;
    defaultSize: number;
    leftDock: PanelDock;
    rightDock: PanelDock;
    /** Width of the left and right docked column in px (0 when not docked). Equal reserve on both sides. */
    leftWidth: number;
    rightWidth: number;
    /** Equal width reserved on each side of the primary region. */
    reserve: number;
    atMin: boolean;
    atMax: boolean;
    isDefault: boolean;
}

/** Narrowest primary region a user can pick, and the smallest the layout will ever fall back to. */
export const PRIMARY_MIN = 280;
/** Hard floor when the space is even smaller than PRIMARY_MIN (the page then scrolls). */
export const PRIMARY_FLOOR = 240;
/** Largest responsive default; "medium" is deliberately below the maximum. */
export const DEFAULT_CAP = 640;
/** Smallest responsive default on a roomy screen. */
export const DEFAULT_FLOOR = 320;
/** The default occupies this share of the largest size that fits beside the panels. */
export const DEFAULT_FILL = 0.88;
/** Below this workspace width the layout stacks. */
export const STACK_BREAKPOINT = 640;
/** Keyboard and button resize step, in px. */
export const SIZE_STEP = 40;
/** Sizes snap to this grid so squares land on whole pixels (an 8-step grid keeps a square divisible). */
export const SIZE_SNAP = 8;

export function clamp(n: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, n));
}

export function snap(n: number): number {
    return Math.round(n / SIZE_SNAP) * SIZE_SNAP;
}

function snapDown(n: number): number {
    return Math.floor(n / SIZE_SNAP) * SIZE_SNAP;
}

function isOpenPanel(spec: PanelSpec | null, open: boolean): spec is PanelSpec {
    return spec !== null && open;
}

/**
 * Width of each flank available beside a primary region of `size`, using the
 * equal-reserve rule: both flanks are as wide as the space left over, halved.
 */
function flankFor(size: number, availW: number, gap: number): number {
    return Math.max(0, (availW - size) / 2 - gap);
}

export function computeWorkspace(input: WorkspaceInput): WorkspaceGeometry {
    const { padding, gap, chromeY } = input;
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
    const maxBeside = (widthOf: (p: PanelSpec) => number): number => {
        const need = Math.max(left ? widthOf(left) : 0, right ? widthOf(right) : 0);
        return need > 0 ? availW - 2 * (need + gap) : availW;
    };
    const heightCap = Math.max(PRIMARY_FLOOR, availH);
    const widthCap = Math.max(PRIMARY_FLOOR, availW);
    const fullMax = snapDown(Math.min(heightCap, widthCap));

    // Responsive default: medium, beside panels at their preferred width if that
    // leaves a usable primary region, else at their minimum width, else with drawers.
    let fits = Math.min(availH, maxBeside((p) => p.preferred));
    if (fits < PRIMARY_MIN) fits = Math.min(availH, maxBeside((p) => p.min));
    if (fits < PRIMARY_MIN) fits = Math.min(availH, availW);
    if (stacked) fits = Math.min(availH, availW);
    const defaultSize = clamp(
        snapDown(fits * (stacked ? 1 : DEFAULT_FILL)),
        Math.min(DEFAULT_FLOOR, fullMax),
        Math.min(DEFAULT_CAP, fullMax),
    );

    const minSize = Math.min(PRIMARY_MIN, fullMax);
    const maxSize = Math.max(minSize, fullMax);
    const wanted = input.preferred ?? defaultSize;
    const size = clamp(snap(wanted), minSize, maxSize);

    if (stacked) {
        const state = (spec: PanelSpec | null, present: boolean, open: boolean): PanelDock =>
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
            atMin: size <= minSize,
            atMax: size >= maxSize,
            isDefault: input.preferred === null,
        };
    }

    const flank = flankFor(size, availW, gap);
    const dock = (spec: PanelSpec | null, present: boolean): { dock: PanelDock; width: number } => {
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
        atMin: size <= minSize,
        atMax: size >= maxSize,
        isDefault: input.preferred === null,
    };
}

/** Next size for a +/- step, snapped and clamped; `direction` is 1 to enlarge, -1 to shrink. */
export function stepSize(current: number, direction: 1 | -1, geometry: Pick<WorkspaceGeometry, 'minSize' | 'maxSize'>): number {
    return clamp(snap(current + direction * SIZE_STEP), geometry.minSize, geometry.maxSize);
}

/**
 * Size implied by dragging a corner handle. The handle sits on the bottom right
 * corner of a region that stays centered, so moving it by `dx` grows the region
 * by 2*dx (both edges move); the vertical drag grows it by `dy`. The larger
 * pull wins, so a diagonal drag feels natural.
 */
export function dragSize(startSize: number, dx: number, dy: number, geometry: Pick<WorkspaceGeometry, 'minSize' | 'maxSize'>): number {
    const pull = Math.abs(dx * 2) > Math.abs(dy) ? dx * 2 : dy;
    return clamp(snap(startSize + pull), geometry.minSize, geometry.maxSize);
}
