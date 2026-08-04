// @ts-expect-error - Disabling TS error while importing /shared submodule
// due to global tsconfig "moduleResolution" prop is set to "node"
import { ServerWallet } from 'zano_web3/server';
import { env } from '@/config/env.js';

async function validateWallet({
	originalMessage,
	signedMessage,
	signature,
	address,
	pkeyFromSignature,
	alias,
}: {
	originalMessage: string;
	signedMessage: string;
	signature: string;
	address: string;
	pkeyFromSignature: string;
	alias: string;
}): Promise<boolean> {
	const serverWallet = new ServerWallet({
		daemonUrl: env.DAEMON_URL,
		walletUrl: '',
	});

	const isValidSignature = await serverWallet.validateSecureMessageSignature({
		originalMessage,
		signedMessage,
		signature,
		address,
		pkeyFromSignature,
	});

	if (!isValidSignature) {
		return false;
	}

	let aliasDetailsResult;

	try {
		aliasDetailsResult = await serverWallet.getAliasDetails(alias);
	} catch (error) {
		if (error instanceof Error && error.message.includes('Error fetching alias')) {
			return false;
		}

		throw error;
	}

	const aliasDetails = aliasDetailsResult?.alias_details;
	const aliasAddress = aliasDetails?.address;

	const addressOk = !!aliasAddress && aliasAddress === address;

	return addressOk;
}

export default validateWallet;
