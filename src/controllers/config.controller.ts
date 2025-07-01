import { Request, Response } from 'express';
import configModel from '../models/Config.js';

class ConfigController {
	async get(req: Request, res: Response) {
		const result = await configModel.get();

		if (!result.success) {
			return res.status(500).send(result);
		}

		res.status(200).send(result);
	}
}

const configController = new ConfigController();

export default configController;
