<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const stats = [
		{
			label: 'Produits',
			value: '156',
			change: '+12%',
			trend: 'up',
			icon: 'products' as const
		},
		{
			label: 'Commandes',
			value: '89',
			change: '+23%',
			trend: 'up',
			icon: 'orders' as const
		},
		{
			label: 'Revenus',
			value: '12.4k€',
			change: '+18%',
			trend: 'up',
			icon: 'dashboard' as const
		},
		{
			label: 'Visiteurs',
			value: '2.3k',
			change: '-3%',
			trend: 'down',
			icon: 'reviews' as const
		}
	];

	const recentActivities = [
		{ type: 'order', message: 'Nouvelle commande #1234', time: 'Il y a 5 min' },
		{ type: 'product', message: 'Produit "T-shirt Rouge" ajouté', time: 'Il y a 1h' },
		{ type: 'review', message: 'Nouvel avis 5★ reçu', time: 'Il y a 2h' },
		{ type: 'order', message: 'Commande #1233 expédiée', time: 'Il y a 3h' }
	];

	const tasks = [
		{ text: 'Configuration Cloudflare R2', status: 'pending' },
		{ text: 'CRUD Catégories', status: 'in_progress' },
		{ text: 'CRUD Produits avec upload images', status: 'pending' },
		{ text: 'API REST', status: 'pending' }
	];
</script>

<svelte:head>
	<title>Dashboard - EasyShop Admin</title>
</svelte:head>

<div class="dashboard">
	<!-- Welcome Section -->
	<div class="welcome-section">
		<div class="welcome-content">
			<h1 class="welcome-title">Bienvenue, <span class="user-name">{data.user?.name || 'Admin'}</span></h1>
			<p class="welcome-subtitle">Voici un aperçu de votre boutique aujourd'hui</p>
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
		{#each stats as stat, index}
			<div class="stat-card" style="--delay: {index * 100}ms">
				<div class="stat-icon">
					<Icon name={stat.icon} size={24} />
				</div>
				<div class="stat-content">
					<div class="stat-label">{stat.label}</div>
					<div class="stat-value">{stat.value}</div>
					<div class="stat-change" class:positive={stat.trend === 'up'} class:negative={stat.trend === 'down'}>
						{stat.change} ce mois
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Main Content Grid -->
	<div class="content-grid">
		<!-- Recent Activity -->
		<div class="activity-card card">
			<div class="card-header">
				<h3>Activité récente</h3>
				<span class="badge">En direct</span>
			</div>
			<div class="activity-list">
				{#each recentActivities as activity, index}
					<div class="activity-item" style="--delay: {index * 80}ms">
						<div class="activity-icon" class:order={activity.type === 'order'} class:product={activity.type === 'product'} class:review={activity.type === 'review'}>
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
			</div>
		</div>

		<!-- Tasks Card -->
		<div class="tasks-card card">
			<div class="card-header">
				<h3>Prochaines étapes</h3>
				<span class="badge">{tasks.filter(t => t.status === 'pending').length} restantes</span>
			</div>
			<div class="tasks-list">
				{#each tasks as task, index}
					<div class="task-item" style="--delay: {index * 80}ms">
						<div class="task-checkbox" class:checked={task.status === 'in_progress'}>
							{#if task.status === 'in_progress'}
								<Icon name="check" size={14} />
							{/if}
						</div>
						<div class="task-text" class:completed={task.status === 'in_progress'}>
							{task.text}
						</div>
						{#if task.status === 'in_progress'}
							<span class="task-badge">En cours</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1400px;
		margin: 0 auto;
		animation: fadeIn 0.6s ease-out;
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
	}

	.welcome-title {
		font-family: var(--font-display);
		font-size: 2.5rem;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-sm);
		font-weight: 600;
	}

	.user-name {
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
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
		cursor: pointer;
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
		font-size: 1.5rem;
		color: var(--color-bg-primary);
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--color-text-primary);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.stat-change {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.stat-change.positive {
		color: var(--color-success);
	}

	.stat-change.negative {
		color: var(--color-error);
	}

	/* Content Grid */
	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
		gap: var(--space-lg);
	}

	.card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		animation: slideUp 0.6s ease-out backwards;
		animation-delay: 400ms;
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
		font-size: 1.5rem;
		color: var(--color-text-primary);
		margin: 0;
		font-weight: 600;
	}

	.badge {
		padding: var(--space-xs) var(--space-md);
		background: var(--color-bg-elevated);
		color: var(--color-accent-primary);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1px solid var(--color-accent-muted);
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
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.activity-icon.order {
		background: rgba(59, 130, 246, 0.15);
		color: var(--color-info);
	}

	.activity-icon.product {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-success);
	}

	.activity-icon.review {
		background: rgba(245, 158, 11, 0.15);
		color: var(--color-accent-primary);
	}

	.activity-content {
		flex: 1;
	}

	.activity-message {
		color: var(--color-text-primary);
		font-weight: 500;
		margin-bottom: var(--space-xs);
	}

	.activity-time {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* Tasks List */
	.tasks-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		transition: all var(--transition-fast);
		animation: slideInRight 0.4s ease-out backwards;
		animation-delay: var(--delay);
	}

	.task-item:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-accent-muted);
	}

	.task-checkbox {
		width: 22px;
		height: 22px;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all var(--transition-fast);
	}

	.task-checkbox.checked {
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		border-color: var(--color-accent-primary);
		color: var(--color-bg-primary);
	}

	.task-text {
		flex: 1;
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.task-text.completed {
		color: var(--color-text-tertiary);
	}

	.task-badge {
		padding: var(--space-xs) var(--space-sm);
		background: var(--color-accent-muted);
		color: var(--color-accent-tertiary);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Mobile Responsive */
	@media (max-width: 968px) {
		.welcome-section {
			flex-direction: column;
			align-items: stretch;
		}

		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		}

		.content-grid {
			grid-template-columns: 1fr;
		}

		.welcome-title {
			font-size: 2rem;
		}
	}

	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: var(--space-lg);
		}

		.welcome-title {
			font-size: 1.75rem;
		}
	}

	@media (max-width: 480px) {
		.welcome-title {
			font-size: 1.5rem;
		}

		.welcome-text {
			font-size: 0.9rem;
		}

		.user-badge {
			padding: var(--space-xs) var(--space-sm);
			font-size: 0.8rem;
		}

		.stat-card {
			padding: var(--space-md);
		}

		.stat-value {
			font-size: 2rem;
		}

		.stat-label {
			font-size: 0.8rem;
		}

		.stat-trend {
			font-size: 0.75rem;
		}

		.section-header h2 {
			font-size: 1.1rem;
		}

		.activity-item,
		.task-item {
			padding: var(--space-sm);
		}

		.activity-icon {
			width: 32px;
			height: 32px;
		}

		.activity-icon svg {
			width: 14px;
			height: 14px;
		}

		.activity-text,
		.task-text {
			font-size: 0.85rem;
		}

		.activity-time {
			font-size: 0.7rem;
		}
	}
</style>
