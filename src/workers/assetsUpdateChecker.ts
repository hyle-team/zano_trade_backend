import { Op } from 'sequelize';
import Currency, { Asset } from '../schemes/Currency';
import Pair from '../schemes/Pair';
import sequelize from '../sequelize';

export const ZANO_ASSET_ID = 'd6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a';
const CHECKING_INTERVAL = 60 * 60 * 1000; // 1 hr
const amountPerIteration = 100;

async function fetchWhitelisted() {
	return fetch(`https://api.zano.org/assets_whitelist.json`)
		.then((res) => res.json())
		.then((res) => res.assets);
}

async function fetchAssets(from: number, to: number) {
	return fetch(`https://explorer.zano.org/api/get_assets/${from}/${to}`)
		.then((res) => res.json())
		.catch((err) => {
			console.log(err);
			return [];
		});
}

class AssetsUpdateChecker {
	public async run() {
		console.log(
			`Assets update checker is running. Checking interval: ${CHECKING_INTERVAL / 1000} sec.`,
		);

		async function check() {
			try {
				console.log(`[${new Date()}] Getting assets list...`);

				const assets: Asset[] = [];

				let iterator = 0;

				// eslint-disable-next-line no-constant-condition
				while (true) {
					const newAssets = await fetchAssets(iterator, iterator + amountPerIteration);
					if (!newAssets.length) break;
					assets.push(...newAssets);
					iterator += amountPerIteration;
				}

				console.log(`[${new Date()}] Got assets list`);

				const whitelistedAssetsIds: string[] = (await fetchWhitelisted()).map(
					(e: Asset) => e.asset_id,
				);

				console.log(`[${new Date()}] Got whitelisted assets list`);

				for (const asset of assets) {
					const existingCurrency = await Currency.findOne({
						where: { asset_id: asset.asset_id },
					});

					if (existingCurrency) {
						if (!existingCurrency.asset_info) {
							existingCurrency.asset_info = asset;
							await existingCurrency.save();
						}
					} else {
						await Currency.create({
							name: asset.ticker,
							code: asset.ticker.toLowerCase(),
							type: 'crypto',
							asset_id: asset.asset_id,
							auto_parsed: true,
							asset_info: asset,
						});

						const first_currency_id = await Currency.findOne({
							where: { asset_id: asset.asset_id },
						}).then((res) => res?.id);

						const zano_id = await Currency.findOne({
							where: { asset_id: ZANO_ASSET_ID },
						}).then((res) => res?.id);

						const pairAlreadyExists = !!(await Pair.findOne({
							where: { first_currency_id, second_currency_id: zano_id },
						}));

						if (!pairAlreadyExists) {
							await Pair.create({ first_currency_id, second_currency_id: zano_id });
						}
					}
				}

				await sequelize.transaction(async (transaction) => {
					await Currency.update(
						{ whitelisted: true },
						{
							where: {
								whitelisted: false,
								asset_id: whitelistedAssetsIds,
							},
							transaction,
						},
					);

					await Currency.update(
						{ whitelisted: false },
						{
							where: {
								whitelisted: true,
								asset_id: {
									[Op.not]: whitelistedAssetsIds,
								},
							},
							transaction,
						},
					);
				});
			} catch (error) {
				console.log(error);
			}
		}

		/* eslint-disable no-constant-condition */
		while (true) {
			await check();
			console.log(
				`[${new Date()}] Assets update check is done. Next check in ${CHECKING_INTERVAL / 1000} sec.`,
			);

			await new Promise((resolve) => setTimeout(resolve, CHECKING_INTERVAL));
		}
		/* eslint-enable no-constant-condition */
	}
}

const assetsUpdateChecker = new AssetsUpdateChecker();

export default assetsUpdateChecker;
