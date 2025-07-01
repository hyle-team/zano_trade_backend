type DepositState = null | 'default' | 'deposit' | 'confirmed' | 'canceled';

interface ChatRow {
	id: string;
	offer_number: string;
	buyer_id: string;
	chat_history: string;
	status: string;
	pay: number;
	receive: number;
	owner_deposit: DepositState;
	opponent_deposit: DepositState;
	view_list: string[];
}

export default ChatRow;

export { type DepositState };
