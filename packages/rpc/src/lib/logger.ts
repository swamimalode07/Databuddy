import { log } from "evlog";
import { useLogger as getRequestLogger } from "evlog/elysia";

const base = { service: "rpc" as const };

type Fields = Record<string, unknown>;

function emit(
	level: "error" | "info" | "warn",
	fieldsOrMessage: Fields | string,
	message?: string
): void {
	if (typeof fieldsOrMessage === "string") {
		log[level]({ ...base, message: fieldsOrMessage });
	} else if (message === undefined) {
		log[level]({ ...base, ...fieldsOrMessage });
	} else {
		log[level]({ ...base, ...fieldsOrMessage, message });
	}
}

/**
 * Pino-compatible (obj, msg) or (msg) logging via evlog global `log`.
 */
export const logger = {
	error: (fieldsOrMessage: Fields | string, message?: string) =>
		emit("error", fieldsOrMessage, message),
	info: (fieldsOrMessage: Fields | string, message?: string) =>
		emit("info", fieldsOrMessage, message),
	warn: (fieldsOrMessage: Fields | string, message?: string) =>
		emit("warn", fieldsOrMessage, message),
};

export async function record<T>(
	name: string,
	fn: () => Promise<T> | T
): Promise<T> {
	const start = performance.now();
	try {
		return await fn();
	} finally {
		const ms = Math.round((performance.now() - start) * 100) / 100;
		try {
			getRequestLogger().set({ [`timing.${name}`]: ms });
		} catch {}
	}
}
