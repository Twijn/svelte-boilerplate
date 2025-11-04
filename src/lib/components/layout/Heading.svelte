<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../ui/Button.svelte';

	type ButtonProps = {
		variant?: 'primary' | 'secondary' | 'link' | 'error';
		type?: 'button' | 'submit' | 'reset';
		text: string;
		onClick: () => void;
	};

	const {
		children,
		text,
		description,
		buttons
	}: { children?: Snippet; text: string; description?: string; buttons?: ButtonProps[] } = $props();
</script>

<div class="header col-12">
	<div class="header-content">
		<h1>{text}</h1>
		{#if description}
			<p class="description">{description}</p>
		{/if}
	</div>
	{@render children?.()}
	{#if buttons}
		<div class="buttons">
			{#each buttons as button}
				<Button
					type={button.type ?? 'button'}
					variant={button.variant ?? 'primary'}
					onClick={button.onClick}
				>
					{button.text}
				</Button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	h1 {
		font-size: 1.8rem;
		margin: 0.3rem 0;
		color: var(--primary-text-color);
	}

	.description {
		color: var(--secondary-text-color);
		margin: 0 0 1.5rem 0;
		font-size: 1rem;
	}

	.buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.buttons {
			width: 100%;
		}

		.buttons :global(button) {
			flex: 1;
			min-width: 120px;
		}
	}
</style>
