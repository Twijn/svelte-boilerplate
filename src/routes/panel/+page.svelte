<script>
	import Heading from '$lib/components/layout/Heading.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import { APP_NAME } from '$lib/consts';
	import { faRocket } from '@fortawesome/free-solid-svg-icons';
</script>

<svelte:head>
	<title>Panel | {APP_NAME}</title>
</svelte:head>

<Heading text="Welcome to {APP_NAME}!" />

<Section icon={faRocket} heading="Getting Started" lgCols={12}>
	<p>This is a boilerplate Svelte project to make it easy to get started with Svelte + Logins</p>
</Section>
