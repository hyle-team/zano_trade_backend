import { Request, Response } from 'express';
import offersModel from '../models/Offers.js';
import UpdateBody from '../interfaces/bodies/offers/UpdateBody.js';
import DeleteBody from '../interfaces/bodies/offers/DeleteBody.js';
import GetPageBody from '../interfaces/bodies/offers/GetPageBody.js';

class OffersController {
	async update(req: Request<unknown, unknown, UpdateBody>, res: Response) {
		try {
			const result = await offersModel.update(req.body);

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

	async getPage(req: Request<unknown, unknown, GetPageBody>, res: Response) {
		try {
			const result = await offersModel.getPage(req.body.data);

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
