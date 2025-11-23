<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let selectedImages: File[] = $state([]);
	let imagePreviews: string[] = $state([]);
	let existingImages = $state([...data.product.images]);

	let formData = $state({
		category_id: data.product.category_id,
		reference: data.product.reference,
		name: data.product.name,
		slug: data.product.slug,
		description: data.product.description,
		price: data.product.price.toString(),
		tva_rate: data.product.tva_rate.toString(),
		stock_quantity: data.product.stock_quantity.toString(),
		meta_description: data.product.meta_description || '',
		status: data.product.status
	});

	function handleImageSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = Array.from(target.files || []);

		selectedImages = [...selectedImages, ...files];

		// Create previews
		files.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreviews = [...imagePreviews, e.target?.result as string];
			};
			reader.readAsDataURL(file);
		});
	}

	function removeNewImage(index: number) {
		selectedImages = selectedImages.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);
	}

	async function removeExistingImage(imageUrl: string) {
		if (!confirm('Supprimer cette image définitivement ?')) {
			return;
		}

		const formData = new FormData();
		formData.append('imageUrl', imageUrl);

		loading = true;

		const response = await fetch('?/deleteImage', {
			method: 'POST',
			body: formData
		});

		loading = false;

		if (response.ok) {
			existingImages = existingImages.filter((url) => url !== imageUrl);
			invalidateAll();
		} else {
			alert('Erreur lors de la suppression de l\'image');
		}
	}
</script>

<svelte:head>
	<title>Modifier {data.product.name} - EasyShop Admin</title>
</svelte:head>

<div class="product-form-page">
	<div class="page-header">
		<h1>Modifier le produit</h1>
		<a href="/admin/products" class="btn-secondary">← Retour</a>
	</div>

	{#if form?.error}
		<div class="alert alert-error">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		action="?/update"
		enctype="multipart/form-data"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<input type="hidden" name="existing_images" value={JSON.stringify(existingImages)} />

		<div class="form-grid">
			<!-- Left column -->
			<div class="form-column">
				<div class="form-card">
					<h2>Informations générales</h2>

					<div class="form-group">
						<label for="name">Nom du produit *</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={formData.name}
							required
							disabled={loading}
						/>
					</div>

					<div class="form-group">
						<label for="reference">Référence *</label>
						<input
							type="text"
							id="reference"
							name="reference"
							bind:value={formData.reference}
							required
							disabled={loading}
						/>
					</div>

					<div class="form-group">
						<label for="category_id">Catégorie *</label>
						<select id="category_id" name="category_id" bind:value={formData.category_id} required disabled={loading}>
							{#each data.categories as category}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="description">Description *</label>
						<textarea
							id="description"
							name="description"
							bind:value={formData.description}
							rows="6"
							required
							disabled={loading}
						></textarea>
					</div>
				</div>

				<div class="form-card">
					<h2>Prix et TVA</h2>

					<div class="form-row">
						<div class="form-group">
							<label for="price">Prix HT (€) *</label>
							<input
								type="number"
								id="price"
								name="price"
								bind:value={formData.price}
								step="0.01"
								min="0"
								required
								disabled={loading}
							/>
						</div>

						<div class="form-group">
							<label for="tva_rate">Taux TVA (%) *</label>
							<input
								type="number"
								id="tva_rate"
								name="tva_rate"
								bind:value={formData.tva_rate}
								step="0.01"
								min="0"
								max="100"
								required
								disabled={loading}
							/>
						</div>
					</div>

					{#if formData.price && formData.tva_rate}
						<div class="price-preview">
							<strong>Prix TTC:</strong>
							<span>
								{(
									parseFloat(formData.price) *
									(1 + parseFloat(formData.tva_rate) / 100)
								).toFixed(2)}
								€
							</span>
						</div>
					{/if}
				</div>

				<div class="form-card">
					<h2>Stock</h2>

					<div class="form-group">
						<label for="stock_quantity">Quantité en stock *</label>
						<input
							type="number"
							id="stock_quantity"
							name="stock_quantity"
							bind:value={formData.stock_quantity}
							min="0"
							required
							disabled={loading}
						/>
						<small>
							Statut actuel:
							<strong class="stock-{data.product.stock_status}">
								{data.product.stock_status === 'available' ? 'En stock' : 'Rupture de stock'}
							</strong>
						</small>
					</div>
				</div>
			</div>

			<!-- Right column -->
			<div class="form-column">
				<div class="form-card">
					<h2>Images</h2>

					<!-- Existing images -->
					{#if existingImages.length > 0}
						<div class="section-title">Images actuelles</div>
						<div class="image-previews">
							{#each existingImages as imageUrl}
								<div class="image-preview">
									<img src={imageUrl} alt="Product" />
									<button
										type="button"
										class="remove-image"
										onclick={() => removeExistingImage(imageUrl)}
										disabled={loading}
									>
										<Icon name="close" size={16} />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- New images -->
					{#if imagePreviews.length > 0}
						<div class="section-title">Nouvelles images</div>
						<div class="image-previews">
							{#each imagePreviews as preview, index}
								<div class="image-preview">
									<img src={preview} alt="Preview {index + 1}" />
									<button
										type="button"
										class="remove-image"
										onclick={() => removeNewImage(index)}
										disabled={loading}
									>
										<Icon name="close" size={16} />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Upload zone -->
					<div class="image-upload">
						<label for="new_images" class="upload-zone">
							<Icon name="image" size={48} class="upload-icon" />
							<span>Ajouter des images</span>
							<small>Formats acceptés: JPG, PNG, WEBP</small>
						</label>
						<input
							type="file"
							id="new_images"
							name="new_images"
							accept="image/*"
							multiple
							onchange={handleImageSelect}
							disabled={loading}
							style="display: none;"
						/>
					</div>
				</div>

				<div class="form-card">
					<h2>SEO</h2>

					<div class="form-group">
						<label for="slug">Slug *</label>
						<input
							type="text"
							id="slug"
							name="slug"
							bind:value={formData.slug}
							pattern="[a-z0-9-]+"
							required
							disabled={loading}
						/>
						<small>URL: /produits/{formData.slug}</small>
					</div>

					<div class="form-group">
						<label for="meta_description">Meta description</label>
						<textarea
							id="meta_description"
							name="meta_description"
							bind:value={formData.meta_description}
							rows="3"
							maxlength="255"
							disabled={loading}
						></textarea>
						<small>{formData.meta_description?.length || 0}/255 caractères</small>
					</div>
				</div>

				<div class="form-card">
					<h2>Publication</h2>

					<div class="form-group">
						<label for="status">Statut *</label>
						<select id="status" name="status" bind:value={formData.status} required disabled={loading}>
							<option value="draft">Brouillon</option>
							<option value="published">Publié</option>
						</select>
					</div>
				</div>
			</div>
		</div>

		<div class="form-actions">
			<a href="/admin/products" class="btn-secondary">Annuler</a>
			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? 'Mise à jour en cours...' : 'Mettre à jour'}
			</button>
		</div>
	</form>
</div>

<style>
	.product-form-page {
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
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.form-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.form-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
	}

	.form-card h2 {
		margin: 0 0 var(--space-lg) 0;
		font-size: 1.25rem;
		font-family: var(--font-display);
		color: var(--color-text-primary);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.section-title {
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: var(--space-md);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: var(--space-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	input,
	textarea,
	select {
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
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		background: var(--color-bg-elevated);
	}

	input:disabled,
	textarea:disabled,
	select:disabled {
		background: var(--color-bg-tertiary);
		opacity: 0.6;
		cursor: not-allowed;
	}

	small {
		display: block;
		margin-top: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.stock-available {
		color: var(--color-success);
	}

	.stock-out_of_stock {
		color: var(--color-error);
	}

	.price-preview {
		display: flex;
		justify-content: space-between;
		padding: var(--space-md);
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		color: var(--color-bg-primary);
		border-radius: var(--radius-md);
		font-size: 1.1rem;
		font-weight: 600;
	}

	/* Image upload */
	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: center;
		background: var(--color-bg-elevated);
	}

	.upload-zone:hover {
		border-color: var(--color-accent-primary);
		background: var(--color-surface);
	}

	.upload-zone :global(.upload-icon) {
		color: var(--color-accent-primary);
		margin-bottom: var(--space-sm);
	}

	.upload-zone span {
		color: var(--color-text-secondary);
		font-weight: 500;
		font-size: 0.9rem;
	}

	.image-upload {
		margin-top: var(--space-md);
	}

	.image-previews {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.image-preview {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--color-border);
	}

	.image-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-image {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		width: 1.5rem;
		height: 1.5rem;
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.remove-image:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.9);
	}

	/* Form actions */
	.form-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
		padding: var(--space-xl);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
	}

	/* Buttons */
	.btn-primary,
	.btn-secondary {
		padding: var(--space-md) var(--space-xl);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-decoration: none;
		display: inline-block;
		font-family: var(--font-body);
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

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 968px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
