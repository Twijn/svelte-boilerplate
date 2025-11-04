<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		children: Snippet;
		hasUnsavedChanges?: boolean;
	}

	let { title, description, children, hasUnsavedChanges = false }: Props = $props();
</script>

<div class="col-12">
	<div class="card-container">
		<div class="card-header">
			<div>
				<h2>{title}</h2>
				{#if description}
					<p class="description">{description}</p>
				{/if}
			</div>
			{#if hasUnsavedChanges}
				<div class="unsaved-indicator">
					<span class="dot"></span>
					<span class="text">Unsaved changes</span>
				</div>
			{/if}
		</div>
		{@render children()}
	</div>
</div>

<style>
	.card-container {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.card-header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: var(--text-color-1);
	}

	.description {
		margin: 0;
		color: var(--text-color-2);
		font-size: 0.95rem;
	}

	.unsaved-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(var(--orange), 0.1);
		border: 1px solid rgba(var(--orange), 0.3);
		border-radius: 0.5rem;
		color: rgb(var(--orange));
		font-size: 0.9rem;
		animation: pulse 2s ease-in-out infinite;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgb(var(--orange));
		animation: blink 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	@media (max-width: 768px) {
		.card-container {
			padding: 1.5rem;
		}

		.card-header {
			flex-direction: column;
			gap: 1rem;
		}

		.unsaved-indicator {
			align-self: flex-start;
		}
	}
</style>
