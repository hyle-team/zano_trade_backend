import AuthorizedData from './AuthorizedData';

interface DepositSocketData extends AuthorizedData {
	deposit_state: string;
}

export default DepositSocketData;
