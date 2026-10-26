import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '@/config/env.js';

interface SendMailParams {
	to: string;
	subject: string;
	text: string;
	html: string;
}

class MailerHelper {
	private transporter: Transporter | null = null;

	get isConfigured() {
		return Boolean(env.SMTP_HOST && env.SMTP_FROM);
	}

	private getTransporter() {
		if (!this.transporter) {
			this.transporter = nodemailer.createTransport({
				host: env.SMTP_HOST,
				port: env.SMTP_PORT,
				secure: env.SMTP_SECURE,
				auth:
					env.SMTP_USER && env.SMTP_PASSWORD
						? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
						: undefined,
			});
		}

		return this.transporter;
	}

	async send({ to, subject, text, html }: SendMailParams) {
		if (!this.isConfigured) {
			console.log(`[mailer] SMTP is not configured, skipping email to ${to}: ${subject}`);
			return false;
		}

		try {
			await this.getTransporter().sendMail({ from: env.SMTP_FROM, to, subject, text, html });
			return true;
		} catch (error) {
			console.error(`[mailer] Failed to send email to ${to}:`, error);
			return false;
		}
	}
}

const mailerHelper = new MailerHelper();

export default mailerHelper;
