import type { LanguageModelUsage } from "ai";
import { getUsage } from "tokenlens/helpers";
import { vercelModels } from "tokenlens/providers/vercel";

/**
 * Best-effort token telemetry for the agent route.
 *
 * - Always returns raw token counts from the AI SDK usage object.
 * - Looks up USD cost in the Vercel AI Gateway catalog. Falls back to
 *   `anthropic/claude-4-sonnet` when the exact model id isn't recognized
 *   (the gateway uses `claude-sonnet-4.6` which the catalog doesn't ship
 *   yet — directionally correct cost). The `costFallback` flag lets
 *   downstream analytics filter or correct estimated rows.
 */

const FALLBACK_MODEL_ID = "anthropic/claude-4-sonnet";

export interface UsageTelemetry {
	cache_read_tokens: number;
	cache_write_tokens: number;
	cost_cache_read_usd: number;
	cost_cache_write_usd: number;
	cost_fallback: boolean;
	cost_input_usd: number;
	cost_model_id: string;
	cost_output_usd: number;
	cost_reasoning_usd: number;
	cost_total_usd: number;
	input_tokens: number;
	output_tokens: number;
	reasoning_tokens: number;
	total_tokens: number;
	[k: string]: string | number | boolean;
}

const num = (value: number | undefined): number =>
	typeof value === "number" && Number.isFinite(value) ? value : 0;

export function summarizeAgentUsage(
	modelId: string,
	usage: LanguageModelUsage
): UsageTelemetry {
	const inputTokens = num(usage.inputTokens);
	const outputTokens = num(usage.outputTokens);

	let costModelId = modelId;
	let costs = getUsage({
		modelId,
		usage,
		providers: vercelModels,
	}).costUSD;

	if (costs?.totalUSD === undefined) {
		costModelId = FALLBACK_MODEL_ID;
		costs = getUsage({
			modelId: FALLBACK_MODEL_ID,
			usage,
			providers: vercelModels,
		}).costUSD;
	}

	return {
		input_tokens: inputTokens,
		output_tokens: outputTokens,
		total_tokens: inputTokens + outputTokens,
		cache_read_tokens: num(usage.inputTokenDetails?.cacheReadTokens),
		cache_write_tokens: num(usage.inputTokenDetails?.cacheWriteTokens),
		reasoning_tokens: num(usage.outputTokenDetails?.reasoningTokens),
		cost_input_usd: num(costs?.inputUSD),
		cost_output_usd: num(costs?.outputUSD),
		cost_total_usd: num(costs?.totalUSD),
		cost_cache_read_usd: num(costs?.cacheReadUSD),
		cost_cache_write_usd: num(costs?.cacheWriteUSD),
		cost_reasoning_usd: num(costs?.reasoningUSD),
		cost_model_id: costModelId,
		cost_fallback: costModelId !== modelId,
	};
}
