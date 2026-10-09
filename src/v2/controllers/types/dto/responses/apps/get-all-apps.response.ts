import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';

export type GetAllAppsDTOAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAllAppsDTO = ServerResponse<GetAllAppsDTOAppData[], GetServerError>;
