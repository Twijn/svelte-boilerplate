<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	interface Tab {
		id: string;
		label: string;
		icon?: IconDefinition;
		count?: number;
		isDanger?: boolean;
	}

	interface Props {
		tabs: Tab[];
		activeTab: string;
		onTabChange?: (tabId: string) => void;
		content: Snippet<[{ activeTab: string }]>;
	}

	let { tabs, activeTab = $bindable(), onTabChange, content }: Props = $props();

	function handleTabClick(tabId: string) {
		activeTab = tabId;
		onTabChange?.(tabId);
	}
</script>

<div class="tabs-wrapper">
	<div class="tabs">
		{#each tabs as tab (tab.id)}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				class:danger={tab.isDanger}
				onclick={() => handleTabClick(tab.id)}
			>
				{#if tab.icon}
					<FontAwesomeIcon icon={tab.icon} />
				{/if}
				{tab.label}
				{#if tab.count !== undefined}
					<span class="count">{tab.count}</span>
				{/if}
			</button>
		{/each}
	</div>
	<div class="tab-content">
		{@render content({ activeTab })}
	</div>
</div>

<style>
	.tabs-wrapper {
		width: 100%;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		overflow-x: auto;
		padding-bottom: 0;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: none;
		border: none;
		color: var(--text-color-2);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border-bottom: 3px solid transparent;
		white-space: nowrap;
		font-family: var(--font-family);
	}

	.tab:hover {
		color: var(--text-color-1);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: var(--theme-color-2);
		border-bottom-color: var(--theme-color-2);
		font-weight: 600;
	}

	.tab.danger {
		color: rgba(var(--red), 0.8);
	}

	.tab.danger:hover {
		color: rgb(var(--red));
	}

	.tab.danger.active {
		color: rgb(var(--red));
		border-bottom-color: rgb(var(--red));
	}

	.count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 0.4rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.tab.active .count {
		background: rgba(var(--theme-color-rgb), 0.3);
		color: var(--theme-color-2);
	}

	.tab.danger .count {
		background: rgba(var(--red), 0.2);
		color: rgb(var(--red));
	}

	.tab-content {
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.tabs {
			gap: 0.25rem;
		}

		.tab {
			padding: 0.75rem 1rem;
			font-size: 0.9rem;
		}
	}
</style>
