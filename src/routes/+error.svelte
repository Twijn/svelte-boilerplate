<script lang="ts">
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
	import { page } from '$app/state';

	function getErrorType(): '403' | '404' | '500' | undefined {
		switch (page.status) {
			case 403:
				return '403';
			case 404:
				return '404';
			case 500:
				return '500';
			default:
				return undefined;
		}
	}
</script>

<svelte:head>
	<title>{page.status} - {page?.error?.message ?? 'Internal Server Error'}</title>
</svelte:head>

<ErrorDisplay
	type={getErrorType()}
	message={page?.error?.message ?? 'Internal Server Error'}
	details={`Requested URL: ${page.url.href}`}
/>
