"use client";

import {
	ArrowRightIcon,
	ArrowsClockwiseIcon,
	BrainIcon,
	CheckIcon,
	CopyIcon,
} from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { useCallback, useState } from "react";
import { AIComponent } from "@/components/ai-elements/ai-component";
import { ToolStep } from "@/components/ai-elements/chain-of-thought";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/chat-context";
import { parseContentSegments } from "@/lib/ai-components";
import { formatToolLabel } from "@/lib/tool-display";
import { cn } from "@/lib/utils";
import { AgentErrorMessage } from "./agent-error-message";

type MessagePart = UIMessage["parts"][number];

type ToolMessagePart = MessagePart & {
	type: string;
	input?: Record<string, unknown>;
	output?: unknown;
	state?: string;
};

const TOOL_PREFIX_REGEX = /^tool-/;

function isToolPart(part: MessagePart): part is ToolMessagePart {
	return part.type.startsWith("tool-");
}

function getToolName(part: ToolMessagePart): string {
	return part.type.replace(TOOL_PREFIX_REGEX, "");
}

function getMessageText(message: UIMessage): string {
	return message.parts
		.flatMap((p) => (p.type === "text" ? [p.text] : []))
		.join("\n\n")
		.trim();
}

function getFollowups(message: UIMessage | undefined): string[] {
	const meta = message?.metadata as { followups?: unknown } | undefined;
	if (!Array.isArray(meta?.followups)) {
		return [];
	}
	return meta.followups.filter(
		(s): s is string => typeof s === "string" && s.trim().length > 0
	);
}

function ReasoningMessage({
	part,
	isStreaming,
}: {
	part: Extract<MessagePart, { type: "reasoning" }>;
	isStreaming: boolean;
}) {
	return (
		<Reasoning defaultOpen={isStreaming} isStreaming={isStreaming}>
			<ReasoningTrigger />
			<ReasoningContent>{part.text}</ReasoningContent>
		</Reasoning>
	);
}

/** Merge consecutive identical tool UI labels (same model re-calling the tool). */
function mergeConsecutiveToolStepsForDisplay(
	tools: ToolMessagePart[]
): Array<{ repeatCount: number; tool: ToolMessagePart }> {
	const merged: Array<{ repeatCount: number; tool: ToolMessagePart }> = [];
	for (const tool of tools) {
		const label = formatToolLabel(getToolName(tool), tool.input ?? {});
		const last = merged.at(-1);
		const lastLabel =
			last && formatToolLabel(getToolName(last.tool), last.tool.input ?? {});
		if (last && lastLabel === label) {
			last.repeatCount += 1;
			last.tool = tool;
		} else {
			merged.push({ repeatCount: 1, tool });
		}
	}
	return merged;
}

function collectToolGroups(parts: MessagePart[]) {
	const result: Array<MessagePart | ToolMessagePart[]> = [];
	let toolBuffer: ToolMessagePart[] = [];

	for (const part of parts) {
		if (isToolPart(part)) {
			toolBuffer.push(part);
			continue;
		}
		if (toolBuffer.length > 0) {
			result.push(toolBuffer);
			toolBuffer = [];
		}
		result.push(part);
	}

	if (toolBuffer.length > 0) {
		result.push(toolBuffer);
	}

	return result;
}

function renderToolGroup(
	tools: ToolMessagePart[],
	key: string,
	isLastGroup: boolean,
	isStreaming: boolean
) {
	const merged = mergeConsecutiveToolStepsForDisplay(tools);

	return (
		<div className="space-y-0 py-1" key={key}>
			{merged.map((entry, idx) => {
				const isLast = idx === merged.length - 1;
				const isActive =
					isLastGroup && isStreaming && isLast && !entry.tool.output;
				const baseLabel = formatToolLabel(
					getToolName(entry.tool),
					entry.tool.input ?? {}
				);
				const label =
					entry.repeatCount > 1
						? `${baseLabel} · ${entry.repeatCount}×`
						: baseLabel;
				return (
					<ToolStep
						key={`${key}-${idx}`}
						label={label}
						status={isActive ? "active" : "complete"}
					/>
				);
			})}
		</div>
	);
}

function renderMessagePart(
	part: MessagePart | ToolMessagePart[],
	partIndex: number,
	messageId: string,
	isLastMessage: boolean,
	isStreaming: boolean,
	role: UIMessage["role"]
) {
	const key = `${messageId}-${partIndex}`;
	const isCurrentlyStreaming = isLastMessage && isStreaming;
	const mode =
		role === "user" || !isCurrentlyStreaming ? "static" : "streaming";

	if (Array.isArray(part)) {
		return renderToolGroup(part, key, isLastMessage, isCurrentlyStreaming);
	}

	if (part.type === "reasoning") {
		return (
			<ReasoningMessage
				isStreaming={isCurrentlyStreaming}
				key={key}
				part={part}
			/>
		);
	}

	if (part.type === "text") {
		if (!part.text.trim()) {
			return null;
		}

		const { segments } = parseContentSegments(part.text);
		if (segments.length === 0) {
			return null;
		}

		return (
			<div className="space-y-4" key={key}>
				{segments.map((segment, idx) => {
					if (segment.type === "text") {
						return (
							<MessageResponse
								isAnimating={isCurrentlyStreaming}
								key={`${key}-text-${idx}`}
								mode={mode}
							>
								{segment.content}
							</MessageResponse>
						);
					}
					return (
						<AIComponent
							input={segment.content}
							key={`${key}-component-${idx}`}
							streaming={segment.type === "streaming-component"}
						/>
					);
				})}
			</div>
		);
	}

	if (isToolPart(part)) {
		const isActive = isCurrentlyStreaming && !part.output;
		return (
			<div className="py-1" key={key}>
				<ToolStep
					label={formatToolLabel(getToolName(part), part.input ?? {})}
					status={isActive ? "active" : "complete"}
				/>
			</div>
		);
	}

	return null;
}

function FollowupSuggestions({
	suggestions,
	onSelect,
}: {
	suggestions: string[];
	onSelect: (text: string) => void;
}) {
	if (suggestions.length === 0) {
		return null;
	}
	return (
		<div className="flex flex-col gap-1.5 pt-2">
			<p className="px-1 text-muted-foreground text-xs">Suggested next</p>
			<div className="flex flex-col gap-1">
				{suggestions.map((suggestion) => (
					<button
						className="group flex items-center justify-between gap-2 rounded border border-border/60 bg-card px-3 py-2 text-left text-sm transition-colors hover:border-border hover:bg-accent/40"
						key={suggestion}
						onClick={() => onSelect(suggestion)}
						type="button"
					>
						<span className="line-clamp-2 text-foreground/85">
							{suggestion}
						</span>
						<ArrowRightIcon
							className="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
							weight="bold"
						/>
					</button>
				))}
			</div>
		</div>
	);
}

function AssistantActions({
	message,
	isLast,
	canRegenerate,
	onRegenerate,
}: {
	message: UIMessage;
	isLast: boolean;
	canRegenerate: boolean;
	onRegenerate: () => void;
}) {
	const [copied, setCopied] = useState(false);
	const text = getMessageText(message);

	const handleCopy = useCallback(async () => {
		if (!text) {
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard unavailable — silent failure.
		}
	}, [text]);

	if (!text) {
		return null;
	}

	return (
		<div className="-ml-1.5 flex items-center gap-0.5 pt-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/message:opacity-100">
			<Button
				aria-label={copied ? "Copied" : "Copy response"}
				className="size-7 text-muted-foreground hover:text-foreground"
				onClick={handleCopy}
				size="icon"
				type="button"
				variant="ghost"
			>
				{copied ? (
					<CheckIcon className="size-3.5" weight="bold" />
				) : (
					<CopyIcon className="size-3.5" weight="duotone" />
				)}
			</Button>
			{isLast && canRegenerate ? (
				<Button
					aria-label="Regenerate response"
					className="size-7 text-muted-foreground hover:text-foreground"
					onClick={onRegenerate}
					size="icon"
					type="button"
					variant="ghost"
				>
					<ArrowsClockwiseIcon className="size-3.5" weight="duotone" />
				</Button>
			) : null}
		</div>
	);
}

export function AgentMessages() {
	const { status, messages, error, regenerate, clearError, sendMessage } =
		useChat();
	const hasError = status === "error";
	const isStreaming = status === "streaming" || status === "submitted";
	const lastMessage = messages.at(-1);
	const errorAfterUser =
		hasError && lastMessage?.role === "user" && messages.length > 0;

	if (messages.length === 0) {
		return null;
	}

	const retry = async () => {
		const last = messages.at(-1);
		if (last?.role === "user") {
			const text = getMessageText(last);
			if (text) {
				await sendMessage({ messageId: last.id, text });
				return;
			}
		}
		await regenerate();
	};

	return (
		<>
			{messages.map((message, index) => {
				const isLastMessage = index === messages.length - 1;
				const isAssistant = message.role === "assistant";
				const showError = isLastMessage && hasError && isAssistant;
				const showActions = isAssistant && !(isLastMessage && isStreaming);
				const groupedParts = collectToolGroups(message.parts);

				return (
					<Message
						className="group/message"
						from={message.role}
						key={message.id}
					>
						<MessageContent className={cn(isAssistant ? "w-full" : "")}>
							{groupedParts.map((part, partIndex) =>
								renderMessagePart(
									part,
									partIndex,
									message.id,
									isLastMessage,
									isStreaming,
									message.role
								)
							)}

							{showError ? (
								<AgentErrorMessage
									error={error}
									onDismissAction={clearError}
									onRetryAction={retry}
								/>
							) : null}

							{showActions ? (
								<AssistantActions
									canRegenerate={!hasError}
									isLast={isLastMessage}
									message={message}
									onRegenerate={() => {
										regenerate().catch(() => undefined);
									}}
								/>
							) : null}
						</MessageContent>
					</Message>
				);
			})}

			{errorAfterUser ? (
				<Message from="assistant">
					<MessageContent className="w-full">
						<AgentErrorMessage
							error={error}
							onDismissAction={clearError}
							onRetryAction={retry}
						/>
					</MessageContent>
				</Message>
			) : null}

			{!(isStreaming || hasError) &&
			lastMessage?.role === "assistant" &&
			getFollowups(lastMessage).length > 0 ? (
				<FollowupSuggestions
					onSelect={(text) => {
						sendMessage({ text }).catch(() => undefined);
					}}
					suggestions={getFollowups(lastMessage)}
				/>
			) : null}

			{showTailIndicator(isStreaming, lastMessage) ? (
				<StreamingIndicator />
			) : null}
		</>
	);
}

/**
 * The tail "Thinking" indicator only fills the gap before the assistant
 * has produced ANY part. Once a reasoning, tool, or text part exists,
 * those parts render their own inline progress, so we suppress the tail
 * to avoid duplicate "Thinking" labels stacking on screen.
 */
function showTailIndicator(
	isStreaming: boolean,
	lastMessage: UIMessage | undefined
): boolean {
	if (!isStreaming) {
		return false;
	}
	if (!lastMessage || lastMessage.role !== "assistant") {
		return true;
	}
	return lastMessage.parts.length === 0;
}

function StreamingIndicator() {
	return (
		<div
			className="fade-in flex w-full animate-in items-center gap-2 duration-200"
			data-role="assistant"
		>
			<BrainIcon
				className="size-4 shrink-0 text-muted-foreground"
				weight="duotone"
			/>
			<Shimmer as="span" className="text-sm" duration={1} spread={4}>
				Thinking
			</Shimmer>
		</div>
	);
}
