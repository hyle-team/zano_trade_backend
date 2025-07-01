interface MessagesRow {
	id: string;
	type: string;
	url: string | null;
	text: string | null;
	timestamp: string;
	from_owner: boolean;
	success: boolean;
	fail: boolean;
	system: boolean;
}

export default MessagesRow;
