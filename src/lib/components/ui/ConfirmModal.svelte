<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title: string;
		message?: string;
		messageSnippet?: import('svelte').Snippet;
		confirmText?: string;
		cancelText?: string;
		confirmVariant?: 'primary' | 'error' | 'success' | 'secondary';
		warning?: string;
		warningSnippet?: import('svelte').Snippet;
	}

	const {
		isOpen: open = $bindable(false),
		onClose,
		onConfirm,
		title,
		message,
		messageSnippet,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmVariant = 'primary',
		warning,
		warningSnippet
	}: Props = $props();

	function handleConfirm() {
		onConfirm();
		onClose();
	}
</script>

<Modal isOpen={open} {onClose} {title} size="small">
	{#snippet children()}
		<div class="confirm-content">
			<div class="message">
				{#if messageSnippet}
					{@render messageSnippet()}
				{:else if message}
					<p>{message}</p>
				{/if}
			</div>
			{#if warningSnippet || warning}
				<div class="warning">
					{#if warningSnippet}
						{@render warningSnippet()}
					{:else if warning}
						<p>{warning}</p>
					{/if}
				</div>
			{/if}
		</div>

		<div class="confirm-actions">
			<Button type="button" variant="secondary" onClick={onClose}>
				{cancelText}
			</Button>
			<Button type="button" variant={confirmVariant} onClick={handleConfirm}>
				{confirmText}
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.confirm-content {
		margin-bottom: 1.5rem;
	}

	.message {
		color: var(--text-color-1);
		font-size: 1rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.message :global(p) {
		margin: 0;
	}

	.warning {
		color: rgb(var(--orange));
		font-weight: 500;
		font-size: 0.9rem;
		margin: 0;
		padding: 0.75rem;
		background: rgba(var(--orange), 0.1);
		border-left: 3px solid rgb(var(--orange));
		border-radius: 0.25rem;
	}

	.warning :global(p) {
		margin: 0;
	}

	.confirm-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	@media (max-width: 480px) {
		.confirm-actions {
			flex-direction: column-reverse;
		}
	}
</style>
