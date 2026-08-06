export type UserType = 1 | 2;

export interface ApiEmployee {
  id: number;
  full_name: string;
  username: string;
  created_at: string;
  updated_at?: string;
}

export interface ApiUser {
  id: number;
  username: string;
  type: UserType;
}

export interface CreateUserResponse {
  id?: number;
  username?: string;
  type?: UserType;
  user?: {
    id?: number;
    username?: string;
    type?: UserType;
  };
  data?: {
    id?: number;
    username?: string;
    type?: UserType;
    user?: {
      id?: number;
      username?: string;
      type?: UserType;
    };
  };
  detail?: string;
}
