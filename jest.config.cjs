/** @type {import('jest').Config} */
module.exports = {
	projects: [
		{
			displayName: 'unit',
			testEnvironment: 'jsdom',
			roots: ['<rootDir>/tests/unit'],
			setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
			transform: {
				'^.+\\.ts$': 'ts-jest',
				'^.+\\.svelte$': [
					'svelte-jester',
					{ preprocess: true, compiler: 'svelte' }
				]
			},
			moduleFileExtensions: ['js', 'ts', 'svelte'],
			moduleNameMapper: {
				'^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
				'^\\$data/(.*)$': '<rootDir>/src/data/$1',
				'^\\$app/(.*)$': '<rootDir>/tests/mocks/sveltekit/$1.ts'
			}
		},
		{
			displayName: 'integration',
			testEnvironment: 'jsdom',
			roots: ['<rootDir>/tests/integration'],
			setupFiles: ['fake-indexeddb/auto'],
			setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
			transform: {
				'^.+\\.ts$': 'ts-jest'
			},
			moduleFileExtensions: ['js', 'ts'],
			moduleNameMapper: {
				'^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
				'^\\$data/(.*)$': '<rootDir>/src/data/$1',
				'^\\$app/(.*)$': '<rootDir>/tests/mocks/sveltekit/$1.ts'
			}
		}
	]
};
