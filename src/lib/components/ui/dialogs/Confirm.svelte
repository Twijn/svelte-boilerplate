<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { confirm } from '$lib/stores/confirm';
	import Button from '$lib/components/ui/Button.svelte';

	const handleClickOutside = (node: HTMLElement) => {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node)) {
				$confirm?.cancel?.();
			}
		};

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				$confirm?.cancel?.();
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
</script>

{#if $confirm}
	<div class="modal-backdrop" transition:fade={{ duration: 200 }}>
		<div class="modal" transition:scale={{ duration: 200 }} use:handleClickOutside>
			<p class="modal-message">{$confirm.message}</p>
			<div class="modal-buttons">
				<Button variant="secondary" type="button" onClick={() => $confirm.cancel?.()}>
					{$confirm.cancelButtonLabel ?? 'Cancel'}
				</Button>
				<Button
					variant={$confirm.danger ? 'error' : 'primary'}
					type="button"
					onClick={() => $confirm.confirm()}
				>
					{$confirm.confirmButtonLabel ?? 'Confirm'}
				</Button>
			</div>
		</div>
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
		max-width: 400px;
		width: calc(100% - 4rem);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
		text-align: center;
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
</style>
