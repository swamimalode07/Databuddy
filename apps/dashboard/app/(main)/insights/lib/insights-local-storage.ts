const STORAGE_VERSION = "v1";
const PREFIX = `databuddy.insights.${STORAGE_VERSION}`;

function dismissedStorageKey(organizationId: string): string {
	return `${PREFIX}.dismissed.${organizationId}`;
}

function feedbackStorageKey(organizationId: string): string {
	return `${PREFIX}.feedback.${organizationId}`;
}

export function loadDismissedIds(organizationId: string): string[] {
	if (typeof window === "undefined") {
		return [];
	}
	try {
		const raw = localStorage.getItem(dismissedStorageKey(organizationId));
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter((x): x is string => typeof x === "string");
	} catch {
		return [];
	}
}

export function saveDismissedIds(organizationId: string, ids: string[]): void {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.setItem(
		dismissedStorageKey(organizationId),
		JSON.stringify(ids)
	);
}

export type InsightFeedbackVote = "up" | "down";

export function loadFeedback(
	organizationId: string
): Record<string, InsightFeedbackVote> {
	if (typeof window === "undefined") {
		return {};
	}
	try {
		const raw = localStorage.getItem(feedbackStorageKey(organizationId));
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw) as unknown;
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return {};
		}
		const out: Record<string, InsightFeedbackVote> = {};
		for (const [k, v] of Object.entries(parsed)) {
			if (v === "up" || v === "down") {
				out[k] = v;
			}
		}
		return out;
	} catch {
		return {};
	}
}

export function saveFeedback(
	organizationId: string,
	feedback: Record<string, InsightFeedbackVote>
): void {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.setItem(
		feedbackStorageKey(organizationId),
		JSON.stringify(feedback)
	);
}
