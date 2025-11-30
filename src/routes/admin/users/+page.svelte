<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let deleteConfirmId = $state<string | null>(null);
</script>

<div class="users-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Gestion des administrateurs</h1>
			<p class="subtitle">Gérez les comptes administrateurs de votre boutique</p>
		</div>
		<button class="btn btn-primary" onclick={() => (showCreateForm = !showCreateForm)}>
			<Icon name="plus" size={18} />
			<span>Nouvel admin</span>
		</button>
	</div>

	{#if form?.error}
		<div class="alert alert-error">
			<Icon name="error" size={20} />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.success}
		<div class="alert alert-success">
			<Icon name="success" size={20} />
			<span>Opération effectuée avec succès</span>
		</div>
	{/if}

	{#if showCreateForm}
		<div class="card create-form">
			<h2>Créer un administrateur</h2>
			<form method="POST" action="?/create" use:enhance>
				<div class="form-grid">
					<div class="form-group">
						<label for="name">Nom</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							placeholder="Nom de l'administrateur"
							value={form?.name ?? ''}
						/>
					</div>
					<div class="form-group">
						<label for="email">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							placeholder="admin@exemple.com"
							value={form?.email ?? ''}
						/>
					</div>
					<div class="form-group">
						<label for="password">Mot de passe</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength="6"
							placeholder="Minimum 6 caractères"
						/>
					</div>
				</div>
				<div class="form-actions">
					<button type="button" class="btn btn-secondary" onclick={() => (showCreateForm = false)}>
						Annuler
					</button>
					<button type="submit" class="btn btn-primary">
						<Icon name="plus" size={18} />
						Créer
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="card">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Nom</th>
						<th>Email</th>
						<th>Type</th>
						<th>Créé le</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.admins as admin}
						<tr>
							<td data-label="Nom">
								<div class="user-cell">
									<div class="user-avatar">
										{admin.name?.charAt(0).toUpperCase() || 'A'}
									</div>
									<span>{admin.name}</span>
								</div>
							</td>
							<td data-label="Email">{admin.email}</td>
							<td data-label="Type">
								{#if admin.is_system}
									<span class="badge badge-system">Système</span>
								{:else}
									<span class="badge badge-normal">Standard</span>
								{/if}
							</td>
							<td data-label="Créé le">
								{new Date(admin.created_at).toLocaleDateString('fr-FR', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric'
								})}
							</td>
							<td>
								{#if admin.is_system}
									<span class="text-muted">Protégé</span>
								{:else if deleteConfirmId === admin.id}
									<form method="POST" action="?/delete" use:enhance class="delete-confirm">
										<input type="hidden" name="id" value={admin.id} />
										<span class="confirm-text">Confirmer ?</span>
										<button type="submit" class="btn btn-danger btn-sm">Oui</button>
										<button
											type="button"
											class="btn btn-secondary btn-sm"
											onclick={() => (deleteConfirmId = null)}
										>
											Non
										</button>
									</form>
								{:else}
									<button
										class="btn btn-icon btn-danger-outline"
										onclick={() => (deleteConfirmId = admin.id)}
										title="Supprimer"
									>
										<Icon name="trash" size={18} />
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.users-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-xl);
		gap: var(--space-lg);
	}

	.header-content h1 {
		margin: 0 0 var(--space-xs) 0;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.subtitle {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
	}

	.alert {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
		font-weight: 500;
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.alert-success {
		background: rgba(16, 185, 129, 0.1);
		color: var(--color-success);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.card {
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		margin-bottom: var(--space-lg);
	}

	.create-form h2 {
		margin: 0 0 var(--space-lg) 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.form-group label {
		font-weight: 500;
		font-size: 0.9rem;
		color: var(--color-text-primary);
	}

	.form-group input {
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		font-size: 0.95rem;
		transition: all var(--transition-fast);
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		box-shadow: 0 0 0 3px rgba(52, 0, 194, 0.1);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-md);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all var(--transition-fast);
		border: none;
		font-family: var(--font-body);
	}

	.btn-primary {
		background: var(--color-accent-primary);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-accent-secondary);
	}

	.btn-secondary {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-bg-secondary);
	}

	.btn-danger {
		background: var(--color-error);
		color: white;
	}

	.btn-danger:hover {
		background: #dc2626;
	}

	.btn-danger-outline {
		background: transparent;
		color: var(--color-error);
		border: 1px solid var(--color-error);
	}

	.btn-danger-outline:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.btn-icon {
		padding: var(--space-sm);
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-sm);
		font-size: 0.8rem;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: var(--space-md) var(--space-lg);
		text-align: left;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	th {
		font-weight: 600;
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	td {
		color: var(--color-text-primary);
	}

	tbody tr:hover {
		background: var(--color-bg-secondary);
	}

	.user-cell {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: white;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-system {
		background: rgba(52, 0, 194, 0.1);
		color: var(--color-accent-primary);
		border: 1px solid rgba(52, 0, 194, 0.2);
	}

	.badge-normal {
		background: var(--color-bg-tertiary);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.text-muted {
		color: var(--color-text-tertiary);
		font-size: 0.9rem;
		font-style: italic;
	}

	.delete-confirm {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.confirm-text {
		font-size: 0.85rem;
		color: var(--color-error);
		font-weight: 500;
	}

	/* ===== RESPONSIVE MOBILE ===== */
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
		}

		.header-content h1 {
			font-size: 1.5rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn {
			justify-content: center;
		}

		.card {
			padding: var(--space-md);
		}

		.create-form h2 {
			font-size: 1.1rem;
		}

		/* Table → Cards */
		.table-container {
			overflow: visible;
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
			background: var(--color-bg-tertiary);
			border: 1px solid var(--color-border-subtle);
			border-radius: var(--radius-lg);
			padding: var(--space-md);
		}

		tr:hover {
			background: var(--color-bg-tertiary);
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
		}

		/* First cell - user avatar and name */
		td:first-child {
			padding-bottom: var(--space-sm);
			border-bottom: 1px solid var(--color-border-subtle);
			margin-bottom: var(--space-sm);
		}

		td:first-child::before {
			display: none;
		}

		.user-cell {
			width: 100%;
		}

		/* Actions at bottom */
		td:last-child {
			padding-top: var(--space-md);
			margin-top: var(--space-sm);
			border-top: 1px solid var(--color-border-subtle);
			justify-content: flex-end;
		}

		td:last-child::before {
			display: none;
		}

		.delete-confirm {
			flex-wrap: wrap;
			justify-content: flex-end;
		}
	}

	@media (max-width: 480px) {
		.header-content h1 {
			font-size: 1.25rem;
		}

		.subtitle {
			font-size: 0.85rem;
		}

		tr {
			padding: var(--space-sm);
		}

		.user-avatar {
			width: 32px;
			height: 32px;
			font-size: 0.85rem;
		}

		.badge {
			font-size: 0.7rem;
			padding: 2px var(--space-xs);
		}

		.btn-sm {
			padding: var(--space-xs) var(--space-sm);
			font-size: 0.8rem;
		}

		.form-group input {
			padding: var(--space-sm);
			font-size: 0.9rem;
		}
	}
</style>
