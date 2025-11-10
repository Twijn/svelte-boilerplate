<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		value?: string;
		placeholder?: string;
		debounce?: number;
		onSearch?: (value: string) => void;
		onClear?: () => void;
		disabled?: boolean;
		maxWidth?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		debounce = 300,
		onSearch,
		onClear,
		disabled = false,
		maxWidth = '600px'
	}: Props = $props();

	let debounceTimer: ReturnType<typeof setTimeout> | undefined = $state(undefined);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Set new timer for debounced search
		if (debounce > 0) {
			debounceTimer = setTimeout(() => {
				onSearch?.(value);
			}, debounce);
		} else {
			onSearch?.(value);
		}
	}

	function handleClear() {
		value = '';
		onSearch?.('');
		onClear?.();
	}

	// Cleanup on component destroy
	$effect(() => {
		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});
</script>

<div class="search-container" style="max-width: {maxWidth}">
	<div class="search-icon">
		<FontAwesomeIcon icon={faSearch} />
	</div>
	<input type="text" class="search-input" {placeholder} {disabled} {value} oninput={handleInput} />
	{#if value}
		<button class="clear-button" onclick={handleClear} type="button" aria-label="Clear search">
			<FontAwesomeIcon icon={faXmark} />
		</button>
	{/if}
</div>

<style>
	.search-container {
		position: relative;
		width: 100%;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-color-3);
		pointer-events: none;
		font-size: 0.9rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		padding-left: 2.75rem;
		padding-right: 3rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: var(--text-color-1);
		font-size: 0.95rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
	}

	.search-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.clear-button {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: var(--text-color-2);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-button:hover {
		background: rgba(255, 255, 255, 0.15);
		color: var(--text-color-1);
	}

	.clear-button:active {
		transform: translateY(-50%) scale(0.95);
	}
</style>
