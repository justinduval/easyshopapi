<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const navItems = [
		{ href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
		{ href: '/admin/products', label: 'Produits', icon: 'products' as const },
		{ href: '/admin/categories', label: 'Catégories', icon: 'categories' as const },
		{ href: '/admin/orders', label: 'Commandes', icon: 'orders' as const },
		{ href: '/admin/reviews', label: 'Avis', icon: 'reviews' as const },
		{ href: '/admin/users', label: 'Utilisateurs', icon: 'users' as const }
	];

	let mobileMenuOpen = $state(false);
</script>

<svelte:head>
	<title>Admin - EasyShop by TWC</title>
</svelte:head>

<div class="admin-layout grain-overlay">
	<!-- Sidebar -->
	<aside class="sidebar" class:mobile-open={mobileMenuOpen}>
		<div class="sidebar-header">
			<a href="/admin/dashboard" class="brand-link">
				<img src="/twc-logo.svg" alt="TWC" class="brand-logo" />
				<div class="brand-text">
					<span class="brand-name">EasyShop</span>
					<span class="brand-by">by TWC</span>
				</div>
			</a>
			<button
				class="mobile-close"
				onclick={() => (mobileMenuOpen = false)}
				aria-label="Fermer le menu"
			>
				<Icon name="close" size={20} />
			</button>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item, index}
				<a
					href={item.href}
					class="nav-item"
					class:active={$page.url.pathname.startsWith(item.href)}
					onclick={() => (mobileMenuOpen = false)}
					style="--delay: {index * 50}ms"
				>
					<span class="nav-icon"><Icon name={item.icon} size={20} /></span>
					<span class="nav-label">{item.label}</span>
					<span class="nav-indicator"></span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<div class="user-card">
				<div class="user-avatar">
					{data.user?.name?.charAt(0).toUpperCase() || 'U'}
				</div>
				<div class="user-info">
					<div class="user-name">{data.user?.name || 'User'}</div>
					<div class="user-email">{data.user?.email || 'user@example.com'}</div>
				</div>
			</div>
			<form method="POST" action="/admin/logout" use:enhance>
				<button type="submit" class="logout-btn">
					<Icon name="logout" size={18} />
					<span>Déconnexion</span>
				</button>
			</form>
		</div>
	</aside>

	<!-- Main content -->
	<div class="main-content">
		<!-- Header -->
		<header class="header">
			<button class="mobile-menu-btn" onclick={() => (mobileMenuOpen = true)}>
				<Icon name="menu" size={24} />
			</button>
			<div class="header-content">
				<h2 class="page-title">
					{navItems.find((item) => $page.url.pathname.startsWith(item.href))?.label || 'Admin'}
				</h2>
			</div>
		</header>

		<!-- Page content -->
		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

{#if mobileMenuOpen}
	<div class="overlay" onclick={() => (mobileMenuOpen = false)}></div>
{/if}

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
		background: var(--color-bg-primary);
	}

	/* Sidebar */
	.sidebar {
		width: 280px;
		background: var(--color-bg-secondary);
		border-right: 1px solid var(--color-border-subtle);
		display: flex;
		flex-direction: column;
		position: fixed;
		height: 100vh;
		left: 0;
		top: 0;
		z-index: 100;
		transition: transform var(--transition-base);
	}

	.sidebar-header {
		padding: var(--space-lg);
		border-bottom: 1px solid var(--color-border-subtle);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		text-decoration: none;
	}

	.brand-logo {
		height: 40px;
		width: auto;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
		letter-spacing: -0.02em;
	}

	.brand-by {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.mobile-close {
		display: none;
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.mobile-close:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	/* Navigation */
	.sidebar-nav {
		flex: 1;
		padding: var(--space-lg) 0;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		padding: var(--space-md) var(--space-xl);
		color: var(--color-text-secondary);
		text-decoration: none;
		position: relative;
		transition: all var(--transition-fast);
		font-weight: 500;
		margin: 0 var(--space-md);
		border-radius: var(--radius-md);
		animation: slideIn var(--transition-base) ease-out backwards;
		animation-delay: var(--delay);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.nav-item:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.nav-item.active {
		background: var(--color-bg-elevated);
		color: var(--color-accent-primary);
	}

	.nav-item.active .nav-indicator {
		opacity: 1;
		transform: scaleY(1);
	}

	.nav-icon {
		font-size: 1.25rem;
		margin-right: var(--space-md);
		color: var(--color-accent-primary);
	}

	.nav-label {
		font-size: 0.95rem;
	}

	.nav-indicator {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%) scaleY(0);
		width: 3px;
		height: 60%;
		background: var(--color-accent-primary);
		border-radius: 0 2px 2px 0;
		opacity: 0;
		transition: all var(--transition-base);
	}

	/* Sidebar Footer */
	.sidebar-footer {
		padding: var(--space-lg) var(--space-xl);
		border-top: 1px solid var(--color-border-subtle);
		gap: var(--space-md);
		display: flex;
		flex-direction: column;
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-subtle);
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-accent-tertiary), var(--color-accent-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: var(--color-bg-primary);
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color-text-primary);
		margin-bottom: var(--space-xs);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-email {
		font-size: 0.8rem;
		color: var(--color-text-tertiary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.logout-btn {
		width: 100%;
		padding: var(--space-md);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		transition: all var(--transition-fast);
		font-family: var(--font-body);
	}

	.logout-btn:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-accent-muted);
		color: var(--color-text-primary);
	}

	/* Main Content */
	.main-content {
		flex: 1;
		margin-left: 280px;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.header {
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border-subtle);
		padding: var(--space-lg) var(--space-xl);
		display: flex;
		align-items: center;
		gap: var(--space-md);
		position: sticky;
		top: 0;
		z-index: 10;
		backdrop-filter: blur(8px);
	}

	.mobile-menu-btn {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-sm);
		color: var(--color-text-primary);
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
	}

	.mobile-menu-btn:hover {
		background: var(--color-surface-hover);
	}

	.header-content {
		flex: 1;
	}

	.page-title {
		margin: 0;
		font-size: 1.75rem;
		color: var(--color-text-primary);
		font-family: var(--font-display);
		font-weight: 600;
	}

	.content {
		flex: 1;
		padding: var(--space-xl);
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

	.overlay {
		display: none;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.sidebar {
			transform: translateX(-100%);
		}

		.sidebar.mobile-open {
			transform: translateX(0);
			box-shadow: var(--shadow-xl);
		}

		.mobile-close {
			display: block;
		}

		.main-content {
			margin-left: 0;
		}

		.mobile-menu-btn {
			display: block;
		}

		.overlay {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(4px);
			z-index: 99;
		}

		.content {
			padding: var(--space-md);
		}

		.page-title {
			font-size: 1.5rem;
		}

		.header {
			padding: var(--space-md) var(--space-lg);
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		.sidebar {
			width: 100%;
		}

		.sidebar-header {
			padding: var(--space-md);
		}

		.brand-logo {
			height: 32px;
		}

		.brand-name {
			font-size: 1.1rem;
		}

		.brand-by {
			font-size: 0.65rem;
		}

		.sidebar-nav {
			padding: var(--space-md) 0;
		}

		.nav-item {
			padding: var(--space-sm) var(--space-lg);
			margin: 0 var(--space-sm);
		}

		.nav-label {
			font-size: 0.9rem;
		}

		.sidebar-footer {
			padding: var(--space-md) var(--space-lg);
		}

		.user-card {
			padding: var(--space-sm);
		}

		.user-avatar {
			width: 36px;
			height: 36px;
			font-size: 1rem;
		}

		.user-name {
			font-size: 0.85rem;
		}

		.user-email {
			font-size: 0.75rem;
		}

		.logout-btn {
			padding: var(--space-sm);
			font-size: 0.85rem;
		}

		.header {
			padding: var(--space-sm) var(--space-md);
		}

		.page-title {
			font-size: 1.25rem;
		}

		.content {
			padding: var(--space-sm);
		}
	}
</style>
