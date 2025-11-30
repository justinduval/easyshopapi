import type { PageServerLoad, Actions } from './$types';
import { getAllAdmins, createAdmin, deleteAdmin } from '$lib/server/api/users';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const admins = await getAllAdmins();
	return { admins };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const name = formData.get('name') as string;

		if (!email || !password || !name) {
			return fail(400, {
				error: 'Tous les champs sont requis',
				email,
				name
			});
		}

		if (password.length < 6) {
			return fail(400, {
				error: 'Le mot de passe doit contenir au moins 6 caractères',
				email,
				name
			});
		}

		try {
			await createAdmin(email, password, name);
			return { success: true };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Erreur lors de la création';
			return fail(400, {
				error: message,
				email,
				name
			});
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID manquant' });
		}

		try {
			await deleteAdmin(id);
			return { success: true };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Erreur lors de la suppression';
			return fail(400, { error: message });
		}
	}
};
