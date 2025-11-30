<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Erreur {$page.status} - EasyShop by TWC</title>
</svelte:head>

<div class="error-page grain-overlay">
	<div class="error-container">
		<div class="error-code">{$page.status}</div>
		<h1 class="error-title">
			{#if $page.status === 404}
				Page introuvable
			{:else if $page.status === 500}
				Erreur serveur
			{:else if $page.status === 403}
				Accès refusé
			{:else}
				Une erreur est survenue
			{/if}
		</h1>
		<p class="error-message">
			{#if $page.error?.message}
				{$page.error.message}
			{:else if $page.status === 404}
				La page que vous recherchez n'existe pas ou a été déplacée.
			{:else if $page.status === 500}
				Une erreur interne est survenue. Veuillez réessayer plus tard.
			{:else}
				Quelque chose s'est mal passé. Veuillez réessayer.
			{/if}
		</p>
		<div class="error-actions">
			<a href="/admin/dashboard" class="btn btn-primary">
				Retour au tableau de bord
			</a>
			<button class="btn btn-secondary" onclick={() => window.history.back()}>
				Page précédente
			</button>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-primary);
		padding: var(--space-xl);
	}

	.error-container {
		text-align: center;
		max-width: 500px;
		animation: fadeIn 0.5s ease-out;
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

	.error-code {
		font-family: var(--font-display);
		font-size: 8rem;
		font-weight: 700;
		background: var(--gradient-twc);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
		margin-bottom: var(--space-md);
	}

	.error-title {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-md);
	}

	.error-message {
		color: var(--color-text-secondary);
		font-size: 1.1rem;
		line-height: 1.6;
		margin: 0 0 var(--space-2xl);
	}

	.error-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-xl);
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all var(--transition-fast);
		border: none;
		font-family: var(--font-body);
		text-decoration: none;
	}

	.btn-primary {
		background: var(--color-accent-primary);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-accent-secondary);
		box-shadow: var(--shadow-twc);
	}

	.btn-secondary {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-bg-secondary);
		border-color: var(--color-accent-muted);
	}

	@media (max-width: 480px) {
		.error-code {
			font-size: 5rem;
		}

		.error-title {
			font-size: 1.5rem;
		}

		.error-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
