<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Connexion {data.appName} - EasyShop by TWC</title>
</svelte:head>

<div class="login-container grain-overlay">
	<!-- Left Panel - Branding -->
	<div class="brand-panel">
		<div class="brand-content">
			<div class="geometric-shapes">
				<div class="shape shape-1"></div>
				<div class="shape shape-2"></div>
				<div class="shape shape-3"></div>
			</div>
			<img src="/twc-logo.svg" alt="TWC" class="brand-logo" />
			<h1 class="brand-title">EasyShop</h1>
			<p class="brand-subtitle">by Tampon Web Conception</p>
			<div class="brand-divider"></div>
			<p class="brand-description">Gérez votre boutique en ligne avec simplicité et élégance</p>
		</div>
	</div>

	<!-- Right Panel - Form -->
	<div class="form-panel">
		<div class="form-container">
			<div class="form-header">
				<h2>Connexion {data.appName}</h2>
				<p>Accédez à votre espace d'administration</p>
			</div>

			<form
				method="POST"
				action="?/login"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="form-group">
					<label for="email">Adresse e-mail</label>
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email ?? ''}
						required
						autocomplete="email"
						disabled={loading}
						placeholder="vous@exemple.com"
					/>
				</div>

				<div class="form-group">
					<label for="password">Mot de passe</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						autocomplete="current-password"
						disabled={loading}
						placeholder="••••••••"
					/>
				</div>

				{#if form?.error}
					<div class="error-message">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
							<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						</svg>
						<span>{form.error}</span>
					</div>
				{/if}

				<button type="submit" class="submit-btn" disabled={loading}>
					{#if loading}
						<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
							<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
						</svg>
						<span>Connexion en cours...</span>
					{:else}
						<span>Se connecter</span>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 45% 55%;
		background: var(--color-bg-primary);
	}

	/* Brand Panel */
	.brand-panel {
		background: var(--color-bg-secondary);
		border-right: 1px solid var(--color-border-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3xl);
		position: relative;
		overflow: hidden;
	}

	.geometric-shapes {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.shape {
		position: absolute;
		border-radius: var(--radius-lg);
		opacity: 0.03;
		animation: float 20s ease-in-out infinite;
	}

	.shape-1 {
		width: 400px;
		height: 400px;
		background: var(--color-accent-primary);
		top: -100px;
		left: -100px;
		transform: rotate(45deg);
		animation-delay: 0s;
	}

	.shape-2 {
		width: 300px;
		height: 300px;
		background: var(--color-accent-tertiary);
		bottom: -50px;
		right: -50px;
		border-radius: 50%;
		animation-delay: 5s;
	}

	.shape-3 {
		width: 200px;
		height: 200px;
		background: var(--color-accent-secondary);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(30deg);
		animation-delay: 10s;
	}

	@keyframes float {
		0%, 100% {
			transform: translate(0, 0) rotate(0deg);
		}
		33% {
			transform: translate(30px, -30px) rotate(120deg);
		}
		66% {
			transform: translate(-20px, 20px) rotate(240deg);
		}
	}

	.brand-content {
		position: relative;
		z-index: 1;
		text-align: center;
		animation: slideInLeft 0.8s ease-out;
		max-width: 100%;
		padding: 0 var(--space-lg);
	}

	.brand-logo {
		width: 100%;
		max-width: 180px;
		height: auto;
		margin-bottom: var(--space-lg);
	}

	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.brand-title {
		font-family: var(--font-display);
		font-size: 4rem;
		font-weight: 700;
		margin: 0 0 var(--space-md);
		letter-spacing: -0.03em;
	}

	.brand-accent {
		color: var(--color-accent-primary);
	}

	.brand-main {
		color: var(--color-text-primary);
	}

	.brand-subtitle {
		font-size: 1.1rem;
		color: var(--color-text-tertiary);
		margin: 0 0 var(--space-xl);
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.brand-divider {
		width: 60px;
		height: 3px;
		background: linear-gradient(90deg, var(--color-accent-tertiary), var(--color-accent-primary));
		margin: 0 auto var(--space-xl);
		border-radius: 2px;
	}

	.brand-description {
		font-size: 1.1rem;
		color: var(--color-text-secondary);
		max-width: 400px;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* Form Panel */
	.form-panel {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2xl);
	}

	.form-container {
		width: 100%;
		max-width: 460px;
		animation: slideInRight 0.8s ease-out;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.form-header {
		margin-bottom: var(--space-2xl);
	}

	.form-header h2 {
		font-family: var(--font-display);
		font-size: 2.5rem;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-sm);
		font-weight: 600;
	}

	.form-header p {
		color: var(--color-text-tertiary);
		font-size: 1rem;
		margin: 0;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	label {
		color: var(--color-text-secondary);
		font-weight: 500;
		font-size: 0.9rem;
		letter-spacing: 0.01em;
	}

	input {
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 1rem;
		color: var(--color-text-primary);
		transition: all var(--transition-fast);
		font-family: var(--font-body);
		box-sizing: border-box;
	}

	input::placeholder {
		color: var(--color-text-muted);
	}

	input:hover {
		border-color: var(--color-accent-muted);
	}

	input:focus {
		outline: none;
		border-color: var(--color-accent-primary);
		background: var(--color-bg-elevated);
		box-shadow: 0 0 0 3px rgba(52, 0, 194, 0.1);
	}

	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid rgba(239, 68, 68, 0.2);
		font-size: 0.9rem;
		animation: shake 0.4s ease-in-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-10px); }
		75% { transform: translateX(10px); }
	}

	.submit-btn {
		width: 100%;
		padding: var(--space-md) var(--space-xl);
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		transition: all var(--transition-base);
		font-family: var(--font-body);
		margin-top: var(--space-md);
		box-shadow: var(--shadow-twc);
	}

	.submit-btn:hover:not(:disabled) {
		box-shadow: 0 6px 20px rgba(52, 0, 194, 0.25);
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Mobile Responsive */
	@media (max-width: 968px) {
		.login-container {
			grid-template-columns: 1fr;
		}

		.brand-panel {
			display: none;
		}

		.form-panel {
			padding: var(--space-xl) var(--space-md);
		}

		.brand-title {
			font-size: 3rem;
		}

		.form-header h2 {
			font-size: 2rem;
		}
	}

	@media (max-width: 480px) {
		.form-container {
			max-width: 100%;
		}

		.form-header h2 {
			font-size: 1.75rem;
		}
	}
</style>
