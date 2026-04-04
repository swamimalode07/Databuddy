# Sidebar Refactor: Provider + Shared Navigation Renderer

**Date**: 2026-04-04
**Branch**: staging
**Scope**: Dashboard sidebar system (`components/layout/`)

## Problem

The sidebar system has three components (Sidebar, CategorySidebar, MobileSidebar) that independently:
- Call `useWebsitesLight`, `useMonitorsLight`, `useFlags`, `useHydrated`
- Run identical `useMemo` blocks to compute navigation config and categories
- Duplicate the same `.map()` + type-guard rendering logic for navigation entries

This results in ~1,910 lines across 8 files with significant copy-paste duplication.

## Solution

### 1. SidebarNavigationProvider

**New file**: `components/layout/sidebar-navigation-provider.tsx` (~120 lines)

Single context that consolidates all duplicated data-fetching and navigation computation.

**Fetches once**: `useWebsitesLight`, `useMonitorsLight`, `useFlags`, `useHydrated`, `useAccordionStates`

**Exposes via context**:
- `navigation: NavigationEntry[]`
- `categories: Category[]`
- `activeCategory: string`
- `setCategory: (id: string) => void`
- `header: ReactNode`
- `currentWebsiteId: string | null`
- `pathname: string`
- `searchParams: ReadonlyURLSearchParams`
- `accordionStates: ReturnType<useAccordionStates>`

### 2. NavigationRenderer

**New file**: `components/layout/navigation/navigation-renderer.tsx` (~60 lines)

Shared component replacing the duplicated `.map()` + type-guard blocks in sidebar.tsx and mobile-sidebar.tsx.

- Consumes from SidebarNavigationProvider context
- Maps NavigationEntry[] to NavigationSection/NavigationItem components
- Props: `className?` for styling differences between desktop/mobile

### 3. Simplified Sidebar Files

| File | Before | After | Change |
|------|--------|-------|--------|
| `sidebar.tsx` | 287 | ~50 | Remove all hooks + useMemo, consume context |
| `category-sidebar.tsx` | 233 | ~80 | Remove data fetching + useMemo, consume context |
| `mobile-sidebar.tsx` | 402 | ~150 | Remove data fetching + rendering duplication |

### 4. Bundle Optimization

**`navigation-config.tsx`**: Change barrel imports to direct imports.
- `import { HouseIcon } from "@phosphor-icons/react"` becomes `import { HouseIcon } from "@phosphor-icons/react/dist/ssr/HouseIcon"`
- Applies to all ~48 icon imports for tree-shaking.

### 5. Layout Integration

**`app/(main)/layout.tsx`**: Wrap sidebar area with `<SidebarNavigationProvider>`.
Provider sits inside existing `BillingProvider` and `CommandSearchProvider`.

## What Doesn't Change

- NavigationItem component (props and behavior unchanged)
- NavigationSection component (props and behavior unchanged)
- types.ts, nav-item-active.ts
- organization-selector.tsx, website-header.tsx
- theme-toggle.tsx, profile-button-client.tsx
- All hooks (use-websites.ts, use-monitors.ts, use-persistent-state.ts)
- Home page (separate optimization pass)

## Expected Result

- ~1,910 lines to ~1,200 lines (37% reduction)
- Three data-fetching duplications eliminated
- Navigation rendering deduplicated
- Bundle size improved via direct icon imports
