"use client";

import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { Skeleton } from "@/components/ds/skeleton";
import { LightningIcon, TrendUpIcon } from "@/components/icons/nucleo";
import { cn } from "@/lib/utils";

interface RewardTier {
	creditsRequired: number;
	rewardAmount: number;
	rewardType: string;
}

interface CreditsPanelProps {
	available: number;
	isLoading: boolean;
	onRedeemAction: (tierIndex: number) => void;
	redeemingTier: number | null;
	tiers: readonly RewardTier[];
	totalEarned: number;
	totalSpent: number;
}

function BalanceSkeleton() {
	return (
		<div className="space-y-4 p-4">
			<div className="space-y-1">
				<Skeleton className="h-3 w-16 rounded" />
				<Skeleton className="h-8 w-20 rounded" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="h-3 w-20 rounded" />
				<Skeleton className="h-3 w-20 rounded" />
			</div>
		</div>
	);
}

export function CreditsPanel({
	available,
	totalEarned,
	totalSpent,
	isLoading,
	tiers,
	onRedeemAction,
	redeemingTier,
}: CreditsPanelProps) {
	if (isLoading) {
		return (
			<Card>
				<BalanceSkeleton />
				<div className="space-y-2 border-t p-4">
					<Skeleton className="h-3 w-24 rounded" />
					{[1, 2, 3, 4].map((n) => (
						<Skeleton className="h-14 w-full rounded" key={n} />
					))}
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<div className="p-4">
				<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					Available Credits
				</p>
				<p className="mt-1 font-semibold text-3xl tabular-nums text-foreground">
					{available.toLocaleString()}
				</p>
				<div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
					<span className="flex items-center gap-1 tabular-nums">
						<TrendUpIcon className="size-3.5 shrink-0 text-success" />
						{totalEarned.toLocaleString()} earned
					</span>
					<span className="tabular-nums">
						{totalSpent.toLocaleString()} spent
					</span>
				</div>
			</div>

			<div className="border-t p-4">
				<p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					Redeem Credits
				</p>
				<div className="space-y-2">
					{tiers.map((tier, index) => {
						const canAfford = available >= tier.creditsRequired;
						return (
							<div
								className={cn(
									"flex items-center justify-between rounded bg-secondary px-3 py-2.5",
									!canAfford && "opacity-40"
								)}
								key={tier.creditsRequired}
							>
								<div className="flex items-center gap-2.5">
									<LightningIcon className="size-4 shrink-0 text-foreground" />
									<div>
										<p className="font-semibold text-sm tabular-nums">
											{tier.rewardAmount.toLocaleString()} {tier.rewardType}
										</p>
									</div>
								</div>
								<Button
									disabled={!canAfford || redeemingTier === index}
									loading={redeemingTier === index}
									onClick={() => onRedeemAction(index)}
									size="sm"
									variant={canAfford ? "primary" : "secondary"}
								>
									{tier.creditsRequired}
								</Button>
							</div>
						);
					})}
				</div>
			</div>
		</Card>
	);
}
