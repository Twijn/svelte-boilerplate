<script lang="ts">
	import { getPermissionCategories, getPermissionsByCategory } from '$lib/constants/permissions';
	import PermissionBadge from './PermissionBadge.svelte';

	interface Props {
		permissions: string[];
		variant?: 'default' | 'compact' | 'detailed';
		groupByCategory?: boolean;
	}

	const { permissions, variant = 'default', groupByCategory = true }: Props = $props();

	const categories = $derived(getPermissionCategories());

	const permissionsByCategory = $derived.by(() => {
		if (!groupByCategory) {
			return [{ key: 'all', label: 'Permissions', permissions }];
		}

		return categories
			.map((cat) => ({
				...cat,
				permissions: permissions.filter((p) => {
					const allPermsInCat = getPermissionsByCategory(cat.key);
					return allPermsInCat.some((pm) => pm.key === p);
				})
			}))
			.filter((cat) => cat.permissions.length > 0);
	});
</script>

<div class="permissions-display" class:grouped={groupByCategory}>
	{#if groupByCategory}
		{#each permissionsByCategory as category}
			<div class="permission-category">
				<h5 class="category-label">
					{category.label}
					<span class="count">{category.permissions.length}</span>
				</h5>
				<div class="permissions-list">
					{#each category.permissions as permission (permission)}
						<PermissionBadge {permission} {variant} />
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<div class="permissions-list">
			{#each permissions as permission (permission)}
				<PermissionBadge {permission} {variant} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.permissions-display {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.permissions-display.grouped {
		gap: 1.25rem;
	}

	.permission-category {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-label {
		color: var(--text-color-1);
		font-size: 0.85rem;
		font-weight: 600;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.4rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-color-2);
	}

	.permissions-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
</style>
