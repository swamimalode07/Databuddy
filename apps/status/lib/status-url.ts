export const STATUS_URL =
	process.env.NEXT_PUBLIC_STATUS_URL || "https://status.databuddy.cc";

export function getStatusPageUrl(slug: string): string {
	return `${STATUS_URL}/${slug}`;
}
