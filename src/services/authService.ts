// services/authService.ts

import usersData from "@/data/users.json"; 

interface LoginPayload {
  username: string;
  password: string;
}

export async function loginService({ username, password }: LoginPayload) {
  const user = usersData.users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    throw new Error("نام کاربری یا رمز عبور اشتباه است");
  }

  const token = `mock-token-${user.id}-${Date.now()}`;

  return { user, token };
}
