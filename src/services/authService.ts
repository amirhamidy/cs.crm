import usersData from "@/data/users.json";

export interface User {
  id: number;
  username: string;
  role: "admin" | "employer" | "employee";
  name: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export async function loginService(
  payload: LoginPayload,
): Promise<LoginResponse> {
  // وقتی API آماده شد، این بلاک رو uncomment کن و بلاک mock رو حذف کن
  // const res = await fetch("/api/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error("invalid_credentials");
  // return res.json();

  // --- mock ---
  await new Promise((r) => setTimeout(r, 300));
  const found = usersData.users.find(
    (u) => u.username === payload.username && u.password === payload.password,
  );
  if (!found) throw new Error("invalid_credentials");
  const { password: _, ...user } = found;
  return { user: user as User, token: `mock-token-${user.id}` };
}
