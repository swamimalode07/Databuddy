import type { Page, Request } from "@playwright/test";
import { test as base, expect as pwExpect } from "@playwright/test";

export const expect = pwExpect;

/**
 * Allowlist of routes the real basket serves (see apps/basket/src/routes/).
 * The tracker mock returns 200 for known routes and 404 for everything else.
 * Any test that fires a request to an unknown path fails at teardown via the
 * auto-fixture below — this is the regression guard that would have caught
 * the /outgoing-links-plugin-POSTed-to-nonexistent-/outgoing bug.
 *
 * Keep this list in sync with apps/basket/src/routes/basket.ts, track.ts, llm.ts.
 */
const BASKET_ROUTES: ReadonlyArray<{ method: string; path: RegExp }> = [
	// CORS preflight — basket responds 204 to OPTIONS on any path.
	{ method: "OPTIONS", path: /.*/ },
	// basketRouter
	{ method: "GET", path: /^\/px\.jpg$/ },
	{ method: "POST", path: /^\/vitals$/ },
	{ method: "POST", path: /^\/errors$/ },
	{ method: "POST", path: /^\/events$/ },
	{ method: "POST", path: /^\/$/ },
	{ method: "POST", path: /^\/batch$/ },
	// trackRoute
	{ method: "POST", path: /^\/track$/ },
	// llmRouter
	{ method: "POST", path: /^\/llm$/ },
	// health
	{ method: "GET", path: /^\/health$/ },
	{ method: "GET", path: /^\/health\/status$/ },
];

export function isKnownBasketRoute(method: string, urlPath: string): boolean {
	return BASKET_ROUTES.some((r) => r.method === method && r.path.test(urlPath));
}

export interface UnknownBasketRouteHit {
	method: string;
	path: string;
	url: string;
}

export interface BasketMock {
	/** Requests the tracker fired to paths basket does not serve. */
	readonly unknownRoutes: readonly UnknownBasketRouteHit[];
}

/**
 * Strict basket mock: 200 for known routes, 404 for anything else.
 *
 * Tracking vs fulfillment are split on purpose:
 *   - `page.on("request")` fires for EVERY request, even ones a test
 *     intercepts with its own `page.route`. We use this to record unknown
 *     routes so teardown can fail loudly — guaranteed to run regardless of
 *     what mocks a test installs.
 *   - `page.route` fulfills requests with 200/404. Individual tests can
 *     register more-specific `page.route` handlers (Playwright uses "last
 *     registered wins" for overlapping globs) to customize the response,
 *     but the tracking above still catches unknown paths.
 */
export async function setupBasketMock(page: Page): Promise<BasketMock> {
	const unknownRoutes: UnknownBasketRouteHit[] = [];

	await page.addInitScript(() => {
		Object.defineProperty(navigator, "sendBeacon", { value: undefined });
	});

	// Always-on tracking: runs before any `page.route` can intercept, so
	// tests that install their own mocks can't hide unknown routes.
	page.on("request", (req) => {
		const rawUrl = req.url();
		if (!rawUrl.includes("basket.databuddy.cc")) {
			return;
		}
		const method = req.method();
		if (method === "OPTIONS") {
			return;
		}
		let urlPath = "/";
		try {
			urlPath = new URL(rawUrl).pathname;
		} catch {
			/* best-effort */
		}
		if (!isKnownBasketRoute(method, urlPath)) {
			unknownRoutes.push({ method, path: urlPath, url: rawUrl });
		}
	});

	// Default fulfillment. Tests can override with their own `page.route`.
	await page.route("**/basket.databuddy.cc/**", async (route) => {
		const req = route.request();
		const method = req.method();
		const rawUrl = req.url();

		let urlPath = "/";
		try {
			urlPath = new URL(rawUrl).pathname;
		} catch {
			/* best-effort */
		}

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
			"Access-Control-Allow-Headers":
				"Content-Type, Authorization, X-Requested-With, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version",
		};

		if (method === "OPTIONS") {
			await route.fulfill({ status: 204, headers: corsHeaders });
			return;
		}

		if (!isKnownBasketRoute(method, urlPath)) {
			await route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({
					error: "Unknown basket route",
					method,
					path: urlPath,
				}),
				headers: corsHeaders,
			});
			return;
		}

		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true }),
			headers: corsHeaders,
		});
	});

	return {
		get unknownRoutes() {
			return unknownRoutes;
		},
	};
}

/**
 * Extended Playwright `test` with an auto-fixture that installs the strict
 * basket mock and fails the test at teardown if the tracker hit any route
 * basket does not serve. Every spec should import `test` from this module
 * instead of `@playwright/test` — the guard runs automatically.
 */
export const test = base.extend<{ basketMock: BasketMock }>({
	basketMock: [
		async ({ page }, use) => {
			const mock = await setupBasketMock(page);
			await use(mock);
			if (mock.unknownRoutes.length > 0) {
				const summary = mock.unknownRoutes
					.map((r) => `${r.method} ${r.path}`)
					.join(", ");
				throw new Error(
					`Tracker hit ${mock.unknownRoutes.length} unknown basket route(s): ${summary}. ` +
						"Update packages/tracker/tests/test-utils.ts BASKET_ROUTES if this path is now valid, " +
						"or fix the tracker so it POSTs to a route basket actually serves."
				);
			}
		},
		{ auto: true },
	],
});

/** Debug IIFE exposes `db.__getMaxScrollDepth` after script load. */
export async function waitForDebugScrollHook(page: Page): Promise<void> {
	await expect
		.poll(async () =>
			page.evaluate(
				() =>
					typeof (
						window as unknown as { db?: { __getMaxScrollDepth?: () => number } }
					).db?.__getMaxScrollDepth === "function"
			)
		)
		.toBeTruthy();
}

export function readMaxScrollDepth(page: Page): Promise<number> {
	return page.evaluate(() =>
		(
			window as unknown as { db: { __getMaxScrollDepth: () => number } }
		).db.__getMaxScrollDepth()
	);
}

export function requestHasNamedEvent(req: Request, name: string): boolean {
	if (!req.url().includes("basket.databuddy.cc") || req.method() !== "POST") {
		return false;
	}
	const raw = req.postData();
	if (!raw) {
		return false;
	}
	try {
		const data = JSON.parse(raw) as unknown;
		const batch = Array.isArray(data) ? data : [data];
		return batch.some((e: { name?: string }) => e.name === name);
	} catch {
		return false;
	}
}

/**
 * Finds a matching event in a request payload, handling both
 * individual events and batched arrays sent to /batch.
 */
export function findEvent(
	req: Request,
	predicate: (event: Record<string, unknown>) => boolean
): Record<string, unknown> | undefined {
	if (!req.url().includes("basket.databuddy.cc")) {
		return undefined;
	}
	try {
		const data = req.postDataJSON();
		if (Array.isArray(data)) {
			return data.find(predicate);
		}
		return predicate(data) ? data : undefined;
	} catch {
		return undefined;
	}
}

export function hasEvent(
	req: Request,
	predicate: (event: Record<string, unknown>) => boolean
): boolean {
	return !!findEvent(req, predicate);
}

/**
 * Counts events matching a predicate across individual and batched payloads.
 */
export function countEvents(
	req: Request,
	predicate: (event: Record<string, unknown>) => boolean
): number {
	if (!req.url().includes("basket.databuddy.cc")) {
		return 0;
	}
	try {
		const data = req.postDataJSON();
		if (Array.isArray(data)) {
			return data.filter(predicate).length;
		}
		return predicate(data) ? 1 : 0;
	} catch {
		return 0;
	}
}
