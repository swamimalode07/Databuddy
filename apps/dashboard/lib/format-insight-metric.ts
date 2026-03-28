import type { InsightMetric, InsightMetricFormat } from "@/lib/insight-types";

const compactNumber = new Intl.NumberFormat("en", {
	notation: "compact",
	maximumFractionDigits: 1,
});

const fullNumber = new Intl.NumberFormat("en", {
	maximumFractionDigits: 1,
});

function formatDurationMs(ms: number): string {
	if (ms < 1000) {
		return `${Math.round(ms)}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatDurationS(s: number): string {
	if (s < 60) {
		return `${s.toFixed(1)}s`;
	}
	const m = Math.floor(s / 60);
	const remainder = Math.round(s % 60);
	return `${m}m ${remainder}s`;
}

export function formatMetric(
	value: number,
	format: InsightMetricFormat
): string {
	switch (format) {
		case "percent":
			return `${fullNumber.format(value)}%`;
		case "duration_ms":
			return formatDurationMs(value);
		case "duration_s":
			return formatDurationS(value);
		default:
			return value >= 10_000
				? compactNumber.format(value)
				: fullNumber.format(value);
	}
}

export function computeMetricChange(metric: InsightMetric): number | null {
	if (metric.previous === undefined || metric.previous === 0) {
		return null;
	}
	return ((metric.current - metric.previous) / metric.previous) * 100;
}
