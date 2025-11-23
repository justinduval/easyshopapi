<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import { formatDateTime } from '$lib/utils/formatting';
	import type { PageData, ActionData } from './$types';
	import type { ReviewWithProduct } from '$lib/server/api/reviews';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let deleteConfirm: string | null = $state(null);
	let showResponseModal = $state(false);
	let currentReview: ReviewWithProduct | null = $state(null);
	let vendorResponse = $state('');

	// Filters
	let filters = $state({ ...data.filters });

	function openResponseModal(review: ReviewWithProduct) {
		currentReview = review;
		vendorResponse = review.vendor_response || '';
		showResponseModal = true;
	}

	function closeResponseModal() {
		showResponseModal = false;
		currentReview = null;
		vendorResponse = '';
	}

	function applyFilters() {
		const params = new URLSearchParams();

		if (filters.status !== 'all') params.set('status', filters.status);
		if (filters.rating !== 'all') params.set('rating', filters.rating);
		if (filters.product_id !== 'all') params.set('product_id', filters.product_id);
		if (filters.search) params.set('search', filters.search);

		goto(`?${params.toString()}`);
	}

	function resetFilters() {
		filters = {
			status: 'all',
			rating: 'all',
			product_id: 'all',
			search: ''
		};
		goto('/admin/reviews');
	}

	function goToPage(page: number) {
		const params = new URLSearchParams(window.location.search);
		params.set('page', page.toString());
		goto(`?${params.toString()}`);
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'En attente',
			approved: 'Approuvé',
			rejected: 'Rejeté'
		};
		return labels[status] || status;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			pending: 'warning',
			approved: 'success',
			rejected: 'error'
		};
		return colors[status] || 'default';
	}

	function truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<svelte:head>
	<title>Avis - EasyShop Admin</title>
</svelte:head>

<div class="reviews-page">
	<div class="page-header">
		<h1>Avis clients</h1>
		<div class="page-stats">
			<span class="stat-badge">{data.pagination.total} avis</span>
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
					placeholder="Client, produit, commentaire..."
					bind:value={filters.search}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<div class="filter-group">
				<label for="status">Statut</label>
				<select id="status" bind:value={filters.status}>
					<option value="all">Tous</option>
					<option value="pending">En attente</option>
					<option value="approved">Approuvé</option>
					<option value="rejected">Rejeté</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="rating">Note</label>
				<select id="rating" bind:value={filters.rating}>
					<option value="all">Toutes</option>
					<option value="5">5 étoiles</option>
					<option value="4">4 étoiles</option>
					<option value="3">3 étoiles</option>
					<option value="2">2 étoiles</option>
					<option value="1">1 étoile</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="product_id">Produit</label>
				<select id="product_id" bind:value={filters.product_id}>
					<option value="all">Tous les produits</option>
					{#each data.products as product}
						<option value={product.id}>{product.name}</option>
					{/each}
				</select>
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

	<!-- Reviews Table -->
	<div class="reviews-table">
		<table>
			<thead>
				<tr>
					<th>Produit</th>
					<th>Client</th>
					<th>Note</th>
					<th>Commentaire</th>
					<th>Statut</th>
					<th>Date</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.reviews as review}
					<tr>
						<td>
							<div class="product-info">
								{#if review.product_image}
									<img src={review.product_image} alt={review.product_name} class="product-thumb" />
								{:else}
									<div class="product-thumb-placeholder">
										<Icon name="package" size={20} />
									</div>
								{/if}
								<div>
									<div class="product-name">{review.product_name}</div>
									<a href="/produits/{review.product_slug}" target="_blank" class="product-link">
										Voir produit →
									</a>
								</div>
							</div>
						</td>
						<td>
							<div class="customer-info">
								<div class="customer-name">{review.customer_name}</div>
								<div class="customer-email">{review.customer_email}</div>
							</div>
						</td>
						<td>
							<StarRating rating={review.rating} size={18} />
						</td>
						<td>
							<div class="comment-preview">
								{truncateText(review.comment, 100)}
							</div>
							{#if review.vendor_response}
								<div class="response-indicator">
									<Icon name="check" size={14} />
									<span>Répondu</span>
								</div>
							{/if}
						</td>
						<td>
							<span class="badge badge-{getStatusColor(review.status)}">
								{getStatusLabel(review.status)}
							</span>
						</td>
						<td>
							<span class="date">{formatDateTime(review.created_at)}</span>
						</td>
						<td class="actions">
							{#if review.status === 'pending'}
								<form
									method="POST"
									action="?/approve"
									use:enhance={() => {
										loading = true;
										return async ({ update }) => {
											await update();
											loading = false;
											invalidateAll();
										};
									}}
								>
									<input type="hidden" name="id" value={review.id} />
									<button type="submit" class="btn-sm btn-success" disabled={loading}>
										Approuver
									</button>
								</form>

								<form
									method="POST"
									action="?/reject"
									use:enhance={() => {
										loading = true;
										return async ({ update }) => {
											await update();
											loading = false;
											invalidateAll();
										};
									}}
								>
									<input type="hidden" name="id" value={review.id} />
									<button type="submit" class="btn-sm btn-secondary" disabled={loading}>
										Rejeter
									</button>
								</form>
							{/if}

							<button
								class="btn-sm btn-primary"
								onclick={() => openResponseModal(review)}
							>
								{review.vendor_response ? 'Modifier réponse' : 'Répondre'}
							</button>

							{#if deleteConfirm === review.id}
								<div class="delete-confirm">
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											loading = true;
											return async ({ update }) => {
												await update();
												loading = false;
												deleteConfirm = null;
												invalidateAll();
											};
										}}
									>
										<input type="hidden" name="id" value={review.id} />
										<button type="submit" class="btn-sm btn-danger" disabled={loading}>
											Confirmer
										</button>
									</form>
									<button class="btn-sm btn-secondary" onclick={() => (deleteConfirm = null)}>
										Annuler
									</button>
								</div>
							{:else}
								<button
									class="btn-sm btn-danger"
									onclick={() => (deleteConfirm = review.id)}
								>
									Supprimer
								</button>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="empty">Aucun avis</td>
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
				({data.pagination.total} avis)
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

<!-- Response Modal -->
{#if showResponseModal && currentReview}
	<div class="modal-overlay" onclick={closeResponseModal}></div>
	<div class="modal">
		<div class="modal-header">
			<h2>Répondre à l'avis</h2>
			<button class="modal-close" onclick={closeResponseModal}>
				<Icon name="close" size={20} />
			</button>
		</div>

		<div class="modal-body">
			<!-- Review Details -->
			<div class="review-details">
				<div class="review-header">
					<div class="review-author">
						<strong>{currentReview.customer_name}</strong>
						<span class="review-date">{formatDateTime(currentReview.created_at)}</span>
					</div>
					<StarRating rating={currentReview.rating} size={20} showNumber={true} />
				</div>

				<div class="review-product">
					<Icon name="package" size={16} />
					<span>Produit : {currentReview.product_name}</span>
				</div>

				<div class="review-comment">
					<p>{currentReview.comment}</p>
				</div>
			</div>

			<!-- Response Form -->
			<form
				method="POST"
				action="?/respond"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						await update();
						loading = false;
						if (result.type === 'success') {
							closeResponseModal();
							invalidateAll();
						}
					};
				}}
			>
				<input type="hidden" name="id" value={currentReview.id} />

				<div class="form-group">
					<label for="vendor_response">Votre réponse</label>
					<textarea
						id="vendor_response"
						name="vendor_response"
						bind:value={vendorResponse}
						rows="5"
						placeholder="Écrivez votre réponse au client..."
						required
						disabled={loading}
						maxlength="1000"
					></textarea>
					<small>{vendorResponse.length}/1000 caractères</small>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-secondary" onclick={closeResponseModal} disabled={loading}>
						Annuler
					</button>
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Envoi...' : 'Envoyer la réponse'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.reviews-page {
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
	.reviews-table {
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
		vertical-align: top;
	}

	tr:hover td {
		background: var(--color-surface-hover);
	}

	.product-info {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.product-thumb {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
		object-fit: cover;
		border: 1px solid var(--color-border);
	}

	.product-thumb-placeholder {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-tertiary);
	}

	.product-name {
		font-weight: 500;
		margin-bottom: var(--space-xs);
	}

	.product-link {
		font-size: 0.85rem;
		color: var(--color-accent-primary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.product-link:hover {
		color: var(--color-accent-tertiary);
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

	.comment-preview {
		color: var(--color-text-primary);
		line-height: 1.5;
		margin-bottom: var(--space-xs);
	}

	.response-indicator {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		background: rgba(16, 185, 129, 0.1);
		color: var(--color-success);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.date {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
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

	/* Actions */
	.actions {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.delete-confirm {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		width: 90%;
		max-width: 700px;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 1001;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translate(-50%, -60%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-xl);
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-family: var(--font-display);
		color: var(--color-text-primary);
	}

	.modal-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-tertiary);
		padding: var(--space-sm);
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.modal-body {
		padding: var(--space-xl);
	}

	.review-details {
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-md);
	}

	.review-author strong {
		display: block;
		color: var(--color-text-primary);
		margin-bottom: var(--space-xs);
	}

	.review-date {
		font-size: 0.85rem;
		color: var(--color-text-tertiary);
	}

	.review-product {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-md);
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.review-comment {
		padding: var(--space-md);
		background: var(--color-surface);
		border-left: 3px solid var(--color-accent-primary);
		border-radius: var(--radius-sm);
	}

	.review-comment p {
		margin: 0;
		line-height: 1.6;
		color: var(--color-text-primary);
	}

	.form-group {
		margin-bottom: var(--space-lg);
	}

	.form-group label {
		display: block;
		margin-bottom: var(--space-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.form-group textarea {
		width: 100%;
		padding: var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 1rem;
		color: var(--color-text-primary);
		transition: all var(--transition-fast);
		box-sizing: border-box;
		font-family: var(--font-body);
		resize: vertical;
	}

	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		background: var(--color-bg-elevated);
	}

	.form-group textarea:disabled {
		background: var(--color-bg-tertiary);
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-group small {
		display: block;
		margin-top: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
		margin-top: var(--space-xl);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border-subtle);
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
	.btn-success,
	.btn-sm {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid transparent;
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

	.btn-success {
		background: var(--color-success);
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		background: #059669;
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

	@media (max-width: 968px) {
		.filters-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
