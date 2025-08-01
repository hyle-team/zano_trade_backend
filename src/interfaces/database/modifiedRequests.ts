import Currency from '@/schemes/Currency';
import Order from '@/schemes/Order';
import Pair from '@/schemes/Pair';
import Transaction from '@/schemes/Transaction';

export interface OrderWithBuyOrders extends Order {
	buy_orders: Transaction[];
}

export interface OrderWithAllTransactions extends Order {
	sell_orders: Transaction[];
	buy_orders: Transaction[];
}

export interface PairWithFirstCurrency extends Pair {
	first_currency: Currency;
}
