export const assertNever = (value: never): never => {
	throw new Error(`Unhandled value passed into assertNever: ${JSON.stringify(value)}`);
};
