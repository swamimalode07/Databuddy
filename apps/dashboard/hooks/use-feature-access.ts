"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function useFeatureAccess(flagKey: string) {
	const { data, isLoading } = useQuery({
		...orpc.featureInvite.checkAccess.queryOptions({
			input: { flagKey },
		}),
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

	return {
		hasAccess: data?.hasAccess ?? false,
		isLoading,
	};
}
