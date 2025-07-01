import ErrorResponse from '../interfaces/responses/ErrorResponse.js';
import GetConfigRes from '../interfaces/responses/config/config.js';

import Currency from '../schemes/Currency.js';

class ConfigModel {
	async getCurrencyRow(id: number) {
		const currency = await Currency.findOne({
			where: {
				id,
			},
		});

		return currency;
	}

	async get(): Promise<ErrorResponse | GetConfigRes> {
		try {
			const selected = await Currency.findAll();

			return {
				success: true,
				data: {
					currencies: selected,
				},
			};
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}
}

const configModel = new ConfigModel();

export default configModel;
