<script lang="ts">
	import {
		getPermissionLabel,
		getPermissionCategory,
		getPermissionDescription
	} from '$lib/constants/permissions';

	interface Props {
		permission: string;
		showTooltip?: boolean;
		variant?: 'default' | 'compact' | 'detailed';
	}

	const { permission, showTooltip = true, variant = 'default' }: Props = $props();

	const label = $derived(getPermissionLabel(permission));
	const category = $derived(getPermissionCategory(permission));
	const description = $derived(getPermissionDescription(permission));
</script>

<span
	class="permission-badge"
	class:category-basic={category === 'basic'}
	class:category-admin={category === 'admin'}
	class:category-system={category === 'system'}
	class:category-content={category === 'content'}
	class:category-api={category === 'api'}
	class:compact={variant === 'compact'}
	class:detailed={variant === 'detailed'}
	title={showTooltip ? description : undefined}
>
	{#if variant === 'detailed'}
		<span class="permission-label">{label}</span>
		{#if description}
			<span class="permission-description">{description}</span>
		{/if}
	{:else}
		{label}
	{/if}
</span>

<style>
	.permission-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.65rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid;
		transition: all 0.2s ease;
		cursor: help;
	}

	.permission-badge.compact {
		padding: 0.15rem 0.5rem;
		font-size: 0.7rem;
	}

	.permission-badge.detailed {
		flex-direction: column;
		align-items: flex-start;
		padding: 0.5rem 0.75rem;
		gap: 0.15rem;
	}

	/* Category-based colors */
	.category-basic {
		background: rgba(100, 200, 255, 0.1);
		border-color: rgba(100, 200, 255, 0.3);
		color: rgb(120, 210, 255);
	}

	.category-admin {
		background: rgba(255, 100, 100, 0.1);
		border-color: rgba(255, 100, 100, 0.3);
		color: rgb(255, 130, 130);
	}

	.category-system {
		background: rgba(255, 200, 100, 0.1);
		border-color: rgba(255, 200, 100, 0.3);
		color: rgb(255, 210, 120);
	}

	.category-content {
		background: rgba(150, 255, 150, 0.1);
		border-color: rgba(150, 255, 150, 0.3);
		color: rgb(150, 255, 150);
	}

	.category-api {
		background: rgba(200, 150, 255, 0.1);
		border-color: rgba(200, 150, 255, 0.3);
		color: rgb(210, 170, 255);
	}

	.permission-label {
		font-weight: 600;
		font-size: 0.8rem;
	}

	.permission-description {
		font-size: 0.7rem;
		opacity: 0.8;
		font-weight: 400;
	}

	.permission-badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
</style>
