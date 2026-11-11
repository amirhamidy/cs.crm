import axiosInstance from "@/lib/axiosInstance";

const URL = "/search/api/v1/global/";

type GlobalSearchParams = Record<string, string | number | boolean | undefined>;

export const globalSearchApi = {
  search: async <T = unknown>(params: GlobalSearchParams = {}, signal?: AbortSignal): Promise<T> => {
    const { data } = await axiosInstance.get<T>(URL, { params, signal });
    return data;
  },
};
