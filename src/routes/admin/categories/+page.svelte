<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData, ActionData } from './$types';
	import { generateSlug } from '$lib/utils/slug';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showModal = $state(false);
	let editingCategory: any = $state(null);
	let loading = $state(false);
	let deleteConfirm: string | null = $state(null);

	let formData = $state({
		name: '',
		slug: '',
		description: ''
	});

	function openCreateModal() {
		editingCategory = null;
		formData = { name: '', slug: '', description: '' };
		showModal = true;
	}

	function openEditModal(category: any) {
		editingCategory = category;
		formData = {
			name: category.name,
			slug: category.slug,
			description: category.description || ''
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingCategory = null;
		formData = { name: '', slug: '', description: '' };
	}

	function handleNameChange(e: Event) {
		const target = e.target as HTMLInputElement;
		formData.name = target.value;
		if (!editingCategory && !formData.slug) {
			formData.slug = generateSlug(target.value);
		}
	}
</script>

<svelte:head>
	<title>Catégories - EasyShop Admin</title>
</svelte:head>

<div class="categories-page">
	<div class="page-header">
		<h1>Catégories</h1>
		<button class="btn-primary" onclick={openCreateModal}>
			+ Nouvelle catégorie
		</button>
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

	<div class="categories-table">
		<table>
			<thead>
				<tr>
					<th>Nom</th>
					<th>Slug</th>
					<th>Description</th>
					<th>Produits</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.categories as category}
					<tr>
						<td data-label="Nom"><strong>{category.name}</strong></td>
						<td data-label="Slug"><code>{category.slug}</code></td>
						<td data-label="Description">{category.description || '—'}</td>
						<td data-label="Produits">{category.product_count || 0}</td>
						<td class="actions">
							<button class="btn-sm btn-edit" onclick={() => openEditModal(category)}>
								Modifier
							</button>
							{#if deleteConfirm === category.id}
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
										<input type="hidden" name="id" value={category.id} />
										<button type="submit" class="btn-sm btn-danger" disabled={loading}>
											Oui
										</button>
									</form>
									<button class="btn-sm btn-secondary" onclick={() => (deleteConfirm = null)}>
										Non
									</button>
								</div>
							{:else}
								<button
									class="btn-sm btn-danger"
									onclick={() => (deleteConfirm = category.id)}
									disabled={category.product_count > 0}
									title={category.product_count > 0
										? 'Impossible de supprimer une catégorie contenant des produits'
										: 'Supprimer'}
								>
									Supprimer
								</button>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="empty">Aucune catégorie</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="modal-overlay" onclick={closeModal}></div>
	<div class="modal">
		<div class="modal-header">
			<h2>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
			<button class="modal-close" onclick={closeModal}>
				<Icon name="close" size={20} />
			</button>
		</div>

		<form
			method="POST"
			action={editingCategory ? '?/update' : '?/create'}
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					await update();
					loading = false;
					if (result.type === 'success') {
						closeModal();
						invalidateAll();
					}
				};
			}}
		>
			{#if editingCategory}
				<input type="hidden" name="id" value={editingCategory.id} />
			{/if}

			<div class="form-group">
				<label for="name">Nom *</label>
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
				<small>Uniquement lettres minuscules, chiffres et tirets</small>
			</div>

			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					name="description"
					bind:value={formData.description}
					rows="3"
					disabled={loading}
				></textarea>
			</div>

			<div class="modal-actions">
				<button type="button" class="btn-secondary" onclick={closeModal} disabled={loading}>
					Annuler
				</button>
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'En cours...' : editingCategory ? 'Mettre à jour' : 'Créer'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.categories-page {
		max-width: 1200px;
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

	.categories-table {
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

	tr:hover td {
		background: var(--color-surface-hover);
	}

	tr:last-child td {
		border-bottom: none;
	}

	code {
		background: var(--color-bg-elevated);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: 0.9em;
		color: var(--color-accent-primary);
		font-family: 'Courier New', monospace;
	}

	.empty {
		text-align: center;
		color: var(--color-text-tertiary);
		padding: var(--space-3xl) !important;
	}

	.actions {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.delete-confirm {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.delete-confirm span {
		font-size: 0.85rem;
		color: var(--color-text-tertiary);
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
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		font-family: var(--font-body);
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		color: var(--color-bg-primary);
		font-size: 1rem;
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
		max-width: 500px;
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

	.modal form {
		padding: var(--space-xl);
	}

	.form-group {
		margin-bottom: var(--space-lg);
	}

	label {
		display: block;
		margin-bottom: var(--space-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	input,
	textarea {
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
	textarea:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		background: var(--color-bg-elevated);
	}

	input:disabled,
	textarea:disabled {
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

	.modal-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
		margin-top: var(--space-xl);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border-subtle);
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

		.btn-primary {
			text-align: center;
			justify-content: center;
		}

		/* Table → Cards */
		.categories-table {
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
			font-size: 0.8rem;
			color: var(--color-text-tertiary);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		td:first-child {
			padding-top: 0;
		}

		td:last-child {
			padding-top: var(--space-md);
			margin-top: var(--space-sm);
			border-top: 1px solid var(--color-border-subtle);
		}

		td:last-child::before {
			display: none;
		}

		.actions {
			width: 100%;
			justify-content: flex-end;
		}

		.delete-confirm {
			flex-wrap: wrap;
			justify-content: flex-end;
		}

		code {
			font-size: 0.8em;
		}

		/* Modal */
		.modal {
			width: 95%;
			max-height: 90vh;
			overflow-y: auto;
		}

		.modal-header {
			padding: var(--space-lg);
		}

		.modal-header h2 {
			font-size: 1.25rem;
		}

		.modal form {
			padding: var(--space-lg);
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-actions button {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.25rem;
		}

		.btn-sm {
			padding: var(--space-xs) var(--space-sm);
			font-size: 0.8rem;
		}

		.actions {
			flex-wrap: wrap;
			gap: var(--space-xs);
		}

		.delete-confirm span {
			font-size: 0.75rem;
		}

		.modal {
			width: 100%;
			height: 100%;
			max-height: 100%;
			border-radius: 0;
			top: 0;
			left: 0;
			transform: none;
		}

		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateY(-20px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
