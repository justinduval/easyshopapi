import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getAllProducts,
	deleteProduct,
	type ProductFilters
} from '$lib/server/api/products';
import { getAllCategories } from '$lib/server/api/categories';

export const load: PageServerLoad = async ({ url }) => {
	const categoryId = url.searchParams.get('category') || undefined;
	const status = (url.searchParams.get('status') as 'draft' | 'published') || undefined;
	const stockStatus = (url.searchParams.get('stock') as 'available' | 'out_of_stock') || undefined;
	const search = url.searchParams.get('search') || undefined;

	const filters: ProductFilters = {
		category_id: categoryId,
		status,
		stock_status: stockStatus,
		search
	};

	const [products, categories] = await Promise.all([
		getAllProducts(filters),
		getAllCategories()
	]);

	return {
		products,
		categories,
		filters: {
			category: categoryId,
			status,
			stock: stockStatus,
			search
		}
	};
};

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { error: 'ID manquant' });
		}

		try {
			await deleteProduct(id as string);
			return { success: true };
		} catch (error: any) {
			console.error('Delete product error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la suppression du produit'
			});
		}
	}
} satisfies Actions;
