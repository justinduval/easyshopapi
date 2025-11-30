import { query } from '$lib/server/db';
import type { PageServerLoad } from './$types';

interface DashboardStats {
	products: number;
	categories: number;
	orders: number;
	reviews: number;
	totalRevenue: number;
	averageRating: number;
}

interface OrderTrend {
	date: string;
	count: number;
	revenue: number;
}

interface RecentActivity {
	type: 'order' | 'product' | 'review';
	message: string;
	time: string;
	created_at: Date;
}

export const load: PageServerLoad = async ({ locals }) => {
	// Get counts
	const [productsResult, categoriesResult, ordersResult, reviewsResult] = await Promise.all([
		query<{ count: string }>('SELECT COUNT(*) as count FROM products'),
		query<{ count: string }>('SELECT COUNT(*) as count FROM categories'),
		query<{ count: string }>('SELECT COUNT(*) as count FROM orders'),
		query<{ count: string }>('SELECT COUNT(*) as count FROM reviews')
	]);

	// Get total revenue
	const revenueResult = await query<{ total: string }>(
		"SELECT COALESCE(SUM(total_ttc), 0) as total FROM orders WHERE order_status != 'cancelled'"
	);

	// Get average rating
	const ratingResult = await query<{ avg: string }>(
		'SELECT COALESCE(AVG(rating), 0) as avg FROM reviews'
	);

	// Get order trends for the last 7 days
	const trendsResult = await query<{ date: string; count: string; revenue: string }>(`
		SELECT
			DATE(created_at) as date,
			COUNT(*) as count,
			COALESCE(SUM(total_ttc), 0) as revenue
		FROM orders
		WHERE created_at >= NOW() - INTERVAL '7 days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`);

	// Get recent activities (last 10)
	const activitiesResult = await query<{
		type: string;
		message: string;
		created_at: Date;
	}>(`
		(
			SELECT 'order' as type,
				CONCAT('Commande #', id::text) as message,
				created_at
			FROM orders
			ORDER BY created_at DESC
			LIMIT 4
		)
		UNION ALL
		(
			SELECT 'product' as type,
				CONCAT('Produit "', name, '"') as message,
				created_at
			FROM products
			ORDER BY created_at DESC
			LIMIT 3
		)
		UNION ALL
		(
			SELECT 'review' as type,
				CONCAT('Avis ', rating, '★ sur ',
					(SELECT name FROM products WHERE id = reviews.product_id LIMIT 1)
				) as message,
				created_at
			FROM reviews
			ORDER BY created_at DESC
			LIMIT 3
		)
		ORDER BY created_at DESC
		LIMIT 8
	`);

	const stats: DashboardStats = {
		products: parseInt(productsResult.rows[0]?.count || '0'),
		categories: parseInt(categoriesResult.rows[0]?.count || '0'),
		orders: parseInt(ordersResult.rows[0]?.count || '0'),
		reviews: parseInt(reviewsResult.rows[0]?.count || '0'),
		totalRevenue: parseFloat(revenueResult.rows[0]?.total || '0'),
		averageRating: parseFloat(ratingResult.rows[0]?.avg || '0')
	};

	const orderTrends: OrderTrend[] = trendsResult.rows.map((row) => ({
		date: row.date,
		count: parseInt(row.count),
		revenue: parseFloat(row.revenue)
	}));

	// Format relative time
	const formatRelativeTime = (date: Date): string => {
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "À l'instant";
		if (minutes < 60) return `Il y a ${minutes} min`;
		if (hours < 24) return `Il y a ${hours}h`;
		return `Il y a ${days}j`;
	};

	const recentActivities: RecentActivity[] = activitiesResult.rows.map((row) => ({
		type: row.type as 'order' | 'product' | 'review',
		message: row.message,
		time: formatRelativeTime(row.created_at),
		created_at: row.created_at
	}));

	return {
		user: locals.user,
		stats,
		orderTrends,
		recentActivities
	};
};
