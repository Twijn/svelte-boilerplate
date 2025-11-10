<script lang="ts">
	import Heading from '$lib/components/layout/Heading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { enhance } from '$app/forms';
	import { notifications } from '$lib/stores/notifications';
	import {
		faCog,
		faEnvelope,
		faCloud,
		faGauge,
		faShieldAlt,
		faServer
	} from '@fortawesome/free-solid-svg-icons';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Category icons mapping
	const categoryIcons: Record<string, any> = {
		app: faCog,
		email: faEnvelope,
		storage: faCloud,
		rate_limiting: faGauge,
		security: faShieldAlt,
		all: faServer
	};

	// Show notifications based on form results
	$effect(() => {
		if (form?.success) {
			notifications.success(form.message);
			// Close edit mode after successful save
			editingKey = null;
			editValue = '';
		} else if (form?.error) {
			notifications.error(form.error);
		}
	});

	let editingKey = $state<string | null>(null);
	let editValue = $state<string | number | boolean>('');
	let searchQuery = $state('');
	let activeCategory = $state('all');

	// Build tabs from categories
	const tabs = $derived.by(() => {
		const categoryTabs = Object.entries(data.grouped).map(([category, configs]) => ({
			id: category,
			label: getCategoryLabel(category),
			icon: categoryIcons[category] || faCog,
			count: configs.length
		}));

		return [
			{ id: 'all', label: 'All Settings', icon: categoryIcons.all, count: data.configs.length },
			...categoryTabs
		];
	});

	// Flatten configs with category information for the table
	const flatConfigs = $derived.by(() => {
		const flat: Array<(typeof data.configs)[number] & { category: string; categoryLabel: string }> =
			[];

		for (const [category, configs] of Object.entries(data.grouped)) {
			for (const config of configs) {
				flat.push({
					...config,
					category,
					categoryLabel: getCategoryLabel(category)
				});
			}
		}

		return flat;
	});

	// Filter configs based on search and active category
	const filteredConfigs = $derived.by(() => {
		let configs = flatConfigs;

		// Filter by category
		if (activeCategory !== 'all') {
			configs = configs.filter((c) => c.category === activeCategory);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			configs = configs.filter(
				(c) =>
					c.key.toLowerCase().includes(query) ||
					c.description?.toLowerCase().includes(query) ||
					c.category.toLowerCase().includes(query)
			);
		}

		return configs;
	});

	const columns = [
		{
			key: 'key' as keyof (typeof flatConfigs)[number],
			label: 'Setting',
			sortValue: (item: (typeof flatConfigs)[number]) => item.key
		},
		{
			key: 'value' as keyof (typeof flatConfigs)[number],
			label: 'Current Value',
			sortValue: (item: (typeof flatConfigs)[number]) => String(item.value)
		},
		{
			key: 'defaultValue' as keyof (typeof flatConfigs)[number],
			label: 'Default',
			sortValue: (item: (typeof flatConfigs)[number]) => String(item.defaultValue)
		}
	];

	// Add actions column conditionally
	const displayColumns: any = data.canEdit
		? [...columns, { key: 'isEditable', label: 'Actions', sortable: false }]
		: columns;

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

<div class="col-12">
	<div class="search-container">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search configuration..."
			class="search-input"
		/>
		{#if searchQuery}
			<button class="clear-search" onclick={() => (searchQuery = '')}>Clear</button>
		{/if}
	</div>

	<Tabs {tabs} bind:activeTab={activeCategory} onTabChange={(id) => (activeCategory = id)}>
		{#snippet content({ activeTab })}
			{#if filteredConfigs.length > 0}
				<SortableTable
					data={filteredConfigs}
					columns={displayColumns}
					rowKey={(config) => config.key}
				>
					{#snippet cellContent({ item: config, column })}
						{#if column.key === 'key'}
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
						{:else if column.key === 'value'}
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
										<textarea name="value" bind:value={editValue} rows="3" required></textarea>
									{:else}
										<input type="text" name="value" bind:value={editValue} required />
									{/if}

									<div class="inline-actions">
										<Button type="submit">Save</Button>
										<Button type="button" onClick={cancelEdit} variant="secondary">Cancel</Button>
									</div>
								</form>
							{:else}
								<code class="value-display">{formatValue(config.value, config.type)}</code>
							{/if}
						{:else if column.key === 'defaultValue'}
							<code class="default-value">{formatValue(config.defaultValue, config.type)}</code>
						{:else if column.key === 'isEditable' && column.label === 'Actions'}
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
						{/if}
					{/snippet}
				</SortableTable>
			{:else}
				<div class="empty-state">
					{#if searchQuery}
						<p>No configuration variables found matching "{searchQuery}"</p>
					{:else}
						<p>No configuration variables in this category</p>
					{/if}
				</div>
			{/if}
		{/snippet}
	</Tabs>
</div>

<style>
	.search-container {
		position: relative;
		max-width: 600px;
		margin-bottom: 1.5rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		padding-right: 5rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: var(--text-color-1);
		font-size: 0.95rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		padding: 0.4rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: var(--text-color-2);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-search:hover {
		background: rgba(255, 255, 255, 0.15);
		color: var(--text-color-1);
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.config-key {
		font-family: var(--font-family-mono);
		font-size: 0.9rem;
		color: white;
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
		font-size: 0.95rem;
		color: white;
		background: rgba(var(--theme-color-rgb), 0.1);
		border: 1px solid rgba(var(--theme-color-rgb), 0.3);
		padding: 0.35rem 0.6rem;
		border-radius: 4px;
		display: inline-block;
		font-weight: 500;
	}

	.default-value {
		font-family: var(--font-family-mono);
		font-size: 0.85rem;
		color: var(--text-color-2);
		opacity: 0.7;
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
</style>
