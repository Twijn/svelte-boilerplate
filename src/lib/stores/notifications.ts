import { writable } from 'svelte/store';

interface Notification {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	timeout?: number;
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);

	const store = {
		subscribe,
		success: (message: string, timeout: number = 3000) =>
			store.add({ type: 'success', message, timeout }),
		info: (message: string, timeout: number = 3000) =>
			store.add({ type: 'info', message, timeout }),
		error: (message: string, timeout: number = 5000) =>
			store.add({ type: 'error', message, timeout }),
		warning: (message: string, timeout: number = 5000) =>
			store.add({ type: 'warning', message, timeout }),
		add: (notification: Omit<Notification, 'id'>) => {
			const id = crypto.randomUUID();
			update((notifications) => [...notifications, { ...notification, id }]);

			if (notification.timeout) {
				setTimeout(() => {
					store.remove(id);
				}, notification.timeout);
			}
		},
		remove: (id: string) => {
			update((notifications) => notifications.filter((n) => n.id !== id));
		},
		clear: () => {
			update(() => []);
		}
	};

	return store;
}

export const notifications = createNotificationStore();
