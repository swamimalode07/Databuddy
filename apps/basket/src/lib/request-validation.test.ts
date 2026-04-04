import { describe, expect, test } from "bun:test";
import {
	isValidIpFromSettings,
	isValidOriginFromSettings,
} from "@hooks/auth";
import { truthTable } from "../test-helpers";
import { getWebsiteSecuritySettings } from "./request-validation";

// ── getWebsiteSecuritySettings ──

describe("getWebsiteSecuritySettings", () => {
	const nullInputs: unknown[] = [null, undefined, "string", 123, true, [], [1, 2]];
	for (const input of nullInputs) {
		test(`returns null for ${JSON.stringify(input)}`, () =>
			expect(getWebsiteSecuritySettings(input)).toBeNull()
		);
	}

	test("empty object → undefined fields", () =>
		expect(getWebsiteSecuritySettings({})).toEqual({
			allowedOrigins: undefined,
			allowedIps: undefined,
		})
	);

	test("extracts string arrays, filters non-strings", () => {
		const result = getWebsiteSecuritySettings({
			allowedOrigins: ["cal.com", 123, null, "*.example.com", undefined],
			allowedIps: ["192.168.1.1", true, "10.0.0.0/8", {}],
		});
		expect(result?.allowedOrigins).toEqual(["cal.com", "*.example.com"]);
		expect(result?.allowedIps).toEqual(["192.168.1.1", "10.0.0.0/8"]);
	});

	test("non-array values → undefined", () => {
		const result = getWebsiteSecuritySettings({
			allowedOrigins: "not-an-array",
			allowedIps: 123,
		});
		expect(result?.allowedOrigins).toBeUndefined();
		expect(result?.allowedIps).toBeUndefined();
	});
});

// ── isValidOriginFromSettings ──

truthTable(
	"isValidOriginFromSettings",
	[
		// empty/undefined allowed = allow all
		["empty allowed → true", "https://example.com", [], true],
		["undefined allowed → true", "https://example.com", undefined as any, true],
		// empty origin = allow
		["empty origin → true", "", ["cal.com"], true],
		["whitespace origin → true", "   ", ["cal.com"], true],
		// wildcard
		["wildcard * → true", "https://anything.com", ["*"], true],
		// localhost
		["localhost with port → true", "http://localhost:3000", ["localhost"], true],
		["localhost no port → true", "http://localhost", ["localhost"], true],
		["non-localhost vs localhost → false", "https://example.com", ["localhost"], false],
		// exact match
		["exact match → true", "https://cal.com", ["cal.com"], true],
		["mismatch → false", "https://cal.com", ["example.com"], false],
		// protocol agnostic
		["http → true", "http://cal.com", ["cal.com"], true],
		["https → true", "https://cal.com", ["cal.com"], true],
		// subdomain wildcard
		["*.cal.com matches app.cal.com", "https://app.cal.com", ["*.cal.com"], true],
		["*.cal.com matches cal.com", "https://cal.com", ["*.cal.com"], true],
		["*.cal.com matches nested", "https://api.v1.cal.com", ["*.cal.com"], true],
		["*.cal.com rejects example.com", "https://example.com", ["*.cal.com"], false],
		["*.cal.com rejects cal.example.com", "https://cal.example.com", ["*.cal.com"], false],
		// normalization
		["www stripped → true", "https://www.cal.com", ["cal.com"], true],
		["case insensitive → true", "https://CAL.COM", ["cal.com"], true],
		["port stripped → true", "https://cal.com:3000", ["cal.com"], true],
		// invalid
		["not-a-url → false", "not-a-url", ["cal.com"], false],
		// multiple allowed
		["multi: exact match", "https://cal.com", ["cal.com", "*.example.com"], true],
		["multi: wildcard match", "https://app.example.com", ["cal.com", "*.example.com"], true],
		["multi: no match", "https://malicious.com", ["cal.com", "*.example.com"], false],
	],
	(origin, allowed) => isValidOriginFromSettings(origin, allowed)
);

// ── isValidIpFromSettings ──

truthTable(
	"isValidIpFromSettings",
	[
		// empty/undefined = allow all
		["empty allowed → true", "192.168.1.1", [], true],
		["undefined allowed → true", "192.168.1.1", undefined as any, true],
		["empty IP → true", "", ["192.168.1.1"], true],
		["whitespace IP → true", "   ", ["192.168.1.1"], true],
		// exact match
		["exact match → true", "192.168.1.1", ["192.168.1.1"], true],
		["exact mismatch → false", "192.168.1.2", ["192.168.1.1"], false],
		// IPv6 exact
		["IPv6 match → true", "2001:db8::1", ["2001:db8::1"], true],
		["IPv6 mismatch → false", "2001:db8::1", ["2001:db8::2"], false],
		// CIDR /24
		["/24 in range → true", "192.168.1.100", ["192.168.1.0/24"], true],
		["/24 boundary 0 → true", "192.168.1.0", ["192.168.1.0/24"], true],
		["/24 boundary 255 → true", "192.168.1.255", ["192.168.1.0/24"], true],
		["/24 out of range → false", "192.168.2.1", ["192.168.1.0/24"], false],
		// CIDR /32
		["/32 exact → true", "192.168.1.1", ["192.168.1.1/32"], true],
		["/32 off by one → false", "192.168.1.2", ["192.168.1.1/32"], false],
		// CIDR /16
		["/16 in range → true", "192.168.255.255", ["192.168.0.0/16"], true],
		["/16 out of range → false", "192.169.0.1", ["192.168.0.0/16"], false],
		// CIDR /8
		["/8 in range → true", "10.1.2.3", ["10.0.0.0/8"], true],
		["/8 out of range → false", "11.0.0.1", ["10.0.0.0/8"], false],
		// invalid CIDR
		["/33 → false", "192.168.1.1", ["192.168.1.0/33"], false],
		["/-1 → false", "192.168.1.1", ["192.168.1.0/-1"], false],
		["invalid/cidr → false", "192.168.1.1", ["invalid/cidr"], false],
		// whitespace trimming
		["trimmed IP → true", "  192.168.1.1  ", ["192.168.1.1"], true],
		// multiple allowed
		["multi: exact match", "192.168.1.1", ["192.168.1.1", "10.0.0.0/8"], true],
		["multi: CIDR match", "10.5.5.5", ["192.168.1.1", "10.0.0.0/8"], true],
		["multi: no match", "8.8.8.8", ["192.168.1.1", "10.0.0.0/8"], false],
		// edge cases
		["0.0.0.0/32 → true", "0.0.0.0", ["0.0.0.0/32"], true],
		["255.255.255.255/32 → true", "255.255.255.255", ["255.255.255.255/32"], true],
		["0.0.0.1 vs 0.0.0.0/32 → false", "0.0.0.1", ["0.0.0.0/32"], false],
	],
	(ip, allowed) => isValidIpFromSettings(ip, allowed)
);
