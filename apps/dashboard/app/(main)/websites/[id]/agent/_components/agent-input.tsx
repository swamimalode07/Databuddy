"use client";

import {
	ClockCountdownIcon,
	PaperPlaneRightIcon,
	StopIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat, usePendingQueue } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";
import { agentInputAtom } from "./agent-atoms";
import { useEnterSubmit } from "./hooks/use-enter-submit";

export function AgentInput() {
	const { sendMessage, stop, status } = useChat();
	const { messages: pendingMessages, removeAction } = usePendingQueue();
	const isLoading = status === "streaming" || status === "submitted";
	const [input, setInput] = useAtom(agentInputAtom);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { formRef, onKeyDown } = useEnterSubmit();

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!input.trim()) {
			return;
		}
		sendMessage({ text: input.trim() });
		setInput("");
	};

	return (
		<form
			className="sticky z-10 mt-auto"
			onSubmit={handleSubmit}
			ref={formRef}
			style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
		>
			{pendingMessages.length > 0 ? (
				<PendingPill
					messages={pendingMessages}
					onClear={stop}
					onRemove={removeAction}
				/>
			) : null}

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
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Ask Databunny anything about your analytics…"
					ref={textareaRef}
					showFocusIndicator={false}
					value={input}
				/>

				<div className="flex items-center justify-between gap-3 rounded-b border-border/60 border-t bg-muted/30 px-3 py-1.5">
					<KeyboardHints isLoading={isLoading} />

					<div className="flex shrink-0 items-center gap-1">
						{isLoading ? (
							<Button
								aria-label="Stop generation"
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
		return null;
	}
	return (
		<div className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
			<Kbd>Enter</Kbd>
			<span>send</span>
			<span className="hidden text-border sm:inline">·</span>
			<Kbd>⇧Enter</Kbd>
			<span className="hidden sm:inline">newline</span>
		</div>
	);
}

function PendingPill({
	messages,
	onRemove,
	onClear,
}: {
	messages: string[];
	onRemove: (index: number) => void;
	onClear: () => void;
}) {
	const count = messages.length;
	const latestIndex = count - 1;
	const latest = messages[latestIndex] ?? "";
	const preview = latest.length > 60 ? `${latest.slice(0, 60)}…` : latest;

	return (
		<div className="mb-2 flex items-center gap-2 rounded border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs">
			<ClockCountdownIcon
				className="size-3.5 shrink-0 text-muted-foreground"
				weight="duotone"
			/>
			<span className="shrink-0 font-medium text-muted-foreground">
				{count === 1 ? "1 queued" : `${count} queued`}
			</span>
			<span className="min-w-0 flex-1 truncate text-foreground/70">
				{preview}
			</span>
			<button
				aria-label="Remove latest queued message"
				className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
				onClick={() => onRemove(latestIndex)}
				type="button"
			>
				<XIcon className="size-3.5" />
			</button>
			{count > 1 ? (
				<button
					className="shrink-0 text-muted-foreground hover:text-foreground"
					onClick={onClear}
					type="button"
				>
					Clear all
				</button>
			) : null}
		</div>
	);
}
