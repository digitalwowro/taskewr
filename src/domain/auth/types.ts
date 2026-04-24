export const WORKSPACE_ROLES = ["owner", "admin", "member", "viewer"] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
