import "@databuddy/test/env";

import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { appRouter } from "@databuddy/rpc";
import {
	reset,
	cleanup,
	hasTestDb,
	userContext,
	apiKeyContext,
	expectCode,
	insertOrganization,
	signUp,
	addToOrganization,
} from "@databuddy/test";

const iit = hasTestDb ? it : it.skip;
const handler = {
	create: appRouter.links.create["~orpc"].handler,
	list: appRouter.links.list["~orpc"].handler,
};

beforeEach(() => reset());
afterAll(() => cleanup());

describe("links.create", () => {
	iit("creates a link for an authorized user", async () => {
		const user = await signUp();
		const org = await insertOrganization();
		await addToOrganization(user.id, org.id, "member");

		const result = await handler.create({
			context: userContext(user, org.id),
			input: {
				name: "My Link",
				targetUrl: "https://example.com",
				organizationId: org.id,
			},
		});

		expect(result.name).toBe("My Link");
		expect(result.targetUrl).toBe("https://example.com");
		expect(result.organizationId).toBe(org.id);
		expect(result.slug).toBeDefined();
		expect(result.createdBy).toBe(user.id);
	});

	iit("creates a link with custom slug", async () => {
		const user = await signUp();
		const org = await insertOrganization();
		await addToOrganization(user.id, org.id, "member");

		const result = await handler.create({
			context: userContext(user, org.id),
			input: {
				name: "Custom Slug",
				targetUrl: "https://example.com",
				organizationId: org.id,
				slug: "my-custom-slug",
			},
		});

		expect(result.slug).toBe("my-custom-slug");
	});

	iit("rejects viewer from creating links", async () => {
		const user = await signUp();
		const org = await insertOrganization();
		await addToOrganization(user.id, org.id, "viewer");

		await expectCode(
			handler.create({
				context: userContext(user, org.id),
				input: {
					name: "Blocked",
					targetUrl: "https://example.com",
					organizationId: org.id,
				},
			}),
			"FORBIDDEN",
		);
	});

	iit("rejects duplicate custom slug", async () => {
		const user = await signUp();
		const org = await insertOrganization();
		await addToOrganization(user.id, org.id, "member");

		await handler.create({
			context: userContext(user, org.id),
			input: {
				name: "First",
				targetUrl: "https://example.com",
				organizationId: org.id,
				slug: "taken-slug",
			},
		});

		try {
			await handler.create({
				context: userContext(user, org.id),
				input: {
					name: "Second",
					targetUrl: "https://example.com",
					organizationId: org.id,
					slug: "taken-slug",
				},
			});
			throw new Error("Expected rejection");
		} catch (e: any) {
			expect(e.message).toContain("slug");
		}
	});

	iit("resolves createdBy to org owner for API key", async () => {
		const org = await insertOrganization();
		const owner = await signUp();
		await addToOrganization(owner.id, org.id, "owner");

		const result = await handler.create({
			context: apiKeyContext(org.id, ["manage:config", "write:links"]),
			input: {
				name: "API Link",
				targetUrl: "https://example.com",
				organizationId: org.id,
			},
		});

		expect(result.createdBy).toBe(owner.id);
	});
});

describe("links.list", () => {
	iit("returns links for the org", async () => {
		const user = await signUp();
		const org = await insertOrganization();
		await addToOrganization(user.id, org.id, "member");

		await handler.create({
			context: userContext(user, org.id),
			input: {
				name: "Link 1",
				targetUrl: "https://one.example.com",
				organizationId: org.id,
			},
		});
		await handler.create({
			context: userContext(user, org.id),
			input: {
				name: "Link 2",
				targetUrl: "https://two.example.com",
				organizationId: org.id,
			},
		});

		const result = await handler.list({
			context: userContext(user, org.id),
			input: { organizationId: org.id },
		});

		expect(result).toHaveLength(2);
	});

	iit("does not leak links from other orgs", async () => {
		const userA = await signUp();
		const userB = await signUp();
		const orgA = await insertOrganization();
		const orgB = await insertOrganization();
		await addToOrganization(userA.id, orgA.id, "member");
		await addToOrganization(userB.id, orgB.id, "member");

		await handler.create({
			context: userContext(userA, orgA.id),
			input: {
				name: "Org A Link",
				targetUrl: "https://a.example.com",
				organizationId: orgA.id,
			},
		});
		await handler.create({
			context: userContext(userB, orgB.id),
			input: {
				name: "Org B Link",
				targetUrl: "https://b.example.com",
				organizationId: orgB.id,
			},
		});

		const result = await handler.list({
			context: userContext(userA, orgA.id),
			input: { organizationId: orgA.id },
		});

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Org A Link");
	});
});
