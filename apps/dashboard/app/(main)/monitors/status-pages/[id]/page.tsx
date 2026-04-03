"use client";

import {
	ArrowClockwiseIcon,
	BrowserIcon,
	HeartbeatIcon,
	PlusIcon,
	SirenIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/app/(main)/websites/_components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorBoundary } from "@/components/error-boundary";
import { FeatureAccessGate } from "@/components/feature-access-gate";
import { PageNavigation } from "@/components/layout/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { List } from "@/components/ui/composables/list";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusPageUrl } from "@/lib/app-url";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { AddMonitorDialog } from "./_components/add-monitor-dialog";
import {
	type StatusPageMonitor,
	StatusPageMonitorRow,
} from "./_components/status-page-monitor-row";

export default function StatusPageDetailsPage() {
	const params = useParams();
	const statusPageId = params.id as string;
	const queryClient = useQueryClient();
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [monitorToRemove, setMonitorToRemove] = useState<string | null>(null);

	const statusPageQuery = useQuery({
		...orpc.statusPage.get.queryOptions({ input: { statusPageId } }),
		enabled: !!statusPageId,
	});

	const removeMutation = useMutation({
		...orpc.statusPage.removeMonitor.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.statusPage.get.key({ input: { statusPageId } }),
			});
			toast.success("Monitor removed");
			setMonitorToRemove(null);
		},
	});

	const statusPage = statusPageQuery.data;

	const monitorToRemoveData = statusPage?.monitors.find(
		(m: StatusPageMonitor) => m.id === monitorToRemove
	);

	const handleConfirmRemove = () => {
		if (!monitorToRemoveData) {
			return;
		}
		removeMutation.mutate({
			statusPageId: monitorToRemoveData.statusPageId,
			uptimeScheduleId: monitorToRemoveData.uptimeScheduleId,
		});
	};

	return (
		<ErrorBoundary>
			<div className="flex h-full min-h-0 flex-col">
				<PageHeader
					description={
						statusPage
							? `Manage monitors for ${statusPage.name}`
							: "Manage status page monitors"
					}
					icon={<BrowserIcon />}
					right={
						statusPage && (
							<>
								<Button asChild size="sm" variant="outline">
									<Link
										href={getStatusPageUrl(statusPage.slug)}
										rel="noopener noreferrer"
										target="_blank"
									>
										View Page
									</Link>
								</Button>
								<Button
									aria-label="Refresh data"
									disabled={
										statusPageQuery.isLoading || statusPageQuery.isFetching
									}
									onClick={() => statusPageQuery.refetch()}
									size="icon"
									variant="outline"
								>
									<ArrowClockwiseIcon
										className={cn(
											(statusPageQuery.isLoading ||
												statusPageQuery.isFetching) &&
												"animate-spin"
										)}
									/>
								</Button>
								<Button onClick={() => setIsAddDialogOpen(true)} size="sm">
									<PlusIcon />
									Add Monitor
								</Button>
							</>
						)
					}
					title={statusPage?.name ?? "Status Page"}
				/>

				<PageNavigation
					breadcrumb={{ label: "Status Pages", href: "/monitors/status-pages" }}
					currentPage={statusPage?.name ?? "Loading..."}
					variant="breadcrumb"
				/>

				<FeatureAccessGate
					flagKey="monitors"
					loadingFallback={<List.DefaultLoading />}
				>
					<Tabs
						className="flex min-h-0 flex-1 flex-col gap-0"
						defaultValue="monitors"
						variant="navigation"
					>
						<TabsList>
							<TabsTrigger value="monitors">
								<HeartbeatIcon size={16} weight="duotone" />
								Monitors
							</TabsTrigger>
							<TabsTrigger disabled value="incidents">
								<SirenIcon size={16} weight="duotone" />
								Incidents
								<Badge className="px-1.5 py-0" variant="secondary">
									Soon
								</Badge>
							</TabsTrigger>
						</TabsList>

						<TabsContent
							className="min-h-0 flex-1 overflow-y-auto"
							value="monitors"
						>
							{statusPageQuery.isLoading ? (
								<List.DefaultLoading />
							) : statusPageQuery.isError ? (
								<div className="flex flex-1 items-center justify-center py-16">
									<EmptyState
										action={{
											label: "Retry",
											onClick: () => statusPageQuery.refetch(),
										}}
										description="Something went wrong while loading the status page."
										icon={<BrowserIcon weight="duotone" />}
										title="Failed to load"
										variant="error"
									/>
								</div>
							) : statusPage?.monitors.length === 0 ? (
								<div className="flex flex-1 items-center justify-center py-16">
									<EmptyState
										action={{
											label: "Add Monitor",
											onClick: () => setIsAddDialogOpen(true),
										}}
										description="Add monitors to this status page to display their uptime and latency."
										icon={<HeartbeatIcon weight="duotone" />}
										title="No monitors added"
										variant="minimal"
									/>
								</div>
							) : (
								<List className="rounded bg-card">
									{statusPage?.monitors.map((monitor: StatusPageMonitor) => (
										<StatusPageMonitorRow
											key={monitor.id}
											monitor={monitor}
											onRemoveRequestAction={(id) => setMonitorToRemove(id)}
											statusPageId={statusPageId}
										/>
									))}
								</List>
							)}
						</TabsContent>

						<TabsContent
							className="min-h-0 flex-1 overflow-y-auto"
							value="incidents"
						>
							<div className="flex flex-1 items-center justify-center py-16">
								<EmptyState
									description="Incident management is coming soon. You'll be able to create and track incidents directly from here."
									icon={<SirenIcon weight="duotone" />}
									showPlusBadge={false}
									title="Coming Soon"
									variant="minimal"
								/>
							</div>
						</TabsContent>
					</Tabs>
				</FeatureAccessGate>

				<AddMonitorDialog
					existingMonitorIds={
						statusPage?.monitors.map(
							(m: StatusPageMonitor) => m.uptimeScheduleId
						) ?? []
					}
					onAddComplete={() => statusPageQuery.refetch()}
					onOpenChange={setIsAddDialogOpen}
					open={isAddDialogOpen}
					statusPageId={statusPageId}
				/>

				<DeleteDialog
					confirmLabel="Remove"
					description="This monitor will no longer appear on the public status page."
					isDeleting={removeMutation.isPending}
					isOpen={monitorToRemove !== null}
					itemName={
						monitorToRemoveData?.uptimeSchedule.name ??
						monitorToRemoveData?.uptimeSchedule.url ??
						undefined
					}
					onClose={() => setMonitorToRemove(null)}
					onConfirm={handleConfirmRemove}
					title="Remove Monitor"
				/>
			</div>
		</ErrorBoundary>
	);
}
