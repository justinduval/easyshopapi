import { env } from '$env/dynamic/private';

export interface SendEmailParams {
	to: string | string[];
	subject: string;
	htmlContent: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
	const { to, subject, htmlContent } = params;

	const MAILER_API_URL = env.MAILER_API_URL;
	const MAILER_API_KEY = env.MAILER_API_KEY;
	const MAILER_FROM_EMAIL = env.MAILER_FROM_EMAIL;
	const MAILER_FROM_NAME = env.MAILER_FROM_NAME;

	if (!MAILER_API_URL || !MAILER_API_KEY) {
		console.error('[Email] Mailer not configured - MAILER_API_URL or MAILER_API_KEY missing');
		return false;
	}

	const recipients = Array.isArray(to) ? to.map((email) => ({ email })) : [{ email: to }];

	try {
		const response = await fetch(MAILER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': MAILER_API_KEY
			},
			body: JSON.stringify({
				sender: {
					email: MAILER_FROM_EMAIL || 'noreply@easyshop.fr',
					name: MAILER_FROM_NAME || 'EasyShop'
				},
				to: recipients,
				subject,
				htmlContent
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[Email] Failed to send email: ${response.status} - ${errorText}`);
			return false;
		}

		console.log(`[Email] Email sent successfully to ${recipients.map((r) => r.email).join(', ')}`);
		return true;
	} catch (error) {
		console.error('[Email] Error sending email:', error);
		return false;
	}
}
