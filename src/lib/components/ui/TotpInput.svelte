<script lang="ts">
	interface Props {
		value?: string;
		onComplete?: (code: string) => void;
		disabled?: boolean;
		error?: boolean;
	}

	let { value = $bindable(''), onComplete, disabled = false, error = false }: Props = $props();

	let inputs = $state<HTMLInputElement[]>([]);
	let code = $state(value.split('').slice(0, 6));

	// Initialize code array with 6 empty strings
	$effect(() => {
		if (code.length < 6) {
			code = [...code, ...Array(6 - code.length).fill('')];
		}
	});

	let hiddenInput = $state<HTMLInputElement | null>(null);

	function handleHiddenInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const digits = target.value.replace(/\D/g, '').slice(0, 6).split('');

		digits.forEach((digit, index) => {
			code[index] = digit;
			if (inputs[index]) {
				inputs[index].value = digit;
			}
		});

		// Update the bindable value
		value = code.join('');

		// Focus first visible input
		inputs[0]?.focus();

		// Check if complete
		if (digits.length === 6 && onComplete) {
			onComplete(digits.join(''));
		}
	}
</script>

<div class="totp-input-wrapper">
	<!-- Visible input for Bitwarden TOTP autofill - styled to blend with boxes -->
	<label>
		Access Code
		<input
			bind:this={hiddenInput}
			type="text"
			inputmode="numeric"
			maxlength="6"
			autocomplete="one-time-code"
			placeholder="000000"
			oninput={handleHiddenInput}
			onfocus={() => hiddenInput?.select()}
			class="totp-autofill-input"
			class:error
		/>
	</label>
</div>

<style>
	.totp-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.totp-autofill-input {
		width: 100%;
		max-width: 20rem;
		height: 3rem;
		text-align: center;
		font-size: 1.25rem;
		font-weight: 600;
		font-family: var(--font-family-mono), monospace;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		background: var(--background-color-1);
		color: var(--text-color-1);
		padding: 0 1rem;
		letter-spacing: 0.5rem;
	}

	.totp-autofill-input:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
	}

	.totp-autofill-input::placeholder {
		letter-spacing: 0.5rem;
		opacity: 0.3;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-5px);
		}
		75% {
			transform: translateX(5px);
		}
	}

	/* Responsive adjustments to prevent overflow */
	@media (max-width: 640px) {
		input {
			width: 2.5rem;
			height: 3rem;
			font-size: 1.25rem;
		}
	}

	@media (max-width: 380px) {
		input {
			width: 2.2rem;
			height: 2.75rem;
			font-size: 1.1rem;
		}
	}
</style>
