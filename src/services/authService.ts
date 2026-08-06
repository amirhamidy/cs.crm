import axiosInstance from "@/lib/axiosInstance";

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

export interface RefreshResponse {
  access: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<LoginResponse>("/accounts/api/v1/auth/login/", payload),

  refresh: (refresh: string) =>
    axiosInstance.post<RefreshResponse>("/accounts/api/v1/auth/refresh/", {
      refresh,
    }),
};
