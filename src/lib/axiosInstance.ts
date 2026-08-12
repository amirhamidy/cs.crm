import axios from "axios";

const BASE_URL = "https://api.radcosys.ir";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const access = localStorage.getItem("crm-access");
  if (access) config.headers.Authorization = `Bearer ${access}`;

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("crm-refresh");
      if (!refresh) return Promise.reject(error);
      try {
        const { data } = await axios.post(
          `${BASE_URL}/accounts/api/v1/auth/refresh/`,
          { refresh },
        );
        localStorage.setItem("crm-access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return axiosInstance(original);
      } catch {
        localStorage.removeItem("crm-access");
        localStorage.removeItem("crm-refresh");
        localStorage.removeItem("crm-type");
        document.cookie = "crm-access=; Max-Age=0; path=/";
        document.cookie = "crm-type=; Max-Age=0; path=/";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
