"use client";

import {
	ArrowClockwiseIcon,
	HeartbeatIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { PageHeader } from "@/app/(main)/websites/_components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorBoundary } from "@/components/error-boundary";
import { MonitorSheet } from "@/components/monitors/monitor-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { type Monitor, MonitorsList } from "./_components/monitors-list";

const MonitorsListSkeleton = () => (
	<div>
		{Array.from({ length: 5 }).map((_, i) => (
			<div
				className="flex items-center gap-3 border-b px-3 py-3 sm:gap-4 sm:px-4"
				key={`skeleton-${i + 1}`}
			>
				<Skeleton className="size-9 shrink-0 rounded" />
				<div className="min-w-0 flex-1 space-y-1.5">
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-14" />
					</div>
					<Skeleton className="h-3 w-48" />
				</div>
				<Skeleton className="size-7 shrink-0 rounded" />
			</div>
		))}
	</div>
);

export default function MonitorsPage() {
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState<{
		id: string;
		url: string;
		name?: string | null;
		granularity: string;
		isPublic?: boolean;
		jsonParsingConfig?: {
			enabled: boolean;
		} | null;
	} | null>(null);

	const {
		data: schedules,
		isLoading,
		refetch,
		isFetching,
		isError,
	} = useQuery({
		...orpc.uptime.listSchedules.queryOptions({ input: {} }),
	});

	const handleCreate = () => {
		setEditingSchedule(null);
		setIsSheetOpen(true);
	};

	const handleEdit = (schedule: Monitor) => {
		setEditingSchedule({
			id: schedule.id,
			url: schedule.url ?? "",
			name: schedule.name,
			granularity: schedule.granularity,
			isPublic: schedule.isPublic,
			jsonParsingConfig: schedule.jsonParsingConfig,
		});
		setIsSheetOpen(true);
	};

	const handleDelete = () => {
		refetch();
	};

	const handleSheetClose = () => {
		setIsSheetOpen(false);
		setEditingSchedule(null);
	};

	return (
		<ErrorBoundary>
			<div className="h-full overflow-y-auto">
				<PageHeader
					count={schedules?.length}
					description="View and manage all your uptime monitors"
					icon={<HeartbeatIcon />}
					right={
						<>
							<Button
								disabled={isLoading || isFetching}
								onClick={() => refetch()}
								size="icon"
								variant="secondary"
							>
								<ArrowClockwiseIcon
									className={cn(
										"size-4",
										(isLoading || isFetching) && "animate-spin"
									)}
								/>
							</Button>
							<Button onClick={handleCreate}>
								<PlusIcon className="mr-2 size-4" />
								Create Monitor
							</Button>
						</>
					}
					title="Monitors"
				/>

				<Suspense fallback={<MonitorsListSkeleton />}>
					{isError ? (
						<div className="flex h-full items-center justify-center py-16">
							<EmptyState
								action={{ label: "Retry", onClick: () => refetch() }}
								description="Something went wrong while fetching monitors."
								icon={<HeartbeatIcon />}
								title="Failed to load monitors"
								variant="minimal"
							/>
						</div>
					) : (
						<MonitorsList
							isLoading={isLoading}
							monitors={(schedules as unknown as Monitor[]) || []}
							onCreateMonitorAction={handleCreate}
							onDeleteMonitorAction={handleDelete}
							onEditMonitorAction={handleEdit}
							onRefetchAction={refetch}
						/>
					)}
				</Suspense>

				{isSheetOpen && (
					<Suspense fallback={null}>
						<MonitorSheet
							onCloseAction={handleSheetClose}
							onSaveAction={refetch}
							open={isSheetOpen}
							schedule={editingSchedule}
						/>
					</Suspense>
				)}
			</div>
		</ErrorBoundary>
	);
}
