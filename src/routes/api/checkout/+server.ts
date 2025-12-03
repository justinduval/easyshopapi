import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import {
	createOrder,
	updateStripeSessionId,
	type CreateOrderItemInput
} from '$lib/server/api/orders';
import { getProductsByIds } from '$lib/server/api/products';
import { createCheckoutSession } from '$lib/server/stripe';
import { env as privateEnv } from '$env/dynamic/private';

// CORS headers
function getCorsHeaders() {
	const allowedOrigin = privateEnv.ALLOWED_ORIGIN || '*';
	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	};
}

// Handle preflight requests
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders()
	});
};

const checkoutSchema = z.object({
	customer: z.object({
		email: z.string().email('Email invalide'),
		name: z.string().min(1, 'Nom requis'),
		phone: z.string().min(1, 'Téléphone requis')
	}),
	pickup_location: z.string().min(1, 'Lieu de retrait requis'),
	items: z
		.array(
			z.object({
				product_id: z.string().uuid('ID produit invalide'),
				quantity: z.number().int().positive('Quantité invalide')
			})
		)
		.min(1, 'Le panier est vide')
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate input
		const validation = checkoutSchema.safeParse(body);
		if (!validation.success) {
			return json(
				{ error: 'Données invalides', details: validation.error.flatten() },
				{ status: 400, headers: getCorsHeaders() }
			);
		}

		const { customer, pickup_location, items } = validation.data;

		// Fetch products from DB
		const productIds = items.map((item) => item.product_id);
		const products = await getProductsByIds(productIds);

		// Check all products exist and have stock
		const errors: string[] = [];
		const orderItems: CreateOrderItemInput[] = [];
		const checkoutItems: Array<{
			product_id: string;
			product_name: string;
			unit_price_ttc: number;
			quantity: number;
		}> = [];

		for (const item of items) {
			const product = products.find((p) => p.id === item.product_id);

			if (!product) {
				errors.push(`Produit introuvable: ${item.product_id}`);
				continue;
			}

			if (product.status !== 'published') {
				errors.push(`Produit non disponible: ${product.name}`);
				continue;
			}

			if (product.stock_quantity < item.quantity) {
				errors.push(
					`Stock insuffisant pour ${product.name} (disponible: ${product.stock_quantity})`
				);
				continue;
			}

			// Calculate TTC price for Stripe
			const priceTtc = product.price * (1 + product.tva_rate / 100);

			orderItems.push({
				product_id: product.id,
				product_name: product.name,
				product_reference: product.reference,
				quantity: item.quantity,
				unit_price_ht: product.price,
				tva_rate: product.tva_rate
			});

			checkoutItems.push({
				product_id: product.id,
				product_name: product.name,
				unit_price_ttc: priceTtc,
				quantity: item.quantity
			});
		}

		if (errors.length > 0) {
			return json({ error: 'Erreurs de validation', details: errors }, { status: 400, headers: getCorsHeaders() });
		}

		// Create order in DB (status: pending)
		const order = await createOrder(
			{
				customer_email: customer.email,
				customer_name: customer.name,
				customer_phone: customer.phone,
				pickup_location,
				payment_method: 'stripe'
			},
			orderItems
		);

		// Create Stripe checkout session
		// PUBLIC_STOREFRONT_URL = URL du site front (Astro) pour les redirections Stripe
		const storefrontUrl = privateEnv.PUBLIC_STOREFRONT_URL || privateEnv.ALLOWED_ORIGIN || 'http://localhost:4321';
		const session = await createCheckoutSession({
			orderId: order.id,
			orderNumber: order.order_number,
			customerEmail: customer.email,
			items: checkoutItems,
			successUrl: `${storefrontUrl}/checkout/success?order=${order.order_number}`,
			cancelUrl: `${storefrontUrl}/checkout/cancel?order=${order.order_number}`
		});

		// Update order with Stripe session ID
		await updateStripeSessionId(order.id, session.id);

		return json(
			{
				success: true,
				order_number: order.order_number,
				checkout_url: session.url
			},
			{ headers: getCorsHeaders() }
		);
	} catch (error) {
		console.error('[Checkout] Error:', error);
		return json(
			{ error: 'Erreur lors de la création de la commande' },
			{ status: 500, headers: getCorsHeaders() }
		);
	}
};
