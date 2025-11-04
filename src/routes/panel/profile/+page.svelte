<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import AvatarUpload from '$lib/components/ui/AvatarUpload.svelte';
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSave } from '@fortawesome/free-solid-svg-icons';

	const { data, form } = $props();

	let selectedFile = $state<File | null>(null);
	let deleteAvatar = $state(false);

	// Profile form
	let profileForm = $state({
		firstName: data.user.firstName,
		lastName: data.user.lastName,
		username: data.user.username,
		bio: data.user.bio || '',
		location: data.user.location || '',
		website: data.user.website || ''
	});

	// Track initial values to detect unsaved changes
	let initialForm = $state({
		firstName: data.user.firstName,
		lastName: data.user.lastName,
		username: data.user.username,
		bio: data.user.bio || '',
		location: data.user.location || '',
		website: data.user.website || ''
	});

	// Detect if there are unsaved changes
	let hasUnsavedChanges = $derived(
		profileForm.firstName !== initialForm.firstName ||
			profileForm.lastName !== initialForm.lastName ||
			profileForm.username !== initialForm.username ||
			profileForm.bio !== initialForm.bio ||
			profileForm.location !== initialForm.location ||
			profileForm.website !== initialForm.website ||
			selectedFile !== null ||
			deleteAvatar
	);

	function handleFileSelect(file: File) {
		selectedFile = file;
		deleteAvatar = false;
	}

	function handleAvatarDelete() {
		selectedFile = null;
		deleteAvatar = true;
	}

	// Show notifications from form actions
	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
				// Reset form state after successful update
				if (form.action === 'updateProfile') {
					selectedFile = null;
					deleteAvatar = false;
					// Update initial form values
					initialForm = { ...profileForm };
				}
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<ProfileTab
	title="Profile Information"
	description="Update your personal information and profile details"
	{hasUnsavedChanges}
>
	<form
		method="POST"
		action="?/updateProfile"
		enctype="multipart/form-data"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: false });
			};
		}}
	>
		<div class="profile-header">
			<AvatarUpload
				currentAvatar={data.user.avatar}
				size="medium"
				editable={true}
				onFileSelect={handleFileSelect}
				onDelete={handleAvatarDelete}
			/>
			<div class="profile-info">
				<h2>{data.user.firstName} {data.user.lastName}</h2>
				<p class="username">@{data.user.username}</p>
				<p class="email">{data.user.email}</p>
			</div>
		</div>

		{#if deleteAvatar}
			<input type="hidden" name="deleteAvatar" value="true" />
		{/if}

		<div class="form-grid">
			<div class="form-group">
				<label for="firstName">First Name</label>
				<input
					id="firstName"
					type="text"
					name="firstName"
					bind:value={profileForm.firstName}
					required
					placeholder="John"
				/>
			</div>

			<div class="form-group">
				<label for="lastName">Last Name</label>
				<input
					id="lastName"
					type="text"
					name="lastName"
					bind:value={profileForm.lastName}
					required
					placeholder="Doe"
				/>
			</div>

			<div class="form-group full-width">
				<label for="username">Username</label>
				<input
					id="username"
					type="text"
					name="username"
					bind:value={profileForm.username}
					required
					placeholder="johndoe"
					pattern="[a-z0-9_-]&#123;3,31&#125;"
					title="3-31 characters, lowercase letters, numbers, hyphens, or underscores"
				/>
				<small>3-31 characters, lowercase letters, numbers, hyphens, or underscores</small>
			</div>

			<div class="form-group full-width">
				<label for="bio">Bio</label>
				<textarea
					id="bio"
					name="bio"
					bind:value={profileForm.bio}
					rows="4"
					placeholder="Tell us about yourself..."
					maxlength="500"
				></textarea>
				<small>{profileForm.bio.length}/500 characters</small>
			</div>

			<div class="form-group">
				<label for="location">Location</label>
				<input
					id="location"
					type="text"
					name="location"
					bind:value={profileForm.location}
					placeholder="San Francisco, CA"
				/>
			</div>

			<div class="form-group">
				<label for="website">Website</label>
				<input
					id="website"
					type="url"
					name="website"
					bind:value={profileForm.website}
					placeholder="https://example.com"
				/>
			</div>
		</div>

		<div class="form-actions">
			<Button type="submit" variant="primary">
				<FontAwesomeIcon icon={faSave} />
				Save Changes
			</Button>
		</div>
	</form>
</ProfileTab>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.profile-info h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: var(--text-color-1);
	}

	.username {
		margin: 0 0 0.25rem 0;
		color: var(--theme-color-2);
		font-weight: 600;
	}

	.email {
		margin: 0;
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.full-width {
		grid-column: span 2;
	}

	label {
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	small {
		margin-top: 0.25rem;
		color: var(--text-color-2);
		font-size: 0.85rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.profile-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-group.full-width {
			grid-column: span 1;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
