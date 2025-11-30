<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	// Format number with K suffix
	const formatNumber = (num: number) => {
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'k';
		}
		return num.toString();
	};

	// Generate SVG path for line chart
	const generateChartPath = (trends: typeof data.orderTrends) => {
		if (!trends || trends.length === 0) return { linePath: '', areaPath: '', points: [] };

		const width = 280;
		const height = 80;
		const padding = 10;

		const values = trends.map((t) => t.revenue);
		const maxValue = Math.max(...values, 1);
		const minValue = Math.min(...values, 0);
		const range = maxValue - minValue || 1;

		const points = trends.map((trend, i) => {
			const x = padding + (i / (trends.length - 1 || 1)) * (width - padding * 2);
			const y = height - padding - ((trend.revenue - minValue) / range) * (height - padding * 2);
			return { x, y, value: trend.revenue, date: trend.date };
		});

		if (points.length === 1) {
			return {
				linePath: '',
				areaPath: '',
				points: [{ ...points[0], x: width / 2 }]
			};
		}

		// Create smooth curve
		let linePath = `M ${points[0].x} ${points[0].y}`;
		for (let i = 1; i < points.length; i++) {
			const prev = points[i - 1];
			const curr = points[i];
			const cpx = (prev.x + curr.x) / 2;
			linePath += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
		}

		// Create area path
		const areaPath =
			linePath +
			` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

		return { linePath, areaPath, points };
	};

	const chartData = $derived(generateChartPath(data.orderTrends));
</script>

<svelte:head>
	<title>Dashboard - EasyShop Admin</title>
</svelte:head>

<div class="dashboard">
	<!-- Welcome Section -->
	<div class="welcome-section">
		<div class="welcome-content">
			<h1 class="welcome-title">
				Bienvenue, <span class="user-name-gradient">{data.user?.name || 'Admin'}</span>
			</h1>
			<p class="welcome-subtitle">Voici un apercu de votre boutique</p>
		</div>
		<div class="user-badge">
			<div class="user-avatar-large">
				{data.user?.name?.charAt(0).toUpperCase() || 'U'}
			</div>
			<div class="user-details">
				<div class="user-name-large">{data.user?.name || 'Utilisateur'}</div>
				<div class="user-email-small">{data.user?.email || 'user@example.com'}</div>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="stats-grid">
		<div class="stat-card" style="--delay: 0ms">
			<div class="stat-icon">
				<Icon name="products" size={24} />
			</div>
			<div class="stat-content">
				<div class="stat-label">Produits</div>
				<div class="stat-value">{data.stats.products}</div>
				<div class="stat-sub">{data.stats.categories} categories</div>
			</div>
		</div>

		<div class="stat-card" style="--delay: 100ms">
			<div class="stat-icon icon-orders">
				<Icon name="orders" size={24} />
			</div>
			<div class="stat-content">
				<div class="stat-label">Commandes</div>
				<div class="stat-value">{data.stats.orders}</div>
				<div class="stat-sub">total</div>
			</div>
		</div>

		<div class="stat-card" style="--delay: 200ms">
			<div class="stat-icon icon-revenue">
				<Icon name="dashboard" size={24} />
			</div>
			<div class="stat-content">
				<div class="stat-label">Revenus</div>
				<div class="stat-value">{formatCurrency(data.stats.totalRevenue)}</div>
				<div class="stat-sub">chiffre d'affaires</div>
			</div>
		</div>

		<div class="stat-card" style="--delay: 300ms">
			<div class="stat-icon icon-reviews">
				<Icon name="reviews" size={24} />
			</div>
			<div class="stat-content">
				<div class="stat-label">Avis</div>
				<div class="stat-value">{data.stats.reviews}</div>
				<div class="stat-sub">
					{#if data.stats.averageRating > 0}
						{data.stats.averageRating.toFixed(1)} moyenne
					{:else}
						aucun avis
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="content-grid">
		<!-- Chart Card -->
		<div class="chart-card card">
			<div class="card-header">
				<h3>Tendance des ventes</h3>
				<span class="badge">7 derniers jours</span>
			</div>
			<div class="chart-container">
				{#if data.orderTrends && data.orderTrends.length > 0}
					<svg viewBox="0 0 280 80" class="chart-svg">
						<defs>
							<linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color: var(--color-accent-primary); stop-opacity: 0.3" />
								<stop offset="100%" style="stop-color: var(--color-accent-primary); stop-opacity: 0" />
							</linearGradient>
							<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" style="stop-color: var(--color-accent-tertiary)" />
								<stop offset="100%" style="stop-color: var(--color-accent-primary)" />
							</linearGradient>
						</defs>

						<!-- Area fill -->
						{#if chartData.areaPath}
							<path d={chartData.areaPath} fill="url(#chartGradient)" />
						{/if}

						<!-- Line -->
						{#if chartData.linePath}
							<path
								d={chartData.linePath}
								fill="none"
								stroke="url(#lineGradient)"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="chart-line"
							/>
						{/if}

						<!-- Data points -->
						{#each chartData.points as point, i}
							<circle
								cx={point.x}
								cy={point.y}
								r="4"
								fill="var(--color-bg-primary)"
								stroke="var(--color-accent-primary)"
								stroke-width="2"
								class="chart-point"
								style="--point-delay: {i * 100}ms"
							/>
						{/each}
					</svg>
					<div class="chart-labels">
						{#each data.orderTrends as trend, i}
							<div class="chart-label" style="--label-delay: {i * 50}ms">
								{new Date(trend.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
							</div>
						{/each}
					</div>
				{:else}
					<div class="chart-empty">
						<Icon name="orders" size={32} />
						<p>Aucune commande ces 7 derniers jours</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="activity-card card">
			<div class="card-header">
				<h3>Activite recente</h3>
				<span class="badge">En direct</span>
			</div>
			<div class="activity-list">
				{#if data.recentActivities && data.recentActivities.length > 0}
					{#each data.recentActivities as activity, index}
						<div class="activity-item" style="--delay: {index * 80}ms">
							<div
								class="activity-icon"
								class:order={activity.type === 'order'}
								class:product={activity.type === 'product'}
								class:review={activity.type === 'review'}
							>
								{#if activity.type === 'order'}<Icon name="orders" size={18} />{/if}
								{#if activity.type === 'product'}<Icon name="products" size={18} />{/if}
								{#if activity.type === 'review'}<Icon name="reviews" size={18} />{/if}
							</div>
							<div class="activity-content">
								<div class="activity-message">{activity.message}</div>
								<div class="activity-time">{activity.time}</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="activity-empty">
						<Icon name="dashboard" size={32} />
						<p>Aucune activite recente</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1400px;
		margin: 0 auto;
		animation: fadeIn 0.6s ease-out;
		overflow-x: hidden;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Welcome Section */
	.welcome-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2xl);
		padding: var(--space-xl);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border-subtle);
		gap: var(--space-xl);
	}

	.welcome-content {
		flex: 1;
		min-width: 0;
	}

	.welcome-title {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-sm);
		font-weight: 600;
		word-break: break-word;
	}

	.user-name-gradient {
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.welcome-subtitle {
		color: var(--color-text-tertiary);
		margin: 0;
		font-size: 1.1rem;
	}

	.user-badge {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--color-bg-elevated);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.user-avatar-large {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: var(--color-bg-primary);
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.user-name-large {
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: var(--space-xs);
	}

	.user-email-small {
		font-size: 0.9rem;
		color: var(--color-text-tertiary);
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-lg);
		margin-bottom: var(--space-2xl);
	}

	.stat-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		display: flex;
		align-items: flex-start;
		gap: var(--space-lg);
		transition: all var(--transition-base);
		animation: slideUp 0.5s ease-out backwards;
		animation-delay: var(--delay);
		min-width: 0;
		overflow: hidden;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.stat-card:hover {
		border-color: var(--color-accent-muted);
		box-shadow: var(--shadow-md);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-bg-primary);
		flex-shrink: 0;
	}

	.stat-icon.icon-orders {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	}

	.stat-icon.icon-revenue {
		background: linear-gradient(135deg, #10b981, #059669);
	}

	.stat-icon.icon-reviews {
		background: linear-gradient(135deg, #f59e0b, #d97706);
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 1.75rem;
		color: var(--color-text-primary);
		font-weight: 700;
		margin-bottom: var(--space-xs);
		line-height: 1;
		word-break: break-word;
	}

	.stat-sub {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* Content Grid */
	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
	}

	.card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		animation: slideUp 0.6s ease-out backwards;
		animation-delay: 400ms;
		min-width: 0;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-lg);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.card-header h3 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--color-text-primary);
		margin: 0;
		font-weight: 600;
	}

	.badge {
		padding: var(--space-xs) var(--space-md);
		background: var(--color-bg-elevated);
		color: var(--color-accent-primary);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1px solid var(--color-accent-muted);
	}

	/* Chart */
	.chart-container {
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.chart-svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.chart-line {
		animation: drawLine 1.5s ease-out forwards;
		stroke-dasharray: 500;
		stroke-dashoffset: 500;
	}

	@keyframes drawLine {
		to {
			stroke-dashoffset: 0;
		}
	}

	.chart-point {
		opacity: 0;
		animation: fadeInPoint 0.3s ease-out forwards;
		animation-delay: calc(0.8s + var(--point-delay));
	}

	@keyframes fadeInPoint {
		to {
			opacity: 1;
		}
	}

	.chart-labels {
		display: flex;
		justify-content: space-between;
		padding: var(--space-md) var(--space-sm) 0;
	}

	.chart-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0;
		animation: fadeIn 0.3s ease-out forwards;
		animation-delay: var(--label-delay);
	}

	.chart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-2xl);
		color: var(--color-text-muted);
		text-align: center;
		gap: var(--space-md);
	}

	.chart-empty p {
		margin: 0;
		font-size: 0.9rem;
	}

	/* Activity List */
	.activity-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		transition: all var(--transition-fast);
		animation: slideInRight 0.4s ease-out backwards;
		animation-delay: var(--delay);
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.activity-item:hover {
		background: var(--color-surface-hover);
	}

	.activity-icon {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.activity-icon.order {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.activity-icon.product {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.activity-icon.review {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-message {
		color: var(--color-text-primary);
		font-weight: 500;
		margin-bottom: var(--space-xs);
		word-break: break-word;
	}

	.activity-time {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.activity-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-2xl);
		color: var(--color-text-muted);
		text-align: center;
		gap: var(--space-md);
	}

	.activity-empty p {
		margin: 0;
		font-size: 0.9rem;
	}

	/* Mobile Responsive */
	@media (max-width: 968px) {
		.welcome-section {
			flex-direction: column;
			align-items: stretch;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}

		.welcome-title {
			font-size: 1.75rem;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.welcome-section {
			padding: var(--space-lg);
			gap: var(--space-md);
		}

		.welcome-title {
			font-size: 1.5rem;
		}

		.user-badge {
			padding: var(--space-md);
		}

		.user-avatar-large {
			width: 44px;
			height: 44px;
			font-size: 1.1rem;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: var(--space-md);
		}

		.stat-card {
			padding: var(--space-md);
			flex-direction: column;
			gap: var(--space-sm);
		}

		.stat-icon {
			width: 36px;
			height: 36px;
		}

		.stat-value {
			font-size: 1.35rem;
		}

		.stat-label {
			font-size: 0.75rem;
		}

		.stat-sub {
			font-size: 0.75rem;
		}

		.card {
			padding: var(--space-md);
		}

		.card-header h3 {
			font-size: 1rem;
		}

		.badge {
			font-size: 0.6rem;
			padding: 4px 8px;
		}

		.activity-item {
			padding: var(--space-sm);
			gap: var(--space-sm);
		}

		.activity-icon {
			width: 32px;
			height: 32px;
		}

		.activity-message {
			font-size: 0.9rem;
		}

		.activity-time {
			font-size: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.welcome-section {
			padding: var(--space-md);
		}

		.welcome-title {
			font-size: 1.25rem;
		}

		.welcome-subtitle {
			font-size: 0.85rem;
		}

		.user-badge {
			padding: var(--space-sm);
			gap: var(--space-sm);
		}

		.user-avatar-large {
			width: 36px;
			height: 36px;
			font-size: 0.9rem;
		}

		.user-name-large {
			font-size: 0.85rem;
		}

		.user-email-small {
			font-size: 0.75rem;
		}

		.stats-grid {
			grid-template-columns: 1fr 1fr;
			gap: var(--space-sm);
		}

		.stat-card {
			padding: var(--space-sm);
		}

		.stat-icon {
			width: 32px;
			height: 32px;
		}

		.stat-value {
			font-size: 1.1rem;
		}

		.stat-label {
			font-size: 0.65rem;
		}

		.stat-sub {
			font-size: 0.65rem;
		}

		.content-grid {
			gap: var(--space-sm);
		}

		.card {
			padding: var(--space-sm);
		}

		.card-header {
			margin-bottom: var(--space-sm);
			padding-bottom: var(--space-sm);
		}

		.card-header h3 {
			font-size: 0.9rem;
		}

		.chart-labels {
			padding: var(--space-xs) 0 0;
		}

		.chart-label {
			font-size: 0.55rem;
		}

		.activity-list {
			gap: var(--space-xs);
		}

		.activity-item {
			padding: var(--space-xs);
			gap: var(--space-xs);
		}

		.activity-icon {
			width: 28px;
			height: 28px;
		}

		.activity-message {
			font-size: 0.8rem;
		}

		.activity-time {
			font-size: 0.65rem;
		}
	}
</style>
