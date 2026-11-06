import axiosInstance from "@/lib/axiosInstance";
import type {
  PermissionMap,
  SectionsResponse,
  UserPermissionsResponse,
} from "@/types/access";
import { cached } from "./_core";

const BASE = "/access/api/v1";

export const accessApi = {
  
  sections: () =>
    cached(
      "access:sections",
      async () => (await axiosInstance.get<SectionsResponse>(`${BASE}/sections/`)).data,
      5 * 60_000,
    ),

  
  me: (userId: number) =>
    cached(
      `access:me:${userId}`,
      async () => (await axiosInstance.get<UserPermissionsResponse>(`${BASE}/me/`)).data,
      60_000,
    ),

  
  userPermissions: async (userId: number) =>
    (
      await axiosInstance.get<UserPermissionsResponse>(
        `${BASE}/users/${userId}/permissions/`,
      )
    ).data,

  
  saveUserPermissions: async (userId: number, permissions: PermissionMap) =>
    (
      await axiosInstance.put<UserPermissionsResponse>(
        `${BASE}/users/${userId}/permissions/`,
        { permissions },
      )
    ).data,
};
