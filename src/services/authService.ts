import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import { getApiUrl } from "@/lib/config";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    type: 1 | 2;
  };
}

export const authService = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<LoginResponse>("/accounts/api/v1/auth/login/", payload),

  logout: async (refresh: string | null) => {
    if (!refresh) return;

    try {
      await axios.post(
        `${getApiUrl()}/accounts/api/v1/auth/logout/`,
        { refresh },
        { timeout: 8_000 },
      );
    } catch {
    }
  },
};
