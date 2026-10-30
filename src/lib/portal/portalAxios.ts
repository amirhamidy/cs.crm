"use client";
import axios from "axios";
import { getApiUrl } from "@/lib/config";
import { clearPortalSession, getPortalAccess } from "./portalAuth";

const portalAxios = axios.create({ baseURL: getApiUrl(), timeout: 15_000 });
portalAxios.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  config.headers["Content-Type"] = "application/json";
  const token = getPortalAccess();
  if (token && !String(config.url || "").includes("/portal/login/")) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
portalAxios.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !String(error.config?.url || "").includes("/portal/login/")) {
    clearPortalSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/portal/login")) window.location.replace("/portal/login/");
  }
  return Promise.reject(error);
});
export default portalAxios;
