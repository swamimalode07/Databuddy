"use client";

import type { BotDetectionResult } from "@databuddy/shared/bot-detection/types";
import { detectBot } from "@databuddy/shared/bot-detection";
import {
	UA_BOT_NAMES,
	UA_PATTERNS,
} from "@databuddy/shared/bot-detection/ua-patterns";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
	AI_CRAWLER: "AI Crawlers",
	AI_ASSISTANT: "AI Assistants",
	AI_SEARCH: "AI Search",
	SEARCH_ENGINE: "Search Engines",
	SOCIAL_MEDIA: "Social Media",
	SEO_TOOL: "SEO Tools",
	MONITORING: "Monitoring",
	SCRAPER: "Scrapers",
	SECURITY: "Security",
	FEED_FETCHER: "Feed Fetchers",
	WEBHOOK: "Webhooks",
	ADVERTISING: "Advertising",
	AGGREGATOR: "Aggregators",
	ARCHIVER: "Archivers",
	ACADEMIC: "Academic",
	ACCESSIBILITY: "Accessibility",
	OTHER: "Other",
};

const CATEGORY_ORDER = [
	"AI_CRAWLER",
	"AI_ASSISTANT",
	"AI_SEARCH",
	"SEARCH_ENGINE",
	"SOCIAL_MEDIA",
	"SEO_TOOL",
	"MONITORING",
	"SCRAPER",
	"SECURITY",
	"FEED_FETCHER",
	"WEBHOOK",
	"ADVERTISING",
	"AGGREGATOR",
	"ARCHIVER",
	"ACADEMIC",
	"ACCESSIBILITY",
	"OTHER",
];

const CATEGORY_COLORS: Record<string, string> = {
	AI_CRAWLER:
		"border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
	AI_ASSISTANT:
		"border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
	AI_SEARCH:
		"border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
	SEARCH_ENGINE:
		"border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
	SOCIAL_MEDIA:
		"border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-300",
	SEO_TOOL:
		"border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
	MONITORING:
		"border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	SCRAPER:
		"border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
	SECURITY:
		"border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
};

function actionBadgeVariant(action: string) {
	switch (action) {
		case "allow":
			return "green" as const;
		case "track_only":
			return "amber" as const;
		case "block":
			return "destructive" as const;
		default:
			return "gray" as const;
	}
}

interface BotEntry {
	pattern: string;
	name: string;
	category: string;
	detection: BotDetectionResult;
}

function buildBotEntries(): BotEntry[] {
	const entries: BotEntry[] = [];
	const seen = new Set<string>();

	for (const [category, patterns] of Object.entries(UA_PATTERNS)) {
		for (const pattern of patterns) {
			if (seen.has(pattern)) continue;
			seen.add(pattern);
			const name = UA_BOT_NAMES[pattern] || pattern;
			const detection = detectBot(pattern);
			entries.push({ pattern, name, category, detection });
		}
	}

	return entries;
}

function BotRow({ entry }: { entry: BotEntry }) {
	return (
		<div className="group flex items-center gap-3 border-b border-border/50 px-4 py-2.5 text-sm last:border-b-0 hover:bg-accent/30">
			<div className="min-w-0 flex-1">
				<span className="font-medium text-foreground">{entry.name}</span>
				{entry.name !== entry.pattern && (
					<span className="ml-2 font-mono text-muted-foreground text-xs">
						{entry.pattern}
					</span>
				)}
			</div>
			<Badge variant={actionBadgeVariant(entry.detection.action)}>
				{entry.detection.action.replace("_", " ")}
			</Badge>
		</div>
	);
}

export default function AdminPage() {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const allEntries = useMemo(buildBotEntries, []);

	const grouped = useMemo(() => {
		const lower = search.toLowerCase();
		const filtered = lower
			? allEntries.filter(
					(e) =>
						e.name.toLowerCase().includes(lower) ||
						e.pattern.toLowerCase().includes(lower)
				)
			: allEntries;

		const map = new Map<string, BotEntry[]>();
		for (const entry of filtered) {
			const list = map.get(entry.category) || [];
			list.push(entry);
			map.set(entry.category, list);
		}

		return CATEGORY_ORDER
			.filter((cat) => map.has(cat))
			.map((cat) => ({
				category: cat,
				label: CATEGORY_LABELS[cat] || cat,
				entries: map.get(cat)!,
			}));
	}, [allEntries, search]);

	const totalFiltered = grouped.reduce((s, g) => s + g.entries.length, 0);

	const aiCount = useMemo(
		() =>
			allEntries.filter(
				(e) =>
					e.category === "AI_CRAWLER" ||
					e.category === "AI_ASSISTANT" ||
					e.category === "AI_SEARCH"
			).length,
		[allEntries]
	);

	return (
		<div className="flex h-full flex-col">
			<div className="flex min-h-[88px] shrink-0 items-center gap-4 border-b px-4 sm:px-6">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-lg bg-accent">
						<ShieldCheckIcon className="size-5 text-foreground" />
					</div>
					<div>
						<h1 className="font-semibold text-base">Bot Detection Database</h1>
						<p className="text-muted-foreground text-xs">
							{allEntries.length} signatures &middot; {aiCount} AI bots
						</p>
					</div>
				</div>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<div className="shrink-0 border-b px-4 py-3 sm:px-6">
					<div className="relative">
						<MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="h-8 pl-8"
							onChange={(e) => {
								setSearch(e.target.value);
								setActiveCategory(null);
							}}
							placeholder="Search bots..."
							value={search}
						/>
					</div>
				</div>

				<div className="flex min-h-0 flex-1">
					<nav className="hidden w-52 shrink-0 overflow-y-auto border-r py-2 md:block">
						<button
							className={cn(
								"flex w-full items-center justify-between px-4 py-1.5 text-left text-sm transition-colors hover:bg-accent/50",
								activeCategory === null &&
									"bg-accent font-medium text-foreground"
							)}
							onClick={() => setActiveCategory(null)}
							type="button"
						>
							<span>All</span>
							<span className="font-mono text-muted-foreground text-xs">
								{totalFiltered}
							</span>
						</button>
						{grouped.map((g) => (
							<button
								className={cn(
									"flex w-full items-center justify-between px-4 py-1.5 text-left text-sm transition-colors hover:bg-accent/50",
									activeCategory === g.category &&
										"bg-accent font-medium text-foreground"
								)}
								key={g.category}
								onClick={() => setActiveCategory(g.category)}
								type="button"
							>
								<span>{g.label}</span>
								<span className="font-mono text-muted-foreground text-xs">
									{g.entries.length}
								</span>
							</button>
						))}
					</nav>

					<div className="min-h-0 flex-1 overflow-y-auto">
						{grouped
							.filter(
								(g) =>
									activeCategory === null || g.category === activeCategory
							)
							.map((g) => (
								<section key={g.category}>
									<div
										className={cn(
											"sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-2 backdrop-blur-sm",
											CATEGORY_COLORS[g.category] ||
												"border-border bg-muted/50 text-foreground"
										)}
									>
										<RobotIcon className="size-4" />
										<span className="font-semibold text-sm">{g.label}</span>
										<span className="font-mono text-xs opacity-60">
											{g.entries.length}
										</span>
									</div>
									{g.entries.map((entry) => (
										<BotRow entry={entry} key={entry.pattern} />
									))}
								</section>
							))}

						{grouped.length === 0 && (
							<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
								No bots matching &quot;{search}&quot;
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
