interface PairStats {
	rate: number;
	coefficient: number;
	high: number;
	low: number;
	volume: number;
}

interface GetPairStatsRes {
	success: true;
	data: PairStats;
}

export default GetPairStatsRes;

export type { PairStats };
