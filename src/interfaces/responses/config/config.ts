import Currency from '../../../schemes/Currency';

interface GetConfigRes {
	success: true;
	data: {
		currencies: Currency[];
	};
}

export default GetConfigRes;
