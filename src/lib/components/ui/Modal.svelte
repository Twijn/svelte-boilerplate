<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		title: string;
		children: Snippet;
		size?: 'small' | 'medium' | 'large';
		closeOnEscape?: boolean;
		closeOnOutsideClick?: boolean;
	}

	let {
		isOpen: open = $bindable(false),
		onClose,
		title,
		children,
		size = 'medium',
		closeOnEscape = true,
		closeOnOutsideClick = true
	}: Props = $props();

	let modalElement: HTMLDivElement | null = $state(null);
	let previouslyFocusedElement: HTMLElement | null = null;

	// Handle keyboard interactions
	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape' && closeOnEscape) {
			event.preventDefault();
			handleClose();
		}

		// Trap focus within modal
		if (event.key === 'Tab' && modalElement) {
			const focusableElements = modalElement.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const firstElement = focusableElements[0] as HTMLElement;
			const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault();
				lastElement?.focus();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault();
				firstElement?.focus();
			}
		}
	}

	function handleClose() {
		open = false;
		onClose();
	}

	function handleOverlayClick(event: MouseEvent) {
		if (closeOnOutsideClick && event.target === event.currentTarget) {
			handleClose();
		}
	}

	// Focus management
	$effect(() => {
		if (open) {
			// Store previously focused element
			previouslyFocusedElement = document.activeElement as HTMLElement;

			// Focus first focusable element in modal
			setTimeout(() => {
				if (modalElement) {
					const focusableElements = modalElement.querySelectorAll(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					const firstElement = focusableElements[0] as HTMLElement;
					firstElement?.focus();
				}
			}, 100);

			// Prevent body scroll
			document.body.style.overflow = 'hidden';

			return () => {
				// Restore body scroll
				document.body.style.overflow = '';

				// Restore focus to previously focused element
				previouslyFocusedElement?.focus();
			};
		}
	});

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if open}
	<div class="modal-overlay" onclick={handleOverlayClick} role="presentation" aria-hidden={!open}>
		<div
			bind:this={modalElement}
			class="modal modal-{size}"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<header class="modal-header">
				<h3 id="modal-title">{title}</h3>
				<button class="modal-close" onclick={handleClose} aria-label="Close modal" type="button">
					×
				</button>
			</header>

			<div class="modal-body">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 1rem;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-small {
		max-width: 400px;
	}

	.modal-medium {
		max-width: 600px;
	}

	.modal-large {
		max-width: 900px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header h3 {
		color: var(--text-color-1);
		font-size: 1.3rem;
		font-weight: 600;
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		font-size: 1.5rem;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: background-color 0.2s ease;
		flex-shrink: 0;
	}

	.modal-close:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-close:focus-visible {
		outline: 2px solid var(--theme-color-2);
		outline-offset: 2px;
	}

	.modal-body {
		padding: 1rem 2rem 2rem;
	}

	@media (max-width: 768px) {
		.modal {
			width: 95%;
			max-height: 95vh;
		}

		.modal-header,
		.modal-body {
			padding-left: 1rem;
			padding-right: 1rem;
		}

		.modal-header {
			padding-top: 1.5rem;
		}

		.modal-body {
			padding-bottom: 1.5rem;
		}
	}
</style>
