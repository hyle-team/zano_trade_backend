interface Message {
	type?: 'img';
	url?: string;
	text?: string;
	timestamp: number;
	fromOwner?: boolean;
	success: boolean;
	fail: boolean;
	system?: boolean;
}

export default Message;
