<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let deleteConfirm: string | null = $state(null);
	let loading = $state(false);
	let searchValue = $state(data.filters.search || '');

	function applyFilters() {
		const params = new URLSearchParams();

		if (data.filters.category) params.set('category', data.filters.category);
		if (data.filters.status) params.set('status', data.filters.status);
		if (data.filters.stock) params.set('stock', data.filters.stock);
		if (searchValue) params.set('search', searchValue);

		goto(`?${params.toString()}`);
	}

	function clearFilters() {
		searchValue = '';
		goto('/admin/products');
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(price);
	}

	function calculatePriceTTC(priceHT: number, tvaRate: number): number {
		return priceHT * (1 + tvaRate / 100);
	}
</script>

<svelte:head>
	<title>Produits - EasyShop Admin</title>
</svelte:head>

<div class="products-page">
	<div class="page-header">
		<h1>Produits</h1>
		<a href="/admin/products/new" class="btn-primary"> + Nouveau produit </a>
	</div>

	{#if form?.error}
		<div class="alert alert-error">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="alert alert-success">Produit supprimé avec succès</div>
	{/if}

	<!-- Filters -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="search">Recherche</label>
				<input
					type="text"
					id="search"
					bind:value={searchValue}
					placeholder="Nom ou référence..."
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<div class="filter-group">
				<label for="category">Catégorie</label>
				<select
					id="category"
					value={data.filters.category || ''}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						data.filters.category = target.value || undefined;
						applyFilters();
					}}
				>
					<option value="">Toutes</option>
					{#each data.categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="status">Statut</label>
				<select
					id="status"
					value={data.filters.status || ''}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						data.filters.status = (target.value as any) || undefined;
						applyFilters();
					}}
				>
					<option value="">Tous</option>
					<option value="published">Publié</option>
					<option value="draft">Brouillon</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="stock">Stock</label>
				<select
					id="stock"
					value={data.filters.stock || ''}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						data.filters.stock = (target.value as any) || undefined;
						applyFilters();
					}}
				>
					<option value="">Tous</option>
					<option value="available">En stock</option>
					<option value="out_of_stock">Rupture</option>
				</select>
			</div>
		</div>

		<div class="filters-actions">
			<button type="button" class="btn-secondary btn-sm" onclick={clearFilters}>
				Réinitialiser
			</button>
			<button type="button" class="btn-primary btn-sm" onclick={applyFilters}>
				Appliquer
			</button>
		</div>
	</div>

	<!-- Products list -->
	<div class="products-count">
		{data.products.length} produit{data.products.length > 1 ? 's' : ''}
	</div>

	<div class="products-grid">
		{#each data.products as product}
			<div class="product-card">
				<div class="product-image">
					{#if product.images && product.images.length > 0}
						<img src={product.images[0]} alt={product.name} />
					{:else}
						<div class="no-image">
							<Icon name="package" size={64} />
						</div>
					{/if}
				</div>

				<div class="product-info">
					<div class="product-header">
						<h3>{product.name}</h3>
						<div class="product-badges">
							<span class="badge badge-{product.status}">
								{product.status === 'published' ? 'Publié' : 'Brouillon'}
							</span>
							<span class="badge badge-stock badge-{product.stock_status}">
								{product.stock_status === 'available' ? 'En stock' : 'Rupture'}
							</span>
						</div>
					</div>

					<div class="product-meta">
						<p class="reference">Réf: {product.reference}</p>
						<p class="category">{product.category_name || 'Sans catégorie'}</p>
					</div>

					<div class="product-pricing">
						<div class="price-row">
							<span>Prix HT:</span>
							<strong>{formatPrice(product.price)}</strong>
						</div>
						<div class="price-row">
							<span>Prix TTC (TVA {product.tva_rate}%):</span>
							<strong>{formatPrice(calculatePriceTTC(product.price, product.tva_rate))}</strong>
						</div>
					</div>

					<div class="product-stock">
						<span>Stock:</span>
						<strong>{product.stock_quantity} unité{product.stock_quantity > 1 ? 's' : ''}</strong>
					</div>

					<div class="product-actions">
						<a href="/admin/products/{product.id}" class="btn-sm btn-edit"> Modifier </a>

						{#if deleteConfirm === product.id}
							<div class="delete-confirm">
								<span>Confirmer ?</span>
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
									<input type="hidden" name="id" value={product.id} />
									<button type="submit" class="btn-sm btn-danger" disabled={loading}> Oui </button>
								</form>
								<button class="btn-sm btn-secondary" onclick={() => (deleteConfirm = null)}>
									Non
								</button>
							</div>
						{:else}
							<button class="btn-sm btn-danger" onclick={() => (deleteConfirm = product.id)}>
								Supprimer
							</button>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<p>Aucun produit trouvé</p>
				<a href="/admin/products/new" class="btn-primary"> Créer le premier produit </a>
			</div>
		{/each}
	</div>
</div>

<style>
	.products-page {
		max-width: 1400px;
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

	.alert {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-md);
		border: 1px solid;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
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
		padding: var(--space-xl);
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
		font-size: 0.9rem;
	}

	.filter-group input,
	.filter-group select {
		width: 100%;
		padding: var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.95rem;
		color: var(--color-text-primary);
		box-sizing: border-box;
		transition: all var(--transition-fast);
		font-family: var(--font-body);
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		background: var(--color-bg-elevated);
	}

	.filters-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
	}

	.products-count {
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-md);
		font-weight: 500;
	}

	/* Products grid */
	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: var(--space-lg);
	}

	.product-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all var(--transition-base);
	}

	.product-card:hover {
		border-color: var(--color-accent-muted);
		box-shadow: var(--shadow-md);
	}

	.product-image {
		width: 100%;
		height: 200px;
		background: var(--color-bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-image {
		color: var(--color-text-muted);
		opacity: 0.3;
	}

	.product-info {
		padding: var(--space-lg);
	}

	.product-header {
		margin-bottom: var(--space-md);
	}

	.product-header h3 {
		margin: 0 0 var(--space-sm) 0;
		color: var(--color-text-primary);
		font-size: 1.1rem;
		font-weight: 600;
	}

	.product-badges {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-md);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.badge-published {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-success);
	}

	.badge-draft {
		background: rgba(239, 68, 68, 0.15);
		color: var(--color-error);
	}

	.badge-stock.badge-available {
		background: rgba(59, 130, 246, 0.15);
		color: var(--color-info);
	}

	.badge-stock.badge-out_of_stock {
		background: rgba(245, 158, 11, 0.15);
		color: var(--color-accent-primary);
	}

	.product-meta {
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.product-meta p {
		margin: var(--space-xs) 0;
		font-size: 0.9rem;
		color: var(--color-text-tertiary);
	}

	.reference {
		font-family: 'Courier New', monospace;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.product-pricing {
		background: var(--color-bg-elevated);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-md);
		border: 1px solid var(--color-border);
	}

	.price-row {
		display: flex;
		justify-content: space-between;
		margin: var(--space-xs) 0;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.price-row strong {
		color: var(--color-accent-primary);
		font-weight: 600;
	}

	.product-stock {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-md);
		padding: var(--space-sm) 0;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.product-actions {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border-subtle);
	}

	.delete-confirm {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex: 1;
	}

	.delete-confirm span {
		font-size: 0.85rem;
		color: #666;
	}

	.delete-confirm form {
		display: inline;
	}

	/* Buttons */
	.btn-primary,
	.btn-secondary,
	.btn-danger,
	.btn-edit,
	.btn-sm {
		padding: var(--space-sm) var(--space-md);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-decoration: none;
		display: inline-block;
		text-align: center;
		font-family: var(--font-body);
		border: 1px solid transparent;
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

	.btn-sm {
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.875rem;
	}

	.btn-edit {
		background: var(--color-info);
		color: white;
		flex: 1;
	}

	.btn-edit:hover:not(:disabled) {
		background: #2563eb;
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

	.delete-confirm {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
		flex: 1;
	}

	.delete-confirm span {
		font-size: 0.85rem;
		color: var(--color-text-tertiary);
	}

	.delete-confirm form {
		display: inline;
	}

	/* Empty state */
	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: var(--space-3xl) var(--space-xl);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
	}

	.empty-state p {
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-lg);
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.products-grid {
			grid-template-columns: 1fr;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
