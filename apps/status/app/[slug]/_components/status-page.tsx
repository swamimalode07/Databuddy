import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@databuddy/ui";
import {
	CheckCircleIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@databuddy/ui/icons";
import { MinusCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { MonitorRowInteractive } from "./monitor-row-interactive";

function StatusRoot({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-10", className)} data-slot="status-page">
			{children}
		</div>
	);
}

const STATUS_CONFIG = {
	operational: {
		label: "All Systems Operational",
		className: "text-emerald-600 dark:text-emerald-400",
		dotClass: "bg-emerald-500",
		Icon: CheckCircleIcon,
		pulse: true,
	},
	degraded: {
		label: "Partial System Outage",
		className: "text-amber-600 dark:text-amber-400",
		dotClass: "bg-amber-500",
		Icon: WarningCircleIcon,
		pulse: false,
	},
	outage: {
		label: "Major System Outage",
		className: "text-red-600 dark:text-red-400",
		dotClass: "bg-red-500",
		Icon: XCircleIcon,
		pulse: false,
	},
} as const;

interface StatusHeaderProps {
	children?: ReactNode;
	className?: string;
	description?: string;
	logoUrl?: string | null;
	name: string;
	status: "operational" | "degraded" | "outage";
	websiteUrl?: string | null;
}

function StatusHeader({
	name,
	description,
	logoUrl,
	websiteUrl,
	status,
	children,
	className,
}: StatusHeaderProps) {
	const config = STATUS_CONFIG[status];
	const heading = (
		<h1 className="font-semibold text-[22px] tracking-tight">{name}</h1>
	);

	return (
		<div className={cn("space-y-4", className)} data-slot="status-header">
			<div className="flex items-center gap-3.5">
				{logoUrl ? (
					<Image
						alt=""
						className="size-10 shrink-0 rounded object-contain"
						height={40}
						src={logoUrl}
						unoptimized
						width={40}
					/>
				) : null}
				<div className="min-w-0 flex-1">
					{websiteUrl ? (
						<a
							className="transition-opacity hover:opacity-80"
							href={websiteUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							{heading}
						</a>
					) : (
						heading
					)}
					{description && (
						<p className="mt-0.5 text-[13px] text-muted-foreground">
							{description}
						</p>
					)}
				</div>
				{children}
			</div>

			<div className={cn("flex items-center gap-2.5", config.className)}>
				<div className="relative flex shrink-0 items-center justify-center">
					{config.pulse ? (
						<span
							className={cn(
								"absolute size-6 animate-ping rounded-full opacity-20",
								config.dotClass
							)}
						/>
					) : null}
					<config.Icon className="relative size-6 shrink-0" weight="fill" />
				</div>
				<span className="font-medium text-[15px]">{config.label}</span>
			</div>
		</div>
	);
}

function StatusMonitorList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-6", className)} data-slot="status-monitors">
			{children}
		</div>
	);
}

const MONITOR_STATUS = {
	up: { Icon: CheckCircleIcon, className: "text-emerald-500" },
	degraded: { Icon: WarningCircleIcon, className: "text-amber-500" },
	down: { Icon: XCircleIcon, className: "text-red-500" },
	unknown: { Icon: MinusCircleIcon, className: "text-muted-foreground" },
} as const;

interface DailyData {
	avg_response_time?: number;
	date: string;
	p95_response_time?: number;
	uptime_percentage?: number;
}

function uptimeColor(pct: number): string {
	if (pct >= 99.9) {
		return "text-emerald-600 dark:text-emerald-400";
	}
	if (pct >= 99) {
		return "text-amber-600 dark:text-amber-400";
	}
	return "text-red-600 dark:text-red-400";
}

function StatusMonitorCard({
	id,
	anchorId,
	name,
	domain,
	currentStatus,
	uptimePercentage,
	dailyData,
	days,
}: {
	anchorId: string;
	currentStatus: "up" | "down" | "degraded" | "unknown";
	dailyData: DailyData[];
	days: number;
	domain?: string;
	id: string;
	name: string;
	uptimePercentage?: number;
}) {
	const statusConfig = MONITOR_STATUS[currentStatus];
	const hasLatencyData = dailyData.some(
		(d) => d.avg_response_time != null || d.p95_response_time != null
	);

	return (
		<div className="scroll-mt-20" id={anchorId}>
			<div className="flex items-center justify-between pb-2.5">
				<div className="flex items-center gap-2.5 overflow-hidden">
					<statusConfig.Icon
						className={cn("size-5 shrink-0", statusConfig.className)}
						weight="fill"
					/>
					<span className="truncate font-medium text-[15px]">{name}</span>
					{domain && (
						<span className="hidden truncate text-[13px] text-muted-foreground sm:inline">
							{domain}
						</span>
					)}
				</div>
				{uptimePercentage !== undefined && (
					<span
						className={cn(
							"shrink-0 font-mono font-semibold text-[15px] tabular-nums",
							uptimeColor(uptimePercentage)
						)}
					>
						{uptimePercentage.toFixed(2)}%
					</span>
				)}
			</div>

			<MonitorRowInteractive
				dailyData={dailyData}
				days={days}
				hasLatencyData={hasLatencyData}
				hasUptimeData={uptimePercentage !== undefined}
				id={id}
			/>
		</div>
	);
}

function StatusFooter({
	timestamp,
	className,
}: {
	className?: string;
	timestamp: string | null;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between text-muted-foreground/60 text-xs",
				className
			)}
		>
			<div className="flex items-center gap-2">
				<CheckCircleIcon
					className="size-3.5 shrink-0 text-emerald-500/60"
					weight="fill"
				/>
				<span>No incidents in the last 90 days</span>
			</div>
			{timestamp && (
				<span className="tabular-nums">
					Updated{" "}
					{new Date(timestamp).toLocaleTimeString("en-US", {
						hour: "numeric",
						minute: "2-digit",
					})}
				</span>
			)}
		</div>
	);
}

StatusRoot.displayName = "Status";

export const Status: typeof StatusRoot & {
	Footer: typeof StatusFooter;
	Header: typeof StatusHeader;
	MonitorCard: typeof StatusMonitorCard;
	MonitorList: typeof StatusMonitorList;
} = Object.assign(StatusRoot, {
	Footer: StatusFooter,
	Header: StatusHeader,
	MonitorCard: StatusMonitorCard,
	MonitorList: StatusMonitorList,
});
