export type GetDecryptedAppTokenRowByAppIdServiceResApiKeyData = {
	id: number;
	appId: number;
	value: string;
	issuedAt: Date;
};

export type GetDecryptedAppTokenRowByAppIdServiceRes =
	GetDecryptedAppTokenRowByAppIdServiceResApiKeyData | null;
