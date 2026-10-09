export type AppTokenState = {
	id: number;
	appId: number;
	value: string;
	issuedAt: Date;
};

export class AppToken {
	private state: AppTokenState;

	constructor(params: { id: number; appId: number; value: string; issuedAt: Date }) {
		this.state = {
			...params,
		};
	}

	get id(): number {
		return this.state.id;
	}

	get appId(): number {
		return this.state.appId;
	}

	get value(): string {
		return this.state.value;
	}

	get issuedAt(): Date {
		return this.state.issuedAt;
	}
}
