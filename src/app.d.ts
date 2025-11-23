import type { AdminUser } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			user: AdminUser | null;
		}
		// interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
