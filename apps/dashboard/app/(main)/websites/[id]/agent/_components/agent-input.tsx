"use client";

import { ClockCountdownIcon } from "@phosphor-icons/react";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import { StopIcon } from "@phosphor-icons/react";
import { XIcon } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import {
	Queue,
	QueueItem,
	QueueItemAction,
	QueueItemActions,
	QueueItemContent,
	QueueItemIndicator,
	QueueList,
	QueueSection,
	QueueSectionContent,
	QueueSectionLabel,
	QueueSectionTrigger,
} from "@/components/ai-elements/queue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat, usePendingQueue } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";
import { agentInputAtom } from "./agent-atoms";
import { AgentCommandMenu } from "./agent-command-menu";
import { useAgentCommands } from "./hooks/use-agent-commands";
import { useEnterSubmit } from "./hooks/use-enter-submit";

export function AgentInput() {
	const { sendMessage, stop, status } = useChat();
	const { messages: pendingMessages, removeAction } = usePendingQueue();
	const isLoading = status === "streaming" || status === "submitted";
	const [input, setInput] = useAtom(agentInputAtom);
	const agentCommands = useAgentCommands();
	const { formRef, onKeyDown } = useEnterSubmit();

	// Esc-to-abort: while a generation is running, hitting Escape stops it.
	// Skipped if the user is mid-IME composition or focused inside the
	// command menu/popovers (those have their own Escape handling).
	useEffect(() => {
		if (!isLoading) {
			return;
		}
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key !== "Escape" || e.defaultPrevented) {
				return;
			}
			stop();
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isLoading, stop]);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!input.trim()) {
			return;
		}
		sendMessage({ text: input.trim() });
		setInput("");
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		agentCommands.handleInputChange(
			e.target.value,
			e.target.selectionStart ?? 0
		);
	};

	return (
		<form
			className="sticky z-10 mt-auto"
			onSubmit={handleSubmit}
			ref={formRef}
			style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
		>
			{pendingMessages.length > 0 ? (
				<PendingQueue
					messages={pendingMessages}
					onClear={stop}
					onRemove={removeAction}
				/>
			) : null}

			<div className="relative">
				<AgentCommandMenu {...agentCommands} />

				<div
					className={cn(
						"rounded border border-border bg-background shadow-xs transition-colors",
						"focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
					)}
				>
					<Textarea
						className={cn(
							"min-h-0 resize-none border-0 bg-transparent px-3 pt-3 pb-2 text-sm shadow-none",
							"focus-visible:border-0 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:ring-0"
						)}
						maxRows={8}
						minRows={1}
						onChange={handleChange}
						onKeyDown={onKeyDown}
						placeholder="Ask Databunny anything about your analytics…"
						ref={agentCommands.inputRef}
						showFocusIndicator={false}
						value={input}
					/>

					<div className="flex items-center justify-between gap-3 rounded-b border-border/60 border-t bg-muted/30 px-3 py-1.5">
						<KeyboardHints isLoading={isLoading} />

						<div className="flex shrink-0 items-center gap-1">
							{isLoading ? (
								<Button
									aria-label="Stop generation (Esc)"
									className="size-7"
									onClick={stop}
									size="icon"
									type="button"
									variant="ghost"
								>
									<StopIcon className="size-3.5" weight="fill" />
								</Button>
							) : null}
							<Button
								aria-label={isLoading ? "Queue message" : "Send message"}
								className="size-7"
								disabled={!input.trim()}
								size="icon"
								type="submit"
							>
								<PaperPlaneRightIcon
									className="size-3.5"
									weight={input.trim() ? "fill" : "duotone"}
								/>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="rounded border border-border bg-background px-1 font-mono text-[10px] text-muted-foreground">
			{children}
		</kbd>
	);
}

function KeyboardHints({ isLoading }: { isLoading: boolean }) {
	if (isLoading) {
		return (
			<div className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
				<Kbd>Esc</Kbd>
				<span className="truncate">stop generating</span>
			</div>
		);
	}
	return (
		<div className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
			<Kbd>Enter</Kbd>
			<span>send</span>
			<span className="hidden text-border sm:inline">·</span>
			<Kbd>⇧Enter</Kbd>
			<span className="hidden sm:inline">newline</span>
			<span className="hidden text-border sm:inline">·</span>
			<Kbd>/</Kbd>
			<span className="hidden sm:inline">commands</span>
		</div>
	);
}

function PendingQueue({
	messages,
	onRemove,
	onClear,
}: {
	messages: string[];
	onRemove: (index: number) => void;
	onClear: () => void;
}) {
	return (
		<Queue className="mb-3 rounded shadow-none">
			<QueueSection>
				<div className="flex items-center gap-2">
					<QueueSectionTrigger className="flex-1 rounded">
						<QueueSectionLabel
							count={messages.length}
							icon={
								<ClockCountdownIcon className="size-3.5" weight="duotone" />
							}
							label="queued"
						/>
					</QueueSectionTrigger>
					{messages.length > 1 ? (
						<button
							className="text-muted-foreground/60 text-xs hover:text-foreground"
							onClick={onClear}
							type="button"
						>
							Clear all
						</button>
					) : null}
				</div>
				<QueueSectionContent>
					<QueueList>
						{messages.map((text, index) => (
							<QueueItem
								className="rounded"
								key={`${index}-${text.slice(0, 20)}`}
							>
								<div className="flex items-center gap-2">
									<QueueItemIndicator />
									<QueueItemContent className="flex-1">{text}</QueueItemContent>
									<QueueItemActions>
										<QueueItemAction
											aria-label="Remove queued message"
											onClick={() => onRemove(index)}
										>
											<XIcon className="size-3.5" />
										</QueueItemAction>
									</QueueItemActions>
								</div>
							</QueueItem>
						))}
					</QueueList>
				</QueueSectionContent>
			</QueueSection>
		</Queue>
	);
}
