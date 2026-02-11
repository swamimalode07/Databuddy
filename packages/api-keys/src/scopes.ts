/**
 * Single source of truth for all API key scopes.
 * DB enum (api_scope) must stay in sync with these values.
 */
export const API_SCOPES = [
	"read:data",
	"write:llm",
	"track:events",
	"read:links",
	"write:links",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export type LinksPermission = "read" | "create" | "update" | "delete";

export const LINKS_SCOPE_MAP = {
	read: "read:links",
	create: "write:links",
	update: "write:links",
	delete: "write:links",
} as const satisfies Record<LinksPermission, ApiScope>;
