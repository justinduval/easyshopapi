import type { OrderWithItems } from '../api/orders';

export function orderConfirmationTemplate(order: OrderWithItems): string {
	const itemsHtml = order.items
		.map(
			(item) => `
			<tr>
				<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
				<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
				<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.unit_price_ht)} HT</td>
				<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.total_ttc)} TTC</td>
			</tr>
		`
		)
		.join('');

	return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="background-color: #2563eb; padding: 30px; text-align: center;">
							<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Commande confirmee</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 30px;">
							<p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
								Bonjour <strong>${order.customer_name}</strong>,
							</p>
							<p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
								Merci pour votre commande ! Votre paiement a bien ete recu.
							</p>

							<!-- Order Info -->
							<table width="100%" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
								<tr>
									<td>
										<p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Numero de commande</p>
										<p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${order.order_number}</p>
									</td>
								</tr>
							</table>

							<!-- Items Table -->
							<h2 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Detail de votre commande</h2>
							<table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
								<thead>
									<tr style="background-color: #f9fafb;">
										<th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; font-size: 14px;">Produit</th>
										<th style="padding: 12px; text-align: center; color: #374151; font-weight: 600; font-size: 14px;">Qte</th>
										<th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; font-size: 14px;">Prix unit.</th>
										<th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; font-size: 14px;">Total</th>
									</tr>
								</thead>
								<tbody>
									${itemsHtml}
								</tbody>
							</table>

							<!-- Totals -->
							<table width="100%" style="margin-bottom: 20px;">
								<tr>
									<td style="text-align: right; padding: 5px 0; color: #6b7280;">Total HT :</td>
									<td style="text-align: right; padding: 5px 0; color: #374151; width: 120px;">${formatPrice(order.total_ht)}</td>
								</tr>
								<tr>
									<td style="text-align: right; padding: 5px 0; color: #6b7280;">TVA :</td>
									<td style="text-align: right; padding: 5px 0; color: #374151;">${formatPrice(order.total_tva)}</td>
								</tr>
								<tr>
									<td style="text-align: right; padding: 10px 0; color: #111827; font-weight: 600; font-size: 18px;">Total TTC :</td>
									<td style="text-align: right; padding: 10px 0; color: #2563eb; font-weight: 600; font-size: 18px;">${formatPrice(order.total_ttc)}</td>
								</tr>
							</table>

							<!-- Pickup Info -->
							<div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
								<h3 style="margin: 0 0 10px; color: #92400e; font-size: 16px; font-weight: 600;">Lieu de retrait</h3>
								<p style="margin: 0; color: #78350f; font-size: 14px;">${order.pickup_location}</p>
								<p style="margin: 10px 0 0; color: #92400e; font-size: 13px;">
									Vous recevrez un email lorsque votre commande sera prete.
								</p>
							</div>

							<p style="margin: 0; color: #6b7280; font-size: 14px;">
								Si vous avez des questions, n'hesitez pas a nous contacter.
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #9ca3af; font-size: 12px;">
								EasyShop - Merci pour votre confiance
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;
}

export function orderStatusUpdateTemplate(
	order: OrderWithItems,
	newStatus: string
): string {
	const statusMessages: Record<string, { title: string; message: string; color: string }> = {
		confirmed: {
			title: 'Commande confirmee',
			message: 'Votre commande a ete confirmee et est en cours de preparation.',
			color: '#2563eb'
		},
		ready_for_pickup: {
			title: 'Commande prete',
			message:
				'Bonne nouvelle ! Votre commande est prete et vous attend au point de retrait.',
			color: '#16a34a'
		},
		completed: {
			title: 'Commande completee',
			message:
				'Votre commande a ete retiree. Merci pour votre achat !',
			color: '#7c3aed'
		},
		cancelled: {
			title: 'Commande annulee',
			message:
				'Votre commande a ete annulee. Si vous avez des questions, contactez-nous.',
			color: '#dc2626'
		}
	};

	const status = statusMessages[newStatus] || {
		title: 'Mise a jour de commande',
		message: `Le statut de votre commande est maintenant : ${newStatus}`,
		color: '#6b7280'
	};

	return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${status.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="background-color: ${status.color}; padding: 30px; text-align: center;">
							<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${status.title}</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 30px;">
							<p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
								Bonjour <strong>${order.customer_name}</strong>,
							</p>
							<p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
								${status.message}
							</p>

							<!-- Order Info -->
							<table width="100%" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
								<tr>
									<td>
										<p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Commande</p>
										<p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${order.order_number}</p>
									</td>
									<td style="text-align: right;">
										<p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Total</p>
										<p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${formatPrice(order.total_ttc)}</p>
									</td>
								</tr>
							</table>

							${
								newStatus === 'ready_for_pickup'
									? `
							<div style="background-color: #dcfce7; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
								<h3 style="margin: 0 0 10px; color: #166534; font-size: 16px; font-weight: 600;">Lieu de retrait</h3>
								<p style="margin: 0; color: #15803d; font-size: 14px;">${order.pickup_location}</p>
							</div>
							`
									: ''
							}

							<p style="margin: 0; color: #6b7280; font-size: 14px;">
								Si vous avez des questions, n'hesitez pas a nous contacter.
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #9ca3af; font-size: 12px;">
								EasyShop - Merci pour votre confiance
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;
}

function formatPrice(price: number): string {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR'
	}).format(price);
}
