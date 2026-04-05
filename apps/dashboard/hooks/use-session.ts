"use client";

import { authClient } from "@databuddy/auth/client";
import { useQuery } from "@tanstack/react-query";

export const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function useSession() {
	return useQuery({
		queryKey: SESSION_QUERY_KEY,
		queryFn: async () => {
			const result = await authClient.getSession();
			return result.data;
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
}
