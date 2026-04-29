import { AuthorizationError } from "@/domain/common/errors";
import type { AuthenticatedActor } from "@/types/auth";

type WorkspaceAccessActor = Pick<AuthenticatedActor, "accessibleWorkspaceIds">;
type ProjectAccessActor = {
  accessibleProjectIds: number[];
};

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
