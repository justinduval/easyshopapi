import { getSessionUser } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

// Origines autorisées pour CORS
const ALLOWED_ORIGINS = [
	'https://astro.tamponwebconception.fr',
	'https://cepmr.re',
	'http://localhost:4321',
	'http://localhost:3000'
];

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');
	const isApiRoute = event.url.pathname.startsWith('/api');

	// Gestion CORS pour les routes API
	if (isApiRoute) {
		// Preflight OPTIONS request
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
					'Access-Control-Max-Age': '86400'
				}
			});
		}
	}

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

	const response = await resolve(event);

	// Ajouter les headers CORS aux réponses API
	if (isApiRoute && origin && ALLOWED_ORIGINS.includes(origin)) {
		response.headers.set('Access-Control-Allow-Origin', origin);
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	return response;
};
