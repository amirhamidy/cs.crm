import axiosInstance from "@/lib/axiosInstance";
import { getApiUrl } from "@/lib/config";

export const apiDocumentationApi = {
  schema: async <T = unknown>() =>
    (await axiosInstance.get<T>("/api/schema/")).data,
  swaggerUrl: () => `${getApiUrl()}/api/docs/`,
};
