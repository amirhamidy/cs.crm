import type { RankedCustomer, RankingParams } from "@/types/ranking";
import { cleanParams, fetchPage, type Paginated } from "./_core";

const RANKING_URL = "/customers/api/v1/customers/ranking/";

export const rankingApi = {
  list: (params: RankingParams = {}, signal?: AbortSignal): Promise<Paginated<RankedCustomer>> =>
    fetchPage<RankedCustomer>(RANKING_URL, cleanParams({ ...params }), signal),
};
