import crypto from 'node:crypto';
import CryptoJS from 'crypto-js';

import { settingsHelper } from '../helpers/settings.helper';

export type AppTokenState = {
	id: number;
	appId: number;
	valueEncryptedForStorage: string;
	issuedAt: Date;
};

export class AppToken {
	private state: AppTokenState;

	constructor(params: {
		id: number;
		appId: number;
		valueEncryptedForStorage: string;
		issuedAt: Date;
	}) {
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

	get valueEncryptedForStorage(): string {
		return this.state.valueEncryptedForStorage;
	}

	get issuedAt(): Date {
		return this.state.issuedAt;
	}

	getValueDecrypted = (): string => {
		const [headers, valueEncryptedBody] = this.state.valueEncryptedForStorage.split(':');
		const salt = CryptoJS.enc.Base64.parse(headers.replace('env_v1__', ''));

		const keyWords = CryptoJS.enc.Hex.parse(
			settingsHelper.globalValues.sensitiveDataEncryptionKey,
		).words.slice(0, 8);
		const key = CryptoJS.lib.WordArray.create(keyWords);

		const valueDecrypted = CryptoJS.AES.decrypt(valueEncryptedBody, key, { iv: salt }).toString(
			CryptoJS.enc.Utf8,
		);

		return valueDecrypted;
	};

	setValueDecrypted = ({ valueDecrypted }: { valueDecrypted: string }): void => {
		const valueEncrypted = AppToken.encryptValueForStorage({ valueDecrypted });
		this.state.valueEncryptedForStorage = valueEncrypted;
	};

	private static readonly VALUE_BYTES_LENGTH = 32;

	static generateValue = (): string => {
		const value = crypto.randomBytes(this.VALUE_BYTES_LENGTH).toString('base64');
		return value;
	};

	static encryptValueForStorage = ({ valueDecrypted }: { valueDecrypted: string }): string => {
		const keyWords = CryptoJS.enc.Hex.parse(
			settingsHelper.globalValues.sensitiveDataEncryptionKey,
		).words.slice(0, 8);
		const key = CryptoJS.lib.WordArray.create(keyWords);

		const salt = CryptoJS.lib.WordArray.random(16);

		const valueEncryptedBody = CryptoJS.AES.encrypt(valueDecrypted, key, {
			iv: salt,
		}).toString();

		const valueEncrypted = `env_v1__${salt.toString(CryptoJS.enc.Base64)}:${valueEncryptedBody}`;

		return valueEncrypted;
	};
}
