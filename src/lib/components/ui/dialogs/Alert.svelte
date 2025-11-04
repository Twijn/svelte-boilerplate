<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';

	type AlertVariant = 'info' | 'success' | 'danger';

	const { children, variant }: { children: Snippet; variant: AlertVariant } = $props();
</script>

<div
	class="alert col-12"
	class:info={variant === 'info'}
	class:success={variant === 'success'}
	class:danger={variant === 'danger'}
	role="alert"
	transition:slide
>
	{@render children?.()}
</div>

<style>
	.info {
		--variant-color: var(--blue);
	}

	.success {
		--variant-color: var(--green);
	}

	.danger {
		--variant-color: var(--red);
	}

	.alert {
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		border-left: 4px solid rgba(var(--variant-color), 0.6);
		color: rgba(var(--variant-color), 1);
		background: linear-gradient(
			135deg,
			rgba(var(--variant-color), 0.12),
			rgba(var(--variant-color), 0.08)
		);
		border: 1px solid rgba(var(--variant-color), 0.2);
		box-shadow:
			0 2px 8px rgba(var(--variant-color), 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		font-weight: 500;
		position: relative;
		overflow: hidden;
	}

	.alert::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 100%;
		background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.05));
		pointer-events: none;
	}

	/* Variant-specific styles that were in app.css */
	.info {
		--variant-color: var(--theme-color-rgb);
		color: var(--text-color-1);
	}

	.success {
		--variant-color: var(--green);
		color: var(--text-color-1);
	}

	.danger {
		--variant-color: var(--red);
		color: var(--text-color-1);
	}

	.alert :global(p) {
		margin: 0.25em 0;
	}

	.alert :global(p:last-of-type) {
		margin-bottom: 0;
	}
</style>
