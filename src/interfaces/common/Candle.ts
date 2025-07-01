interface Candle {
	timestamp: string;
	shadow_top: number | undefined;
	shadow_bottom: number | undefined;
	body_first: number | undefined;
	body_second: number | undefined;
}

export default Candle;
