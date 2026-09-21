import CryptoJS from 'crypto-js';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const generateKeyPair = promisify(crypto.generateKeyPair);

const MAX_CIPHER_DATA_BYTES_LENGTH = 64 * 1024;
const MAX_CIPHER_DATA_LENGTH_ERR_MSG = 'MAX_CIPHER_DATA_LENGTH_ERR';

class AsymmetricEncryptionHelper {
	generateKeysPair = async (): Promise<{
		publicKeyHex: string;
		privateKeyHex: string;
	}> => {
		const { publicKey, privateKey } = await generateKeyPair('rsa', {
			modulusLength: 2048,
			publicKeyEncoding: {
				type: 'spki',
				format: 'der',
			},
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'der',
			},
		});

		return {
			publicKeyHex: publicKey.toString('hex'),
			privateKeyHex: privateKey.toString('hex'),
		};
	};

	encrypt = async ({
		plainData,
		publicKeyHex,
	}: {
		plainData: string[];
		publicKeyHex: string;
	}): Promise<{
		cipherDataHex: string[];
		intermediateEncryptionPublicKeyHex: string;
	}> => {
		const plainDataBytesLength = plainData.reduce(
			(totalBytesLength, plaintext) =>
				totalBytesLength + Buffer.byteLength(plaintext, 'utf8'),
			0,
		);

		if (plainDataBytesLength > MAX_CIPHER_DATA_BYTES_LENGTH) {
			throw new Error(MAX_CIPHER_DATA_LENGTH_ERR_MSG);
		}

		const AESKey = CryptoJS.lib.WordArray.random(32);
		const AESInitializationVector = CryptoJS.lib.WordArray.random(32);

		const cipherDataHex = plainData.map((plaintext) =>
			CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plaintext), AESKey, {
				iv: AESInitializationVector,
			}).toString(CryptoJS.format.Hex),
		);

		const AESFullKey = AESKey.clone().concat(AESInitializationVector);

		const RSAPublicKeyObject = crypto.createPublicKey({
			key: Buffer.from(publicKeyHex, 'hex'),
			format: 'der',
			type: 'spki',
		});

		const encryptedAESFullKeyHex = crypto
			.publicEncrypt(
				{
					key: RSAPublicKeyObject,
					padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
					oaepHash: 'sha256',
				},
				Buffer.from(AESFullKey.toString(CryptoJS.enc.Hex), 'hex'),
			)
			.toString('hex');

		return {
			cipherDataHex,
			intermediateEncryptionPublicKeyHex: encryptedAESFullKeyHex,
		};
	};

	decrypt = async ({
		cipherDataHex,
		intermediateEncryptionPublicKeyHex,
		privateKeyHex,
	}: {
		cipherDataHex: string[];
		intermediateEncryptionPublicKeyHex: string;
		privateKeyHex: string;
	}): Promise<{
		plainData: string[];
	}> => {
		const cipherDataBytesLength = cipherDataHex.reduce(
			(totalBytesLength, cipherTextHex) =>
				totalBytesLength + Math.ceil(cipherTextHex.length / 2),
			0,
		);

		if (cipherDataBytesLength > MAX_CIPHER_DATA_BYTES_LENGTH) {
			throw new Error(MAX_CIPHER_DATA_LENGTH_ERR_MSG);
		}

		const RSAPrivateKeyObject = crypto.createPrivateKey({
			key: Buffer.from(privateKeyHex, 'hex'),
			format: 'der',
			type: 'pkcs8',
		});

		const AESFullKeyBuffer = crypto.privateDecrypt(
			{
				key: RSAPrivateKeyObject,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
				oaepHash: 'sha256',
			},
			Buffer.from(intermediateEncryptionPublicKeyHex, 'hex'),
		);

		const AESFullKey = CryptoJS.enc.Hex.parse(AESFullKeyBuffer.toString('hex'));

		const AESKey = CryptoJS.lib.WordArray.create(AESFullKey.words.slice(0, 8), 32);

		const AESInitializationVector = CryptoJS.lib.WordArray.create(
			AESFullKey.words.slice(8, 16),
			32,
		);

		const plainData = cipherDataHex.map((cipherTextHex) => {
			const cipherParams = CryptoJS.lib.CipherParams.create({
				ciphertext: CryptoJS.enc.Hex.parse(cipherTextHex),
			});

			const plaintext = CryptoJS.AES.decrypt(cipherParams, AESKey, {
				iv: AESInitializationVector,
			}).toString(CryptoJS.enc.Utf8);

			return plaintext;
		});

		return {
			plainData,
		};
	};
}

export const asymmetricEncryptionHelper = new AsymmetricEncryptionHelper();
