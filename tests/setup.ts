import '@testing-library/jest-dom';

if (typeof globalThis.structuredClone !== 'function') {
	globalThis.structuredClone = function structuredClone<T>(value: T): T {
		if (value === undefined) return undefined as T;
		return JSON.parse(JSON.stringify(value));
	};
}
