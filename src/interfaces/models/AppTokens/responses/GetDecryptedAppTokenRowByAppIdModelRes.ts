export type GetDecryptedAppTokenRowByAppIdResApiKeyData = {
	id: number;
	appId: number;
	value: string;
	issuedAt: Date;
};

type GetDecryptedAppTokenRowByAppIdRes = GetDecryptedAppTokenRowByAppIdResApiKeyData | null;

export default GetDecryptedAppTokenRowByAppIdRes;
