"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InsightFeedbackVote } from "@/app/(main)/insights/lib/insights-local-storage";
import {
	loadDismissedIds,
	loadFeedback,
	saveDismissedIds,
	saveFeedback,
} from "@/app/(main)/insights/lib/insights-local-storage";

export function useInsightsLocalState(organizationId: string | undefined) {
	const [dismissedIds, setDismissedIds] = useState<string[]>([]);
	const [feedbackById, setFeedbackById] = useState<
		Record<string, InsightFeedbackVote>
	>({});
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		if (!organizationId) {
			setDismissedIds([]);
			setFeedbackById({});
			setHydrated(true);
			return;
		}
		setDismissedIds(loadDismissedIds(organizationId));
		setFeedbackById(loadFeedback(organizationId));
		setHydrated(true);
	}, [organizationId]);

	const dismissAction = useCallback(
		(insightId: string) => {
			if (!organizationId) {
				return;
			}
			setDismissedIds((prev) => {
				if (prev.includes(insightId)) {
					return prev;
				}
				const next = [...prev, insightId];
				saveDismissedIds(organizationId, next);
				return next;
			});
		},
		[organizationId]
	);

	const clearAllDismissedAction = useCallback(() => {
		if (!organizationId) {
			return;
		}
		setDismissedIds([]);
		saveDismissedIds(organizationId, []);
	}, [organizationId]);

	const setFeedbackAction = useCallback(
		(insightId: string, vote: InsightFeedbackVote | null) => {
			if (!organizationId) {
				return;
			}
			setFeedbackById((prev) => {
				const next = { ...prev };
				if (vote === null) {
					delete next[insightId];
				} else {
					next[insightId] = vote;
				}
				saveFeedback(organizationId, next);
				return next;
			});
		},
		[organizationId]
	);

	const dismissedIdSet = useMemo(() => new Set(dismissedIds), [dismissedIds]);

	return {
		hydrated,
		dismissedIdSet,
		dismissedIds,
		dismissAction,
		clearAllDismissedAction,
		feedbackById,
		setFeedbackAction,
	};
}
