"use client";

import {
	ArrowRightIcon,
	BrainIcon,
	ChartBarIcon,
	LightningIcon,
	SparkleIcon,
	TableIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/contexts/chat-context";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { AgentInput } from "./agent-input";
import { AgentMessages } from "./agent-messages";
import { ChatHistory } from "./chat-history";
import { setLastChatId } from "./hooks/use-chat-db";
import { NewChatButton } from "./new-chat-button";

interface AgentPageContentProps {
	chatId: string;
	websiteId: string;
}

const FALLBACK_ICONS = [
	ChartBarIcon,
	BrainIcon,
	TableIcon,
	LightningIcon,
] as const;

const CAPABILITY_PROMPTS: Array<{ label: string; prompt: string }> = [
	{
		label: "Deep analysis",
		prompt:
			"Run a deep analysis of my site's performance over the last 30 days and tell me what stands out.",
	},
	{
		label: "Pattern detection",
		prompt:
			"Look across my traffic, sources, and pages and surface any patterns I should know about.",
	},
	{
		label: "Anomaly alerts",
		prompt:
			"Detect anomalies in my analytics from the last 14 days and explain what likely caused them.",
	},
	{
		label: "Auto reports",
		prompt:
			"Generate a weekly performance report covering traffic, sources, top pages, and conversions.",
	},
];

export function AgentPageContent({ chatId, websiteId }: AgentPageContentProps) {
	useEffect(() => {
		setLastChatId(websiteId, chatId);
	}, [websiteId, chatId]);

	const { messages, sendMessage } = useChat();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const autoSentRef = useRef(false);

	useEffect(() => {
		if (autoSentRef.current) {
			return;
		}
		const prompt = searchParams.get("prompt");
		if (!prompt || messages.length > 0) {
			return;
		}

		autoSentRef.current = true;
		sendMessage({ text: prompt });
		// Strip ?prompt= so reloading or sharing the URL doesn't re-send.
		router.replace(pathname);
	}, [searchParams, messages.length, sendMessage, router, pathname]);

	const hasMessages = messages.length > 0;

	const launchPrompt = (text: string) => {
		sendMessage({ text });
	};

	return (
		<div className="relative flex flex-1 overflow-hidden">
			<div className="flex flex-1 flex-col overflow-hidden">
				<header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
					<Avatar className="size-6 rounded">
						<AvatarImage alt="Databunny avatar" src="/databunny.webp" />
						<AvatarFallback className="rounded bg-primary/10 font-semibold text-[10px] text-primary">
							DB
						</AvatarFallback>
					</Avatar>
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<h1 className="truncate font-semibold text-foreground text-sm">
							Databunny
						</h1>
						<span className="rounded border border-border/60 px-1.5 py-px font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
							Alpha
						</span>
					</div>
					<div className="flex shrink-0 items-center gap-1">
						<ChatHistory />
						<NewChatButton />
					</div>
				</header>

				<Conversation className="flex-1 overscroll-none">
					<ConversationContent
						className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6"
						scrollClassName="overscroll-none"
					>
						{hasMessages ? (
							<AgentMessages />
						) : (
							<div className="flex flex-1 items-center justify-center">
								<WelcomeState
									onPromptSelect={launchPrompt}
									websiteId={websiteId}
								/>
							</div>
						)}
						<AgentInput />
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
			</div>
		</div>
	);
}

function WelcomeState({
	onPromptSelect,
	websiteId,
}: {
	onPromptSelect: (text: string) => void;
	websiteId: string;
}) {
	const { data: prompts } = useQuery({
		...orpc.agentChats.suggestedPrompts.queryOptions({
			input: { websiteId },
		}),
		staleTime: 5 * 60 * 1000,
	});

	const items = prompts ?? [];

	return (
		<div className="w-full space-y-8">
			<div className="flex flex-col items-center gap-3">
				<Avatar className="size-10 rounded">
					<AvatarImage alt="Databunny avatar" src="/databunny.webp" />
					<AvatarFallback className="rounded bg-primary/10 font-semibold text-primary text-xs">
						DB
					</AvatarFallback>
				</Avatar>

				<div className="max-w-md space-y-1.5 text-center">
					<h3 className="text-balance font-semibold text-lg">Meet Databunny</h3>
					<p className="text-pretty text-muted-foreground text-sm leading-relaxed">
						Databunny explores your analytics, uncovers patterns, and surfaces
						actionable insights without you babysitting every step.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap justify-center gap-1.5">
				{CAPABILITY_PROMPTS.map((capability) => (
					<button
						className="rounded border border-border/60 bg-card px-2.5 py-1 text-foreground/80 text-xs transition-colors hover:border-border hover:bg-accent/50"
						key={capability.label}
						onClick={() => onPromptSelect(capability.prompt)}
						type="button"
					>
						{capability.label}
					</button>
				))}
			</div>

			<div className="grid gap-2 sm:grid-cols-2">
				{items.map((item, idx) => {
					const Icon =
						item.source === "insight"
							? SparkleIcon
							: (FALLBACK_ICONS[idx] ?? FALLBACK_ICONS[0]);
					return (
						<button
							className={cn(
								"group flex items-start gap-3 rounded border border-border/60 bg-card p-3 text-left",
								"transition-colors hover:border-border hover:bg-accent/40"
							)}
							key={`${item.source}-${item.label}`}
							onClick={() => onPromptSelect(item.prompt)}
							type="button"
						>
							<div
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded",
									item.source === "insight"
										? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
										: "bg-accent/60 text-muted-foreground"
								)}
							>
								<Icon className="size-3.5" weight="duotone" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="line-clamp-2 text-sm leading-tight">
									{item.label}
								</p>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{item.source === "insight"
										? "From your insights"
										: "Suggested"}
								</p>
							</div>
							<ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-transparent transition-colors group-hover:text-muted-foreground" />
						</button>
					);
				})}
			</div>
		</div>
	);
}
