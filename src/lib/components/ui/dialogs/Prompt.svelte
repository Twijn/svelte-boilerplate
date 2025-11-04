<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { prompt } from '$lib/stores/prompt';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/dialogs/Alert.svelte';

	const handleClickOutside = (node: HTMLElement) => {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node)) {
				$prompt?.cancel?.();
			}
		};

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				$prompt?.cancel?.();
			}
		};

		document.addEventListener('click', handleClick, true);
		document.addEventListener('keydown', handleKeydown, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
				document.removeEventListener('keydown', handleKeydown, true);
			}
		};
	};

	let value: string = $state('');
	let inputElement: HTMLInputElement | null = $state(null);

	function confirm(e: Event) {
		e.preventDefault();
		if ($prompt) {
			$prompt.confirm(value);
		}
		return false;
	}

	$effect(() => {
		if ($prompt && inputElement) {
			inputElement.focus();
		} else {
			value = '';
		}
	});

	function handleKeyUp(e: KeyboardEvent) {
		if (e.key !== 'Enter') {
			prompt.clearErrors();
		}
	}
</script>

{#if $prompt}
	<div class="modal-backdrop" transition:fade={{ duration: 200 }}>
		<form>
			<div class="modal" transition:scale={{ duration: 200 }} use:handleClickOutside>
				{#if $prompt.errors && $prompt.errors.length > 0}
					{#each $prompt.errors as error (error)}
						<Alert variant="danger">
							{error}
						</Alert>
					{/each}
				{/if}
				<p class="modal-message">{$prompt.message}</p>
				<label>
					{$prompt.inputLabel}
					<input type={$prompt.type} bind:value bind:this={inputElement} onkeyup={handleKeyUp} />
				</label>
				<div class="modal-buttons">
					<Button variant="secondary" type="button" onClick={() => $prompt.cancel?.()}>
						{$prompt.cancelButtonLabel ?? 'Cancel'}
					</Button>
					<Button variant={$prompt.danger ? 'error' : 'primary'} type="submit" onClick={confirm}>
						{$prompt.confirmButtonLabel ?? 'Confirm'}
					</Button>
				</div>
			</div>
		</form>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(1px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--background-color-2);
		padding: 1.5rem;
		border-radius: 1rem;
		max-width: 600px;
		width: calc(100% - 4rem);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	}

	.modal-message {
		margin-bottom: 1.5rem;
		font-size: 1.1rem;
		font-weight: 500;
	}

	.modal-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	label {
		margin: 0.75em 0;
	}

	p {
		margin-top: 0;
	}
</style>
