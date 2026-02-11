/**
 * Thin tracing wrapper around @databuddy/api-keys.
 */
import {
	type ApiKeyRow,
	extractSecret,
	getApiKeyFromHeader as resolveApiKey,
} from "@databuddy/api-keys/resolve";
import { record, setAttributes } from "@lib/tracing";

export type { ApiKeyRow, ApiScope } from "@databuddy/api-keys/resolve";
export { hasKeyScope } from "@databuddy/api-keys/resolve";

export function getApiKeyFromHeader(
	headers: Headers
): Promise<ApiKeyRow | null> {
	return record("getApiKeyFromHeader", async () => {
		const secret = extractSecret(headers);
		if (!secret) {
			setAttributes({ api_key_present: false });
			return null;
		}

		setAttributes({ api_key_present: true });
		const key = await resolveApiKey(headers);

		setAttributes({
			api_key_valid: Boolean(key),
			...(!key && { api_key_reason: "invalid_or_expired" }),
		});

		return key;
	});
}
