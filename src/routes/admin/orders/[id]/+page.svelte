<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { formatCurrency, formatDateTime } from '$lib/utils/formatting';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let deleteConfirm = $state(false);

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'En attente',
			confirmed: 'Confirmée',
			ready_for_pickup: 'Prête au retrait',
			completed: 'Terminée',
			cancelled: 'Annulée'
		};
		return labels[status] || status;
	}

	function getPaymentStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'En attente',
			paid: 'Payé',
			failed: 'Échoué'
		};
		return labels[status] || status;
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

	type StatusIconName = 'clock' | 'check' | 'package' | 'check-circle' | 'x-circle';

	function getStatusIcon(status: string): StatusIconName {
		const icons: Record<string, StatusIconName> = {
			pending: 'clock',
			confirmed: 'check',
			ready_for_pickup: 'package',
			completed: 'check-circle',
			cancelled: 'x-circle'
		};
		return icons[status] || 'clock';
	}
</script>

<svelte:head>
	<title>Commande {data.order.order_number} - Admin</title>
</svelte:head>

<div class="order-detail-page">
	<!-- Header -->
	<header class="page-header">
		<div class="header-left">
			<a href="/admin/orders" class="back-link">
				<Icon name="arrow-left" size={20} />
				<span>Retour aux commandes</span>
			</a>
			<div class="order-title">
				<h1>{data.order.order_number}</h1>
				<span class="order-date">{formatDateTime(data.order.created_at)}</span>
			</div>
		</div>
		<div class="header-badges">
			<span class="badge badge-lg badge-{getStatusColor(data.order.order_status)}">
				<Icon name={getStatusIcon(data.order.order_status)} size={16} />
				{getStatusLabel(data.order.order_status)}
			</span>
			<span class="badge badge-lg badge-{getPaymentStatusColor(data.order.payment_status)}">
				{getPaymentStatusLabel(data.order.payment_status)}
			</span>
		</div>
	</header>

	{#if form?.error}
		<div class="alert alert-error">
			<Icon name="alert-circle" size={20} />
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="alert alert-success">
			<Icon name="check-circle" size={20} />
			{form.message || 'Opération réussie'}
		</div>
	{/if}

	<div class="content-grid">
		<!-- Main Content -->
		<div class="main-content">
			<!-- Order Items -->
			<section class="card items-card">
				<div class="card-header">
					<h2>
						<Icon name="shopping-bag" size={20} />
						Articles commandés
					</h2>
					<span class="items-count">{data.order.items.length} article{data.order.items.length > 1 ? 's' : ''}</span>
				</div>
				<div class="items-list">
					{#each data.order.items as item}
						<div class="item-row">
							<div class="item-info">
								<span class="item-name">{item.product_name}</span>
								<span class="item-ref">Réf: {item.product_reference}</span>
							</div>
							<div class="item-quantity">
								<span class="qty-badge">×{item.quantity}</span>
							</div>
							<div class="item-prices">
								<div class="unit-price">{formatCurrency(item.unit_price_ht)} HT/unité</div>
								<div class="tva-rate">TVA {item.tva_rate}%</div>
							</div>
							<div class="item-total">
								<div class="total-ttc">{formatCurrency(item.total_ttc)}</div>
								<div class="total-ht">{formatCurrency(item.total_ht)} HT</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="items-summary">
					<div class="summary-row">
						<span>Sous-total HT</span>
						<span>{formatCurrency(data.order.total_ht)}</span>
					</div>
					<div class="summary-row">
						<span>TVA</span>
						<span>{formatCurrency(data.order.total_tva)}</span>
					</div>
					<div class="summary-row total">
						<span>Total TTC</span>
						<span class="total-amount">{formatCurrency(data.order.total_ttc)}</span>
					</div>
				</div>
			</section>

			<!-- Timeline / Actions -->
			<section class="card actions-card">
				<div class="card-header">
					<h2>
						<Icon name="activity" size={20} />
						Actions
					</h2>
				</div>
				<div class="actions-content">
					{#if getAvailableStatusTransitions(data.order.order_status).length > 0}
						<div class="action-group">
							<h3>Changer le statut</h3>
							<div class="status-buttons">
								{#each getAvailableStatusTransitions(data.order.order_status) as status}
									<form
										method="POST"
										action="?/updateStatus"
										use:enhance={() => {
											loading = true;
											return async ({ update }) => {
												await update();
												loading = false;
												invalidateAll();
											};
										}}
									>
										<input type="hidden" name="order_status" value={status} />
										<button
											type="submit"
											class="status-btn status-btn-{getStatusColor(status)}"
											disabled={loading}
										>
											<Icon name={getStatusIcon(status)} size={18} />
											{getStatusLabel(status)}
										</button>
									</form>
								{/each}
							</div>
						</div>
					{:else}
						<div class="no-actions">
							<Icon name="check-circle" size={24} />
							<p>Cette commande est {getStatusLabel(data.order.order_status).toLowerCase()}.</p>
						</div>
					{/if}

					{#if data.order.order_status === 'cancelled'}
						<div class="action-group danger-zone">
							<h3>Zone de danger</h3>
							{#if deleteConfirm}
								<div class="delete-confirm-box">
									<p>Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.</p>
									<div class="confirm-actions">
										<form method="POST" action="?/delete">
											<button type="submit" class="btn btn-danger" disabled={loading}>
												<Icon name="trash" size={18} />
												Confirmer la suppression
											</button>
										</form>
										<button class="btn btn-secondary" onclick={() => (deleteConfirm = false)}>
											Annuler
										</button>
									</div>
								</div>
							{:else}
								<button class="btn btn-outline-danger" onclick={() => (deleteConfirm = true)}>
									<Icon name="trash" size={18} />
									Supprimer la commande
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</section>
		</div>

		<!-- Sidebar -->
		<aside class="sidebar">
			<!-- Customer Info -->
			<section class="card customer-card">
				<div class="card-header">
					<h2>
						<Icon name="user" size={20} />
						Client
					</h2>
				</div>
				<div class="card-content">
					<div class="customer-name">{data.order.customer_name}</div>
					<div class="customer-contact">
						<a href="mailto:{data.order.customer_email}" class="contact-item">
							<Icon name="mail" size={16} />
							{data.order.customer_email}
						</a>
						<a href="tel:{data.order.customer_phone}" class="contact-item">
							<Icon name="phone" size={16} />
							{data.order.customer_phone}
						</a>
					</div>
				</div>
			</section>

			<!-- Pickup Location -->
			<section class="card location-card">
				<div class="card-header">
					<h2>
						<Icon name="map-pin" size={20} />
						Lieu de retrait
					</h2>
				</div>
				<div class="card-content">
					<p class="location-text">{data.order.pickup_location}</p>
				</div>
			</section>

			<!-- Payment Info -->
			<section class="card payment-card">
				<div class="card-header">
					<h2>
						<Icon name="credit-card" size={20} />
						Paiement
					</h2>
				</div>
				<div class="card-content">
					<div class="payment-row">
						<span class="payment-label">Méthode</span>
						<span class="payment-value method-badge">
							{#if data.order.payment_method === 'stripe'}
								<Icon name="credit-card" size={14} />
							{:else}
								<Icon name="wallet" size={14} />
							{/if}
							{data.order.payment_method === 'stripe' ? 'Stripe' : 'Oney'}
						</span>
					</div>
					<div class="payment-row">
						<span class="payment-label">Statut</span>
						<span class="badge badge-{getPaymentStatusColor(data.order.payment_status)}">
							{getPaymentStatusLabel(data.order.payment_status)}
						</span>
					</div>
					{#if data.order.payment_status !== 'paid'}
						<div class="payment-action">
							<form
								method="POST"
								action="?/updatePayment"
								use:enhance={() => {
									loading = true;
									return async ({ update }) => {
										await update();
										loading = false;
										invalidateAll();
									};
								}}
							>
								<input type="hidden" name="payment_status" value="paid" />
								<button type="submit" class="btn btn-sm btn-success" disabled={loading}>
									<Icon name="check" size={16} />
									Marquer comme payé
								</button>
							</form>
						</div>
					{/if}
				</div>
			</section>

			<!-- Dates -->
			<section class="card dates-card">
				<div class="card-header">
					<h2>
						<Icon name="calendar" size={20} />
						Dates
					</h2>
				</div>
				<div class="card-content">
					<div class="date-row">
						<span class="date-label">Créée le</span>
						<span class="date-value">{formatDateTime(data.order.created_at)}</span>
					</div>
					<div class="date-row">
						<span class="date-label">Mise à jour</span>
						<span class="date-value">{formatDateTime(data.order.updated_at)}</span>
					</div>
				</div>
			</section>
		</aside>
	</div>
</div>

<style>
	.order-detail-page {
		max-width: 1400px;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-xl);
		gap: var(--space-lg);
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: var(--color-accent-primary);
	}

	.order-title {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.order-title h1 {
		margin: 0;
		font-family: 'Courier New', monospace;
		font-size: 1.75rem;
		color: var(--color-accent-primary);
		letter-spacing: 0.02em;
	}

	.order-date {
		font-size: 0.9rem;
		color: var(--color-text-tertiary);
	}

	.header-badges {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	/* Alerts */
	.alert {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
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

	/* Grid Layout */
	.content-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: var(--space-xl);
		align-items: start;
	}

	/* Cards */
	.card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--color-border-subtle);
		background: var(--color-bg-elevated);
	}

	.card-header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.card-content {
		padding: var(--space-lg);
	}

	/* Items Card */
	.items-card {
		margin-bottom: var(--space-xl);
	}

	.items-count {
		font-size: 0.85rem;
		color: var(--color-text-tertiary);
		background: var(--color-surface);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
	}

	.items-list {
		padding: var(--space-md);
	}

	.item-row {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: var(--space-lg);
		align-items: center;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
	}

	.item-row:hover {
		background: var(--color-surface-hover);
	}

	.item-row + .item-row {
		border-top: 1px solid var(--color-border-subtle);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.item-name {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.item-ref {
		font-size: 0.8rem;
		color: var(--color-text-tertiary);
		font-family: monospace;
	}

	.qty-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		height: 36px;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.item-prices {
		text-align: right;
	}

	.unit-price {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.tva-rate {
		font-size: 0.8rem;
		color: var(--color-text-tertiary);
	}

	.item-total {
		text-align: right;
		min-width: 100px;
	}

	.total-ttc {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--color-accent-primary);
	}

	.total-ht {
		font-size: 0.8rem;
		color: var(--color-text-tertiary);
	}

	.items-summary {
		padding: var(--space-lg);
		background: var(--color-bg-elevated);
		border-top: 1px solid var(--color-border-subtle);
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		padding: var(--space-sm) 0;
		color: var(--color-text-secondary);
	}

	.summary-row.total {
		border-top: 2px solid var(--color-border);
		margin-top: var(--space-sm);
		padding-top: var(--space-md);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.total-amount {
		color: var(--color-accent-primary);
		font-size: 1.25rem;
	}

	/* Actions Card */
	.actions-card .actions-content {
		padding: var(--space-lg);
	}

	.action-group {
		margin-bottom: var(--space-xl);
	}

	.action-group:last-child {
		margin-bottom: 0;
	}

	.action-group h3 {
		margin: 0 0 var(--space-md) 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-buttons {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.status-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border: 2px solid;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		background: transparent;
	}

	.status-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-btn-success {
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.status-btn-success:hover:not(:disabled) {
		background: var(--color-success);
		color: white;
	}

	.status-btn-primary {
		border-color: var(--color-accent-primary);
		color: var(--color-accent-primary);
	}

	.status-btn-primary:hover:not(:disabled) {
		background: var(--color-accent-primary);
		color: var(--color-bg-primary);
	}

	.status-btn-info {
		border-color: var(--color-info);
		color: var(--color-info);
	}

	.status-btn-info:hover:not(:disabled) {
		background: var(--color-info);
		color: white;
	}

	.status-btn-error {
		border-color: var(--color-error);
		color: var(--color-error);
	}

	.status-btn-error:hover:not(:disabled) {
		background: var(--color-error);
		color: white;
	}

	.no-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xl);
		color: var(--color-text-tertiary);
		text-align: center;
	}

	.danger-zone {
		padding-top: var(--space-lg);
		border-top: 1px dashed var(--color-error);
	}

	.danger-zone h3 {
		color: var(--color-error);
	}

	.delete-confirm-box {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
	}

	.delete-confirm-box p {
		margin: 0 0 var(--space-md) 0;
		color: var(--color-error);
	}

	.confirm-actions {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	/* Sidebar Cards */
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.customer-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: var(--space-md);
	}

	.customer-contact {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.contact-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.contact-item:hover {
		background: var(--color-surface-hover);
		color: var(--color-accent-primary);
	}

	.location-text {
		margin: 0;
		color: var(--color-text-primary);
		line-height: 1.6;
	}

	.payment-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) 0;
	}

	.payment-label {
		color: var(--color-text-tertiary);
		font-size: 0.9rem;
	}

	.payment-value {
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.method-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		background: var(--color-bg-elevated);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
	}

	.payment-action {
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border-subtle);
	}

	.date-row {
		display: flex;
		justify-content: space-between;
		padding: var(--space-sm) 0;
	}

	.date-label {
		color: var(--color-text-tertiary);
		font-size: 0.9rem;
	}

	.date-value {
		color: var(--color-text-primary);
		font-size: 0.9rem;
	}

	/* Badges */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.badge-lg {
		padding: var(--space-sm) var(--space-md);
		font-size: 0.85rem;
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

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		border: none;
		font-family: var(--font-body);
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.875rem;
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--color-surface-hover);
	}

	.btn-success {
		background: var(--color-success);
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.btn-danger {
		background: var(--color-error);
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.btn-outline-danger {
		background: transparent;
		color: var(--color-error);
		border: 1px solid var(--color-error);
	}

	.btn-outline-danger:hover:not(:disabled) {
		background: var(--color-error);
		color: white;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.sidebar {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: var(--space-lg);
		}
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-badges {
			justify-content: flex-start;
		}

		.order-title h1 {
			font-size: 1.4rem;
		}

		.item-row {
			grid-template-columns: 1fr;
			gap: var(--space-md);
		}

		.item-quantity,
		.item-prices,
		.item-total {
			text-align: left;
		}

		.item-row + .item-row {
			padding-top: var(--space-md);
			margin-top: var(--space-md);
		}

		.status-buttons {
			flex-direction: column;
		}

		.status-btn {
			width: 100%;
			justify-content: center;
		}

		.sidebar {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.card-header,
		.card-content,
		.items-list,
		.items-summary,
		.actions-content {
			padding: var(--space-md);
		}

		.badge-lg {
			padding: var(--space-xs) var(--space-sm);
			font-size: 0.75rem;
		}

		.confirm-actions {
			flex-direction: column;
		}

		.confirm-actions .btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
