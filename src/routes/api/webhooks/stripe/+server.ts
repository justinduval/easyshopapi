import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyWebhookSignature } from '$lib/server/stripe';
import {
	getOrderByStripeSessionId,
	getOrderById,
	markOrderAsPaid,
	markOrderPaymentFailed
} from '$lib/server/api/orders';
import { decrementStockBatch } from '$lib/server/api/products';
import { sendEmail } from '$lib/server/email';
import { orderConfirmationTemplate } from '$lib/server/email/templates';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		console.error('[Stripe Webhook] Missing signature');
		return json({ error: 'Missing signature' }, { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = verifyWebhookSignature(payload, signature);
	} catch (err) {
		console.error('[Stripe Webhook] Signature verification failed:', err);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	console.log(`[Stripe Webhook] Received event: ${event.type}`);

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutCompleted(session);
				break;
			}

			case 'checkout.session.expired': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutExpired(session);
				break;
			}

			default:
				console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
		}
	} catch (error) {
		console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}

	return json({ received: true });
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
	const orderId = session.metadata?.order_id;
	const orderNumber = session.metadata?.order_number;

	if (!orderId) {
		console.error('[Stripe Webhook] No order_id in session metadata');
		return;
	}

	console.log(`[Stripe Webhook] Processing payment for order ${orderNumber} (${orderId})`);

	// Get order with items
	const order = await getOrderById(orderId);

	if (!order) {
		console.error(`[Stripe Webhook] Order not found: ${orderId}`);
		return;
	}

	// Check if already processed (idempotency)
	if (order.payment_status === 'paid') {
		console.log(`[Stripe Webhook] Order ${orderNumber} already paid, skipping`);
		return;
	}

	// Mark order as paid
	const updatedOrder = await markOrderAsPaid(orderId);

	if (!updatedOrder) {
		console.error(`[Stripe Webhook] Failed to update order ${orderId} to paid`);
		return;
	}

	console.log(`[Stripe Webhook] Order ${orderNumber} marked as paid`);

	// Decrement stock for all items
	const stockItems = order.items.map((item) => ({
		product_id: item.product_id,
		quantity: item.quantity
	}));

	const stockDecremented = await decrementStockBatch(stockItems);

	if (!stockDecremented) {
		console.error(`[Stripe Webhook] Failed to decrement stock for order ${orderNumber}`);
	} else {
		console.log(`[Stripe Webhook] Stock decremented for order ${orderNumber}`);
	}

	// Send confirmation email
	try {
		const emailHtml = orderConfirmationTemplate(order);
		await sendEmail({
			to: order.customer_email,
			subject: `Confirmation de commande ${order.order_number}`,
			htmlContent: emailHtml
		});
		console.log(`[Stripe Webhook] Confirmation email sent to ${order.customer_email}`);
	} catch (emailError) {
		console.error(`[Stripe Webhook] Failed to send confirmation email:`, emailError);
	}
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
	const orderId = session.metadata?.order_id;
	const orderNumber = session.metadata?.order_number;

	if (!orderId) {
		console.error('[Stripe Webhook] No order_id in session metadata for expired session');
		return;
	}

	console.log(`[Stripe Webhook] Checkout expired for order ${orderNumber}`);

	// Mark payment as failed
	await markOrderPaymentFailed(orderId);

	console.log(`[Stripe Webhook] Order ${orderNumber} marked as payment failed`);
}
