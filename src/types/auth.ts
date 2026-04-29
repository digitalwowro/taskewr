export type SessionPayload = {
  userId: number;
  workspaceId: number;
  workspaceRole: string;
  timezone: string | null;
  issuedAt: number;
};

export type AuthenticatedWorkspaceMembership = {
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  role: string;
};

export type AuthenticatedActor = {
  userId: number;
  workspaceId: number;
  workspaceRole: string;
  workspaceMemberships: AuthenticatedWorkspaceMembership[];
  accessibleWorkspaceIds: number[];
  timezone: string | null;
};
