import { redirect } from '@sveltejs/kit';
import { deleteSessionCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	deleteSessionCookie(event);
	throw redirect(303, '/login');
};
