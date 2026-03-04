import { body } from 'express-validator';

interface GetAssetsPriceRatesBody {
	assetsIds: string[];
}

export const getAssetsPriceRatesValidator = [
	body('assetsIds')
		.isArray({ min: 1 })
		.withMessage('assetsIds must be a non-empty array of strings'),
	body('assetsIds.*').isString().withMessage('Each assetId must be a string'),
];

export default GetAssetsPriceRatesBody;
