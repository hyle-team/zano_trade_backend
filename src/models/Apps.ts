import App from '../schemes/App.js';

class Apps {
	create = async ({
		name,
	}: {
		name: string;
	}): Promise<{
		success: true;
		data: {
			id: number;
			name: string;
		};
	}> => {
		const appRow = await App.create({ name });

		return {
			success: true,
			data: {
				id: appRow.id,
				name: appRow.name,
			},
		};
	};
}

const appsModel = new Apps();

export default appsModel;
