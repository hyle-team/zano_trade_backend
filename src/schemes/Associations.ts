import Transaction from './Transaction';
import Order from './Order';
import User from './User';
import Pair from './Pair';

export function setupAssociations() {
	Transaction.belongsTo(Order, {
		foreignKey: 'buy_order_id',
		as: 'buy_order',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		hooks: true,
		constraints: false,
	});

	Transaction.belongsTo(Order, {
		foreignKey: 'sell_order_id',
		as: 'sell_order',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		hooks: true,
		constraints: false,
	});

	Order.hasMany(Transaction, {
		foreignKey: 'buy_order_id',
		as: 'buy_orders',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		hooks: true,
		constraints: false,
	});

	Order.hasMany(Transaction, {
		foreignKey: 'sell_order_id',
		as: 'sell_orders',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		hooks: true,
		constraints: false,
	});

	Order.belongsTo(Pair, {
		foreignKey: 'pair_id',
		as: 'pair',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		hooks: true,
		constraints: false,
	});

	Order.belongsTo(User, {
		foreignKey: 'user_id',
		as: 'user',
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
		hooks: true,
		constraints: false,
	});
}