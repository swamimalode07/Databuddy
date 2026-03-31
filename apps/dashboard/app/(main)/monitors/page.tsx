"use client";

import {
	ArrowClockwiseIcon,
	HeartbeatIcon,
	PlusIcon,
	UserPlusIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { PageHeader } from "@/app/(main)/websites/_components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorBoundary } from "@/components/error-boundary";
import { FeatureAccessGate } from "@/components/feature-access-gate";
import { MonitorSheet } from "@/components/monitors/monitor-sheet";
import { FeatureInviteDialog } from "@/components/organizations/feature-invite-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { type Monitor, MonitorsList } from "./_components/monitors-list";

const MonitorsListSkeleton = () => (
	<div className="w-full overflow-x-auto">
		{Array.from({ length: 5 }).map((_, i) => (
			<div
				className="flex h-15 items-center gap-4 border-b px-4"
				key={`skeleton-${i + 1}`}
			>
				<Skeleton className="size-8 shrink-0 rounded" />
				<Skeleton className="h-4 w-40 shrink-0 lg:w-52" />
				<Skeleton className="h-3 min-w-0 flex-1" />
				<Skeleton className="hidden h-3 w-14 shrink-0 md:block" />
				<Skeleton className="hidden h-5 w-16 shrink-0 md:block" />
				<Skeleton className="hidden h-5 w-32 shrink-0 lg:block lg:w-44" />
				<Skeleton className="hidden h-4 w-14 shrink-0 lg:block" />
				<Skeleton className="h-5 w-16 shrink-0" />
				<Skeleton className="size-8 shrink-0 rounded" />
			</div>
		))}
	</div>
);

export default function MonitorsPage() {
	const { hasAccess, isLoading: isAccessLoading } =
		useFeatureAccess("monitors");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [showInviteDialog, setShowInviteDialog] = useState(false);
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
		enabled: hasAccess,
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
					count={hasAccess ? schedules?.length : undefined}
					description="View and manage all your uptime monitors"
					icon={<HeartbeatIcon />}
					right={
						hasAccess ? (
							<>
								<Button
									onClick={() => setShowInviteDialog(true)}
									variant="outline"
								>
									<UserPlusIcon weight="duotone" />
									Invite
								</Button>
								<Button
									aria-label="Refresh monitors"
									disabled={isLoading || isFetching}
									onClick={() => refetch()}
									size="icon"
									variant="outline"
								>
									<ArrowClockwiseIcon
										className={cn((isLoading || isFetching) && "animate-spin")}
									/>
								</Button>
								<Button onClick={handleCreate}>
									<PlusIcon />
									Create Monitor
								</Button>
							</>
						) : undefined
					}
					title="Monitors"
				/>

				<FeatureAccessGate
					flagKey="monitors"
					loadingFallback={<MonitorsListSkeleton />}
				>
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
							isLoading={isAccessLoading || isLoading}
							monitors={(schedules as unknown as Monitor[]) || []}
							onCreateMonitorAction={handleCreate}
							onDeleteMonitorAction={handleDelete}
							onEditMonitorAction={handleEdit}
							onRefetchAction={refetch}
						/>
					)}
				</FeatureAccessGate>

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
				{showInviteDialog && (
					<FeatureInviteDialog
						flagKey="monitors"
						onOpenChangeAction={setShowInviteDialog}
						open={showInviteDialog}
					/>
				)}
			</div>
		</ErrorBoundary>
	);
}
