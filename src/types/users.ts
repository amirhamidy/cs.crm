export type UserType = 1 | 2;

export interface ApiEmployee {
  id: number;
  full_name: string;
  type?: number;
  username: string;
  user?: number;
  user_id?: number;
  created_at: string;
  updated_at: string;
  department?: number;
  role?: string;
}


export interface ApiUser {
  id: number;
  username: string;
  phone_number: string;
  type: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserCardProps {
  employee?: ApiEmployee;
  index: number;
  onDelete: (id: number) => void;
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
