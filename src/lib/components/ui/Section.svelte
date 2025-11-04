<script lang="ts">
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { Snippet } from 'svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

	const {
		children,
		heading,
		icon,
		lgCols = 12,
		mdCols,
		smCols
	}: {
		children: Snippet;
		heading?: string;
		icon?: IconDefinition;
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();
</script>

<section
	class="{lgCols ? `col-${lgCols}` : ''} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''}"
>
	{#if heading}
		<h2>
			{#if icon}
				<FontAwesomeIcon {icon} />
			{/if}
			{heading}
		</h2>
	{/if}
	{@render children?.()}
</section>

<style>
	section {
		background-color: var(--background-color-2);
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2);
	}

	:global(section > h2, section > h3, section > h4, section > h5, section > h6) {
		font-size: 0.95rem;
		text-transform: uppercase;
		padding: 0.8rem 1rem;
		margin: -1rem -1rem 1rem -1rem;
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem 0.5rem 0 0;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2) inset;
	}

	@media only screen and (max-width: 768px) {
		section {
			padding: 0.75rem;
		}

		:global(section > h2, section > h3, section > h4, section > h5, section > h6) {
			padding: 0.75rem 0.75rem;
			margin: -0.75rem -0.75rem 0.75rem -0.75rem;
		}
	}
</style>
