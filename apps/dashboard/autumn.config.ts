import { feature, item, plan } from "atmn";

// =============================================================================
// Features
// =============================================================================
//
// Conventions:
// - Metered consumable: usage that gets consumed (events, agent tokens)
// - Metered non-consumable: countable resources (monitors, status pages, seats)
// - Boolean: feature flag — included or not, no quantity
// - credit_system: visible pool that auto-deducts from underlying metered features
//
// All limits are declared here. Server-side enforcement is wired up in
// follow-up tickets.

// -----------------------------------------------------------------------------
// Analytics core
// -----------------------------------------------------------------------------

export const events = feature({
	id: "events",
	name: "Events",
	type: "metered",
	consumable: true,
	eventNames: ["Events"],
});

export const funnels = feature({
	id: "funnels",
	name: "Funnels",
	type: "metered",
	consumable: false,
});

export const goals = feature({
	id: "goals",
	name: "Goals",
	type: "metered",
	consumable: false,
});

export const feature_flags = feature({
	id: "feature_flags",
	name: "Feature Flags",
	type: "metered",
	consumable: false,
});

export const target_groups = feature({
	id: "target_groups",
	name: "Target Groups",
	type: "metered",
	consumable: false,
});

export const retention_analytics = feature({
	id: "retention_analytics",
	name: "Retention Analytics",
	type: "boolean",
});

export const error_tracking = feature({
	id: "error_tracking",
	name: "Error Tracking",
	type: "boolean",
});

// -----------------------------------------------------------------------------
// Team / collaboration
// -----------------------------------------------------------------------------

export const seats = feature({
	id: "seats",
	name: "Seats",
	type: "metered",
	consumable: false,
});

export const sso = feature({
	id: "sso",
	name: "Single Sign On",
	type: "boolean",
});

export const rbac = feature({
	id: "rbac",
	name: "Role Based Access Control",
	type: "boolean",
});

// -----------------------------------------------------------------------------
// Pulse — uptime monitoring + status pages
// -----------------------------------------------------------------------------

export const monitors = feature({
	id: "monitors",
	name: "Uptime Monitors",
	type: "metered",
	consumable: false,
});

// Gates sub-5-minute check intervals (minute, five_minutes granularity).
// Free/Hobby get 10-min and slower; Pro+ unlocks 1-min checks.
export const uptime_minute_checks = feature({
	id: "uptime_minute_checks",
	name: "Sub-5-Minute Uptime Checks",
	type: "boolean",
});

export const status_pages = feature({
	id: "status_pages",
	name: "Status Pages",
	type: "metered",
	consumable: false,
});

export const status_page_custom_branding = feature({
	id: "status_page_custom_branding",
	name: "Status Page Custom Branding",
	type: "boolean",
});

export const status_page_custom_domain = feature({
	id: "status_page_custom_domain",
	name: "Status Page Custom Domain",
	type: "boolean",
});

// -----------------------------------------------------------------------------
// Alerts / alarms
// -----------------------------------------------------------------------------

export const alarms = feature({
	id: "alarms",
	name: "Alarms",
	type: "metered",
	consumable: false,
});

// Slack/webhook/Telegram alert destinations. Free/Hobby get email-only.
export const webhook_alert_destinations = feature({
	id: "webhook_alert_destinations",
	name: "Webhook & Slack Alert Destinations",
	type: "boolean",
});

// -----------------------------------------------------------------------------
// Databunny agent — token currencies + visible credit pool
// -----------------------------------------------------------------------------
// Raw token counts get tracked from `result.totalUsage` via tokenlens.
// Users never see these directly — they're the underlying currency that the
// `agent_credits` credit_system converts into a single visible pool.

export const agent_input_tokens = feature({
	id: "agent_input_tokens",
	name: "Agent Input Tokens",
	type: "metered",
	consumable: true,
});

export const agent_output_tokens = feature({
	id: "agent_output_tokens",
	name: "Agent Output Tokens",
	type: "metered",
	consumable: true,
});

export const agent_cache_read_tokens = feature({
	id: "agent_cache_read_tokens",
	name: "Agent Cache Read Tokens",
	type: "metered",
	consumable: true,
});

export const agent_cache_write_tokens = feature({
	id: "agent_cache_write_tokens",
	name: "Agent Cache Write Tokens",
	type: "metered",
	consumable: true,
});

// 1 credit ≈ $0.005 of LLM compute. Sonnet 4.6 rates per token:
//   input        $3.00/M  → 0.0006   credits
//   output      $15.00/M  → 0.003    credits
//   cache read   $0.30/M  → 0.00006  credits
//   cache write  $3.75/M  → 0.00075  credits
//
// A typical analytics turn (5k cache read + 200 fresh input + 1.5k output)
// consumes ~5 credits. Heavy multi-tool turns 15-30 credits.
export const agent_credits = feature({
	id: "agent_credits",
	name: "Agent Credits",
	type: "credit_system",
	creditSchema: [
		{ meteredFeatureId: agent_input_tokens.id, creditCost: 0.0006 },
		{ meteredFeatureId: agent_output_tokens.id, creditCost: 0.003 },
		{ meteredFeatureId: agent_cache_read_tokens.id, creditCost: 0.000_06 },
		{ meteredFeatureId: agent_cache_write_tokens.id, creditCost: 0.000_75 },
	],
});

// =============================================================================
// Plans
// =============================================================================

export const free = plan({
	id: "free",
	name: "Free",
	autoEnable: true,
	items: [
		// Analytics
		item({
			featureId: events.id,
			included: 10_000,
			reset: { interval: "month" },
		}),
		item({ featureId: funnels.id, included: 1 }),
		item({ featureId: goals.id, included: 2 }),
		item({ featureId: feature_flags.id, included: 3 }),

		// Team
		item({ featureId: seats.id, included: 2 }),

		// Agent
		item({
			featureId: agent_credits.id,
			included: 100,
			reset: { interval: "month" },
		}),

		// Pulse — taste, not full product
		item({ featureId: monitors.id, included: 1 }),
	],
});

export const hobby = plan({
	id: "hobby",
	name: "Hobby",
	price: {
		amount: 9.99,
		interval: "month",
	},
	items: [
		// Analytics
		item({
			featureId: events.id,
			included: 30_000,
			price: {
				tiers: [
					{ to: 2_030_000, amount: 0.000_035 },
					{ to: 10_030_000, amount: 0.000_03 },
					{ to: 50_030_000, amount: 0.000_02 },
					{ to: 250_030_000, amount: 0.000_015 },
					{ to: "inf", amount: 0.000_01 },
				],
				tierBehaviour: "graduated",
				billingUnits: 1,
				billingMethod: "usage_based",
				interval: "month",
			},
		}),
		item({ featureId: funnels.id, included: 5 }),
		item({ featureId: goals.id, included: 10 }),
		item({ featureId: feature_flags.id, included: 10 }),
		item({ featureId: target_groups.id, included: 5 }),
		item({ featureId: retention_analytics.id }),
		item({ featureId: error_tracking.id }),

		// Team
		item({ featureId: seats.id, included: 5 }),

		// Agent
		item({
			featureId: agent_credits.id,
			included: 500,
			reset: { interval: "month" },
		}),

		// Pulse — small built-in allowance, 5-min minimum interval
		item({ featureId: monitors.id, included: 5 }),
		item({ featureId: status_pages.id, included: 1 }),
		item({ featureId: alarms.id, included: 5 }),
	],
});

export const pro = plan({
	id: "pro",
	name: "Pro",
	price: {
		amount: 49.99,
		interval: "month",
	},
	items: [
		// Analytics
		item({
			featureId: events.id,
			included: 1_000_000,
			price: {
				tiers: [
					{ to: 2_000_000, amount: 0.000_035 },
					{ to: 10_000_000, amount: 0.000_03 },
					{ to: 50_000_000, amount: 0.000_02 },
					{ to: 250_000_000, amount: 0.000_015 },
					{ to: "inf", amount: 0.000_01 },
				],
				tierBehaviour: "graduated",
				billingUnits: 1,
				billingMethod: "usage_based",
				interval: "month",
			},
		}),
		item({ featureId: funnels.id, included: 50 }),
		item({ featureId: goals.id, unlimited: true }),
		item({ featureId: feature_flags.id, included: 100 }),
		item({ featureId: target_groups.id, included: 25 }),
		item({ featureId: retention_analytics.id }),
		item({ featureId: error_tracking.id }),

		// Team
		item({ featureId: seats.id, included: 25 }),
		item({ featureId: rbac.id }),

		// Agent — with rollover and overage tiers
		item({
			featureId: agent_credits.id,
			included: 5000,
			rollover: {
				max: 5000,
				expiryDurationType: "month",
				expiryDurationLength: 1,
			},
			price: {
				tiers: [
					{ to: 10_000, amount: 0.006 },
					{ to: 50_000, amount: 0.005 },
					{ to: "inf", amount: 0.004 },
				],
				tierBehaviour: "graduated",
				billingUnits: 1,
				billingMethod: "usage_based",
				interval: "month",
			},
		}),

		// Pulse — minute-level checks unlocked
		item({ featureId: monitors.id, included: 25 }),
		item({ featureId: uptime_minute_checks.id }),
		item({ featureId: status_pages.id, included: 3 }),
		item({ featureId: status_page_custom_branding.id }),
		item({ featureId: alarms.id, included: 50 }),
		item({ featureId: webhook_alert_destinations.id }),
	],
});

// Scale is being phased out — preserve current capability for existing
// customers but do NOT add new feature items beyond what's necessary for
// parity with Pro. No new bells, no overage tiers.
export const scale = plan({
	id: "scale",
	name: "Scale",
	price: {
		amount: 99.99,
		interval: "month",
	},
	items: [
		// Analytics
		item({
			featureId: events.id,
			included: 3_000_000,
			price: {
				tiers: [
					{ to: 5_000_000, amount: 0.000_035 },
					{ to: 13_000_000, amount: 0.000_03 },
					{ to: 53_000_000, amount: 0.000_02 },
					{ to: 253_000_000, amount: 0.000_015 },
					{ to: "inf", amount: 0.000_01 },
				],
				tierBehaviour: "graduated",
				billingUnits: 1,
				billingMethod: "usage_based",
				interval: "month",
			},
		}),
		item({ featureId: funnels.id, unlimited: true }),
		item({ featureId: goals.id, unlimited: true }),
		item({ featureId: feature_flags.id, unlimited: true }),
		item({ featureId: target_groups.id, unlimited: true }),
		item({ featureId: retention_analytics.id }),
		item({ featureId: error_tracking.id }),

		// Team
		item({ featureId: seats.id, unlimited: true }),
		item({ featureId: rbac.id }),

		// Agent
		item({
			featureId: agent_credits.id,
			included: 5000,
			reset: { interval: "month" },
		}),

		// Pulse — equivalent to Pro
		item({ featureId: monitors.id, included: 50 }),
		item({ featureId: uptime_minute_checks.id }),
		item({ featureId: status_pages.id, included: 5 }),
		item({ featureId: status_page_custom_branding.id }),
		item({ featureId: alarms.id, unlimited: true }),
		item({ featureId: webhook_alert_destinations.id }),
	],
});

export const sso_plan = plan({
	id: "sso",
	name: "SSO",
	addOn: true,
	price: {
		amount: 100,
		interval: "month",
	},
	items: [item({ featureId: sso.id })],
});

// -----------------------------------------------------------------------------
// Pulse plans — uptime monitoring focused, larger monitor counts
// -----------------------------------------------------------------------------

export const pulse_hobby = plan({
	id: "pulse_hobby",
	name: "Pulse Hobby",
	group: "Pulse",
	price: {
		amount: 14.99,
		interval: "month",
	},
	items: [
		item({ featureId: monitors.id, included: 25 }),
		item({ featureId: uptime_minute_checks.id }),
		item({ featureId: status_pages.id, included: 3 }),
		item({ featureId: status_page_custom_branding.id }),
		item({ featureId: alarms.id, included: 25 }),
		item({ featureId: webhook_alert_destinations.id }),
	],
});

export const pulse_pro = plan({
	id: "pulse_pro",
	name: "Pulse Pro",
	group: "Pulse",
	price: {
		amount: 49.99,
		interval: "month",
	},
	items: [
		item({ featureId: monitors.id, included: 150 }),
		item({ featureId: uptime_minute_checks.id }),
		item({ featureId: status_pages.id, included: 10 }),
		item({ featureId: status_page_custom_branding.id }),
		item({ featureId: status_page_custom_domain.id }),
		item({ featureId: alarms.id, unlimited: true }),
		item({ featureId: webhook_alert_destinations.id }),
	],
});
