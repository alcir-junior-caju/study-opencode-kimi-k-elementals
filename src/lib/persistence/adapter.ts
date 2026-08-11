export const COLLECTION_KEY = 'collection';

export const COLLECTION_RECORD_VERSION = 1;

export const STORAGE_OPERATION_TIMEOUT_MS = 2000;

export interface CollectionRecord {
	readonly version: number;
	readonly ids: string[];
}

export interface PersistenceAdapter {
	isStorageAvailable(): Promise<boolean>;
	loadCollection(): Promise<string[]>;
	saveCollection(ids: string[]): Promise<void>;
}
