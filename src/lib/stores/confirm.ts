import { writable } from 'svelte/store';

interface ConfirmMessage {
	message: string;
	danger?: boolean;
	confirmButtonLabel?: string;
	cancelButtonLabel?: string;
	confirm: () => void;
	cancel?: () => void;
}

function createConfirmStore() {
	const { subscribe, update } = writable<ConfirmMessage | null>(null);

	return {
		subscribe,
		confirm: (message: ConfirmMessage) => {
			const handle = (success: boolean) => {
				update(() => null);
				if (success) {
					message.confirm();
				} else if (message.cancel) {
					message.cancel();
				}
			};
			update(() => {
				return {
					...message,
					confirm: () => handle(true),
					cancel: () => handle(false)
				};
			});
		}
	};
}

export const confirm = createConfirmStore();
