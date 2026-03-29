import {
	BotCategory,
	detectBot as detectBotShared,
} from "@databuddy/shared/bot-detection";
import { LRUCache } from "lru-cache";

interface BotResult {
	isBot: boolean;
	isSocialBot: boolean;
}

const cache = new LRUCache<string, BotResult>({ max: 500, ttl: 300_000 });

function detect(userAgent: string): BotResult {
	const cached = cache.get(userAgent);
	if (cached) {
		return cached;
	}

	const result = detectBotShared(userAgent);
	const botResult: BotResult = {
		isBot: result.isBot,
		isSocialBot:
			result.category === BotCategory.SOCIAL_MEDIA ||
			result.category === BotCategory.SEARCH_ENGINE,
	};
	cache.set(userAgent, botResult);
	return botResult;
}

export function isBot(userAgent: string | null): boolean {
	if (!userAgent) {
		return false;
	}
	return detect(userAgent).isBot;
}

export function isSocialBot(userAgent: string | null): boolean {
	if (!userAgent) {
		return false;
	}
	return detect(userAgent).isSocialBot;
}
