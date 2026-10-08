export type AppState = {
	id: number;
	name: string;
	userId: number;
};

export class App {
	private state: AppState;

	constructor(params: { id: number; name: string; userId: number }) {
		this.state = {
			...params,
		};
	}

	get id(): number {
		return this.state.id;
	}

	get name(): string {
		return this.state.name;
	}

	public get userId(): number {
		return this.state.userId;
	}
}
