import type { ComponentType } from 'react'
import * as B from './bad'
import * as G from './good'

/** Demo registry. Keys are referenced by guidance/antipatterns/*.json (bad.demo, good[].demo). */
export const DEMOS: Record<string, ComponentType> = {
  'bad-nested-borders': B.NestedBorders,
  'good-flat-surfaces': G.FlatSurfaces,
  'bad-left-border': B.LeftBorder,
  'good-fill-emphasis': G.FillEmphasis,
  'bad-washed-destructive': B.WashedDestructive,
  'good-solid-destructive': G.SolidDestructive,
  'good-neutral-destructive': G.NeutralDestructive,
  'bad-accent-focus': B.AccentFocus,
  'good-neutral-focus': G.NeutralFocus,
  'bad-pill-tags': B.PillTags,
  'good-plain-meta': G.PlainMeta,
  'good-functional-tag': G.FunctionalTag,
  'good-toast-saved': G.ToastSaved,
  'bad-initials-avatars': B.InitialsAvatars,
  'good-plain-names': G.PlainNames,
  'bad-dense-mobile': B.DenseMobile,
  'good-airy-sheet': G.AirySheet,
  'bad-send-and-stop': B.SendAndStop,
  'good-send-or-stop': G.SendOrStop,
  'bad-select-plus-create': B.SelectPlusCreate,
  'good-dropdown-create': G.DropdownCreate,
  'bad-helper-text': B.HelperText,
  'good-plain-form': G.PlainForm,
  'good-empty-line': G.EmptyLine,
  'bad-stacked-sidebars': B.StackedSidebars,
  'good-sidebar-swap': G.SidebarSwap,
  'good-content-detail': G.ContentDetail,
  'bad-all-emerald': B.AllEmerald,
  'good-restrained-accent': G.RestrainedAccent,
  'bad-glow-hero': B.GlowHero,
  'good-matte-hero': G.MatteHero,
  'bad-indented-tree': B.IndentedTree,
  'good-flat-breadcrumbs': G.FlatBreadcrumbs,
  'bad-card-in-card': B.CardInCard,
  'good-single-surface': G.SingleSurface,
  'bad-toolbar-overload': B.ToolbarOverload,
  'good-toolbar-menu': G.ToolbarMenu,
  'good-static-context-menu': G.StaticContextMenu,
}

/** Demos that render a fixed 360px (or wider) frame. The gallery lets these scroll inside the stage on narrow screens. */
export const WIDE_DEMOS: string[] = ['bad-dense-mobile', 'good-airy-sheet', 'bad-stacked-sidebars', 'good-sidebar-swap', 'good-content-detail', 'bad-toolbar-overload', 'good-toolbar-menu']
