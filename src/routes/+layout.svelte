<script lang="ts">
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';

	import '@fontsource-variable/noto-sans';
	import '@fontsource/lato/400.css';
	import '@fontsource/lato/700.css';
	import '@fontsource/fira-code';
	import '$lib/app.css';

	config.autoAddCss = false;

	const { children } = $props();
</script>

{@render children?.()}
