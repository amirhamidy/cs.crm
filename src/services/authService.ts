import axios from "axios";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    type: 1 | 2;
  };
}

export const authService = {
  login: (payload: LoginPayload) =>
    axios.post<LoginResponse>("/api/auth/login", payload),

  logout: () => axios.post("/api/auth/logout"),
};
