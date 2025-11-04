<script lang="ts">
	import {
		getAllPermissions,
		getPermissionCategories,
		getPermissionsByCategory
	} from '$lib/constants/permissions';

	interface Props {
		selected?: string[];
		onSelect?: (permissions: string[]) => void;
		disabled?: boolean;
	}

	let { selected = $bindable([]), onSelect, disabled = false }: Props = $props();

	const categories = getPermissionCategories();

	function togglePermission(key: string) {
		if (disabled) return;

		if (selected.includes(key)) {
			selected = selected.filter((p) => p !== key);
		} else {
			selected = [...selected, key];
		}

		onSelect?.(selected);
	}

	function toggleCategory(categoryKey: string) {
		if (disabled) return;

		const categoryPerms = getPermissionsByCategory(categoryKey).map((p) => p.key);
		const allSelected = categoryPerms.every((p) => selected.includes(p));

		if (allSelected) {
			selected = selected.filter((p) => !categoryPerms.includes(p));
		} else {
			const newPerms = categoryPerms.filter((p) => !selected.includes(p));
			selected = [...selected, ...newPerms];
		}

		onSelect?.(selected);
	}

	function isCategoryFullySelected(categoryKey: string): boolean {
		const categoryPerms = getPermissionsByCategory(categoryKey);
		return categoryPerms.length > 0 && categoryPerms.every((p) => selected.includes(p.key));
	}

	function isCategoryPartiallySelected(categoryKey: string): boolean {
		const categoryPerms = getPermissionsByCategory(categoryKey);
		return (
			categoryPerms.some((p) => selected.includes(p.key)) && !isCategoryFullySelected(categoryKey)
		);
	}
</script>

<div class="permission-selector">
	{#each categories as category}
		{@const categoryPermissions = getPermissionsByCategory(category.key)}
		{#if categoryPermissions.length > 0}
			<div class="category-section">
				<div class="category-header">
					<label class="category-checkbox">
						<input
							type="checkbox"
							checked={isCategoryFullySelected(category.key)}
							indeterminate={isCategoryPartiallySelected(category.key)}
							onchange={() => toggleCategory(category.key)}
							{disabled}
						/>
						<span class="category-name">{category.label}</span>
						<span class="category-count">{categoryPermissions.length}</span>
					</label>
				</div>

				<div class="permissions-grid">
					{#each categoryPermissions as permission}
						<label class="permission-item">
							<input
								type="checkbox"
								checked={selected.includes(permission.key)}
								onchange={() => togglePermission(permission.key)}
								{disabled}
							/>
							<div class="permission-info">
								<span class="permission-label">{permission.label}</span>
								<span class="permission-description">{permission.description}</span>
							</div>
						</label>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.permission-selector {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.category-section {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.category-header {
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.category-checkbox {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.category-name {
		flex: 1;
		font-size: 0.95rem;
	}

	.category-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.75rem;
		height: 1.75rem;
		padding: 0 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-color-2);
	}

	.permissions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.permission-item {
		display: flex;
		align-items: start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.permission-item:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.permission-item input[type='checkbox'] {
		margin-top: 0.25rem;
		cursor: pointer;
	}

	.permission-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.permission-label {
		color: var(--text-color-1);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.permission-description {
		color: var(--text-color-3);
		font-size: 0.75rem;
		line-height: 1.4;
	}

	input[type='checkbox'] {
		width: 1.125rem;
		height: 1.125rem;
		accent-color: rgb(var(--blue));
		cursor: pointer;
	}

	input[type='checkbox']:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	label:has(input[type='checkbox']:disabled) {
		cursor: not-allowed;
		opacity: 0.6;
	}

	@media (max-width: 768px) {
		.permissions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
