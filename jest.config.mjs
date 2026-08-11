/** @type {import('jest').Config} */
export default {
	projects: [
		{
			displayName: 'unit',
			testEnvironment: 'jsdom',
			roots: ['<rootDir>/tests/unit'],
			setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
			injectGlobals: true,
			extensionsToTreatAsEsm: ['.ts', '.svelte'],
			transform: {
				'\\.svelte\\.js$': '<rootDir>/tests/transformers/svelte-module-transformer.mjs',
				'^.+\\.(js|ts)$': ['ts-jest', { useESM: true }],
				'^.+\\.svelte$': [
					'svelte-jester',
					{ preprocess: true, compiler: 'svelte' }
				]
			},
			moduleFileExtensions: ['js', 'ts', 'svelte', 'svelte.js'],
			moduleNameMapper: {
				'^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
				'^\\$data/(.*)$': '<rootDir>/src/data/$1',
				'^\\$app/(.*)$': '<rootDir>/tests/mocks/sveltekit/$1.ts'
			},
			transformIgnorePatterns: ['node_modules/(?!(svelte|idb-keyval|esm-env|@testing-library)/)']
		},
		{
			displayName: 'integration',
			testEnvironment: 'jsdom',
			roots: ['<rootDir>/tests/integration'],
			setupFiles: ['fake-indexeddb/auto'],
			setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
			injectGlobals: true,
			extensionsToTreatAsEsm: ['.ts'],
			transform: {
				'^.+\\.ts$': ['ts-jest', { useESM: true }]
			},
			moduleFileExtensions: ['js', 'ts'],
			moduleNameMapper: {
				'^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
				'^\\$data/(.*)$': '<rootDir>/src/data/$1',
				'^\\$app/(.*)$': '<rootDir>/tests/mocks/sveltekit/$1.ts'
			},
			transformIgnorePatterns: ['node_modules/(?!(idb-keyval)/)']
		}
	]
};
