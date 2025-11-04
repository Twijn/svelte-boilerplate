<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCamera, faUser, faTrash } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		currentAvatar?: string | null;
		size?: 'small' | 'medium' | 'large';
		editable?: boolean;
		onFileSelect?: (file: File) => void;
		onDelete?: () => void;
	}

	let {
		currentAvatar = null,
		size = 'medium',
		editable = false,
		onFileSelect,
		onDelete
	}: Props = $props();

	let fileInput = $state<HTMLInputElement>();
	let previewUrl = $state<string | null>(currentAvatar || null);

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('Please select an image file');
				return;
			}

			// Validate file size (5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('File size must be less than 5MB');
				return;
			}

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				previewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);

			// Call callback
			if (onFileSelect) {
				onFileSelect(file);
			}
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	function handleDelete() {
		previewUrl = null;
		if (fileInput) {
			fileInput.value = '';
		}
		if (onDelete) {
			onDelete();
		}
	}

	function getSizeClass() {
		switch (size) {
			case 'small':
				return 'avatar-small';
			case 'large':
				return 'avatar-large';
			default:
				return 'avatar-medium';
		}
	}
</script>

<div class="avatar-upload {getSizeClass()}" class:editable>
	<div class="avatar-container">
		{#if previewUrl}
			<img src={previewUrl} alt="Avatar" class="avatar-image" />
		{:else}
			<div class="avatar-placeholder">
				<FontAwesomeIcon icon={faUser} size="2x" />
			</div>
		{/if}

		{#if editable}
			<button type="button" class="avatar-edit-button" onclick={triggerFileInput}>
				<FontAwesomeIcon icon={faCamera} />
			</button>
			{#if previewUrl}
				<button type="button" class="avatar-delete-button" onclick={handleDelete}>
					<FontAwesomeIcon icon={faTrash} />
				</button>
			{/if}
		{/if}
	</div>

	{#if editable}
		<input
			type="file"
			bind:this={fileInput}
			onchange={handleFileChange}
			accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
			style="display: none;"
			name="avatar"
		/>
	{/if}
</div>

<style>
	.avatar-upload {
		display: inline-block;
		position: relative;
	}

	.avatar-container {
		position: relative;
		border-radius: 50%;
		background: var(--background-color-2);
		border: 3px solid var(--background-color-1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.avatar-container::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		overflow: hidden;
	}

	.avatar-small .avatar-container {
		width: 60px;
		height: 60px;
		border-width: 2px;
	}

	.avatar-medium .avatar-container {
		width: 120px;
		height: 120px;
	}

	.avatar-large .avatar-container {
		width: 180px;
		height: 180px;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color-3);
		background: linear-gradient(
			135deg,
			rgba(var(--theme-color-rgb), 0.1),
			rgba(var(--theme-color-rgb), 0.2)
		);
		border-radius: 50%;
	}

	.avatar-edit-button {
		position: absolute;
		bottom: -3px;
		right: -3px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--theme-color-2);
		color: white;
		border: 3px solid var(--background-color-1);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		z-index: 5;
	}

	.avatar-small .avatar-edit-button {
		width: 24px;
		height: 24px;
		border-width: 2px;
	}

	.avatar-large .avatar-edit-button {
		width: 48px;
		height: 48px;
	}

	.avatar-edit-button:hover {
		background: var(--theme-color-1);
		transform: scale(1.1);
	}

	.avatar-edit-button:active {
		transform: scale(0.95);
	}

	.avatar-delete-button {
		position: absolute;
		bottom: -3px;
		left: -3px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgb(var(--red));
		color: white;
		border: 3px solid var(--background-color-1);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		z-index: 5;
	}

	.avatar-small .avatar-delete-button {
		width: 24px;
		height: 24px;
		border-width: 2px;
	}

	.avatar-large .avatar-delete-button {
		width: 48px;
		height: 48px;
	}

	.avatar-delete-button:hover {
		background: rgb(var(--red-dark, var(--red)));
		transform: scale(1.1);
	}

	.avatar-delete-button:active {
		transform: scale(0.95);
	}
</style>
