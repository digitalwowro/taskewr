export const WORKSPACE_ROLES = ["owner", "admin", "member", "viewer"] as const;
export const MANAGEABLE_WORKSPACE_ROLES = ["owner", "admin", "member"] as const;
export const APP_ROLES = ["admin", "user"] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
export type ManageableWorkspaceRole = (typeof MANAGEABLE_WORKSPACE_ROLES)[number];
export type AppRole = (typeof APP_ROLES)[number];
