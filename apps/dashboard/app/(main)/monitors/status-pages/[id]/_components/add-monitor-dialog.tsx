"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organizations-provider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { orpc } from "@/lib/orpc";

interface AddMonitorDialogProps {
	statusPageId: string;
	existingMonitorIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddComplete: () => void;
}

export function AddMonitorDialog({
	statusPageId,
	existingMonitorIds,
	open,
	onOpenChange,
	onAddComplete,
}: AddMonitorDialogProps) {
	const { activeOrganizationId, activeOrganization } =
		useOrganizationsContext();
	const resolvedOrgId = activeOrganization?.id ?? activeOrganizationId ?? "";

	const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");

	const schedulesQuery = useQuery({
		...orpc.uptime.listSchedules.queryOptions({
			input: { organizationId: resolvedOrgId },
		}),
		enabled: open && !!resolvedOrgId,
	});

	const addMutation = useMutation({
		...orpc.statusPage.addMonitor.mutationOptions(),
	});

	const availableSchedules =
		schedulesQuery.data?.filter((s) => !existingMonitorIds.includes(s.id)) ??
		[];

	const handleAdd = async () => {
		if (!selectedScheduleId) {
			return;
		}

		try {
			await addMutation.mutateAsync({
				statusPageId,
				uptimeScheduleId: selectedScheduleId,
			});
			toast.success("Monitor added to status page");
			onAddComplete();
			onOpenChange(false);
			setSelectedScheduleId("");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to add monitor";
			toast.error(errorMessage);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Monitor</DialogTitle>
					<DialogDescription>
						Select an existing uptime monitor to display on this status page.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<Label className="mb-2 block">Monitor</Label>
					<Select
						disabled={schedulesQuery.isLoading}
						onValueChange={setSelectedScheduleId}
						value={selectedScheduleId}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a monitor..." />
						</SelectTrigger>
						<SelectContent>
							{availableSchedules.length === 0 ? (
								<SelectItem disabled value="empty">
									No available monitors
								</SelectItem>
							) : (
								availableSchedules.map((schedule) => (
									<SelectItem key={schedule.id} value={schedule.id}>
										{schedule.name || schedule.url}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={!selectedScheduleId || addMutation.isPending}
						onClick={handleAdd}
					>
						{addMutation.isPending ? "Adding..." : "Add Monitor"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
