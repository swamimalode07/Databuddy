"use client";

import { useFlags } from "@databuddy/sdk/react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { DropdownMenu } from "@/components/ds/dropdown-menu";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import {
	filterCategoriesByFlags,
	filterCategoriesForRoute,
	getContextConfig,
	getDefaultCategory,
} from "./navigation-config";

interface MobileCategorySelectorProps {
	onCategoryChangeAction?: (categoryId: string) => void;
	selectedCategory?: string;
}

export function MobileCategorySelector({
	onCategoryChangeAction,
	selectedCategory,
}: MobileCategorySelectorProps) {
	const pathname = usePathname();
	const { getFlag } = useFlags();
	const isHydrated = useHydrated();

	const { categories, defaultCategory } = useMemo(() => {
		const config = getContextConfig(pathname);
		const defaultCat = getDefaultCategory(pathname);
		const filteredCategories = filterCategoriesByFlags(
			filterCategoriesForRoute(config.categories, pathname),
			isHydrated,
			getFlag
		);

		return { categories: filteredCategories, defaultCategory: defaultCat };
	}, [pathname, isHydrated, getFlag]);

	const activeCategory = selectedCategory || defaultCategory;
	const currentCategory = categories.find((cat) => cat.id === activeCategory);

	return (
		<div className="p-3 md:hidden">
			<DropdownMenu>
				<DropdownMenu.Trigger
					className={cn(
						"flex h-10 w-full items-center justify-between rounded-md border border-sidebar-border px-3",
						"bg-secondary text-foreground text-sm",
						"transition-colors duration-(--duration-quick) ease-(--ease-smooth)",
						"hover:bg-interactive-hover",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					)}
				>
					<div className="flex items-center gap-2">
						{currentCategory?.icon ? (
							<currentCategory.icon
								className="size-4 text-sidebar-foreground"
								weight="duotone"
							/>
						) : null}
						<span className="text-sidebar-foreground text-sm">
							{currentCategory?.name || "Select Category"}
						</span>
					</div>
					<CaretDownIcon className="size-4" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					align="start"
					className="z-120 w-full min-w-(--anchor-width)"
				>
					{categories.map((category) => {
						const Icon = category.icon;
						const isActive = activeCategory === category.id;
						return (
							<DropdownMenu.Item
								className={cn(
									isActive
										? "bg-sidebar-accent text-sidebar-accent-foreground"
										: ""
								)}
								key={category.id}
								onClick={() => onCategoryChangeAction?.(category.id)}
							>
								<Icon
									className={cn(
										"size-4",
										isActive ? "text-sidebar-ring" : "text-muted-foreground"
									)}
									weight={isActive ? "fill" : "duotone"}
								/>
								<span>{category.name}</span>
							</DropdownMenu.Item>
						);
					})}
				</DropdownMenu.Content>
			</DropdownMenu>
		</div>
	);
}
