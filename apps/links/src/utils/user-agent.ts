import { LRUCache } from "lru-cache";
import { UAParser } from "ua-parser-js";

interface ParsedUA {
	browserName: string | null;
	deviceType: string | null;
}

const cache = new LRUCache<string, ParsedUA>({ max: 500, ttl: 300_000 });

export function parseUserAgent(userAgent: string | null): ParsedUA {
	if (!userAgent) {
		return { browserName: null, deviceType: null };
	}

	const cached = cache.get(userAgent);
	if (cached) {
		return cached;
	}

	try {
		const parser = new UAParser(userAgent);
		const result = parser.getResult();
		const parsed: ParsedUA = {
			browserName: result.browser.name || null,
			deviceType: result.device.type || "desktop",
		};
		cache.set(userAgent, parsed);
		return parsed;
	} catch {
		return { browserName: null, deviceType: null };
	}
}
