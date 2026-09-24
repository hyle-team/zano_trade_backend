import crypto from 'node:crypto';
import { sha256 } from '../../shared/utils';

export type ValidateIntegrationKeyResult = {
	isIntegrationRequest: boolean;
	isValidKey: boolean;
};

export const validateIntegrationKey = ({
	providedKey,
	expectedKeyHash,
}: {
	providedKey: string | undefined;
	expectedKeyHash: NodeJS.ArrayBufferView<ArrayBufferLike>;
}): ValidateIntegrationKeyResult => {
	if (providedKey === undefined) {
		return { isIntegrationRequest: false, isValidKey: false };
	}

	const isValidKey = crypto.timingSafeEqual(sha256(providedKey), expectedKeyHash);

	return { isIntegrationRequest: true, isValidKey };
};
