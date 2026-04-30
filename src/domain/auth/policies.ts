import { AuthorizationError } from "@/domain/common/errors";
import type { AuthenticatedActor } from "@/types/auth";

type WorkspaceAccessActor = Pick<AuthenticatedActor, "accessibleWorkspaceIds">;
type UserManagementActor = Pick<AuthenticatedActor, "appRole">;
type WorkspaceManagementActor = Pick<AuthenticatedActor, "appRole" | "workspaceMemberships">;
type ProjectAccessActor = {
  accessibleProjectIds: number[];
};

function getWorkspaceRole(actor: WorkspaceManagementActor, workspaceId: number) {
  return actor.workspaceMemberships.find((membership) => membership.workspaceId === workspaceId)
    ?.role;
}

export function requireWorkspaceOwnership(workspaceId: number | null | undefined) {
  if (workspaceId === null || workspaceId === undefined) {
    throw new AuthorizationError(
      "You do not have access to that workspace.",
      "workspace_access_denied",
    );
  }

  return workspaceId;
}

export function assertCanAccessWorkspace(actor: WorkspaceAccessActor, workspaceId: number) {
  if (!actor.accessibleWorkspaceIds.includes(workspaceId)) {
    throw new AuthorizationError(
      "You do not have access to that workspace.",
      "workspace_access_denied",
    );
  }
}

export function assertCanManageUsers(actor: UserManagementActor) {
  if (actor.appRole !== "admin") {
    throw new AuthorizationError(
      "You do not have permission to manage users.",
      "user_management_denied",
    );
  }
}

export function canManageWorkspace(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  return (
    actor.appRole === "admin" ||
    actor.workspaceMemberships.some(
      (membership) =>
        membership.workspaceId === workspaceId &&
        (membership.role === "owner" || membership.role === "admin"),
    )
  );
}

export function assertCanManageWorkspace(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  if (!canManageWorkspace(actor, workspaceId)) {
    throw new AuthorizationError(
      "You do not have permission to manage that workspace.",
      "workspace_management_denied",
    );
  }
}

export function canManageWorkspaceOwners(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  return (
    actor.appRole === "admin" ||
    getWorkspaceRole(actor, workspaceId) === "owner"
  );
}

export function assertCanManageWorkspaceOwners(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  if (!canManageWorkspaceOwners(actor, workspaceId)) {
    throw new AuthorizationError(
      "You do not have permission to manage workspace owners.",
      "workspace_owner_management_denied",
    );
  }
}

export function canDeleteWorkspace(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  return canManageWorkspaceOwners(actor, workspaceId);
}

export function assertCanDeleteWorkspace(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  if (!canDeleteWorkspace(actor, workspaceId)) {
    throw new AuthorizationError(
      "You do not have permission to delete that workspace.",
      "workspace_delete_denied",
    );
  }
}

export function canViewWorkspaceAdmin(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  return actor.appRole === "admin" || getWorkspaceRole(actor, workspaceId) !== undefined;
}

export function assertCanViewWorkspaceAdmin(
  actor: WorkspaceManagementActor,
  workspaceId: number,
) {
  if (!canViewWorkspaceAdmin(actor, workspaceId)) {
    throw new AuthorizationError(
      "You do not have access to that workspace.",
      "workspace_access_denied",
    );
  }
}

export function canListWorkspaceAdmin(actor: WorkspaceManagementActor) {
  return actor.appRole === "admin" || actor.workspaceMemberships.length > 0;
}

export function assertCanListWorkspaceAdmin(actor: WorkspaceManagementActor) {
  if (!canListWorkspaceAdmin(actor)) {
    throw new AuthorizationError(
      "You do not have permission to manage workspaces.",
      "workspace_management_denied",
    );
  }
}

export function assertCanAccessProject(
  actor: ProjectAccessActor,
  input: { projectId: number },
) {
  if (!actor.accessibleProjectIds.includes(input.projectId)) {
    throw new AuthorizationError(
      "You do not have access to that project.",
      "project_access_denied",
    );
  }
}

export function assertCanAccessTask(
  actor: ProjectAccessActor,
  input: { projectId: number },
) {
  assertCanAccessProject(actor, input);
}
