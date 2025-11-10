import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface Column<T> {
	key: keyof T;
	label: string;
	sortable?: boolean;
	sortValue?: (item: T) => unknown; // Custom sort value extractor
	class?: string;
}

export interface BulkAction<T> {
	id: string;
	label: string;
	icon?: IconDefinition;
	variant?: 'primary' | 'secondary' | 'success' | 'error' | 'link' | 'header';
	onClick: (selectedItems: T[]) => void | Promise<void>;
}
