import CurrencyType from '../common/CurrecnyType';

interface CurrencyRow {
	id: string;
	name: string;
	code: string;
	type: CurrencyType;
	asset_id: string | null;
}

export default CurrencyRow;
