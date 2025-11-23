<script lang="ts">
	type Props = {
		rating: number;
		size?: number;
		showNumber?: boolean;
		class?: string;
	};

	let { rating, size = 18, showNumber = false, class: className = '' }: Props = $props();

	// Ensure rating is between 1 and 5
	const normalizedRating = Math.max(1, Math.min(5, rating));
</script>

<div class="star-rating {className}">
	<div class="stars">
		{#each Array(5) as _, index}
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill={index < normalizedRating ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="star"
				class:filled={index < normalizedRating}
			>
				<polygon
					points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				/>
			</svg>
		{/each}
	</div>
	{#if showNumber}
		<span class="rating-number">{normalizedRating}/5</span>
	{/if}
</div>

<style>
	.star-rating {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.stars {
		display: inline-flex;
		gap: 2px;
	}

	.star {
		color: var(--color-border);
		transition: all var(--transition-fast);
	}

	.star.filled {
		color: var(--color-accent-primary);
		fill: var(--color-accent-primary);
	}

	.rating-number {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		font-weight: 500;
		margin-left: var(--space-xs);
	}
</style>
