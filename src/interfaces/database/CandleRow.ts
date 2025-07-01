interface CandleRow {
	id: string;
	pair_id: string;
	timestamp: string;
	shadow_top: number;
	shadow_bottom: number;
	body_first: number;
	body_second: number;
}

export default CandleRow;
