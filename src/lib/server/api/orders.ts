import { query } from '../db';
import { z } from 'zod';

export interface OrderItem {
	id: string;
	order_id: string;
	product_id: string;
	product_name: string;
	product_reference: string;
	quantity: number;
	unit_price_ht: number;
	tva_rate: number;
	total_ht: number;
	total_tva: number;
	total_ttc: number;
}

export interface Order {
	id: string;
	order_number: string;
	customer_email: string;
	customer_name: string;
	customer_phone: string;
	pickup_location: string;
	total_ht: number;
	total_tva: number;
	total_ttc: number;
	payment_method: 'stripe' | 'oney';
	payment_status: 'pending' | 'paid' | 'failed';
	order_status: 'pending' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled';
	stripe_session_id: string | null;
	oney_transaction_id: string | null;
	created_at: Date;
	updated_at: Date;
	items_count?: number;
}

export interface OrderWithItems extends Order {
	items: OrderItem[];
}

export interface OrderFilters {
	order_status?: Order['order_status'];
	payment_status?: Order['payment_status'];
	payment_method?: Order['payment_method'];
	search?: string;
	date_from?: string;
	date_to?: string;
}

export interface PaginationParams {
	page?: number;
	limit?: number;
}

export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Validation schemas
export const orderStatusSchema = z.enum([
	'pending',
	'confirmed',
	'ready_for_pickup',
	'completed',
	'cancelled'
]);

export const paymentStatusSchema = z.enum(['pending', 'paid', 'failed']);

export const updateOrderStatusSchema = z.object({
	order_status: orderStatusSchema
});

export const updatePaymentStatusSchema = z.object({
	payment_status: paymentStatusSchema
});

// Status workflow validation
const statusTransitions: Record<Order['order_status'], Order['order_status'][]> = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['ready_for_pickup', 'cancelled'],
	ready_for_pickup: ['completed', 'cancelled'],
	completed: [],
	cancelled: []
};

export function validateStatusTransition(
	currentStatus: Order['order_status'],
	newStatus: Order['order_status']
): boolean {
	return statusTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Get all orders with optional filters and pagination
 */
export async function getAllOrders(
	filters?: OrderFilters,
	paginationParams?: PaginationParams
): Promise<PaginatedResult<Order>> {
	const page = paginationParams?.page || 1;
	const limit = paginationParams?.limit || 50;
	const offset = (page - 1) * limit;

	let whereClause = 'WHERE 1=1';
	const params: any[] = [];
	let paramIndex = 1;

	// Build WHERE clause
	if (filters?.order_status) {
		whereClause += ` AND o.order_status = $${paramIndex}`;
		params.push(filters.order_status);
		paramIndex++;
	}

	if (filters?.payment_status) {
		whereClause += ` AND o.payment_status = $${paramIndex}`;
		params.push(filters.payment_status);
		paramIndex++;
	}

	if (filters?.payment_method) {
		whereClause += ` AND o.payment_method = $${paramIndex}`;
		params.push(filters.payment_method);
		paramIndex++;
	}

	if (filters?.date_from) {
		whereClause += ` AND o.created_at >= $${paramIndex}`;
		params.push(filters.date_from);
		paramIndex++;
	}

	if (filters?.date_to) {
		whereClause += ` AND o.created_at <= $${paramIndex}`;
		params.push(filters.date_to + ' 23:59:59');
		paramIndex++;
	}

	if (filters?.search) {
		whereClause += ` AND (
			o.order_number ILIKE $${paramIndex} OR
			o.customer_name ILIKE $${paramIndex} OR
			o.customer_email ILIKE $${paramIndex}
		)`;
		params.push(`%${filters.search}%`);
		paramIndex++;
	}

	// Get total count
	const countResult = await query<{ count: number }>(
		`SELECT COUNT(*)::int as count FROM orders o ${whereClause}`,
		params
	);

	const total = countResult.rows[0]?.count || 0;
	const totalPages = Math.ceil(total / limit);

	// Get paginated data
	const dataQuery = `
		SELECT o.*, COUNT(oi.id)::int as items_count
		FROM orders o
		LEFT JOIN order_items oi ON o.id = oi.order_id
		${whereClause}
		GROUP BY o.id
		ORDER BY o.created_at DESC
		LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
	`;

	const result = await query<Order>(dataQuery, [...params, limit, offset]);

	return {
		data: result.rows,
		pagination: {
			page,
			limit,
			total,
			totalPages
		}
	};
}

/**
 * Get order by ID with all items
 */
export async function getOrderById(id: string): Promise<OrderWithItems | null> {
	// Get order
	const orderResult = await query<Order>(
		`SELECT o.*, COUNT(oi.id)::int as items_count
		 FROM orders o
		 LEFT JOIN order_items oi ON o.id = oi.order_id
		 WHERE o.id = $1
		 GROUP BY o.id`,
		[id]
	);

	if (orderResult.rows.length === 0) {
		return null;
	}

	// Get items
	const itemsResult = await query<OrderItem>(
		`SELECT * FROM order_items WHERE order_id = $1 ORDER BY product_name`,
		[id]
	);

	return {
		...orderResult.rows[0],
		items: itemsResult.rows
	};
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
	const orderResult = await query<Order>(
		'SELECT * FROM orders WHERE order_number = $1',
		[orderNumber]
	);

	if (orderResult.rows.length === 0) {
		return null;
	}

	const itemsResult = await query<OrderItem>(
		`SELECT * FROM order_items WHERE order_id = $1 ORDER BY product_name`,
		[orderResult.rows[0].id]
	);

	return {
		...orderResult.rows[0],
		items: itemsResult.rows
	};
}

/**
 * Update order status
 */
export async function updateOrderStatus(
	id: string,
	newStatus: Order['order_status']
): Promise<Order | null> {
	// Get current order
	const currentOrder = await query<Order>('SELECT * FROM orders WHERE id = $1', [id]);

	if (currentOrder.rows.length === 0) {
		throw new Error('Commande introuvable');
	}

	const currentStatus = currentOrder.rows[0].order_status;

	// Validate transition
	if (!validateStatusTransition(currentStatus, newStatus)) {
		throw new Error(
			`Transition de statut invalide : ${currentStatus} → ${newStatus}`
		);
	}

	const result = await query<Order>(
		`UPDATE orders
		 SET order_status = $1, updated_at = CURRENT_TIMESTAMP
		 WHERE id = $2
		 RETURNING *`,
		[newStatus, id]
	);

	return result.rows[0] || null;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
	id: string,
	newStatus: Order['payment_status']
): Promise<Order | null> {
	const result = await query<Order>(
		`UPDATE orders
		 SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
		 WHERE id = $2
		 RETURNING *`,
		[newStatus, id]
	);

	return result.rows[0] || null;
}

/**
 * Delete an order (only if cancelled)
 */
export async function deleteOrder(id: string): Promise<boolean> {
	// Check if order is cancelled
	const checkResult = await query<{ order_status: string }>(
		'SELECT order_status FROM orders WHERE id = $1',
		[id]
	);

	if (checkResult.rows.length === 0) {
		throw new Error('Commande introuvable');
	}

	if (checkResult.rows[0].order_status !== 'cancelled') {
		throw new Error('Seules les commandes annulées peuvent être supprimées');
	}

	// Delete order (order_items will be CASCADE deleted)
	const result = await query('DELETE FROM orders WHERE id = $1', [id]);

	return (result.rowCount ?? 0) > 0;
}

/**
 * Get order statistics
 */
export async function getOrderStats() {
	const result = await query<{
		total_orders: number;
		total_revenue: number;
		pending_orders: number;
		completed_orders: number;
	}>(`
		SELECT
			COUNT(*)::int as total_orders,
			COALESCE(SUM(total_ttc), 0) as total_revenue,
			COUNT(*) FILTER (WHERE order_status = 'pending')::int as pending_orders,
			COUNT(*) FILTER (WHERE order_status = 'completed')::int as completed_orders
		FROM orders
	`);

	return result.rows[0];
}

// Schemas for order creation
export const createOrderItemSchema = z.object({
	product_id: z.string().uuid(),
	quantity: z.number().int().positive()
});

export const createOrderSchema = z.object({
	customer_email: z.string().email(),
	customer_name: z.string().min(1),
	customer_phone: z.string().min(1),
	pickup_location: z.string().min(1),
	payment_method: z.enum(['stripe', 'oney']),
	items: z.array(createOrderItemSchema).min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface CreateOrderItemInput {
	product_id: string;
	product_name: string;
	product_reference: string;
	quantity: number;
	unit_price_ht: number;
	tva_rate: number;
}

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
	const date = new Date();
	const year = date.getFullYear().toString().slice(-2);
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const random = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `CMD-${year}${month}${day}-${random}`;
}

/**
 * Create a new order with items
 */
export async function createOrder(
	input: Omit<CreateOrderInput, 'items'>,
	items: CreateOrderItemInput[]
): Promise<OrderWithItems> {
	const orderNumber = generateOrderNumber();

	// Calculate totals
	let totalHt = 0;
	let totalTva = 0;

	const itemsWithTotals = items.map((item) => {
		const itemTotalHt = item.unit_price_ht * item.quantity;
		const itemTotalTva = itemTotalHt * (item.tva_rate / 100);
		const itemTotalTtc = itemTotalHt + itemTotalTva;

		totalHt += itemTotalHt;
		totalTva += itemTotalTva;

		return {
			...item,
			total_ht: itemTotalHt,
			total_tva: itemTotalTva,
			total_ttc: itemTotalTtc
		};
	});

	const totalTtc = totalHt + totalTva;

	// Create order
	const orderResult = await query<Order>(
		`INSERT INTO orders (
			order_number, customer_email, customer_name, customer_phone,
			pickup_location, total_ht, total_tva, total_ttc,
			payment_method, payment_status, order_status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending')
		RETURNING *`,
		[
			orderNumber,
			input.customer_email,
			input.customer_name,
			input.customer_phone,
			input.pickup_location,
			totalHt,
			totalTva,
			totalTtc,
			input.payment_method
		]
	);

	const order = orderResult.rows[0];

	// Create order items
	const createdItems: OrderItem[] = [];
	for (const item of itemsWithTotals) {
		const itemResult = await query<OrderItem>(
			`INSERT INTO order_items (
				order_id, product_id, product_name, product_reference,
				quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING *`,
			[
				order.id,
				item.product_id,
				item.product_name,
				item.product_reference,
				item.quantity,
				item.unit_price_ht,
				item.tva_rate,
				item.total_ht,
				item.total_tva,
				item.total_ttc
			]
		);
		createdItems.push(itemResult.rows[0]);
	}

	return {
		...order,
		items: createdItems
	};
}

/**
 * Update Stripe session ID for an order
 */
export async function updateStripeSessionId(
	orderId: string,
	sessionId: string
): Promise<Order | null> {
	const result = await query<Order>(
		`UPDATE orders
		 SET stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP
		 WHERE id = $2
		 RETURNING *`,
		[sessionId, orderId]
	);

	return result.rows[0] || null;
}

/**
 * Get order by Stripe session ID
 */
export async function getOrderByStripeSessionId(
	sessionId: string
): Promise<OrderWithItems | null> {
	const orderResult = await query<Order>(
		'SELECT * FROM orders WHERE stripe_session_id = $1',
		[sessionId]
	);

	if (orderResult.rows.length === 0) {
		return null;
	}

	const itemsResult = await query<OrderItem>(
		'SELECT * FROM order_items WHERE order_id = $1 ORDER BY product_name',
		[orderResult.rows[0].id]
	);

	return {
		...orderResult.rows[0],
		items: itemsResult.rows
	};
}

/**
 * Mark order as paid and confirmed
 */
export async function markOrderAsPaid(orderId: string): Promise<Order | null> {
	const result = await query<Order>(
		`UPDATE orders
		 SET payment_status = 'paid', order_status = 'confirmed', updated_at = CURRENT_TIMESTAMP
		 WHERE id = $1 AND payment_status = 'pending'
		 RETURNING *`,
		[orderId]
	);

	return result.rows[0] || null;
}

/**
 * Mark order payment as failed
 */
export async function markOrderPaymentFailed(orderId: string): Promise<Order | null> {
	const result = await query<Order>(
		`UPDATE orders
		 SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
		 WHERE id = $1
		 RETURNING *`,
		[orderId]
	);

	return result.rows[0] || null;
}
