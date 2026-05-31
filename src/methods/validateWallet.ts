import AuthData from '@/interfaces/bodies/user/AuthData';
import axios from 'axios';

if (process.env.DAEMON_URL === undefined || process.env.DAEMON_URL === '') {
	throw new Error('DAEMON_URL is not defined in environment variables');
}

async function validateWallet(authData: AuthData) {
	async function fetchZanoApi(method: string, params: object) {
		try {
			return await axios
				.post(process.env.DAEMON_URL ?? '', {
					id: 0,
					jsonrpc: '2.0',
					method,
					params,
				})
				.then((res) => res.data);
		} catch (error) {
			console.log(error);
		}
	}

	const { message, address, alias, signature } = authData;

	if (!message || !alias || !signature) {
		return false;
	}

	const response = await fetchZanoApi('validate_signature', {
		buff: Buffer.from(message).toString('base64'),
		alias,
		sig: signature,
	});

	const aliasOk = response?.result?.status === 'OK';

	if (!aliasOk) {
		return false;
	}

	const aliasDetailsResponse = await fetchZanoApi('get_alias_details', {
		alias,
	});

	const aliasDetails = aliasDetailsResponse?.result?.alias_details;
	const aliasAddress = aliasDetails?.address;

	const addressOk = !!aliasAddress && aliasAddress === address;

	return aliasOk && addressOk;
}

export default validateWallet;
