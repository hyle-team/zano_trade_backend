import axios, { type AxiosInstance } from 'axios';

import { env } from '@/config/env.js';
import GetAssetsRes, {
	GetAssetsErrorCode,
	GetAssetsParams,
	GetAssetsResAssetData,
} from '@/interfaces/helpers/zano-explorer/GetAssets.js';
import GetHistoricalZanoPriceRes, {
	GetHistoricalZanoPriceErrorCode,
	GetHistoricalZanoPriceParams,
} from '@/interfaces/helpers/zano-explorer/GetHistoricalZanoPrice.js';

class ZanoExplorerHelper {
	private static readonly INTEGRATION_KEY_HEADER = 'X-Integration-Key';

	private static readonly REQUEST_TIMEOUT_MS = 5000;

	private static readonly API_BASE_PATH = '/api';

	private readonly client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: new URL(
				ZanoExplorerHelper.API_BASE_PATH,
				env.ZANO_EXPLORER_API_URL,
			).toString(),
			timeout: ZanoExplorerHelper.REQUEST_TIMEOUT_MS,
			validateStatus: () => true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				[ZanoExplorerHelper.INTEGRATION_KEY_HEADER]: env.ZANO_EXPLORER_INTEGRATION_KEY,
			},
		});

		this.client.interceptors.response.use(undefined, async (error: unknown) => {
			if (axios.isAxiosError(error)) {
				const method = error.config?.method ?? 'UNKNOWN_METHOD';
				const url = error.config?.url ?? 'UNKNOWN_URL';
				const code = error.code ?? 'UNKNOWN_CODE';
				const status = error.response?.status ?? 'NO_RESPONSE';

				throw new Error(
					`Zano Explorer API request failed: ${error.message}; ${method} ${url}; code: ${code}; status: ${status}`,
				);
			}

			throw error;
		});
	}

	getAssets = async ({ from, to }: GetAssetsParams): Promise<GetAssetsRes> => {
		const GET_ASSETS_PATH = '/get_assets';

		let rawPayload: unknown;

		try {
			const response = await this.client.get<unknown>(
				`${GET_ASSETS_PATH}/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
			);
			rawPayload = response.data;
		} catch (error) {
			return { success: false, data: GetAssetsErrorCode.EXPLORER_API_UNAVAILABLE };
		}

		if (!Array.isArray(rawPayload)) {
			return { success: false, data: GetAssetsErrorCode.EXPLORER_API_UNAVAILABLE };
		}

		return {
			success: true,
			assets: rawPayload as GetAssetsResAssetData[],
		};
	};

	getHistoricalZanoPrice = async ({
		timestamp,
	}: GetHistoricalZanoPriceParams): Promise<GetHistoricalZanoPriceRes> => {
		const GET_HISTORICAL_ZANO_PRICE_PATH = '/get_historical_zano_price';

		let rawPayload: unknown;

		try {
			const response = await this.client.get<unknown>(GET_HISTORICAL_ZANO_PRICE_PATH, {
				params: { timestamp },
			});
			rawPayload = response.data;
		} catch (error) {
			return {
				success: false,
				data: GetHistoricalZanoPriceErrorCode.EXPLORER_API_UNAVAILABLE,
			};
		}

		const price = (rawPayload as { data?: { price?: unknown } } | null)?.data?.price;

		if (typeof price !== 'string') {
			return {
				success: false,
				data: GetHistoricalZanoPriceErrorCode.EXPLORER_API_UNAVAILABLE,
			};
		}

		return {
			success: true,
			price: price as string,
		};
	};
}

const zanoExplorerHelper = new ZanoExplorerHelper();

export default zanoExplorerHelper;
