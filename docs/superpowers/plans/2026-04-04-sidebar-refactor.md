# Sidebar Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 3x duplicated data-fetching/navigation logic across the sidebar system by introducing a shared provider and navigation renderer.

**Architecture:** A `SidebarNavigationProvider` consolidates all shared state (websites, monitors, flags, categories, navigation config) into a single context. A `NavigationRenderer` component replaces the duplicated `.map()` rendering in both desktop and mobile sidebars. Icon imports in navigation-config.tsx switch from barrel to direct SSR paths.

**Tech Stack:** React 19 context, Next.js 16, Phosphor Icons (SSR direct imports), existing hooks (`useWebsitesLight`, `useMonitorsLight`, `useFlags`, `useHydrated`, `useAccordionStates`)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `components/layout/sidebar-navigation-provider.tsx` | Single context: fetches data, computes nav config, exposes to children |
| Create | `components/layout/navigation/navigation-renderer.tsx` | Shared nav entry rendering (type guards + map + borders) |
| Modify | `components/layout/sidebar.tsx` | Strip all hooks/useMemo, consume context, render shell |
| Modify | `components/layout/category-sidebar.tsx` | Strip data fetching, consume context for categories |
| Modify | `components/layout/mobile-sidebar.tsx` | Strip data fetching + nav rendering, consume context |
| Modify | `components/layout/navigation/navigation-config.tsx` | Switch barrel imports to direct SSR paths |
| Modify | `app/(main)/layout.tsx` | Wrap sidebar area with provider |

All paths are relative to `apps/dashboard/`.

---

### Task 1: Create SidebarNavigationProvider

**Files:**
- Create: `apps/dashboard/components/layout/sidebar-navigation-provider.tsx`

This task extracts the duplicated logic from sidebar.tsx (lines 53-175), category-sidebar.tsx (lines 50-107), and mobile-sidebar.tsx (lines 109-178) into a single provider.

- [ ] **Step 1: Create the provider file**

```tsx
// apps/dashboard/components/layout/sidebar-navigation-provider.tsx
"use client";

import { authClient } from "@databuddy/auth/client";
import { useFlags } from "@databuddy/sdk/react";
import { usePathname, useSearchParams } from "next/navigation";
import {
	type ReactNode,
	createContext,
	use,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMonitorsLight } from "@/hooks/use-monitors";
import { useAccordionStates } from "@/hooks/use-persistent-state";
import { useWebsitesLight } from "@/hooks/use-websites";
import {
	categoryConfig,
	createLoadingMonitorsNavigation,
	createLoadingWebsitesNavigation,
	createMonitorsNavigation,
	createWebsitesNavigation,
	filterCategoriesByFlags,
	filterCategoriesForRoute,
	getContextConfig,
	getDefaultCategory,
} from "./navigation/navigation-config";
import type { Category, NavigationEntry } from "./navigation/types";
import { OrganizationSelector } from "./organization-selector";
import { WebsiteHeader } from "./navigation/website-header";

interface SidebarNavigationContextValue {
	navigation: NavigationEntry[];
	categories: Category[];
	activeCategory: string;
	setCategory: (id: string) => void;
	header: ReactNode;
	currentWebsiteId: string | null | undefined;
	pathname: string;
	searchParams: ReadonlyURLSearchParams;
	accordionStates: ReturnType<typeof useAccordionStates>;
}

const SidebarNavigationContext =
	createContext<SidebarNavigationContextValue | null>(null);

export function useSidebarNavigation() {
	const ctx = use(SidebarNavigationContext);
	if (!ctx) {
		throw new Error(
			"useSidebarNavigation must be used within SidebarNavigationProvider",
		);
	}
	return ctx;
}

export function SidebarNavigationProvider({
	children,
}: { children: ReactNode }) {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;

	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { getFlag } = useFlags();
	const isHydrated = useHydrated();
	const accordionStates = useAccordionStates();

	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		undefined,
	);

	const { websites, isLoading: isLoadingWebsites } = useWebsitesLight({
		enabled: user !== null,
	});
	const { monitors, isLoading: isLoadingMonitors } = useMonitorsLight({
		enabled: user !== null,
	});

	const isDemo = pathname.startsWith("/demo");
	const isWebsite = pathname.startsWith("/websites/");
	const websiteId = isDemo || isWebsite ? pathname.split("/")[2] : null;

	const currentWebsite = useMemo(
		() => (websiteId ? websites?.find((site) => site.id === websiteId) : null),
		[websiteId, websites],
	);

	// Build the populated config with live website/monitor data
	const populatedConfig = useMemo(() => {
		const baseConfig = getContextConfig(pathname);
		if (baseConfig !== categoryConfig.main) return baseConfig;

		return {
			...baseConfig,
			navigationMap: {
				...baseConfig.navigationMap,
				home:
					!isHydrated || isLoadingWebsites
						? createLoadingWebsitesNavigation()
						: createWebsitesNavigation(websites),
				monitors:
					!isHydrated || isLoadingMonitors
						? createLoadingMonitorsNavigation()
						: createMonitorsNavigation(monitors),
			},
		};
	}, [
		pathname,
		isHydrated,
		isLoadingWebsites,
		websites,
		isLoadingMonitors,
		monitors,
	]);

	// Categories filtered by route and flags
	const categories = useMemo(
		() =>
			filterCategoriesByFlags(
				filterCategoriesForRoute(populatedConfig.categories, pathname),
				isHydrated,
				getFlag,
			),
		[populatedConfig.categories, pathname, isHydrated, getFlag],
	);

	// Reset selected category when the default changes (e.g. navigating between sections)
	const defaultCategory = useMemo(
		() => getDefaultCategory(pathname),
		[pathname],
	);
	const previousDefaultCategoryRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (
			previousDefaultCategoryRef.current !== undefined &&
			previousDefaultCategoryRef.current !== defaultCategory
		) {
			setSelectedCategory(undefined);
		}
		previousDefaultCategoryRef.current = defaultCategory;
	}, [defaultCategory]);

	const activeCategory = selectedCategory || defaultCategory;

	// Resolve navigation entries for the active category
	const navigation = useMemo(() => {
		const navSections =
			populatedConfig.navigationMap[
				activeCategory as keyof typeof populatedConfig.navigationMap
			] ||
			populatedConfig.navigationMap[
				populatedConfig.defaultCategory as keyof typeof populatedConfig.navigationMap
			];

		return navSections
			.map((entry) => {
				if ("items" in entry) {
					const filteredItems = entry.items.filter((item) => {
						if (item.flag) {
							const flagState = getFlag(item.flag);
							return flagState.status === "ready" && flagState.on;
						}
						return true;
					});
					return { ...entry, items: filteredItems };
				}
				return entry;
			})
			.filter((entry) => {
				if (entry.flag) {
					const flagState = getFlag(entry.flag);
					if (!(flagState.status === "ready" && flagState.on)) {
						return false;
					}
				}
				if ("items" in entry && entry.items.length === 0) {
					return false;
				}
				return true;
			});
	}, [populatedConfig, activeCategory, getFlag]);

	// Header component depends on context (website vs org)
	const header = useMemo(() => {
		if (isWebsite || isDemo) {
			return (
				<WebsiteHeader showBackButton={!isDemo} website={currentWebsite} />
			);
		}
		return <OrganizationSelector />;
	}, [isWebsite, isDemo, currentWebsite]);

	const currentWebsiteId = isWebsite || isDemo ? websiteId : undefined;

	const value = useMemo<SidebarNavigationContextValue>(
		() => ({
			navigation,
			categories,
			activeCategory,
			setCategory: setSelectedCategory,
			header,
			currentWebsiteId,
			pathname,
			searchParams,
			accordionStates,
		}),
		[
			navigation,
			categories,
			activeCategory,
			header,
			currentWebsiteId,
			pathname,
			searchParams,
			accordionStates,
		],
	);

	return (
		<SidebarNavigationContext value={value}>
			{children}
		</SidebarNavigationContext>
	);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors related to `sidebar-navigation-provider.tsx`. There may be other pre-existing errors.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/layout/sidebar-navigation-provider.tsx
git commit -m "feat(dashboard): add SidebarNavigationProvider context"
```

---

### Task 2: Create NavigationRenderer

**Files:**
- Create: `apps/dashboard/components/layout/navigation/navigation-renderer.tsx`

This extracts the duplicated `.map()` + type-guard logic from sidebar.tsx (lines 220-280) and mobile-sidebar.tsx (lines 297-357).

- [ ] **Step 1: Create the renderer file**

```tsx
// apps/dashboard/components/layout/navigation/navigation-renderer.tsx
"use client";

import { cn } from "@/lib/utils";
import { useSidebarNavigation } from "../sidebar-navigation-provider";
import { isNavItemActive } from "./nav-item-active";
import { NavigationItem } from "./navigation-item";
import { NavigationSection } from "./navigation-section";
import type {
	NavigationEntry,
	NavigationItem as NavigationItemType,
	NavigationSection as NavigationSectionType,
} from "./types";

const isSection = (entry: NavigationEntry): entry is NavigationSectionType =>
	"items" in entry;

const isItem = (entry: NavigationEntry): entry is NavigationItemType =>
	"href" in entry && !("items" in entry);

export function NavigationRenderer({ className }: { className?: string }) {
	const {
		navigation,
		currentWebsiteId,
		pathname,
		searchParams,
		accordionStates,
	} = useSidebarNavigation();

	return (
		<nav aria-label="Main navigation" className={cn("flex flex-col", className)}>
			{navigation.map((entry, idx) => {
				if (isSection(entry)) {
					return (
						<NavigationSection
							accordionStates={accordionStates}
							className={cn(
								navigation.length > 1 && idx === navigation.length - 1
									? "border-t"
									: idx === 0 && navigation.length < 2
										? "border-b"
										: idx !== 0 && navigation.length > 1
											? "border-t"
											: "border-transparent",
							)}
							currentWebsiteId={currentWebsiteId}
							flag={entry.flag}
							icon={entry.icon}
							items={entry.items}
							key={entry.title}
							pathname={pathname}
							searchParams={searchParams}
							title={entry.title}
						/>
					);
				}

				if (isItem(entry)) {
					return (
						<div className={cn(idx !== 0 && "border-t")} key={entry.name}>
							<NavigationItem
								alpha={entry.alpha}
								badge={entry.badge}
								currentWebsiteId={currentWebsiteId}
								disabled={entry.disabled}
								domain={entry.domain}
								href={entry.href}
								icon={entry.icon}
								isActive={isNavItemActive(
									entry,
									pathname,
									searchParams,
									currentWebsiteId,
								)}
								isExternal={entry.external}
								isLocked={false}
								isRootLevel={!!entry.rootLevel}
								lockedPlanName={null}
								name={entry.name}
								production={entry.production}
								sectionName="main"
								tag={entry.tag}
							/>
						</div>
					);
				}

				return null;
			})}
		</nav>
	);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/layout/navigation/navigation-renderer.tsx
git commit -m "feat(dashboard): add shared NavigationRenderer component"
```

---

### Task 3: Wrap layout with SidebarNavigationProvider

**Files:**
- Modify: `apps/dashboard/app/(main)/layout.tsx`

- [ ] **Step 1: Add the provider to the layout**

Read the file first, then replace its contents. The provider wraps the flex container that holds Sidebar + content, inside the existing CommandSearchProvider:

```tsx
// apps/dashboard/app/(main)/layout.tsx
import { AutumnProvider } from "autumn-js/react";
import { Suspense } from "react";
import { FeedbackPrompt } from "@/components/feedback-prompt";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarNavigationProvider } from "@/components/layout/sidebar-navigation-provider";
import { BillingProvider } from "@/components/providers/billing-provider";
import { CommandSearchProvider } from "@/components/ui/command-search";

export const dynamic = "force-dynamic";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AutumnProvider
			backendUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
			includeCredentials
		>
			<BillingProvider>
				<CommandSearchProvider>
					<SidebarNavigationProvider>
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden text-foreground">
							<Suspense fallback={null}>
								<Sidebar />
							</Suspense>
							<div className="relative flex min-h-0 flex-1 flex-col pl-0 md:pl-76 lg:pl-84">
								<div className="flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden overscroll-none pt-12 md:pt-0">
									{children}
								</div>
							</div>
							<FeedbackPrompt />
						</div>
					</SidebarNavigationProvider>
				</CommandSearchProvider>
			</BillingProvider>
		</AutumnProvider>
	);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/app/\(main\)/layout.tsx
git commit -m "feat(dashboard): wrap main layout with SidebarNavigationProvider"
```

---

### Task 4: Simplify sidebar.tsx

**Files:**
- Modify: `apps/dashboard/components/layout/sidebar.tsx`

Strip all hooks, useMemo, type guards, and data-fetching. The component becomes a thin shell that reads from context.

- [ ] **Step 1: Rewrite sidebar.tsx**

Read the file first, then replace:

```tsx
// apps/dashboard/components/layout/sidebar.tsx
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CategorySidebar } from "./category-sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { NavigationRenderer } from "./navigation/navigation-renderer";
import { useSidebarNavigation } from "./sidebar-navigation-provider";

export function Sidebar() {
	const { header } = useSidebarNavigation();

	return (
		<>
			<MobileSidebar />

			<div className="hidden md:block">
				<CategorySidebar />
			</div>

			<nav className="fixed inset-y-0 left-12 z-50 hidden w-64 overflow-hidden border-r bg-sidebar md:block lg:w-72">
				<ScrollArea className="h-full">
					<div className="flex h-full flex-col">
						{header}
						<NavigationRenderer />
					</div>
				</ScrollArea>
			</nav>
		</>
	);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/layout/sidebar.tsx
git commit -m "refactor(dashboard): simplify sidebar.tsx to consume context"
```

---

### Task 5: Simplify category-sidebar.tsx

**Files:**
- Modify: `apps/dashboard/components/layout/category-sidebar.tsx`

Strip data fetching and category computation. Consume from context.

- [ ] **Step 1: Rewrite category-sidebar.tsx**

Read the file first, then replace:

```tsx
// apps/dashboard/components/layout/category-sidebar.tsx
"use client";

import { InfoIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Branding } from "@/components/layout/logo";
import { useCommandSearchOpenAction } from "@/components/ui/command-search";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { PendingInvitationsButton } from "./pending-invitations-button";
import { ProfileButtonClient } from "./profile-button-client";
import { useSidebarNavigation } from "./sidebar-navigation-provider";
import { ThemeToggle } from "./theme-toggle";

const HelpDialog = dynamic(
	() => import("./help-dialog").then((mod) => mod.HelpDialog),
	{
		ssr: false,
		loading: () => null,
	},
);

export function CategorySidebar() {
	const { categories, activeCategory, setCategory } = useSidebarNavigation();
	const [helpOpen, setHelpOpen] = useState(false);
	const openCommandSearchAction = useCommandSearchOpenAction();

	return (
		<div className="fixed inset-y-0 left-0 z-40 w-12 border-r bg-transparent">
			<div className="flex h-full flex-col">
				<div className="flex h-12 shrink-0 items-center justify-center border-border border-b">
					<Link
						className="relative shrink-0 transition-opacity hover:opacity-80"
						href="/websites"
					>
						<Branding heightPx={28} priority variant="logomark" />
					</Link>
				</div>

				<div className="shrink-0">
					<Tooltip delayDuration={500}>
						<TooltipTrigger asChild>
							<button
								aria-label="Search"
								className="relative flex h-10 w-full cursor-pointer items-center justify-center border-border border-b hover:bg-sidebar-accent-brighter focus:outline-none"
								onClick={() => openCommandSearchAction()}
								type="button"
							>
								<MagnifyingGlassIcon
									className="size-5 text-sidebar-foreground/75"
									weight="duotone"
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent
							className="max-w-xs text-balance"
							side="right"
							sideOffset={8}
						>
							Search
						</TooltipContent>
					</Tooltip>
				</div>

				{categories.map((category, idx) => {
					const Icon = category.icon;
					const isActive = activeCategory === category.id;
					const isLast = idx === categories.length - 1;
					const borderClass = isActive && !isLast ? "border-accent" : "";
					const hoverClass = isActive
						? ""
						: "hover:bg-sidebar-accent-brighter";
					const boxClass = isLast
						? "border-border border-b"
						: "border-transparent";

					return (
						<Tooltip delayDuration={500} key={category.id}>
							<TooltipTrigger asChild>
								<button
									className={cn(
										borderClass,
										"relative flex h-10 w-full cursor-pointer items-center justify-center",
										"focus:outline-none",
										hoverClass,
										boxClass,
									)}
									onClick={() => setCategory(category.id)}
									type="button"
								>
									{isActive ? (
										<div
											className={cn(
												"absolute top-0 left-0 -z-10 h-full w-full bg-sidebar-accent-brighter",
											)}
										/>
									) : null}
									<Icon
										className={cn(
											"size-5",
											isActive
												? "text-sidebar-ring"
												: "text-sidebar-foreground/75",
										)}
										weight={isActive ? "fill" : "duotone"}
									/>
								</button>
							</TooltipTrigger>
							<TooltipContent side="right" sideOffset={8}>
								{category.name}
							</TooltipContent>
						</Tooltip>
					);
				})}

				<div className="flex-1" />

				<div className="space-y-2 border-t p-2 pb-4">
					<div className="flex justify-center">
						<div className="flex size-8 items-center justify-center">
							<ThemeToggle tooltip />
						</div>
					</div>

					<div className="flex justify-center">
						<Button
							className="flex size-8 items-center justify-center"
							onClick={() => setHelpOpen(true)}
							suppressHydrationWarning
							type="button"
							variant="ghost"
						>
							<InfoIcon
								className="size-5 text-sidebar-foreground/75"
								weight="duotone"
							/>
						</Button>
					</div>

					<div className="flex justify-center">
						<PendingInvitationsButton />
					</div>
					<div className="flex justify-center">
						<ProfileButtonClient user={null} />
					</div>
				</div>

				<HelpDialog onOpenChangeAction={setHelpOpen} open={helpOpen} />
			</div>
		</div>
	);
}
```

Note: The original component had `user` from `authClient.useSession()` and passed it to `ProfileButtonClient`. We need to keep that. Let me fix — the `ProfileButtonClient` needs the user prop. Since we removed `authClient.useSession` from this component (it's in the provider now), we should either:

(a) Re-read user from context/session in CategorySidebar (it's cheap — `authClient.useSession()` is a cached hook), or
(b) Expose user from the provider.

Option (a) is simpler and avoids bloating the provider. The `authClient.useSession()` call is deduplicated by the auth library. So the CategorySidebar keeps its own `authClient.useSession()` call just for the user prop on `ProfileButtonClient` and `PendingInvitationsButton` conditional.

Updated version — add back the session hook just for user display:

```tsx
// apps/dashboard/components/layout/category-sidebar.tsx
"use client";

import { authClient } from "@databuddy/auth/client";
import { InfoIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Branding } from "@/components/layout/logo";
import { useCommandSearchOpenAction } from "@/components/ui/command-search";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { PendingInvitationsButton } from "./pending-invitations-button";
import { ProfileButtonClient } from "./profile-button-client";
import { useSidebarNavigation } from "./sidebar-navigation-provider";
import { ThemeToggle } from "./theme-toggle";

const HelpDialog = dynamic(
	() => import("./help-dialog").then((mod) => mod.HelpDialog),
	{
		ssr: false,
		loading: () => null,
	},
);

export function CategorySidebar() {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;

	const { categories, activeCategory, setCategory } = useSidebarNavigation();
	const [helpOpen, setHelpOpen] = useState(false);
	const openCommandSearchAction = useCommandSearchOpenAction();

	return (
		<div className="fixed inset-y-0 left-0 z-40 w-12 border-r bg-transparent">
			<div className="flex h-full flex-col">
				<div className="flex h-12 shrink-0 items-center justify-center border-border border-b">
					<Link
						className="relative shrink-0 transition-opacity hover:opacity-80"
						href="/websites"
					>
						<Branding heightPx={28} priority variant="logomark" />
					</Link>
				</div>

				<div className="shrink-0">
					<Tooltip delayDuration={500}>
						<TooltipTrigger asChild>
							<button
								aria-label="Search"
								className="relative flex h-10 w-full cursor-pointer items-center justify-center border-border border-b hover:bg-sidebar-accent-brighter focus:outline-none"
								onClick={() => openCommandSearchAction()}
								type="button"
							>
								<MagnifyingGlassIcon
									className="size-5 text-sidebar-foreground/75"
									weight="duotone"
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent
							className="max-w-xs text-balance"
							side="right"
							sideOffset={8}
						>
							Search
						</TooltipContent>
					</Tooltip>
				</div>

				{categories.map((category, idx) => {
					const Icon = category.icon;
					const isActive = activeCategory === category.id;
					const isLast = idx === categories.length - 1;
					const borderClass = isActive && !isLast ? "border-accent" : "";
					const hoverClass = isActive
						? ""
						: "hover:bg-sidebar-accent-brighter";
					const boxClass = isLast
						? "border-border border-b"
						: "border-transparent";

					return (
						<Tooltip delayDuration={500} key={category.id}>
							<TooltipTrigger asChild>
								<button
									className={cn(
										borderClass,
										"relative flex h-10 w-full cursor-pointer items-center justify-center",
										"focus:outline-none",
										hoverClass,
										boxClass,
									)}
									onClick={() => setCategory(category.id)}
									type="button"
								>
									{isActive ? (
										<div
											className={cn(
												"absolute top-0 left-0 -z-10 h-full w-full bg-sidebar-accent-brighter",
											)}
										/>
									) : null}
									<Icon
										className={cn(
											"size-5",
											isActive
												? "text-sidebar-ring"
												: "text-sidebar-foreground/75",
										)}
										weight={isActive ? "fill" : "duotone"}
									/>
								</button>
							</TooltipTrigger>
							<TooltipContent side="right" sideOffset={8}>
								{category.name}
							</TooltipContent>
						</Tooltip>
					);
				})}

				<div className="flex-1" />

				<div className="space-y-2 border-t p-2 pb-4">
					<div className="flex justify-center">
						<div className="flex size-8 items-center justify-center">
							<ThemeToggle tooltip />
						</div>
					</div>

					<div className="flex justify-center">
						<Button
							className="flex size-8 items-center justify-center"
							onClick={() => setHelpOpen(true)}
							suppressHydrationWarning
							type="button"
							variant="ghost"
						>
							<InfoIcon
								className="size-5 text-sidebar-foreground/75"
								weight="duotone"
							/>
						</Button>
					</div>

					{user ? (
						<div className="flex justify-center">
							<PendingInvitationsButton />
						</div>
					) : null}
					<div className="flex justify-center">
						<ProfileButtonClient user={user} />
					</div>
				</div>

				<HelpDialog onOpenChangeAction={setHelpOpen} open={helpOpen} />
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/layout/category-sidebar.tsx
git commit -m "refactor(dashboard): simplify category-sidebar to consume context"
```

---

### Task 6: Simplify mobile-sidebar.tsx

**Files:**
- Modify: `apps/dashboard/components/layout/mobile-sidebar.tsx`

Strip data fetching, category computation, and duplicated navigation rendering. Use context + NavigationRenderer.

- [ ] **Step 1: Rewrite mobile-sidebar.tsx**

Read the file first, then replace:

```tsx
// apps/dashboard/components/layout/mobile-sidebar.tsx
"use client";

import { authClient } from "@databuddy/auth/client";
import {
	ListIcon,
	MagnifyingGlassIcon,
	MonitorIcon,
	MoonIcon,
	SignOutIcon,
	SunIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCommandSearchOpenAction } from "@/components/ui/command-search";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Branding } from "./logo";
import { NavigationRenderer } from "./navigation/navigation-renderer";
import { useSidebarNavigation } from "./sidebar-navigation-provider";

function MobileThemeToggle() {
	const { theme, setTheme } = useTheme();
	const currentTheme = theme ?? "system";

	const themes = [
		{ id: "light" as const, icon: SunIcon, label: "Light" },
		{ id: "dark" as const, icon: MoonIcon, label: "Dark" },
		{ id: "system" as const, icon: MonitorIcon, label: "System" },
	];

	return (
		<div className="flex gap-0.5 rounded bg-sidebar-accent/40 p-0.5">
			{themes.map(({ id, icon: Icon, label }) => (
				<button
					className={cn(
						"flex h-7 flex-1 items-center justify-center gap-1.5 rounded text-xs transition-colors",
						currentTheme === id
							? "bg-background font-medium text-sidebar-accent-foreground shadow-sm"
							: "text-sidebar-foreground/50 hover:text-sidebar-foreground",
					)}
					key={id}
					onClick={() => setTheme(id)}
					suppressHydrationWarning
					type="button"
				>
					<Icon
						className="size-3.5"
						suppressHydrationWarning
						weight="duotone"
					/>
					<span suppressHydrationWarning>{label}</span>
				</button>
			))}
		</div>
	);
}

function getInitials(
	name: string | null | undefined,
	email: string | null | undefined,
) {
	if (name) {
		return name
			.split(" ")
			.map((n) => n.at(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}
	return email?.at(0)?.toUpperCase() || "U";
}

export function MobileSidebar() {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;

	const { header, categories, activeCategory, setCategory, pathname } =
		useSidebarNavigation();

	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const openCommandSearchAction = useCommandSearchOpenAction();

	useEffect(() => {
		setIsOpen(false);
	}, [pathname]);

	const handleSignOut = useCallback(async () => {
		setIsOpen(false);
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Logged out successfully");
					router.push("/login");
				},
				onError: (error) => {
					router.push("/login");
					toast.error(error.error.message || "Failed to log out");
				},
			},
		});
	}, [router]);

	return (
		<div className="md:hidden">
			<header className="fixed top-0 right-0 left-0 z-40 h-12 w-full border-b bg-background">
				<div className="flex h-full items-center justify-between px-3">
					<div className="flex items-center gap-2.5">
						<Button
							aria-label="Open navigation menu"
							className="size-9"
							data-track="sidebar-toggle"
							onClick={() => setIsOpen(true)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<ListIcon className="size-5" weight="duotone" />
						</Button>

						<Link
							className="flex min-w-0 select-none items-center gap-2 transition-opacity hover:opacity-80"
							data-track="logo-click"
							href="/websites"
						>
							<Branding heightPx={22} priority variant="primary-logo" />
						</Link>
					</div>

					<Button
						aria-label="Search"
						className="size-9"
						data-track="mobile-search"
						onClick={() => openCommandSearchAction()}
						size="icon"
						type="button"
						variant="ghost"
					>
						<MagnifyingGlassIcon className="size-5" weight="duotone" />
					</Button>
				</div>
			</header>

			<Drawer direction="left" onOpenChange={setIsOpen} open={isOpen}>
				<DrawerContent className="bg-sidebar">
					<div className="flex h-12 shrink-0 items-center border-b px-4">
						<Link
							className="flex select-none items-center gap-2 transition-opacity hover:opacity-80"
							href="/websites"
							onClick={() => setIsOpen(false)}
						>
							<Branding heightPx={22} priority variant="primary-logo" />
						</Link>
					</div>

					{header}

					{categories.length > 1 ? (
						<div className="shrink-0 border-b px-3 py-2.5">
							<div className="flex gap-1 overflow-x-auto">
								{categories.map((category) => {
									const Icon = category.icon;
									const isActive = activeCategory === category.id;
									return (
										<button
											className={cn(
												"flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 font-medium text-xs transition-colors",
												isActive
													? "bg-sidebar-accent text-sidebar-accent-foreground"
													: "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
											)}
											key={category.id}
											onClick={() => setCategory(category.id)}
											type="button"
										>
											<Icon
												className="size-3.5"
												weight={isActive ? "fill" : "duotone"}
											/>
											<span>{category.name}</span>
										</button>
									);
								})}
							</div>
						</div>
					) : null}

					<ScrollArea className="flex-1">
						<NavigationRenderer />
					</ScrollArea>

					<div className="shrink-0 border-t bg-sidebar">
						<div className="border-b px-3 py-2.5">
							<MobileThemeToggle />
						</div>

						{user ? (
							<div className="flex items-center gap-3 px-3 py-3">
								<Avatar className="size-8 shrink-0">
									<AvatarImage
										alt={user.name || "User"}
										src={user.image || undefined}
									/>
									<AvatarFallback className="bg-primary text-primary-foreground text-xs">
										{getInitials(user.name, user.email)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sidebar-foreground text-sm">
										{user.name || "User"}
									</p>
									<p className="truncate text-sidebar-foreground/50 text-xs">
										{user.email}
									</p>
								</div>
								<Button
									aria-label="Sign out"
									className="size-8 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
									onClick={handleSignOut}
									size="icon"
									type="button"
									variant="ghost"
								>
									<SignOutIcon className="size-4" weight="duotone" />
								</Button>
							</div>
						) : null}
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/layout/mobile-sidebar.tsx
git commit -m "refactor(dashboard): simplify mobile-sidebar to consume context"
```

---

### Task 7: Convert navigation-config.tsx to direct icon imports

**Files:**
- Modify: `apps/dashboard/components/layout/navigation/navigation-config.tsx`

Replace the barrel import block (lines 2-48) with direct SSR imports. The existing codebase pattern is `@phosphor-icons/react/dist/ssr/IconName` (e.g. `websites/page.tsx` line 3).

- [ ] **Step 1: Replace the import block**

Read the file first. Replace the barrel import block at lines 2-48 with direct imports:

```tsx
import { GATED_FEATURES } from "@databuddy/shared/types/features";
import { ActivityIcon } from "@phosphor-icons/react/dist/ssr/Activity";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { BookOpenIcon } from "@phosphor-icons/react/dist/ssr/BookOpen";
import { BrowserIcon } from "@phosphor-icons/react/dist/ssr/Browser";
import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { CalendarIcon } from "@phosphor-icons/react/dist/ssr/Calendar";
import { ChartBarIcon } from "@phosphor-icons/react/dist/ssr/ChartBar";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { ChartPieIcon } from "@phosphor-icons/react/dist/ssr/ChartPie";
import { CodeIcon } from "@phosphor-icons/react/dist/ssr/Code";
import { CreditCardIcon } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { FileArrowDownIcon } from "@phosphor-icons/react/dist/ssr/FileArrowDown";
import { FlagIcon } from "@phosphor-icons/react/dist/ssr/Flag";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { GlobeSimpleIcon } from "@phosphor-icons/react/dist/ssr/GlobeSimple";
import { HeartbeatIcon } from "@phosphor-icons/react/dist/ssr/Heartbeat";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { KeyIcon } from "@phosphor-icons/react/dist/ssr/Key";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { LinkIcon } from "@phosphor-icons/react/dist/ssr/Link";
import { LockIcon } from "@phosphor-icons/react/dist/ssr/Lock";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { PlugIcon } from "@phosphor-icons/react/dist/ssr/Plug";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { RoadHorizonIcon } from "@phosphor-icons/react/dist/ssr/RoadHorizon";
import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/ssr/SpeakerHigh";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { TargetIcon } from "@phosphor-icons/react/dist/ssr/Target";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { UserGearIcon } from "@phosphor-icons/react/dist/ssr/UserGear";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import type { Category, NavigationEntry, NavigationSection } from "./types";
```

The rest of the file (lines 50-562) stays exactly the same — only the imports change.

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/dashboard && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/layout/navigation/navigation-config.tsx
git commit -m "perf(dashboard): switch navigation-config to direct icon imports"
```

---

### Task 8: Smoke test the full sidebar

**Files:** None (verification only)

- [ ] **Step 1: Run the dev server and verify**

Run: `cd /Users/iza/Dev/Databuddy && bun run dev:dashboard`

Manually verify:
1. Desktop sidebar renders with category icons on the left, navigation on the right
2. Clicking category icons switches navigation sections
3. Mobile hamburger menu opens the drawer with categories + navigation
4. Navigation items highlight correctly based on current route
5. Accordion sections expand/collapse and persist state
6. Organization selector and website header render in correct contexts

- [ ] **Step 2: Run type checking**

Run: `cd /Users/iza/Dev/Databuddy && bun run check-types`

Expected: No new errors in dashboard.

- [ ] **Step 3: Run linting**

Run: `cd /Users/iza/Dev/Databuddy && bun run lint`

Expected: No new errors.

- [ ] **Step 4: Format**

Run: `cd /Users/iza/Dev/Databuddy && bun run format`

- [ ] **Step 5: Final commit if any formatting changes**

```bash
git add -A
git commit -m "fix(dashboard): format after sidebar refactor"
```
