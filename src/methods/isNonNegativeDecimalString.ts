export const NON_NEGATIVE_REAL_NUMBER_REGEX = /^\d+(\.\d+)?$/;

export const isNonNegativeDecimalString = (value: unknown): boolean => {
	if (typeof value !== 'string') {
		return false;
	}

	return NON_NEGATIVE_REAL_NUMBER_REGEX.test(value);
};
