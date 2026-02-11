import {
	type ApiKeyRow,
	collectScopes,
	keys,
} from "@databuddy/api-keys/resolve";
import { API_SCOPES } from "@databuddy/api-keys/scopes";
import { websitesApi } from "@databuddy/auth";
import { and, apikey, desc, eq, isNull } from "@databuddy/db";
import { invalidateCacheableKey } from "@databuddy/redis";
import { ORPCError } from "@orpc/server";
import {
	ApiKeyErrorCode,
	hasAllScopes,
	hasAnyScope,
	hasScope,
	isExpired,
} from "keypal";
import { z } from "zod";
import type { Context } from "../orpc";
import { protectedProcedure, publicProcedure } from "../orpc";

type ApiKey = ApiKeyRow;
interface Metadata {
	resources?: Record<string, string[]>;
	tags?: string[];
	description?: string;
	lastUsedAt?: string;
}

const scopeEnum = z.enum(API_SCOPES);
const resourcesSchema = z.record(z.string(), z.array(scopeEnum));
const rateLimitSchema = z.object({
	enabled: z.boolean().optional(),
	max: z.number().int().positive().nullable().optional(),
	window: z.number().int().positive().nullable().optional(),
});

const getMeta = (key: ApiKey): Metadata => (key.metadata as Metadata) ?? {};

async function verifyOrganizationAccess(
	ctx: Context & { user: NonNullable<Context["user"]> },
	organizationId: string
) {
	try {
		const { success } = await websitesApi.hasPermission({
			headers: ctx.headers,
			body: {
				organizationId,
				permissions: { website: ["configure"] },
			},
		});

		if (!success) {
			throw new ORPCError("FORBIDDEN", {
				message: "Missing organization permissions",
			});
		}
	} catch (error) {
		// If it's already an ORPCError, re-throw it
		if (error instanceof ORPCError) {
			throw error;
		}
		// Otherwise, treat permission check failures as FORBIDDEN
		throw new ORPCError("FORBIDDEN", {
			message: "Missing organization permissions",
		});
	}
}

async function getKeyWithAuth(
	ctx: Context & { user: NonNullable<Context["user"]> },
	id: string
) {
	const key = await ctx.db.query.apikey.findFirst({ where: eq(apikey.id, id) });
	if (!key) {
		throw new ORPCError("NOT_FOUND", { message: "API key not found" });
	}

	if (key.organizationId) {
		await verifyOrganizationAccess(ctx, key.organizationId);
	} else if (key.userId !== ctx.user.id) {
		throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
	}

	return key;
}

function mapKey(key: ApiKey, full = false) {
	const meta = getMeta(key);
	return {
		id: key.id,
		name: key.name,
		prefix: key.prefix,
		start: key.start,
		type: key.type,
		enabled: key.enabled,
		scopes: collectScopes(key),
		tags: meta.tags ?? [],
		expiresAt: key.expiresAt,
		revokedAt: key.revokedAt,
		lastUsedAt: meta.lastUsedAt ?? null,
		createdAt: key.createdAt,
		updatedAt: key.updatedAt,
		...(full && {
			description: meta.description ?? null,
			resources: meta.resources ?? {},
			rateLimit: {
				enabled: key.rateLimitEnabled,
				max: key.rateLimitMax,
				window: key.rateLimitTimeWindow,
			},
		}),
	};
}

export const apikeysRouter = {
	list: protectedProcedure
		.input(z.object({ organizationId: z.string().optional() }).default({}))
		.handler(async ({ context, input }) => {
			if (input.organizationId) {
				await verifyOrganizationAccess(context, input.organizationId);
			}

			const rows = await context.db
				.select()
				.from(apikey)
				.where(
					input.organizationId
						? eq(apikey.organizationId, input.organizationId)
						: and(
								eq(apikey.userId, context.user.id),
								isNull(apikey.organizationId)
							)
				)
				.orderBy(desc(apikey.createdAt));
			return rows.map((r) => mapKey(r));
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) =>
			mapKey(await getKeyWithAuth(context, input.id), true)
		),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100),
				description: z.string().max(500).optional(),
				organizationId: z.string().optional(),
				type: z.enum(["user", "sdk", "automation"]).default("user"),
				scopes: z.array(scopeEnum).default([]),
				resources: resourcesSchema.optional(),
				tags: z.array(z.string().max(50)).max(10).optional(),
				expiresAt: z.string().optional(),
				rateLimit: rateLimitSchema.optional(),
			})
		)
		.handler(async ({ context, input }) => {
			if (input.organizationId) {
				await verifyOrganizationAccess(context, input.organizationId);
			}

			const { key: secret, record } = await keys.create({
				ownerId: input.organizationId ?? context.user.id,
				name: input.name,
				scopes: input.scopes,
				resources: input.resources,
				tags: input.tags,
				expiresAt: input.expiresAt ?? null,
			});

			const [created] = await context.db
				.insert(apikey)
				.values({
					id: record.id,
					name: input.name,
					prefix: secret.split("_")[0] ?? "dbdy",
					start: secret.slice(0, 8),
					keyHash: record.keyHash,
					userId: input.organizationId ? null : context.user.id,
					organizationId: input.organizationId ?? null,
					type: input.type,
					scopes: input.scopes,
					enabled: true,
					rateLimitEnabled: input.rateLimit?.enabled ?? true,
					rateLimitMax: input.rateLimit?.max,
					rateLimitTimeWindow: input.rateLimit?.window,
					expiresAt: input.expiresAt ?? null,
					metadata: {
						resources: input.resources,
						tags: input.tags,
						description: input.description,
					},
				})
				.returning();

			return {
				id: created.id,
				secret,
				prefix: created.prefix,
				start: created.start,
			};
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(100).optional(),
				description: z.string().max(500).nullable().optional(),
				enabled: z.boolean().optional(),
				scopes: z.array(scopeEnum).optional(),
				resources: resourcesSchema.nullable().optional(),
				tags: z.array(z.string().max(50)).max(10).nullable().optional(),
				expiresAt: z.string().nullable().optional(),
				rateLimit: rateLimitSchema.optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const key = await getKeyWithAuth(context, input.id);
			const meta = getMeta(key);

			const [updated] = await context.db
				.update(apikey)
				.set({
					...(input.name !== undefined && { name: input.name }),
					...(input.enabled !== undefined && { enabled: input.enabled }),
					...(input.scopes !== undefined && { scopes: input.scopes }),
					...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
					...(input.rateLimit?.enabled !== undefined && {
						rateLimitEnabled: input.rateLimit.enabled,
					}),
					...(input.rateLimit?.max !== undefined && {
						rateLimitMax: input.rateLimit.max,
					}),
					...(input.rateLimit?.window !== undefined && {
						rateLimitTimeWindow: input.rateLimit.window,
					}),
					metadata: {
						...meta,
						...(input.resources !== undefined && {
							resources: input.resources ?? undefined,
						}),
						...(input.description !== undefined && {
							description: input.description ?? undefined,
						}),
						...(input.tags !== undefined && { tags: input.tags ?? undefined }),
					},
					updatedAt: new Date(),
				})
				.where(eq(apikey.id, input.id))
				.returning();

			// Invalidate cache for the API key
			await invalidateCacheableKey("getCachedApiKeyByHash", updated.keyHash);

			return mapKey(updated);
		}),

	revoke: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const key = await getKeyWithAuth(context, input.id);
			await context.db
				.update(apikey)
				.set({ enabled: false, revokedAt: new Date(), updatedAt: new Date() })
				.where(eq(apikey.id, input.id));

			// Invalidate cache for the revoked API key
			await invalidateCacheableKey("getCachedApiKeyByHash", key.keyHash);

			return { success: true };
		}),

	rotate: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const key = await getKeyWithAuth(context, input.id);
			const meta = getMeta(key);

			const { key: secret, record } = await keys.create({
				ownerId: key.organizationId ?? key.userId ?? context.user.id,
				name: key.name,
				scopes: key.scopes,
				resources: meta.resources,
				tags: meta.tags,
				expiresAt: key.expiresAt ?? null,
			});

			const [updated] = await context.db
				.update(apikey)
				.set({
					prefix: secret.split("_")[0] ?? "dbdy",
					start: secret.slice(0, 8),
					keyHash: record.keyHash,
					updatedAt: new Date(),
				})
				.where(eq(apikey.id, input.id))
				.returning();

			// Invalidate cache for both old and new key hash
			await Promise.all([
				invalidateCacheableKey("getCachedApiKeyByHash", key.keyHash),
				invalidateCacheableKey("getCachedApiKeyByHash", updated.keyHash),
			]);

			return {
				id: updated.id,
				secret,
				prefix: updated.prefix,
				start: updated.start,
			};
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const key = await getKeyWithAuth(context, input.id);
			await context.db.delete(apikey).where(eq(apikey.id, input.id));

			// Invalidate cache for the deleted API key
			await invalidateCacheableKey("getCachedApiKeyByHash", key.keyHash);

			return { success: true };
		}),

	verify: publicProcedure
		.input(
			z.object({
				secret: z.string().optional(),
				resource: z.string().optional(),
				requiredScopes: z.array(scopeEnum).optional(),
				mode: z.enum(["any", "all"]).default("any"),
				trackUsage: z.boolean().default(true),
			})
		)
		.handler(async ({ context, input }) => {
			// Use keys.extractKey() for header extraction
			const secret = input.secret ?? keys.extractKey(context.headers);
			if (!secret) {
				return {
					valid: false,
					error: "No API key",
					errorCode: ApiKeyErrorCode.MISSING_KEY,
				};
			}

			const key = await context.db.query.apikey.findFirst({
				where: eq(apikey.keyHash, keys.hashKey(secret)),
			});
			if (!key) {
				return {
					valid: false,
					error: "Invalid key",
					errorCode: ApiKeyErrorCode.INVALID_KEY,
				};
			}
			if (!key.enabled) {
				return {
					valid: false,
					error: "Disabled",
					errorCode: ApiKeyErrorCode.DISABLED,
				};
			}
			if (key.revokedAt) {
				return {
					valid: false,
					error: "Revoked",
					errorCode: ApiKeyErrorCode.REVOKED,
				};
			}
			if (isExpired(key.expiresAt)) {
				return {
					valid: false,
					error: "Expired",
					errorCode: ApiKeyErrorCode.EXPIRED,
				};
			}

			const scopes = collectScopes(key, input.resource);

			// Use keypal's scope checking
			if (input.requiredScopes?.length) {
				const check = input.mode === "all" ? hasAllScopes : hasAnyScope;
				if (!check(scopes, input.requiredScopes)) {
					return {
						valid: false,
						error: "Missing scopes",
						scopes,
						matched: input.requiredScopes.filter((s) => hasScope(scopes, s)),
						missing: input.requiredScopes.filter((s) => !hasScope(scopes, s)),
					};
				}
			}

			if (input.trackUsage) {
				await context.db
					.update(apikey)
					.set({
						metadata: { ...getMeta(key), lastUsedAt: new Date().toISOString() },
					})
					.where(eq(apikey.id, key.id));
			}

			return {
				valid: true,
				keyId: key.id,
				ownerId: key.organizationId ?? key.userId,
				scopes,
			};
		}),
};
