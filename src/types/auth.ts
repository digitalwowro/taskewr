export type SessionPayload = {
  userId: number;
  workspaceId: number;
  workspaceRole: string;
  timezone: string | null;
  issuedAt: number;
};

export type AuthenticatedActor = {
  userId: number;
  workspaceId: number;
  workspaceRole: string;
  timezone: string | null;
};
