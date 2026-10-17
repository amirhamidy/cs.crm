import axios, { type InternalAxiosRequestConfig } from "axios";
import { getApiUrl } from "@/lib/config";
import {
  clearSession,
  getAccessToken,
  refreshAccessToken,
} from "@/lib/clientAuth";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AUTH_PATHS = ["/auth/login/", "/auth/refresh/", "/auth/logout/"];

const axiosInstance = axios.create({
  timeout: 15_000,
});

function isAuthRequest(url?: string) {
  return AUTH_PATHS.some((path) => url?.includes(path));
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.replace(/\/+$/, "") === "/login") return;

  window.location.replace("/login/");
}

axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();

  const access = getAccessToken();
  if (access) config.headers.Authorization = `Bearer ${access}`;

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    config.timeout = 0;
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthRequest(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    const sentWith = String(original.headers.Authorization ?? "");
    const current = getAccessToken();

    if (current && sentWith !== `Bearer ${current}`) {
      original.headers.Authorization = `Bearer ${current}`;
      return axiosInstance(original);
    }

    let token: string | null;

    try {
      token = await refreshAccessToken();
    } catch {
      return Promise.reject(error);
    }

    if (!token) {
      clearSession();
      redirectToLogin();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return axiosInstance(original);
  },
);

export default axiosInstance;
