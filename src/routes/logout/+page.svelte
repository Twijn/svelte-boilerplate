<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import CenteredSection from '$lib/components/ui/CenteredSection.svelte';
</script>

<CenteredSection heading="Sign Out">
	<div class="form-container">
		<p class="form-intro">Are you sure you want to sign out?</p>

		<form method="POST" use:enhance class="enhanced-form">
			<div class="form-actions">
				<Button full type="submit" variant="error">Sign Out</Button>
				<Button href="/panel" variant="link">Cancel</Button>
			</div>
		</form>
	</div>
</CenteredSection>
