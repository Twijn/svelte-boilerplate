<script lang="ts">
	interface Props {
		value?: string;
		onComplete?: (code: string) => void;
		disabled?: boolean;
		error?: boolean;
	}

	let { value = '', onComplete, disabled = false, error = false }: Props = $props();

	let inputs: HTMLInputElement[] = [];
	let code = $state(value.split('').slice(0, 6));

	// Initialize code array with 6 empty strings
	$effect(() => {
		if (code.length < 6) {
			code = [...code, ...Array(6 - code.length).fill('')];
		}
	});

	function handleInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const val = target.value;

		// Only allow single digit
		if (val.length > 1) {
			target.value = val[0];
			code[index] = val[0];
		} else {
			code[index] = val;
		}

		// Auto-focus next input
		if (val && index < 5) {
			inputs[index + 1]?.focus();
		}

		// Check if complete
		if (code.every((digit) => digit !== '')) {
			const fullCode = code.join('');
			if (onComplete) {
				onComplete(fullCode);
			}
		}
	}

	function handleKeyDown(index: number, event: KeyboardEvent) {
		// Handle backspace
		if (event.key === 'Backspace' && !code[index] && index > 0) {
			inputs[index - 1]?.focus();
		}

		// Handle arrow keys
		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			inputs[index - 1]?.focus();
		}
		if (event.key === 'ArrowRight' && index < 5) {
			event.preventDefault();
			inputs[index + 1]?.focus();
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedData = event.clipboardData?.getData('text') || '';
		const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

		digits.forEach((digit, index) => {
			code[index] = digit;
			if (inputs[index]) {
				inputs[index].value = digit;
			}
		});

		// Focus the next empty input or the last one
		const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
		inputs[nextEmptyIndex]?.focus();

		// Check if complete
		if (digits.length === 6) {
			const fullCode = digits.join('');
			if (onComplete) {
				onComplete(fullCode);
			}
		}
	}
</script>

<div class="totp-input-container">
	{#each Array(6) as _, index}
		<input
			bind:this={inputs[index]}
			type="text"
			inputmode="numeric"
			pattern="[0-9]"
			maxlength="1"
			value={code[index] || ''}
			oninput={(e) => handleInput(index, e)}
			onkeydown={(e) => handleKeyDown(index, e)}
			onpaste={handlePaste}
			{disabled}
			class:error
			autocomplete="off"
		/>
	{/each}
</div>

<style>
	.totp-input-container {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		max-width: 100%;
		padding: 0 0.5rem;
		box-sizing: border-box;
	}

	input {
		width: 3rem;
		height: 3.5rem;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		font-family: var(--font-family-mono), monospace;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		background: var(--background-color-1);
		color: var(--text-color-1);
		transition: all 0.2s ease;
		padding: 0;
		margin: 0;
		box-sizing: border-box;
		flex-shrink: 0;
	}

	input:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow:
			0 0 0 3px rgba(var(--theme-color-rgb), 0.1),
			0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: rgba(0, 0, 0, 0.2);
	}

	input.error {
		border-color: rgb(var(--red));
		animation: shake 0.3s ease-in-out;
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
		.totp-input-container {
			gap: 0.4rem;
			padding: 0 0.25rem;
		}

		input {
			width: 2.5rem;
			height: 3rem;
			font-size: 1.25rem;
		}
	}

	@media (max-width: 380px) {
		.totp-input-container {
			gap: 0.3rem;
			padding: 0;
		}

		input {
			width: 2.2rem;
			height: 2.75rem;
			font-size: 1.1rem;
		}
	}
</style>
