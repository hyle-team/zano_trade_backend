interface getTotalStatsRes {
	largest_tvl: {
		asset_id: string;
		tvl: string;
	};
	total_tvl: string;

	period_data?: {
		active_tokens: string;
		most_traded: {
			asset_id: string;
			volume: string;
		};
		total_volume: string;
	};
}

export default getTotalStatsRes;
