export type GetHistoricalZanoPriceParams = {
	timestamp: number;
};

export type GetHistoricalZanoPriceSuccessRes = {
	success: true;
	price: string;
};

export enum GetHistoricalZanoPriceErrorCode {
	EXPLORER_API_UNAVAILABLE = 'EXPLORER_API_UNAVAILABLE',
}

export type GetHistoricalZanoPriceErrorRes = {
	success: false;
	data: GetHistoricalZanoPriceErrorCode;
};

type GetHistoricalZanoPriceRes = GetHistoricalZanoPriceSuccessRes | GetHistoricalZanoPriceErrorRes;

export default GetHistoricalZanoPriceRes;
