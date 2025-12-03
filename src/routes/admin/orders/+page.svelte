<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { formatCurrency, formatDateTime } from '$lib/utils/formatting';
	import type { PageData, ActionData } from './$types';
	import type { OrderItem } from '$lib/server/api/orders';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let deleteConfirm: string | null = $state(null);

	// Filters - use default values if data.filters is undefined
	const defaultFilters = {
		order_status: 'all',
		payment_status: 'all',
		payment_method: 'all',
		search: '',
		date_from: '',
		date_to: ''
	};
	let filters = $state({ ...defaultFilters, ...(data.filters || {}) });

	function viewOrderDetails(orderId: string) {
		goto(`/admin/orders/${orderId}`);
	}

	function applyFilters() {
		const params = new URLSearchParams();

		if (filters.order_status !== 'all') params.set('order_status', filters.order_status);
		if (filters.payment_status !== 'all') params.set('payment_status', filters.payment_status);
		if (filters.payment_method !== 'all') params.set('payment_method', filters.payment_method);
		if (filters.search) params.set('search', filters.search);
		if (filters.date_from) params.set('date_from', filters.date_from);
		if (filters.date_to) params.set('date_to', filters.date_to);

		goto(`?${params.toString()}`);
	}

	function resetFilters() {
		filters = {
			order_status: 'all',
			payment_status: 'all',
			payment_method: 'all',
			search: '',
			date_from: '',
			date_to: ''
		};
		goto('/admin/orders');
	}

	function goToPage(page: number) {
		const params = new URLSearchParams(window.location.search);
		params.set('page', page.toString());
		goto(`?${params.toString()}`);
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'En attente',
			confirmed: 'Confirmée',
			ready_for_pickup: 'Prête',
			completed: 'Terminée',
			cancelled: 'Annulée'
		};
		return labels[status] || status;
	}

	function getPaymentStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'En attente',
			paid: 'Payée',
			failed: 'Échouée'
		};
		return labels[status] || status;
	}

	function getPaymentMethodLabel(method: string): string {
		const labels: Record<string, string> = {
			stripe: 'Stripe',
			oney: 'Oney'
		};
		return labels[method] || method;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'warning',
			confirmed: 'info',
			ready_for_pickup: 'primary',
			completed: 'success',
			cancelled: 'error'
		};
		return colors[status] || 'default';
	}

	function getPaymentStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'warning',
			paid: 'success',
			failed: 'error'
		};
		return colors[status] || 'default';
	}

	function getAvailableStatusTransitions(currentStatus: string): string[] {
		const transitions: Record<string, string[]> = {
			pending: ['confirmed', 'cancelled'],
			confirmed: ['ready_for_pickup', 'cancelled'],
			ready_for_pickup: ['completed', 'cancelled'],
			completed: [],
			cancelled: []
		};
		return transitions[currentStatus] || [];
	}
</script>

<svelte:head>
	<title>Commandes - EasyShop Admin</title>
</svelte:head>

<div class="orders-page">
	<div class="page-header">
		<h1>Commandes</h1>
		<div class="page-stats">
			<span class="stat-badge">{data.pagination.total} commande{data.pagination.total > 1 ? 's' : ''}</span>
		</div>
	</div>

	{#if form?.error}
		<div class="alert alert-error">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="alert alert-success">
			Opération réussie !
		</div>
	{/if}

	<!-- Filters -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="search">Recherche</label>
				<input
					type="text"
					id="search"
					placeholder="N° commande, nom, email..."
					bind:value={filters.search}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<div class="filter-group">
				<label for="order_status">Statut commande</label>
				<select id="order_status" bind:value={filters.order_status}>
					<option value="all">Tous</option>
					<option value="pending">En attente</option>
					<option value="confirmed">Confirmée</option>
					<option value="ready_for_pickup">Prête</option>
					<option value="completed">Terminée</option>
					<option value="cancelled">Annulée</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="payment_status">Paiement</label>
				<select id="payment_status" bind:value={filters.payment_status}>
					<option value="all">Tous</option>
					<option value="pending">En attente</option>
					<option value="paid">Payé</option>
					<option value="failed">Échoué</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="payment_method">Méthode</label>
				<select id="payment_method" bind:value={filters.payment_method}>
					<option value="all">Toutes</option>
					<option value="stripe">Stripe</option>
					<option value="oney">Oney</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="date_from">Date début</label>
				<input type="date" id="date_from" bind:value={filters.date_from} />
			</div>

			<div class="filter-group">
				<label for="date_to">Date fin</label>
				<input type="date" id="date_to" bind:value={filters.date_to} />
			</div>
		</div>

		<div class="filters-actions">
			<button class="btn-secondary btn-sm" onclick={resetFilters}>
				Réinitialiser
			</button>
			<button class="btn-primary btn-sm" onclick={applyFilters}>
				Appliquer
			</button>
		</div>
	</div>

	<!-- Orders Table -->
	<div class="orders-table">
		<table>
			<thead>
				<tr>
					<th>N° Commande</th>
					<th>Client</th>
					<th>Date</th>
					<th>Articles</th>
					<th>Total TTC</th>
					<th>Paiement</th>
					<th>Statut</th>
					<th style="width: 50px;"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.orders as order}
					<tr class="order-row" onclick={() => viewOrderDetails(order.id)}>
						<td data-label="Commande">
							<strong class="order-number">{order.order_number}</strong>
						</td>
						<td data-label="Client">
							<div class="customer-info">
								<div class="customer-name">{order.customer_name}</div>
								<div class="customer-email">{order.customer_email}</div>
							</div>
						</td>
						<td data-label="Date">
							<span class="date">{formatDateTime(order.created_at)}</span>
						</td>
						<td data-label="Articles">
							<span class="items-count">{order.items_count || 0}</span>
						</td>
						<td data-label="Total">
							<strong class="total">{formatCurrency(order.total_ttc)}</strong>
						</td>
						<td data-label="Paiement">
							<div class="payment-info">
								<span class="badge badge-{getPaymentStatusColor(order.payment_status)}">
									{getPaymentStatusLabel(order.payment_status)}
								</span>
								<small class="payment-method">{getPaymentMethodLabel(order.payment_method)}</small>
							</div>
						</td>
						<td data-label="Statut">
							<span class="badge badge-{getStatusColor(order.order_status)}">
								{getStatusLabel(order.order_status)}
							</span>
						</td>
						<td class="action-cell">
							<button
								class="view-btn"
								onclick={(e) => { e.stopPropagation(); viewOrderDetails(order.id); }}
								aria-label="Voir détails"
							>
								<Icon name="chevron-right" size={20} />
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="8" class="empty">Aucune commande</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="pagination">
			<button
				class="btn-secondary btn-sm"
				disabled={data.pagination.page === 1}
				onclick={() => goToPage(data.pagination.page - 1)}
			>
				← Précédent
			</button>

			<span class="pagination-info">
				Page {data.pagination.page} sur {data.pagination.totalPages}
				({data.pagination.total} commande{data.pagination.total > 1 ? 's' : ''})
			</span>

			<button
				class="btn-secondary btn-sm"
				disabled={data.pagination.page === data.pagination.totalPages}
				onclick={() => goToPage(data.pagination.page + 1)}
			>
				Suivant →
			</button>
		</div>
	{/if}
</div>

<style>
	.orders-page {
		max-width: 1600px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xl);
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		color: var(--color-text-primary);
		font-size: 2rem;
	}

	.page-stats {
		display: flex;
		gap: var(--space-md);
	}

	.stat-badge {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	/* Alerts */
	.alert {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-md);
		border: 1px solid;
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.alert-success {
		background: rgba(16, 185, 129, 0.1);
		color: var(--color-success);
		border-color: var(--color-success);
	}

	/* Filters */
	.filters-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.filter-group label {
		display: block;
		margin-bottom: var(--space-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.filter-group input,
	.filter-group select {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		color: var(--color-text-primary);
		transition: all var(--transition-fast);
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		background: var(--color-bg-elevated);
	}

	.filters-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: flex-end;
	}

	/* Table */
	.orders-table {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		background: var(--color-bg-elevated);
		padding: var(--space-md) var(--space-lg);
		text-align: left;
		font-weight: 600;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border-subtle);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	td {
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--color-border-subtle);
		color: var(--color-text-primary);
	}

	.order-row {
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.order-row:hover td {
		background: var(--color-surface-hover);
	}

	.order-row:active td {
		background: var(--color-bg-elevated);
	}

	.view-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-tertiary);
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.view-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-accent-primary);
	}

	.action-cell {
		text-align: center;
	}

	.order-number {
		font-family: 'Courier New', monospace;
		color: var(--color-accent-primary);
	}

	.customer-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.customer-name {
		font-weight: 500;
	}

	.customer-email {
		font-size: 0.85rem;
		color: var(--color-text-tertiary);
	}

	.date {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.items-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 var(--space-sm);
		background: var(--color-bg-elevated);
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.total {
		color: var(--color-accent-primary);
		font-size: 1.05rem;
	}

	.payment-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.payment-method {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* Badges */
	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.badge-success {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-success);
	}

	.badge-error {
		background: rgba(239, 68, 68, 0.15);
		color: var(--color-error);
	}

	.badge-warning {
		background: rgba(245, 158, 11, 0.15);
		color: var(--color-accent-primary);
	}

	.badge-info {
		background: rgba(59, 130, 246, 0.15);
		color: var(--color-info);
	}

	.badge-primary {
		background: rgba(245, 158, 11, 0.2);
		color: var(--color-accent-primary);
	}


	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-lg);
		margin-top: var(--space-xl);
		padding: var(--space-lg);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border-subtle);
	}

	.pagination-info {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	/* Buttons */
	.btn-primary,
	.btn-secondary,
	.btn-danger,
	.btn-sm {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		font-family: var(--font-body);
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.875rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		color: var(--color-bg-primary);
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
	}

	.btn-primary:hover:not(:disabled) {
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text-secondary);
		border-color: var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-accent-muted);
	}

	.btn-danger {
		background: var(--color-error);
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #dc2626;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.empty {
		text-align: center;
		color: var(--color-text-tertiary);
		padding: var(--space-3xl) !important;
	}

	@media (max-width: 1200px) {
		.filters-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}
	}

	/* ===== RESPONSIVE MOBILE ===== */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
		}

		h1 {
			font-size: 1.5rem;
		}

		.page-stats {
			justify-content: flex-start;
		}

		.filters-card {
			padding: var(--space-md);
		}

		.filters-grid {
			grid-template-columns: 1fr;
			gap: var(--space-sm);
		}

		.filters-actions {
			flex-direction: column;
		}

		.filters-actions button {
			width: 100%;
		}

		/* Table → Cards */
		.orders-table {
			background: transparent;
			border: none;
		}

		table, thead, tbody, tr, th, td {
			display: block;
		}

		thead {
			display: none;
		}

		tbody {
			display: flex;
			flex-direction: column;
			gap: var(--space-md);
		}

		tr {
			background: var(--color-bg-secondary);
			border: 1px solid var(--color-border-subtle);
			border-radius: var(--radius-lg);
			padding: var(--space-md);
			position: relative;
		}

		tr:hover td {
			background: transparent;
		}

		td {
			padding: var(--space-xs) 0;
			border: none;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		td::before {
			content: attr(data-label);
			font-weight: 600;
			font-size: 0.75rem;
			color: var(--color-text-tertiary);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			flex-shrink: 0;
			margin-right: var(--space-md);
		}

		/* Order number - make it prominent */
		td:first-child {
			padding-top: 0;
			padding-bottom: var(--space-sm);
			border-bottom: 1px solid var(--color-border-subtle);
			margin-bottom: var(--space-sm);
		}

		td:first-child::before {
			display: none;
		}

		/* Hide action cell on mobile - whole row is clickable */
		td:last-child {
			position: absolute;
			top: var(--space-md);
			right: var(--space-md);
			padding: 0;
		}

		td:last-child::before {
			display: none;
		}

		.order-number {
			font-size: 1.1rem;
		}

		/* Customer info */
		.customer-info {
			text-align: right;
		}

		.customer-email {
			font-size: 0.8rem;
		}


		/* Pagination */
		.pagination {
			flex-direction: column;
			gap: var(--space-md);
			padding: var(--space-md);
		}

		.pagination-info {
			order: -1;
			text-align: center;
		}

		.pagination button {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.25rem;
		}

		.stat-badge {
			font-size: 0.8rem;
			padding: var(--space-xs) var(--space-sm);
		}

		tr {
			padding: var(--space-sm);
		}

		.order-number {
			font-size: 1rem;
		}

		.badge {
			font-size: 0.7rem;
			padding: 2px var(--space-xs);
		}

		.total {
			font-size: 0.95rem;
		}
	}
</style>
