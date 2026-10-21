export const HEX_REGEX = /^(?:[0-9a-fA-F]{2})+$/;

export const isValidHexValue = (value: string) => HEX_REGEX.test(value);
