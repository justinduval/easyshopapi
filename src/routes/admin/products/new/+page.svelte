<script lang="ts">
	import { enhance } from '$app/forms';
	import { generateProductSlug } from '$lib/utils/slug';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let selectedImages: File[] = $state([]);
	let imagePreviews: string[] = $state([]);

	let formData = $state({
		category_id: '',
		reference: '',
		name: '',
		slug: '',
		description: '',
		price: '',
		tva_rate: '20.00',
		stock_quantity: '0',
		meta_description: '',
		status: 'draft'
	});

	function handleNameChange(e: Event) {
		const target = e.target as HTMLInputElement;
		formData.name = target.value;
		if (!formData.slug) {
			formData.slug = generateProductSlug(target.value);
		}
	}

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

	function removeImage(index: number) {
		selectedImages = selectedImages.filter((_, i) => i !== index);
		imagePreviews = imagePreviews.filter((_, i) => i !== index);
	}
</script>

<svelte:head>
	<title>Nouveau produit - EasyShop Admin</title>
</svelte:head>

<div class="product-form-page">
	<div class="page-header">
		<h1>Nouveau produit</h1>
		<a href="/admin/products" class="btn-secondary">← Retour</a>
	</div>

	{#if form?.error}
		<div class="alert alert-error">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
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
							oninput={handleNameChange}
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
							placeholder="Ex: PN-MICH-001"
						/>
					</div>

					<div class="form-group">
						<label for="category_id">Catégorie *</label>
						<select id="category_id" name="category_id" bind:value={formData.category_id} required disabled={loading}>
							<option value="">Sélectionner une catégorie</option>
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
							Le statut sera automatiquement défini sur "Rupture" si la quantité est 0
						</small>
					</div>
				</div>
			</div>

			<!-- Right column -->
			<div class="form-column">
				<div class="form-card">
					<h2>Images</h2>

					<div class="image-upload">
						<label for="images" class="upload-zone">
							<Icon name="image" size={48} class="upload-icon" />
							<span>Cliquer pour ajouter des images</span>
							<small>Formats acceptés: JPG, PNG, WEBP</small>
						</label>
						<input
							type="file"
							id="images"
							name="images"
							accept="image/*"
							multiple
							onchange={handleImageSelect}
							disabled={loading}
							style="display: none;"
						/>
					</div>

					{#if imagePreviews.length > 0}
						<div class="image-previews">
							{#each imagePreviews as preview, index}
								<div class="image-preview">
									<img src={preview} alt="Preview {index + 1}" />
									<button
										type="button"
										class="remove-image"
										onclick={() => removeImage(index)}
										disabled={loading}
									>
										<Icon name="close" size={16} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
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
						<small>{formData.meta_description.length}/255 caractères</small>
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
				{loading ? 'Création en cours...' : 'Créer le produit'}
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
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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
		padding: var(--space-2xl);
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
	}

	.image-previews {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.image-preview {
		position: relative;
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid #e2e8f0;
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
		gap: 1rem;
		justify-content: flex-end;
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Buttons */
	.btn-primary,
	.btn-secondary {
		padding: var(--space-md) var(--space-xl);
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
