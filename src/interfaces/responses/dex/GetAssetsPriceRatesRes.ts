export type GetAssetsPriceRatesResPriceRate = {
	asset_id: string;
	rate: number | null;
	day_change: number | null;
	day_volume: number | null;
	day_high: number | null;
	day_low: number | null;
};

export type GetAssetsPriceRatesSuccessRes = {
	success: true;
	priceRates: GetAssetsPriceRatesResPriceRate[];
};

export enum GetAssetsPriceRatesErrorCode {}

export type GetAssetsPriceRatesErrorRes = {
	success: false;
	data: GetAssetsPriceRatesErrorCode;
};

type GetAssetsPriceRatesRes = GetAssetsPriceRatesSuccessRes | GetAssetsPriceRatesErrorRes;

export default GetAssetsPriceRatesRes;
