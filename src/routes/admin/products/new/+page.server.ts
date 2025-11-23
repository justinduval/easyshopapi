import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAllCategories } from '$lib/server/api/categories';
import {
	createProduct,
	productSchema,
	generateProductSlug
} from '$lib/server/api/products';
import { uploadFile } from '$lib/server/r2';

export const load: PageServerLoad = async () => {
	const categories = await getAllCategories();

	return {
		categories
	};
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		try {
			// Handle image uploads
			const imageFiles = formData.getAll('images') as File[];
			const uploadedImages: string[] = [];

			for (const file of imageFiles) {
				if (file && file.size > 0) {
					const result = await uploadFile(file, 'products');
					uploadedImages.push(result.url);
				}
			}

			// Parse form data
			const data = {
				category_id: formData.get('category_id'),
				reference: formData.get('reference'),
				name: formData.get('name'),
				slug: formData.get('slug') || generateProductSlug(formData.get('name') as string),
				description: formData.get('description'),
				price: parseFloat(formData.get('price') as string),
				tva_rate: parseFloat(formData.get('tva_rate') as string),
				stock_quantity: parseInt(formData.get('stock_quantity') as string, 10),
				images: uploadedImages,
				meta_description: formData.get('meta_description') || null,
				status: formData.get('status') as 'draft' | 'published'
			};

			// Validate
			const validation = productSchema.safeParse(data);

			if (!validation.success) {
				return fail(400, {
					error: validation.error.errors[0].message,
					values: data
				});
			}

			// Create product
			const product = await createProduct(validation.data);

			// Redirect to product list
			throw redirect(303, '/admin/products');
		} catch (error: any) {
			if (error instanceof Response) {
				throw error;
			}

			console.error('Create product error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la création du produit'
			});
		}
	}
} satisfies Actions;
