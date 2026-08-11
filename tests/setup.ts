import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
	globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
	globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

if (typeof globalThis.structuredClone !== 'function') {
	globalThis.structuredClone = function structuredClone<T>(value: T): T {
		if (value === undefined) return undefined as T;
		return JSON.parse(JSON.stringify(value));
	};
}
