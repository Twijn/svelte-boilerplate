<script lang="ts">
	interface Props {
		title: string;
		description?: string;
	}

	let { title, description }: Props = $props();
</script>

<div class="auth-header">
	<h1>{title}</h1>
	{#if description}
		<p>{description}</p>
	{/if}
</div>

<style>
	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-header h1 {
		color: var(--text-color-1);
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.auth-header p {
		color: var(--text-color-2);
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.auth-header h1 {
			font-size: 1.75rem;
		}
	}
</style>
