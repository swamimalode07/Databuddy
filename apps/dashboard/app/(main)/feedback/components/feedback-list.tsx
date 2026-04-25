"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ds/card";
import { EmptyState } from "@/components/ds/empty-state";
import { Skeleton } from "@/components/ds/skeleton";
import { ChatTextIcon } from "@/components/icons/nucleo";
import dayjs from "@/lib/dayjs";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { FeedbackStatusBadge } from "./feedback-status-badge";

const CATEGORY_LABELS: Record<string, string> = {
	bug_report: "Bug Report",
	feature_request: "Feature Request",
	ux_improvement: "UX Improvement",
	performance: "Performance",
	documentation: "Documentation",
	other: "Other",
};

function FeedbackRowSkeleton() {
	return (
		<div className="flex items-start gap-3 px-4 py-3">
			<Skeleton className="mt-0.5 size-8 shrink-0 rounded" />
			<div className="min-w-0 flex-1 space-y-1.5">
				<Skeleton className="h-3.5 w-48 rounded" />
				<Skeleton className="h-3 w-full max-w-64 rounded" />
			</div>
			<Skeleton className="h-5 w-16 shrink-0 rounded-full" />
		</div>
	);
}

export function FeedbackList() {
	const { data: items, isLoading } = useQuery(
		orpc.feedback.list.queryOptions({ input: {} })
	);

	return (
		<Card>
			<Card.Header>
				<Card.Title>Your Feedback</Card.Title>
				<Card.Description>
					Submit feedback to earn credits — approved feedback gets rewarded
				</Card.Description>
			</Card.Header>
			<Card.Content className="p-0">
				{isLoading ? (
					<div className="divide-y divide-border/40">
						<FeedbackRowSkeleton />
						<FeedbackRowSkeleton />
						<FeedbackRowSkeleton />
					</div>
				) : !items || items.length === 0 ? (
					<div className="py-10">
						<EmptyState
							description="Your submitted feedback will appear here."
							icon={<ChatTextIcon />}
							title="No feedback yet"
						/>
					</div>
				) : (
					<div className="divide-y divide-border/40">
						{items.map((item) => (
							<div className="flex items-start gap-3 px-4 py-3" key={item.id}>
								<div
									className={cn(
										"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded text-[11px] font-semibold",
										item.status === "approved"
											? "bg-success/10 text-success"
											: item.status === "rejected"
												? "bg-destructive/10 text-destructive"
												: "bg-secondary text-muted-foreground"
									)}
								>
									{item.status === "approved" && item.creditsAwarded > 0
										? `+${item.creditsAwarded}`
										: CATEGORY_LABELS[item.category]?.charAt(0) ?? "?"}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate font-semibold text-foreground text-sm">
											{item.title}
										</p>
										<FeedbackStatusBadge status={item.status} />
									</div>
									<p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
										{item.description}
									</p>
									<p className="mt-1 text-muted-foreground/60 text-[11px]">
										{CATEGORY_LABELS[item.category] ?? item.category}
										{" · "}
										{dayjs(item.createdAt).fromNow()}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</Card.Content>
		</Card>
	);
}
