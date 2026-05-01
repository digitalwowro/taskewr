export type SessionPayload = {
  userId: number;
  workspaceId: number;
  workspaceRole: string;
  appRole: string;
  timezone: string | null;
  issuedAt: number;
  sessionVersion?: number;
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
  appRole: string;
  workspaceMemberships: AuthenticatedWorkspaceMembership[];
  accessibleWorkspaceIds: number[];
  timezone: string | null;
};
