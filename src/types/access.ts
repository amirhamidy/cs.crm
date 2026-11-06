export type PermissionAction = "view" | "create" | "edit" | "delete";

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
];

export type SectionPermissions = Partial<Record<PermissionAction, boolean>>;


export type PermissionMap = Record<string, SectionPermissions>;

export interface SectionInfo {
  key: string;
  label: string;
  actions: PermissionAction[];
  hint: string;
}

export interface SectionsResponse {
  action_labels: Record<PermissionAction, string>;
  sections: SectionInfo[];
}

export interface UserPermissionsResponse {
  user_id: number;
  is_manager: boolean;
  permissions: PermissionMap;
}
