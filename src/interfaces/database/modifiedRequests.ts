import Currency from '@/schemes/Currency';
import Order from '@/schemes/Order';
import Pair from '@/schemes/Pair';
import Transaction from '@/schemes/Transaction';
import User from '@/schemes/User';

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

export interface OrderWithUser extends Order {
	user: User;
}

export interface OrderWithPair extends Order {
	pair: Pair;
}
export interface PairWithCurrencies extends Pair {
	first_currency: Currency;
	second_currency: Currency;
}

export interface OrderWithPairAndCurrencies extends Order {
	pair: PairWithCurrencies;
}

export interface PairWithIdAndCurrencies extends PairWithCurrencies {
	id: number;
}
