/**
 * T007 — Testes de integração do adaptador de persistência (IndexedDB via idb-keyval).
 */

import { get, set, del } from 'idb-keyval';
import {
	createIdbAdapter,
	type IdbAdapterOptions,
	type KeyvalLike
} from '$lib/persistence/idb-adapter';
import {
	StorageReadError,
	StorageWriteError,
	StorageUnavailableError
} from '$lib/persistence/errors';
import { COLLECTION_KEY } from '$lib/persistence/adapter';

function createAdapter(options?: IdbAdapterOptions) {
	return createIdbAdapter(options);
}

function fakeKeyval(overrides: Partial<KeyvalLike> = {}): KeyvalLike {
	return {
		async get() {
			return undefined;
		},
		async set() {},
		async del() {},
		...overrides
	};
}

describe('IDB adapter', () => {
	beforeEach(async () => {
		// Limpa o registro entre os testes sem apagar todo o banco.
		await del(COLLECTION_KEY);
	});

	describe('isStorageAvailable', () => {
		it('resolve true quando o IndexedDB está acessível', async () => {
			const adapter = createAdapter();
			await expect(adapter.isStorageAvailable()).resolves.toBe(true);
		});

		it('resolve false quando o IndexedDB está bloqueado e nunca rejeita', async () => {
			const originalIndexedDB = globalThis.indexedDB;
			// @ts-expect-error simula ausência total de IndexedDB
			globalThis.indexedDB = undefined;

			const adapter = createAdapter();
			await expect(adapter.isStorageAvailable()).resolves.toBe(false);

			globalThis.indexedDB = originalIndexedDB;
		});
	});

	describe('loadCollection', () => {
		it('resolve [] quando não há registro', async () => {
			const adapter = createAdapter();
			await expect(adapter.loadCollection()).resolves.toEqual([]);
		});

		it('faz roundtrip save → load', async () => {
			const adapter = createAdapter();
			const ids = ['water_basic', 'fire_gold', 'earth_candy'];
			await adapter.saveCollection(ids);
			await expect(adapter.loadCollection()).resolves.toEqual(ids);
		});

		it('descarta registro corrompido e retorna []', async () => {
			const adapter = createAdapter();
			await set(COLLECTION_KEY, { version: 'not-a-number', ids: [1, 2, 3] });
			await expect(adapter.loadCollection()).resolves.toEqual([]);
		});

		it('valida estrutura { version: number, ids: string[] }', async () => {
			const adapter = createAdapter();
			await set(COLLECTION_KEY, { version: 1, ids: ['a', 'b'] });
			await expect(adapter.loadCollection()).resolves.toEqual(['a', 'b']);

			await set(COLLECTION_KEY, { version: 1 });
			await expect(adapter.loadCollection()).resolves.toEqual([]);

			await set(COLLECTION_KEY, ['a', 'b']);
			await expect(adapter.loadCollection()).resolves.toEqual([]);

			await set(COLLECTION_KEY, null);
			await expect(adapter.loadCollection()).resolves.toEqual([]);
		});

		it('rejeita com StorageReadError/StorageUnavailableError em falha persistente', async () => {
			const adapter = createAdapter({
				async probe() {
					return true;
				},
				keyval: fakeKeyval({
					async get() {
						throw new Error('disk failure');
					}
				})
			});

			await expect(adapter.loadCollection()).rejects.toBeInstanceOf(StorageReadError);
		});

		it('rejeita com StorageUnavailableError quando storage fica indisponível', async () => {
			const adapter = createAdapter({
				async probe() {
					return false;
				},
				keyval: fakeKeyval()
			});

			await expect(adapter.loadCollection()).rejects.toBeInstanceOf(StorageUnavailableError);
		});

		it('faz 1 retry de leitura com backoff de 200 ms + jitter', async () => {
			let attempts = 0;
			const adapter = createAdapter({
				async probe() {
					return true;
				},
				keyval: fakeKeyval({
					async get<T = unknown>() {
						attempts += 1;
						if (attempts === 1) {
							throw new Error('transient');
						}
						return { version: 1, ids: ['water_basic'] } as T;
					}
				})
			});

			const start = Date.now();
			await expect(adapter.loadCollection()).resolves.toEqual(['water_basic']);
			const elapsed = Date.now() - start;

			expect(attempts).toBe(2);
			expect(elapsed).toBeGreaterThanOrEqual(200);
		});

		it('rejeita com StorageReadError quando excede o timeout de 2 s', async () => {
			const adapter = createAdapter({
				async probe() {
					return true;
				},
				keyval: fakeKeyval({
					async get() {
						return new Promise<never>(() => {});
					}
				}),
				timeoutMs: 50
			});

			await expect(adapter.loadCollection()).rejects.toBeInstanceOf(StorageReadError);
		});
	});

	describe('saveCollection', () => {
		it('grava o registro versionado completo', async () => {
			const adapter = createAdapter();
			await adapter.saveCollection(['water_basic', 'fire_gold']);
			const raw = await get(COLLECTION_KEY);
			expect(raw).toEqual({ version: 1, ids: ['water_basic', 'fire_gold'] });
		});

		it('rejeita com StorageWriteError em falha de escrita', async () => {
			const adapter = createAdapter({
				async probe() {
					return true;
				},
				keyval: fakeKeyval({
					async set() {
						throw new Error('quota exceeded');
					}
				})
			});

			await expect(adapter.saveCollection(['water_basic'])).rejects.toBeInstanceOf(
				StorageWriteError
			);
		});

		it('rejeita com StorageUnavailableError quando storage fica indisponível', async () => {
			const adapter = createAdapter({
				async probe() {
					return false;
				},
				keyval: fakeKeyval()
			});

			await expect(adapter.saveCollection(['water_basic'])).rejects.toBeInstanceOf(
				StorageUnavailableError
			);
		});

		it('rejeita com StorageWriteError quando excede o timeout de 2 s', async () => {
			const adapter = createAdapter({
				async probe() {
					return true;
				},
				keyval: fakeKeyval({
					async set() {
						return new Promise<void>(() => {});
					}
				}),
				timeoutMs: 50
			});

			await expect(adapter.saveCollection(['water_basic'])).rejects.toBeInstanceOf(
				StorageWriteError
			);
		});
	});
});
