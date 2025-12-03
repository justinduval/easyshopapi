import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
	if (!STRIPE_SECRET_KEY) {
		throw new Error('STRIPE_SECRET_KEY is not defined');
	}
	if (!stripeInstance) {
		stripeInstance = new Stripe(STRIPE_SECRET_KEY);
	}
	return stripeInstance;
}

export const stripe = {
	get instance() {
		return getStripe();
	}
};

export interface CheckoutItem {
	product_id: string;
	product_name: string;
	unit_price_ttc: number;
	quantity: number;
}

export interface CreateCheckoutSessionParams {
	orderId: string;
	orderNumber: string;
	customerEmail: string;
	items: CheckoutItem[];
	successUrl: string;
	cancelUrl: string;
}

export async function createCheckoutSession(
	params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
	const { orderId, orderNumber, customerEmail, items, successUrl, cancelUrl } = params;

	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
		price_data: {
			currency: 'eur',
			product_data: {
				name: item.product_name
			},
			unit_amount: Math.round(item.unit_price_ttc * 100)
		},
		quantity: item.quantity
	}));

	const session = await getStripe().checkout.sessions.create({
		payment_method_types: ['card'],
		mode: 'payment',
		customer_email: customerEmail,
		line_items: lineItems,
		metadata: {
			order_id: orderId,
			order_number: orderNumber
		},
		success_url: successUrl,
		cancel_url: cancelUrl
	});

	return session;
}

export function verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
	if (!STRIPE_WEBHOOK_SECRET) {
		throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
	}

	return getStripe().webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}
