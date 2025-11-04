<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		children,
		heading
	}: {
		children: Snippet;
		heading: string;
	} = $props();
</script>

<main>
	<h1>{heading}</h1>
	{@render children?.()}
</main>

<style>
	main {
		padding: 0.75em;
		max-width: 30em;
		margin: 0 auto;
	}
</style>
