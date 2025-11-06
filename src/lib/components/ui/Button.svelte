<script lang="ts">
	import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	export let href: string | undefined = undefined;
	export let newTab: boolean = false;
	export let variant: 'primary' | 'secondary' | 'success' | 'error' | 'link' | 'header' = 'primary';
	export let onClick: ((e: Event) => void | boolean | Promise<boolean>) | undefined = undefined;
	export let full: boolean = false;
	export let arrow: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;
	export let external: boolean = false;
	export let title: string | undefined = undefined;

	function handleClick(e: Event) {
		if (disabled) {
			e.preventDefault();
			return false;
		}
		if (onClick) {
			onClick(e);
		}
	}
</script>

{#if href}
	<a
		{href}
		class="button {variant}"
		class:disabled
		class:full
		class:arrow
		target={newTab ? '_blank' : undefined}
		rel={external ? 'external' : undefined}
		{title}
		onclick={handleClick}
	>
		<slot />
		{#if arrow}
			<FontAwesomeIcon icon={faArrowRight} />
		{/if}
	</a>
{:else}
	<button onclick={handleClick} {type} class="button {variant}" {disabled} class:full class:arrow>
		<slot />
		{#if arrow}
			<FontAwesomeIcon icon={faArrowRight} />
		{/if}
	</button>
{/if}

<style>
	.button {
		position: relative;
		box-sizing: border-box;
		font-family: var(--font-family), sans-serif;
		color: var(--text-color-1);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.button.arrow {
		padding-right: 2.5rem;
	}

	.button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transition: left 0.5s;
	}

	.button :global(svg) {
		margin-right: 0.5em;
	}

	.arrow :global(svg) {
		position: absolute;
		top: 50%;
		right: 0.3rem;
		transform: translateY(-50%);
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		opacity: 0.9;
	}

	.button.arrow:hover:not(.disabled) :global(svg),
	.button.arrow:focus-visible:not(.disabled) :global(svg) {
		transform: translateY(-50%) translateX(3px) scale(1.1);
		opacity: 1;
	}

	.primary {
		background: linear-gradient(135deg, var(--theme-color-1), var(--theme-color-2));
		color: white;
		border-color: var(--theme-color-2);
	}

	.secondary {
		background: linear-gradient(135deg, var(--background-color-2), #323537);
		color: var(--text-color-1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.success {
		background: linear-gradient(135deg, rgb(var(--green)), rgba(var(--green), 0.8));
		color: white;
		border-color: rgb(var(--green));
	}

	.error {
		background: linear-gradient(135deg, rgb(var(--red)), rgba(var(--red), 0.8));
		color: white;
		border-color: rgb(var(--red));
	}

	.link {
		background: transparent;
		color: #e4e4e4;
		border: none;
		padding: 0.25rem 0;
		font-weight: 600;
		font-size: 0.9rem;
		box-shadow: none;
		position: relative;
		transition: all 0.2s ease;
	}

	.link::before {
		display: none;
	}

	.link::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 0;
		height: 2px;
		background: linear-gradient(90deg, var(--theme-color-1), var(--theme-color-2));
		transition: width 0.3s ease;
	}

	.button:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 6px 20px rgba(0, 0, 0, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.button:hover:not(.disabled)::before {
		left: 100%;
	}

	.button:active:not(.disabled) {
		transform: translateY(-1px);
		box-shadow:
			0 3px 10px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.primary:hover:not(.disabled) {
		box-shadow:
			0 6px 20px rgba(var(--theme-color-rgb), 0.4),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.success:hover:not(.disabled) {
		box-shadow:
			0 6px 20px rgba(var(--green), 0.4),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.error:hover:not(.disabled) {
		box-shadow:
			0 6px 20px rgba(var(--red), 0.4),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.link:hover:not(.disabled),
	.link:focus-visible:not(.disabled) {
		color: var(--theme-color-1);
		transform: none;
		box-shadow: none;
		border-color: transparent;
	}

	.link:hover:not(.disabled)::after,
	.link:focus-visible:not(.disabled)::after {
		width: 100%;
	}

	.link:hover:not(.disabled)::before {
		left: -100%;
	}

	.header {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-color-1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 500;
		border-radius: 0.375rem;
		box-shadow: none;
		backdrop-filter: blur(10px);
		transition: all 0.2s ease;
	}

	.header::before {
		display: none;
	}

	.header:hover:not(.disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-color: rgba(255, 255, 255, 0.2);
		transform: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.header:active:not(.disabled) {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(0.98);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.disabled,
	.button:disabled {
		cursor: not-allowed;
		background: var(--background-color-2);
		color: var(--text-color-2);
		border-color: rgba(255, 255, 255, 0.05);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
		transform: none !important;
	}

	.disabled::before,
	.button:disabled::before {
		display: none;
	}

	.full {
		width: 100%;
	}
</style>
