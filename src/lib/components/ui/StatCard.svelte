<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

	interface Props {
		icon: IconDefinition;
		value: string | number;
		label: string;
		color?: 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'yellow';
		href?: string;
		columns?: ColumnCount;
	}

	let { icon, value, label, color = 'blue', href, columns = 3 }: Props = $props();

	function getColorClass(color: string) {
		switch (color) {
			case 'blue':
				return 'blue';
			case 'red':
				return 'red';
			case 'green':
				return 'green';
			case 'orange':
				return 'orange';
			case 'purple':
				return 'purple';
			case 'yellow':
				return 'yellow';
			default:
				return 'blue';
		}
	}
</script>

{#if href}
	<a {href} class="stat-card col-{columns} col-sm-12" class:col-md-6={columns < 6}>
		<div class="stat-icon {getColorClass(color)}">
			<FontAwesomeIcon {icon} size="2x" />
		</div>
		<div class="stat-content">
			<h3>{value}</h3>
			<p>{label}</p>
		</div>
	</a>
{:else}
	<div class="stat-card col-{columns} col-sm-12" class:col-md-6={columns < 6}>
		<div class="stat-icon {getColorClass(color)}">
			<FontAwesomeIcon {icon} size="2x" />
		</div>
		<div class="stat-content">
			<h3>{value}</h3>
			<p>{label}</p>
		</div>
	</div>
{/if}

<style>
	.stat-card {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		text-decoration: none;
		color: inherit;
	}

	.stat-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.stat-icon {
		flex-shrink: 0;
		width: 60px;
		height: 60px;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-icon.blue {
		background: rgba(var(--blue), 0.2);
		color: rgb(var(--blue));
	}

	.stat-icon.red {
		background: rgba(var(--red), 0.2);
		color: rgb(var(--red));
	}

	.stat-icon.green {
		background: rgba(var(--green), 0.2);
		color: rgb(var(--green));
	}

	.stat-icon.orange {
		background: rgba(var(--orange), 0.2);
		color: rgb(var(--orange));
	}

	.stat-icon.purple {
		background: rgba(var(--purple), 0.2);
		color: rgb(var(--purple));
	}

	.stat-icon.yellow {
		background: rgba(255, 204, 0, 0.2);
		color: rgb(255, 204, 0);
	}

	.stat-content h3 {
		color: var(--text-color-1);
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
	}

	.stat-content p {
		color: var(--text-color-2);
		font-size: 0.9rem;
		margin: 0;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.stat-card {
			padding: 1.5rem;
		}

		.stat-icon {
			width: 50px;
			height: 50px;
		}

		.stat-content h3 {
			font-size: 1.75rem;
		}

		.stat-content p {
			font-size: 0.85rem;
		}
	}
</style>
