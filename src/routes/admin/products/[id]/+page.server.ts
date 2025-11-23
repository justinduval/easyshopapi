import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAllCategories } from '$lib/server/api/categories';
import {
	getProductById,
	updateProduct,
	productSchema
} from '$lib/server/api/products';
import { uploadFile, deleteFile, extractKeyFromUrl } from '$lib/server/r2';

export const load: PageServerLoad = async ({ params }) => {
	const product = await getProductById(params.id);

	if (!product) {
		throw error(404, 'Produit non trouvé');
	}

	const categories = await getAllCategories();

	return {
		product,
		categories
	};
};

export const actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();

		try {
			// Get existing product
			const existingProduct = await getProductById(params.id);
			if (!existingProduct) {
				throw error(404, 'Produit non trouvé');
			}

			// Handle image uploads
			const newImageFiles = formData.getAll('new_images') as File[];
			const existingImages = JSON.parse(formData.get('existing_images') as string || '[]');
			const uploadedImages: string[] = [...existingImages];

			for (const file of newImageFiles) {
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
				slug: formData.get('slug'),
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

			// Update product
			await updateProduct(params.id, validation.data);

			// Redirect to product list
			throw redirect(303, '/admin/products');
		} catch (error: any) {
			if (error instanceof Response) {
				throw error;
			}

			console.error('Update product error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la mise à jour du produit'
			});
		}
	},

	deleteImage: async ({ request, params }) => {
		const formData = await request.formData();
		const imageUrl = formData.get('imageUrl') as string;

		try {
			const product = await getProductById(params.id);
			if (!product) {
				throw error(404, 'Produit non trouvé');
			}

			// Remove image from R2
			const key = extractKeyFromUrl(imageUrl);
			await deleteFile(key);

			// Update product images
			const updatedImages = product.images.filter((url) => url !== imageUrl);
			await updateProduct(params.id, {
				...product,
				images: updatedImages
			});

			return { success: true };
		} catch (error: any) {
			console.error('Delete image error:', error);
			return fail(500, {
				error: error.message || 'Erreur lors de la suppression de l\'image'
			});
		}
	}
} satisfies Actions;
