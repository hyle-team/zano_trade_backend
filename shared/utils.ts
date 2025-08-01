import Decimal from 'decimal.js';

export function validateTokensInput(input: string | number, decimal_point = 12) {
	let inputVal = input;

	if (decimal_point < 0 || decimal_point > 18) {
		return {
			valid: false,
			error: 'Invalid decimal point',
		};
	}

	if (inputVal === '') {
		return {
			valid: false,
			error: 'Invalid input',
		};
	}

	// Normalize input using Decimal
	try {
		const decimal = new Decimal(inputVal);
		inputVal = decimal.toFixed();
	} catch (e) {
		return {
			valid: false,
			error: 'Invalid number format',
		};
	}

	inputVal = inputVal.replace(/[^0-9.,]/g, '');
	const dotInput = inputVal.replace(/,/g, '');

	const MAX_NUMBER = new Decimal(2).pow(64).minus(1);
	const decimalDevider = new Decimal(10).pow(decimal_point);
	const maxAllowedNumber = MAX_NUMBER.div(decimalDevider);
	const minAllowedNumber = new Decimal(1).div(decimalDevider);

	const decimalsAmount = dotInput.split('.')[1]?.length || 0;
	if (decimalsAmount > decimal_point) {
		return {
			valid: false,
			error: 'Invalid amount - too many decimal points',
		};
	}

	const rounded = (() => {
		if (dotInput.replace('.', '').length > 20) {
			const decimalParts = dotInput.split('.');
			if (decimalParts.length === 2 && decimalParts[1].length > 1) {
				const beforeDotLength = decimalParts[0].length;
				const roundedInput = new Decimal(dotInput).toFixed(
					Math.max(20 - beforeDotLength, 0),
				);

				if (roundedInput.replace(/./g, '').length <= 20) {
					return roundedInput;
				}
			}
			return false;
		}
		return dotInput;
	})();

	if (rounded === false) {
		return {
			valid: false,
			error: 'Invalid amount - number is too big or has too many decimal points',
		};
	}

	let dotInputDecimal: Decimal;
	try {
		dotInputDecimal = new Decimal(rounded);
	} catch (e) {
		return {
			valid: false,
			error: 'Invalid number format',
		};
	}

	if (dotInputDecimal.gt(maxAllowedNumber)) {
		return {
			valid: false,
			error: 'Invalid amount - number is too big',
		};
	}

	if (dotInputDecimal.lt(minAllowedNumber)) {
		return {
			valid: false,
			error: 'Invalid amount - number is too small',
		};
	}

	return {
		valid: true,
	};
}
