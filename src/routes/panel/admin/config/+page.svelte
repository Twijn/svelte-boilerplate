<script lang="ts">
	import Heading from '$lib/components/layout/Heading.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { enhance } from '$app/forms';
	import { notifications } from '$lib/stores/notifications';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Show notifications based on form results
	$effect(() => {
		if (form?.success) {
			notifications.success(form.message);
		} else if (form?.error) {
			notifications.error(form.error);
		}
	});

	let editingKey = $state<string | null>(null);
	let editValue = $state<string | number | boolean>('');
	let searchQuery = $state('');

	type SortColumn = 'key' | 'value' | 'default' | null;
	type SortDirection = 'asc' | 'desc' | null;
	let sortColumn = $state<SortColumn>(null);
	let sortDirection = $state<SortDirection>(null);

	const categories = $derived(Object.keys(data.grouped).sort());

	// Filter configs based on search
	const filteredGrouped = $derived.by(() => {
		if (!searchQuery.trim()) return data.grouped;

		const query = searchQuery.toLowerCase();
		const filtered: typeof data.grouped = {};

		for (const [category, configs] of Object.entries(data.grouped)) {
			const matchingConfigs = configs.filter(
				(c) =>
					c.key.toLowerCase().includes(query) ||
					c.description?.toLowerCase().includes(query) ||
					category.toLowerCase().includes(query)
			);

			if (matchingConfigs.length > 0) {
				filtered[category] = matchingConfigs;
			}
		}

		return filtered;
	});

	// Sort configs within each category
	const sortedGrouped = $derived.by(() => {
		if (!sortColumn || !sortDirection) return filteredGrouped;

		const sorted: typeof filteredGrouped = {};

		for (const [category, configs] of Object.entries(filteredGrouped)) {
			const sortedConfigs = [...configs].sort((a, b) => {
				let aVal: any;
				let bVal: any;

				if (sortColumn === 'key') {
					aVal = a.key;
					bVal = b.key;
				} else if (sortColumn === 'value') {
					aVal = String(a.value);
					bVal = String(b.value);
				} else if (sortColumn === 'default') {
					aVal = String(a.defaultValue);
					bVal = String(b.defaultValue);
				}

				if (typeof aVal === 'string' && typeof bVal === 'string') {
					const comparison = aVal.localeCompare(bVal);
					return sortDirection === 'desc' ? -comparison : comparison;
				}

				return 0;
			});

			sorted[category] = sortedConfigs;
		}

		return sorted;
	});

	function handleSort(column: SortColumn) {
		if (sortColumn === column) {
			// Cycle: asc -> desc -> null
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else if (sortDirection === 'desc') {
				sortDirection = null;
				sortColumn = null;
			}
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function getSortIcon(column: SortColumn) {
		if (sortColumn !== column) return faSort;
		return sortDirection === 'asc' ? faSortUp : faSortDown;
	}

	function startEdit(key: string, value: unknown) {
		editingKey = key;
		editValue = value as string | number | boolean;
	}

	function cancelEdit() {
		editingKey = null;
		editValue = '';
	}

	function getCategoryLabel(category: string): string {
		return category
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function formatValue(value: unknown, type: string): string {
		if (type === 'boolean') {
			return value ? 'Enabled' : 'Disabled';
		}
		if (type === 'json') {
			return JSON.stringify(value, null, 2);
		}
		return String(value);
	}
</script>

<Heading text="System Configuration" description="Manage system settings and configuration" />

<Section>
	<input
		type="text"
		bind:value={searchQuery}
		placeholder="Search configuration..."
		class="search-input"
	/>

	{#if Object.keys(filteredGrouped).length > 0}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th
							class="sortable"
							class:sorted={sortColumn === 'key'}
							onclick={() => handleSort('key')}
						>
							<span class="th-content">
								<span>Setting</span>
								<span class="sort-icon">
									<FontAwesomeIcon icon={getSortIcon('key')} />
								</span>
							</span>
						</th>
						<th
							class="sortable"
							class:sorted={sortColumn === 'value'}
							onclick={() => handleSort('value')}
						>
							<span class="th-content">
								<span>Current Value</span>
								<span class="sort-icon">
									<FontAwesomeIcon icon={getSortIcon('value')} />
								</span>
							</span>
						</th>
						<th
							class="sortable"
							class:sorted={sortColumn === 'default'}
							onclick={() => handleSort('default')}
						>
							<span class="th-content">
								<span>Default</span>
								<span class="sort-icon">
									<FontAwesomeIcon icon={getSortIcon('default')} />
								</span>
							</span>
						</th>
						{#if data.canEdit}
							<th class="actions-col">Actions</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each categories as category, categoryIndex}
						{@const configs = sortedGrouped[category]}
						{#if configs && configs.length > 0}
							<tr class="category-divider">
								<td colspan={data.canEdit ? 4 : 3}>
									<strong>{getCategoryLabel(category)}</strong>
								</td>
							</tr>
							{#each configs as config (config.key)}
								<tr>
									<td>
										<div class="setting-info">
											<code class="config-key">{config.key}</code>
											{#if !config.isDefault}
												<span class="badge badge-warning">Modified</span>
											{/if}
											{#if config.description}
												<div class="setting-desc">{config.description}</div>
											{/if}
											<small>Type: {config.type}</small>
										</div>
									</td>
									<td>
										{#if editingKey === config.key}
											<form method="POST" action="?/update" use:enhance class="inline-form">
												<input type="hidden" name="key" value={config.key} />
												<input type="hidden" name="type" value={config.type} />

												{#if config.type === 'boolean'}
													<select name="value" bind:value={editValue}>
														<option value="true">Enabled</option>
														<option value="false">Disabled</option>
													</select>
												{:else if config.type === 'number'}
													<input type="number" name="value" bind:value={editValue} required />
												{:else if config.type === 'json'}
													<textarea name="value" bind:value={editValue} rows="3" required
													></textarea>
												{:else}
													<input type="text" name="value" bind:value={editValue} required />
												{/if}

												<div class="inline-actions">
													<Button type="submit">Save</Button>
													<Button type="button" onClick={cancelEdit} variant="secondary"
														>Cancel</Button
													>
												</div>
											</form>
										{:else}
											<code class="value-display">{formatValue(config.value, config.type)}</code>
										{/if}
									</td>
									<td>
										<code class="default-value"
											>{formatValue(config.defaultValue, config.type)}</code
										>
									</td>
									{#if data.canEdit}
										<td class="actions-col">
											{#if config.isEditable && editingKey !== config.key}
												<div class="action-buttons">
													<Button onClick={() => startEdit(config.key, config.value)}>Edit</Button>
													{#if !config.isDefault}
														<form method="POST" action="?/reset" use:enhance>
															<input type="hidden" name="key" value={config.key} />
															<Button type="submit" variant="secondary">Reset</Button>
														</form>
													{/if}
												</div>
											{/if}
										</td>
									{/if}
								</tr>
							{/each}
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="empty-state">
			<p>No configuration variables found matching "{searchQuery}"</p>
		</div>
	{/if}
</Section>

<style>
	.search-input {
		width: 100%;
		max-width: 500px;
		padding: 0.75rem 1rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: var(--text-color-1);
		font-size: 0.95rem;
		margin-bottom: 2rem;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--theme-color-2);
	}

	.category-divider {
		background: linear-gradient(
			135deg,
			rgba(var(--theme-color-rgb), 0.15),
			rgba(var(--theme-color-rgb), 0.08)
		);
		border-top: 2px solid rgba(var(--theme-color-rgb), 0.3);
	}

	.category-divider td {
		padding: 0.75rem 1rem;
		color: var(--theme-color-2);
		font-size: 1.1rem;
		letter-spacing: 0.025em;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.config-key {
		font-family: var(--font-family-mono);
		font-size: 0.9rem;
		color: var(--theme-color-2);
		background: rgba(255, 255, 255, 0.05);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		display: inline-block;
	}

	.setting-desc {
		color: var(--text-color-2);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.value-display {
		font-family: var(--font-family-mono);
		font-size: 0.9rem;
		color: var(--text-color-1);
	}

	.default-value {
		font-family: var(--font-family-mono);
		font-size: 0.85rem;
		color: var(--text-color-2);
	}

	.inline-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.inline-form input,
	.inline-form select,
	.inline-form textarea {
		padding: 0.5rem;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: var(--text-color-1);
		font-family: var(--font-family-mono);
		font-size: 0.9rem;
	}

	.inline-form textarea {
		resize: vertical;
	}

	.inline-actions {
		display: flex;
		gap: 0.5rem;
	}

	.actions-col {
		width: 150px;
		text-align: right;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-color-2);
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.15s ease;
	}

	th.sortable:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	th.sorted {
		background: rgba(var(--theme-color-rgb), 0.1);
		color: var(--theme-color-2);
	}

	.th-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.sort-icon {
		opacity: 0.5;
		font-size: 0.85em;
		min-width: 0.85em;
		display: flex;
		align-items: center;
		transition: opacity 0.15s ease;
	}

	th.sortable:hover .sort-icon,
	th.sorted .sort-icon {
		opacity: 1;
	}

	th.sorted .sort-icon {
		color: var(--theme-color-2);
	}
</style>
