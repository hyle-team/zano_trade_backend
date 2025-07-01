import { Request, Response } from 'express';
import offersModel from '../models/Offers.js';
import UpdateBody from '../interfaces/bodies/offers/UpdateBody.js';
import DeleteBody from '../interfaces/bodies/offers/DeleteBody.js';
import GetPageBody from '../interfaces/bodies/offers/GetPageBody.js';

class OffersController {
	async update(req: Request, res: Response) {
		try {
			const { offerData } = req.body as UpdateBody;
			const isFull = !!(
				offerData &&
				offerData?.price &&
				offerData?.min &&
				offerData?.max &&
				offerData?.deposit_seller &&
				offerData?.deposit_buyer &&
				offerData?.type &&
				offerData?.input_currency_id &&
				offerData?.target_currency_id &&
				offerData?.deposit_currency_id
			);

			const rangeCorrect =
				offerData?.min > 0 &&
				offerData?.min < 1000000000 &&
				offerData?.max > 0 &&
				offerData?.max < 1000000000 &&
				offerData?.deposit_buyer > 0 &&
				offerData?.deposit_buyer < 1000000000 &&
				offerData?.deposit_seller > 0 &&
				offerData?.deposit_seller < 1000000000 &&
				offerData?.price > 0 &&
				offerData?.price < 10000000000 &&
				offerData?.min < offerData?.max;

			if (!isFull || !rangeCorrect)
				return res.status(400).send({ success: false, data: 'Invalid offer data' });

			const result = await offersModel.update(req.body as UpdateBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (
				result.data === 'User not registered' ||
				result.data === 'Forbidden' ||
				result.data === 'Offer is finished' ||
				result.data === 'Invalid offer data'
			) {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async delete(req: Request, res: Response) {
		try {
			if (!req.body.offerData?.number)
				return res.status(400).send({ success: false, data: 'Invalid offer data' });

			const result = await offersModel.delete(req.body as DeleteBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data !== 'Internal error') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getPage(req: Request, res: Response) {
		try {
			const pageData = (req.body as GetPageBody).data;

			if (!(pageData && pageData?.page && pageData?.type))
				return res.status(400).send({ success: false, data: 'Invalid page data' });

			const result = await offersModel.getPage((req.body as GetPageBody).data);

			if (!result.success) return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getStats(_: Request, res: Response) {
		try {
			const result = await offersModel.getStats();

			if (!result.success) return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const offersController = new OffersController();

export default offersController;
