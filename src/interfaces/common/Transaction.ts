import Order from '@/schemes/Order';
import Transaction from '@/schemes/Transaction';
import User from '@/schemes/User';

interface TransactionWithOrders extends Transaction {
	buy_order: Order & {
		user: User;
	};
	sell_order: Order & {
		user: User;
	};
}

export default TransactionWithOrders;
