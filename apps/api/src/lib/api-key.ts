/**
 * Re-exports from @databuddy/api-keys.
 * Local consumers import from here for convenience.
 */
export {
	type ApiKeyRow,
	type ApiScope,
	collectScopes,
	extractSecret,
	getAccessibleWebsiteIds,
	getApiKeyFromHeader,
	getEffectiveScopes,
	hasGlobalAccess,
	hasKeyAllScopes,
	hasKeyAnyScope,
	hasKeyScope,
	hasWebsiteAllScopes,
	hasWebsiteAnyScope,
	hasWebsiteScope,
	isApiKeyPresent,
	keys,
	resolveEffectiveScopesForWebsite,
} from "@databuddy/api-keys/resolve";
