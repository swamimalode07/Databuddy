import { auth, websitesApi } from "@databuddy/auth";
import { db, eq, member } from "@databuddy/db";
import { getAccessibleWebsites } from "../../lib/accessible-websites";
import {
	type ApiKeyRow,
	getAccessibleWebsiteIds,
	hasGlobalAccess,
	hasKeyScope,
	hasWebsiteScope,
} from "../../lib/api-key";
import { getCachedWebsite, validateWebsite } from "../../lib/website-utils";
import type { AppContext } from "../config/context";

const PROTOCOL_RE = /^https?:\/\//;

export interface WebsiteSelectorInput {
	websiteDomain?: string;
	websiteId?: string;
	websiteName?: string;
}

export interface RequestPrincipal {
	apiKey: ApiKeyRow | null;
	userId: string | null;
}

export async function ensureWebsiteAccess(
	websiteId: string,
	headers: Headers,
	apiKey: ApiKeyRow | null
): Promise<{ domain: string } | Error> {
	const validation = await validateWebsite(websiteId);
	if (!(validation.success && validation.website)) {
		return new Error(validation.error ?? "Website not found");
	}
	const { website } = validation;

	if (website.isPublic) {
		return { domain: website.domain ?? "unknown" };
	}

	if (apiKey) {
		if (!hasKeyScope(apiKey, "read:data")) {
			return new Error("API key missing read:data scope");
		}
		const accessibleIds = getAccessibleWebsiteIds(apiKey);
		const hasWebsiteAccess =
			hasWebsiteScope(apiKey, websiteId, "read:data") ||
			accessibleIds.includes(websiteId) ||
			(hasGlobalAccess(apiKey) &&
				apiKey.organizationId === website.organizationId);
		if (!hasWebsiteAccess) {
			return new Error("Access denied to this website");
		}
		return { domain: website.domain ?? "unknown" };
	}

	const session = await auth.api.getSession({ headers });
	if (session?.user?.role === "ADMIN") {
		return { domain: website.domain ?? "unknown" };
	}

	const hasPermission =
		website.organizationId &&
		(
			await websitesApi.hasPermission({
				headers,
				body: { permissions: { website: ["read"] } },
			})
		).success;
	if (!hasPermission) {
		return new Error("Access denied to this website");
	}
	return { domain: website.domain ?? "unknown" };
}

export async function resolveWebsiteId(
	input: WebsiteSelectorInput,
	principal: RequestPrincipal
): Promise<string | Error> {
	if (input.websiteId) {
		return input.websiteId;
	}

	const authCtx = {
		user: principal.userId ? { id: principal.userId } : null,
		apiKey: principal.apiKey,
	};
	const list = await getAccessibleWebsites(authCtx);

	if (input.websiteDomain) {
		const domain = input.websiteDomain.toLowerCase().replace(PROTOCOL_RE, "");
		const match = list.find((w) => w.domain?.toLowerCase() === domain);
		if (match) {
			return match.id;
		}
		return new Error(
			`No accessible website found with domain "${input.websiteDomain}"`
		);
	}

	if (input.websiteName) {
		const name = input.websiteName.toLowerCase();
		const match = list.find((w) => w.name?.toLowerCase() === name);
		if (match) {
			return match.id;
		}
		return new Error(
			`No accessible website found with name "${input.websiteName}"`
		);
	}

	return new Error(
		"One of websiteId, websiteName, or websiteDomain is required"
	);
}

export async function getOrganizationId(
	websiteId: string
): Promise<string | Error> {
	const website = await getCachedWebsite(websiteId);
	if (!website) {
		return new Error("Website not found");
	}
	if (!website.organizationId) {
		return new Error("Website is not associated with an organization");
	}
	return website.organizationId;
}

/**
 * Resolve the set of organization IDs to query, based on auth principal and
 * an optional explicit websiteId. Used by org-wide tools (insights, summaries).
 *
 * Resolution order:
 * 1. If websiteId provided → resolve via getOrganizationId (single org)
 * 2. If API key → use apiKey.organizationId (single org)
 * 3. If session user → list all org memberships (multi-org)
 */
export async function resolveOrganizationIds(
	websiteId: string | undefined,
	principal: RequestPrincipal
): Promise<string[] | Error> {
	if (websiteId) {
		const orgId = await getOrganizationId(websiteId);
		if (orgId instanceof Error) {
			return orgId;
		}
		return [orgId];
	}
	if (principal.apiKey?.organizationId) {
		return [principal.apiKey.organizationId];
	}
	if (principal.userId) {
		const memberships = await db.query.member.findMany({
			where: eq(member.userId, principal.userId),
			columns: { organizationId: true },
		});
		if (memberships.length === 0) {
			return new Error("User has no organization memberships");
		}
		return memberships.map((m) => m.organizationId);
	}
	return new Error("Could not determine organization");
}

export function buildRpcContext(
	principal: RequestPrincipal & {
		requestHeaders: Headers;
	}
): AppContext {
	return {
		userId: principal.userId ?? "",
		websiteId: "",
		websiteDomain: "",
		timezone: "UTC",
		currentDateTime: new Date().toISOString(),
		chatId: "",
		requestHeaders: principal.requestHeaders,
	};
}

export function coerceQueriesArray(val: unknown): unknown[] | undefined {
	if (Array.isArray(val)) {
		return val;
	}
	if (typeof val === "string") {
		try {
			const parsed = JSON.parse(val) as unknown;
			return Array.isArray(parsed) ? parsed : undefined;
		} catch {
			return undefined;
		}
	}
	return undefined;
}
