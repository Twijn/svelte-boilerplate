import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./tests/setup.ts'],
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'tests/', '**/*.config.*', '**/mockData', '.svelte-kit/']
		}
	},
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			$app: resolve('./node_modules/@sveltejs/kit/src/runtime/app'),
			'$env/dynamic/private': resolve('./tests/mocks/env.ts'),
			'$env/static/private': resolve('./tests/mocks/env.ts')
		}
	}
});
