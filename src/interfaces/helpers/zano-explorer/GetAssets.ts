export type GetAssetsParams = {
	from: number;
	to: number;
};

export type GetAssetsResAssetData = {
	asset_id: string;
	logo: string;
	price_url: string;
	ticker: string;
	full_name: string;
	total_max_supply: string;
	current_supply: string;
	decimal_point: number;
	meta_info: string;
};

export type GetAssetsSuccessRes = {
	success: true;
	assets: GetAssetsResAssetData[];
};

export enum GetAssetsErrorCode {
	EXPLORER_API_UNAVAILABLE = 'EXPLORER_API_UNAVAILABLE',
}

export type GetAssetsErrorRes = {
	success: false;
	data: GetAssetsErrorCode;
};

type GetAssetsRes = GetAssetsSuccessRes | GetAssetsErrorRes;

export default GetAssetsRes;
