<script lang="ts">
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>404 - Page Not Found</title>
</svelte:head>

<ErrorDisplay
	type="404"
	message="The page '{page.url.pathname}' doesn't exist or has been moved."
	details="Requested URL: {page.url.href}"
/>
