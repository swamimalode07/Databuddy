import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { clear, createStore, del, get, set } from "idb-keyval";

const DB_NAME = "databuddy-query-cache";
const STORE_NAME = "agent-chats";
const CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";
const CACHE_VERSION = "v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

const PERSISTED_PATH_PREFIX = "agentChats";

const store =
	typeof indexedDB === "undefined" ? null : createStore(DB_NAME, STORE_NAME);

const asyncStorage = {
	getItem: async (key: string): Promise<string | null> => {
		if (!store) {
			return null;
		}
		const value = await get<string>(key, store);
		return value ?? null;
	},
	setItem: async (key: string, value: string): Promise<void> => {
		if (!store) {
			return;
		}
		await set(key, value, store);
	},
	removeItem: async (key: string): Promise<void> => {
		if (!store) {
			return;
		}
		await del(key, store);
	},
};

export const queryPersister = createAsyncStoragePersister({
	storage: asyncStorage,
	key: CACHE_KEY,
	throttleTime: 1000,
});

function isAgentChatsQueryKey(queryKey: readonly unknown[]): boolean {
	const head = queryKey[0];
	if (!Array.isArray(head)) {
		return false;
	}
	return head[0] === PERSISTED_PATH_PREFIX;
}

export const persistQueryClientOptions: Omit<
	PersistQueryClientOptions,
	"queryClient"
> = {
	persister: queryPersister,
	maxAge: MAX_AGE_MS,
	buster: CACHE_VERSION,
	dehydrateOptions: {
		shouldDehydrateQuery: (query) =>
			query.state.status === "success" && isAgentChatsQueryKey(query.queryKey),
	},
};

export async function clearPersistedQueryCache(): Promise<void> {
	if (!store) {
		return;
	}
	try {
		await clear(store);
	} catch {}
}
