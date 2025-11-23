import { getSessionUser } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Get the current user from session
	event.locals.user = await getSessionUser(event);

	// Protect /admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}
	}

	// Redirect to admin if already logged in and trying to access login page
	if (event.url.pathname === '/login' && event.locals.user) {
		throw redirect(303, '/admin/dashboard');
	}

	return await resolve(event);
};
