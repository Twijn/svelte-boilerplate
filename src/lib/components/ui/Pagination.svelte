<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Button from './Button.svelte';
	import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		currentPage: number;
		totalPages: number;
		changePage: (page: number) => void;
	}

	const { currentPage = $bindable(), totalPages = $bindable(), changePage }: Props = $props();
</script>

<div class="pagination col-12">
	<Button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
		<FontAwesomeIcon icon={faChevronLeft} />
		Previous
	</Button>

	<div class="page-numbers">
		{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
			const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
			return startPage + i;
		}) as pageNum (pageNum)}
			<button
				class="page-number {pageNum === currentPage ? 'active' : ''}"
				onclick={() => changePage(pageNum)}
			>
				{pageNum}
			</button>
		{/each}
	</div>

	<Button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
		Next
		<FontAwesomeIcon icon={faChevronRight} />
	</Button>
</div>

<style>
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	.page-numbers {
		display: flex;
		gap: 0.5rem;
	}

	.page-number {
		padding: 0.5rem 0.75rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-color-2);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.page-number:hover {
		background: var(--background-color-1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.page-number.active {
		background: var(--theme-color-2);
		color: white;
		border-color: var(--theme-color-2);
	}

	@media (max-width: 768px) {
		.pagination {
			flex-direction: column;
		}
	}
</style>
