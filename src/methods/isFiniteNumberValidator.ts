export function isFiniteNumberValidator(value: unknown): boolean {
	if (typeof value !== 'number') {
		throw new Error('Value is not a number type');
	}

	if (Number.isNaN(value) || !Number.isFinite(value)) {
		throw new Error('Value is not a finite number');
	}

	return true;
}
