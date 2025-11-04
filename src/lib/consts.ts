import { PUBLIC_APP_NAME } from '$env/static/public';

declare const __APP_VERSION__: string;

export const APP_NAME = PUBLIC_APP_NAME ?? 'Svelte Boilerplate';
export const APP_VERSION = __APP_VERSION__;
