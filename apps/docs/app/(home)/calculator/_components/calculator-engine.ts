import { normalizePlans } from "@/app/(home)/pricing/_pricing/normalize";
import { RAW_PLANS } from "@/app/(home)/pricing/data";
import type { NormalizedPlan } from "@/app/(home)/pricing/_pricing/types";
import { estimateTieredOverageCostFromTiers } from "@/app/(home)/pricing/_pricing/estimator-utils";

const PLANS: NormalizedPlan[] = normalizePlans(RAW_PLANS);

/** Industry-typical cookie-banner friction band (low / high bounce) for range display */
export const BOUNCE_RANGE_LOW = 0.2;
export const BOUNCE_RANGE_HIGH = 0.4;

function getDatabuddyMonthlyCost(monthlyEvents: number): {
	plan: NormalizedPlan;
	totalCost: number;
} {
	const paidPlans = PLANS.filter((p) => p.priceMonthly > 0 && p.eventTiers);

	let bestPlan = paidPlans.at(0);
	let bestCost = Number.POSITIVE_INFINITY;

	for (const plan of paidPlans) {
		const overage = Math.max(monthlyEvents - plan.includedEventsMonthly, 0);
		const overageCost =
			overage > 0 && plan.eventTiers
				? estimateTieredOverageCostFromTiers(overage, plan.eventTiers)
				: 0;
		const total = plan.priceMonthly + overageCost;
		if (total < bestCost) {
			bestCost = total;
			bestPlan = plan;
		}
	}

	return {
		plan: bestPlan as NormalizedPlan,
		totalCost: bestCost,
	};
}

export interface CalculatorInputs {
	monthlyVisitors: number;
	bannerBounceRate: number;
	visitorToPaidRate: number;
	revenuePerConversion: number;
}

export interface CalculatorOutputs {
	lostVisitors: number;
	lostConversions: number;
	lostRevenueMonthly: number;
	lostRevenueYearly: number;
	/** Same inputs, 20% banner bounce — lower bound of industry band */
	lostRevenueYearlyRangeLow: number;
	/** Same inputs, 40% banner bounce — upper bound of industry band */
	lostRevenueYearlyRangeHigh: number;
	databuddyMonthlyCost: number;
	databuddyPlanName: string;
}

function coreCalc(
	monthlyVisitors: number,
	bannerBounce: number,
	visitorToPaid: number,
	revenuePerConversion: number
): {
	lostVisitors: number;
	lostConversions: number;
	lostRevenueMonthly: number;
	lostRevenueYearly: number;
} {
	const lostVisitors = monthlyVisitors * bannerBounce;
	const lostConversions = lostVisitors * visitorToPaid;
	const lostRevenueMonthly = lostConversions * revenuePerConversion;
	const lostRevenueYearly = lostRevenueMonthly * 12;
	return {
		lostVisitors,
		lostConversions,
		lostRevenueMonthly,
		lostRevenueYearly,
	};
}

export function calculateCookieBannerCost(
	inputs: CalculatorInputs
): CalculatorOutputs {
	const primary = coreCalc(
		inputs.monthlyVisitors,
		inputs.bannerBounceRate,
		inputs.visitorToPaidRate,
		inputs.revenuePerConversion
	);

	const lowBand = coreCalc(
		inputs.monthlyVisitors,
		BOUNCE_RANGE_LOW,
		inputs.visitorToPaidRate,
		inputs.revenuePerConversion
	);
	const highBand = coreCalc(
		inputs.monthlyVisitors,
		BOUNCE_RANGE_HIGH,
		inputs.visitorToPaidRate,
		inputs.revenuePerConversion
	);

	const { plan, totalCost } = getDatabuddyMonthlyCost(inputs.monthlyVisitors);

	return {
		...primary,
		lostRevenueYearlyRangeLow: lowBand.lostRevenueYearly,
		lostRevenueYearlyRangeHigh: highBand.lostRevenueYearly,
		databuddyMonthlyCost: totalCost,
		databuddyPlanName: plan.name,
	};
}

export interface Scenario {
	name: string;
	description: string;
	inputs: CalculatorInputs;
	outputs: CalculatorOutputs;
}

const SCENARIO_CONFIGS: Omit<Scenario, "outputs">[] = [
	{
		name: "Small Blog",
		description: "Content site with affiliate revenue",
		inputs: {
			monthlyVisitors: 5_000,
			bannerBounceRate: 0.25,
			visitorToPaidRate: 0.012,
			revenuePerConversion: 45,
		},
	},
	{
		name: "Growing Blog",
		description: "Established content site with courses",
		inputs: {
			monthlyVisitors: 25_000,
			bannerBounceRate: 0.28,
			visitorToPaidRate: 0.015,
			revenuePerConversion: 120,
		},
	},
	{
		name: "Growing SaaS",
		description:
			"B2B — conservative visitor-to-paid (many visitors never buy)",
		inputs: {
			monthlyVisitors: 25_000,
			bannerBounceRate: 0.26,
			visitorToPaidRate: 0.012,
			revenuePerConversion: 58,
		},
	},
	{
		name: "Mid-Traffic Site",
		description: "E-commerce or marketplace",
		inputs: {
			monthlyVisitors: 100_000,
			bannerBounceRate: 0.3,
			visitorToPaidRate: 0.02,
			revenuePerConversion: 85,
		},
	},
	{
		name: "High-Traffic App",
		description: "Large-scale SaaS or media platform",
		inputs: {
			monthlyVisitors: 500_000,
			bannerBounceRate: 0.32,
			visitorToPaidRate: 0.015,
			revenuePerConversion: 110,
		},
	},
];

export const SCENARIOS: Scenario[] = SCENARIO_CONFIGS.map((config) => ({
	...config,
	outputs: calculateCookieBannerCost(config.inputs),
}));

export function formatCurrency(value: number): string {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `$${(value / 1_000).toFixed(1)}K`;
	}
	return `$${Math.round(value).toLocaleString()}`;
}

export function formatCurrencyFull(value: number): string {
	return `$${Math.round(value).toLocaleString()}`;
}

export function formatNumber(value: number): string {
	return Math.round(value).toLocaleString();
}

export function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}
