<script lang="ts">
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { Snippet } from 'svelte';

	const {
		header,
		children,
		actions,
		icon,
		initials,
		initialsTitle,
		name,
		description
	}: {
		header?: Snippet;
		children: Snippet;
		actions?: Snippet;
		icon?: IconDefinition;
		initials?: string;
		initialsTitle?: string;
		name: string;
		description?: string;
	} = $props();
</script>

<article class="card col-4 col-md-6 col-sm-12">
	<div class="card-header">
		{#if icon}
			<div class="card-icon">
				<FontAwesomeIcon {icon} size="lg" />
			</div>
		{:else if initials}
			<div class="card-initials" title={initialsTitle}>{initials.toUpperCase()}</div>
		{/if}
		<div class="card-info">
			<h3>{name}</h3>
			{#if description}
				<p class="card-description">{description}</p>
			{/if}
			<div class="card-meta">
				{@render header?.()}
			</div>
		</div>
	</div>
	<div class="card-content">
		{@render children?.()}
	</div>
	{#if actions}
		<div class="card-actions">
			{@render actions()}
		</div>
	{/if}
</article>

<style>
	.card {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.3s ease;
	}

	.card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.card-header {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.card-icon {
		flex-shrink: 0;
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-initials {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--theme-color-1), var(--theme-color-2));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		color: white;
		flex-shrink: 0;
	}

	.card-info {
		flex: 1;
		min-width: 0;
	}

	.card-info h3 {
		color: var(--text-color-1);
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
	}

	.card-description {
		color: var(--text-color-2);
		font-size: 0.85rem;
		margin: 0 0 0.5rem 0;
	}

	.card-content > :global(div) {
		margin-bottom: 0.75rem;
	}

	.card-content :global(h4) {
		display: flex;
		justify-content: space-between;
		color: var(--text-color-1);
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.75em;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 768px) {
		.card {
			padding: 0.85rem;
		}

		.card-icon {
			width: 40px;
			height: 40px;
		}

		.card-info h3 {
			font-size: 1rem;
		}

		.card-actions {
			flex-direction: column;
		}
	}
</style>
