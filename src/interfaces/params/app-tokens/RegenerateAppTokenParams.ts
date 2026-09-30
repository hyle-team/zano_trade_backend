import { param } from 'express-validator';

interface RegenerateAppTokenParams {
	appId: string;
	publicKeyHex: string;
}

export const regenerateAppTokenParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
	param('publicKeyHex')
		.notEmpty()
		.withMessage('publicKeyHex must not be empty')
		.bail()
		.isLength({ max: 1000 })
		.withMessage('publicKeyHex must be at most 1000 characters long')
		.bail()
		.isHexadecimal()
		.withMessage('publicKeyHex must be a hex string'),
];

export default RegenerateAppTokenParams;
