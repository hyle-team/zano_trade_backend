export type GetDecryptedAppTokenRowByAppIdServiceResApiKeyData = {
	id: number;
	appId: number;
	value: string;
	issuedAt: Date;
};

type GetDecryptedAppTokenRowByAppIdServiceRes =
	GetDecryptedAppTokenRowByAppIdServiceResApiKeyData | null;

export default GetDecryptedAppTokenRowByAppIdServiceRes;
