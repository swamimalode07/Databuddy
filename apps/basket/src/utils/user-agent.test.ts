import { describe, expect, test } from "bun:test";
import { detectBot, parseUserAgent } from "./user-agent";

const dummyReq = new Request("https://example.com");

// ── detectBot ──

describe("detectBot", () => {
	const bots: [string, string][] = [
		["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
		["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
		["GPTBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot"],
		["ClaudeBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0"],
		["ChatGPT-User", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) ChatGPT-User/1.0"],
	];

	for (const [name, ua] of bots) {
		test(`detects ${name}`, () => {
			const result = detectBot(ua, dummyReq);
			expect(result.isBot).toBe(true);
		});
	}

	const browsers: string[] = [
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
		"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
	];

	for (const ua of browsers) {
		test(`real browser not flagged: ${ua.slice(0, 50)}…`, () => {
			const result = detectBot(ua, dummyReq);
			expect(result.isBot).toBe(false);
		});
	}

	test("empty UA → detected as bot (missing_user_agent)", () => {
		const result = detectBot("", dummyReq);
		expect(result.isBot).toBe(true);
		expect(result.reason).toBe("missing_user_agent");
	});

	test("Googlebot → allow action", () => {
		const result = detectBot(
			"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
			dummyReq
		);
		expect(result.action).toBe("allow");
	});

	test("GPTBot → category mapped to AI Crawler", () => {
		const result = detectBot(
			"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0",
			dummyReq
		);
		expect(result.isBot).toBe(true);
		expect(["AI Crawler", "AI Assistant"]).toContain(result.category);
	});

	test("result includes full BotDetectionResult", () => {
		const result = detectBot(
			"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
			dummyReq
		);
		expect(result.result).toBeDefined();
		expect(result.result!.isBot).toBe(true);
	});
});

// ── parseUserAgent ──

describe("parseUserAgent", () => {
	test("Chrome on Windows", async () => {
		const result = await parseUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
		);
		expect(result.browserName).toBeTruthy();
		expect(result.osName).toBeTruthy();
	});

	test("Safari on macOS", async () => {
		const result = await parseUserAgent(
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
		);
		expect(result.browserName).toBeTruthy();
	});

	test("Mobile Safari on iPhone", async () => {
		const result = await parseUserAgent(
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
		);
		expect(result.deviceType).toBeTruthy();
	});

	test("empty string → all undefined", async () => {
		const result = await parseUserAgent("");
		expect(result.browserName).toBeUndefined();
		expect(result.osName).toBeUndefined();
		expect(result.deviceType).toBeUndefined();
	});

	test("gibberish UA → doesn't crash", async () => {
		const result = await parseUserAgent("totally-not-a-real-user-agent/1.0");
		expect(typeof result).toBe("object");
	});

	test("50 real UAs → all return objects", async () => {
		const uas = [
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
			...Array.from({ length: 47 }, (_, i) =>
				`Mozilla/5.0 (Test ${i}) AppleWebKit/537.36 Chrome/${100 + i}.0.0.0 Safari/537.36`
			),
		];
		const results = await Promise.all(uas.map(parseUserAgent));
		for (const r of results) {
			expect(typeof r).toBe("object");
			expect(r).toHaveProperty("browserName");
		}
	});
});
