import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getAllCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	categorySchema,
	generateSlug
} from '$lib/server/api/categories';

export const load: PageServerLoad = async () => {
	const categories = await getAllCategories();

	return {
		categories
	};
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name');
		const slug = formData.get('slug');
		const description = formData.get('description');

		const validation = categorySchema.safeParse({
			name,
			slug: slug || generateSlug(name as string),
			description: description || null
		});

		if (!validation.success) {
			return fail(400, {
				error: validation.error.errors[0].message,
				values: { name, slug, description }
			});
		}

		try {
			await createCategory(validation.data);
			return { success: true };
		} catch (error: any) {
			console.error('Create category error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la création de la catégorie',
				values: { name, slug, description }
			});
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name');
		const slug = formData.get('slug');
		const description = formData.get('description');

		if (!id) {
			return fail(400, { error: 'ID manquant' });
		}

		const validation = categorySchema.safeParse({
			name,
			slug,
			description: description || null
		});

		if (!validation.success) {
			return fail(400, {
				error: validation.error.errors[0].message,
				values: { id, name, slug, description }
			});
		}

		try {
			await updateCategory(id as string, validation.data);
			return { success: true };
		} catch (error: any) {
			console.error('Update category error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la mise à jour de la catégorie',
				values: { id, name, slug, description }
			});
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { error: 'ID manquant' });
		}

		try {
			await deleteCategory(id as string);
			return { success: true };
		} catch (error: any) {
			console.error('Delete category error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la suppression de la catégorie'
			});
		}
	}
} satisfies Actions;
