export type AppState = {
	id: number;
};

export class App {
	state: AppState;

	constructor(params: { id: number }) {
		this.state = {
			...params,
		};
	}
}
