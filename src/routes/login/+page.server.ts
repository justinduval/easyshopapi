import { fail, redirect } from '@sveltejs/kit';
import { verifyCredentials, setSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.string().email('Email invalide'),
	password: z.string().min(1, 'Mot de passe requis')
});

export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		// Validate input
		const validation = loginSchema.safeParse({ email, password });

		if (!validation.success) {
			return fail(400, {
				error: 'Email ou mot de passe invalide',
				email: email as string
			});
		}

		// Verify credentials
		try {
			const user = await verifyCredentials(validation.data.email, validation.data.password);

			if (!user) {
				return fail(400, {
					error: 'Email ou mot de passe incorrect',
					email: validation.data.email
				});
			}

			// Set session cookie
			setSessionCookie({ cookies } as any, user.id);

			// Redirect to admin dashboard
			throw redirect(303, '/admin/dashboard');
		} catch (error) {
			if (error instanceof Response) {
				throw error;
			}

			console.error('Login error:', error);
			return fail(500, {
				error: 'Une erreur est survenue. Veuillez réessayer.',
				email: validation.data.email
			});
		}
	}
} satisfies Actions;
