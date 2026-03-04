import authMessagesModel from '@/models/AuthMessages';

const CLEAN_INTERVAL = 60 * 60 * 1000; // 1 hour

class AuthMessagesCleanService {
	run = async () => {
		console.log(
			`Auth messages clean service is running. Cleaning interval: ${CLEAN_INTERVAL / 1000} sec.`,
		);

		async function clean() {
			console.log(`[${new Date()}] Cleaning auth messages...`);

			await authMessagesModel.deleteAllExpired({ now: new Date() });

			console.log(`[${new Date()}] Auth messages cleaned.`);
		}

		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				await clean();
			} catch (error) {
				console.log(
					`[${new Date()}] Error while cleaning auth messages. Continuing on next iteration. Error:`,
				);
				console.error(error);
			}

			console.log(
				`[${new Date()}] Auth messages cleaned. Next cleaning in ${CLEAN_INTERVAL / 1000} sec.`,
			);

			await new Promise((resolve) => setTimeout(resolve, CLEAN_INTERVAL));
		}
	};
}

const authMessagesCleanService = new AuthMessagesCleanService();

export default authMessagesCleanService;
