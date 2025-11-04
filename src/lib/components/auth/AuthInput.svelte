<script lang="ts">
	import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	interface Props {
		label: string;
		name: string;
		id?: string;
		type?: 'text' | 'email' | 'password';
		value?: string;
		required?: boolean;
		autocomplete?: AutoFill;
		placeholder?: string;
		helperText?: string;
		showToggle?: boolean;
		minlength?: number;
	}

	let {
		label,
		id = crypto.randomUUID(),
		name,
		type = 'text',
		value = $bindable(''),
		required = false,
		autocomplete,
		placeholder,
		helperText,
		showToggle = false,
		minlength
	}: Props = $props();

	let showPassword = $state(false);
	let inputValue = $derived(value);
</script>

<div class="form-group">
	<label for={id}>{label}</label>
	<div class="input-wrapper" class:has-toggle={showToggle}>
		<input
			{id}
			{name}
			type={showToggle ? (showPassword ? 'text' : 'password') : type}
			bind:value={inputValue}
			{required}
			{autocomplete}
			{placeholder}
			{minlength}
		/>
		{#if showToggle}
			<button
				type="button"
				class="toggle-password"
				onclick={() => (showPassword = !showPassword)}
				aria-label={showPassword ? 'Hide password' : 'Show password'}
			>
				<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
			</button>
		{/if}
	</div>
	{#if helperText}
		<small>{helperText}</small>
	{/if}
</div>

<style>
	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		color: var(--text-color-1);
		font-weight: 500;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.input-wrapper {
		position: relative;
	}

	.input-wrapper input {
		width: 100%;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		color: var(--text-color-1);
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.input-wrapper.has-toggle input {
		padding-right: 3rem;
	}

	.input-wrapper input:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.2);
	}

	.input-wrapper input::placeholder {
		color: var(--text-color-3);
	}

	.form-group small {
		display: block;
		margin-top: 0.25rem;
		color: var(--text-color-3);
		font-size: 0.85rem;
	}

	.toggle-password {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s ease;
	}

	.toggle-password:hover {
		color: var(--text-color-1) !important;
	}

	.toggle-password :global(svg) {
		font-size: 1rem;
	}

	.toggle-password :global(svg path) {
		fill: currentColor !important;
	}
</style>
