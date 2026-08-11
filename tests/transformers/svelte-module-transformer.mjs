// @ts-nocheck
import { compileModule } from 'svelte/compiler';

export default {
	process(source, filename) {
		const result = compileModule(source, {
			filename,
			dev: true,
			generate: 'client'
		});
		return {
			code: result.js.code,
			map: result.js.map
		};
	}
};
