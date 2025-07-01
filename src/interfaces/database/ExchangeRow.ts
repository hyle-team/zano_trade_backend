interface ExchangeRow {
	id: string;
	buy_order_id: string;
	sell_order_id: string;
	amount: number;
	timestamp: string;
	status: string;
	creator: string;
	hex_raw_proposal: string;
}

export default ExchangeRow;
