import Period from '../../common/Period';

interface GetCandlesBody {
	pairId: string;
	period: Period;
}

export default GetCandlesBody;
