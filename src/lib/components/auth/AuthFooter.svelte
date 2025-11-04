<script lang="ts">
	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="auth-footer">
	{@render children()}
</div>

<style>
	.auth-footer {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.auth-footer :global(p) {
		color: var(--text-color-2);
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.auth-footer :global(a) {
		color: var(--theme-color-2);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.auth-footer :global(a:hover) {
		color: var(--theme-color-1);
		text-decoration: underline;
	}
</style>
