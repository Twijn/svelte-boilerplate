<script lang="ts">
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { page } from '$app/state';
	import { APP_NAME } from '$lib/consts';

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

	// Get helpful suggestions based on error type
	const suggestions = $derived.by(() => {
		const errorType = getErrorType();
		switch (errorType) {
			case '404':
				return ['Check the URL for typos', 'Return to the homepage and navigate from there'];
			case '403':
				return [
					'Make sure you are logged in',
					'Contact an administrator if you believe you should have access',
					'Try logging out and back in'
				];
			case '500':
				return [
					'Refresh the page to try again',
					'Check back in a few minutes',
					'Contact support if the problem persists'
				];
			default:
				return ['Return to the homepage', 'Try refreshing the page'];
		}
	});
</script>

<svelte:head>
	<title>{page.status} - {page?.error?.message ?? 'Internal Server Error'} | {APP_NAME}</title>
</svelte:head>

<ErrorDisplay
	type={getErrorType()}
	message={page?.error?.message ?? 'Internal Server Error'}
	details={`Requested URL: ${page.url.href}`}
>
	{#snippet customSuggestions()}
		{#if suggestions.length > 0}
			<div class="suggestions">
				<ul>
					{#each suggestions as suggestion (suggestion)}
						<li>{suggestion}</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/snippet}
	{#snippet customActions()}
		<Button onClick={() => history.back()} variant="secondary">Go Back</Button>
		<Button href="/" variant="primary">Go Home</Button>
	{/snippet}
</ErrorDisplay>

<style>
	.suggestions {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1.5rem;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.suggestions ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.suggestions li {
		color: var(--text-color-2);
		font-size: 0.9rem;
		padding: 0.5rem 0 0.5rem 1.5rem;
		position: relative;
		line-height: 1.2;
	}

	.suggestions li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: var(--theme-color-2);
		font-weight: bold;
	}
</style>
