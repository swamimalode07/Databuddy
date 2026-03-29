"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export interface MonitorLight {
	id: string;
	name: string | null;
	url: string | null;
	websiteId: string | null;
	website: {
		id: string;
		name: string | null;
		domain: string;
	} | null;
}

export function useMonitorsLight(options?: { enabled?: boolean }) {
	const query = useQuery({
		...orpc.uptime.listSchedules.queryOptions({ input: {} }),
		enabled: options?.enabled !== false,
		staleTime: 5 * 60 * 1000,
	});

	return {
		monitors: (query.data ?? []) as MonitorLight[],
		isLoading: query.isLoading,
	};
}
