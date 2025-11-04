<script lang="ts">
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { APP_NAME } from '$lib/consts';
</script>

<svelte:head>
	<title>Unauthorized Access | {APP_NAME}</title>
</svelte:head>

<ErrorDisplay
	type="403"
	message="Sorry, you don't have permission to access this resource. If you believe this is an error, please contact your administrator."
>
	{#snippet customActions()}
		<Button href="/panel" variant="primary">Back to Dashboard</Button>
		<Button href="/" variant="secondary">Go Home</Button>
	{/snippet}
</ErrorDisplay>
