interface getAssetStatsRes {
	current_tvl: string;
	current_price: string;
	change_24h_percent: string;
	volume_24h: string;
	market_cap: string;
	name: string;
	ticker: string;
	pair_id: string;
	current_supply: string;
	period_data?: {
		price_change_percent: string;
		volume: string;
	};
}

export default getAssetStatsRes;
