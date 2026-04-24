import { AuthorizationError } from "@/domain/common/errors";
import type { AuthenticatedActor } from "@/types/auth";

export function assertCanAccessWorkspace(actor: AuthenticatedActor, workspaceId: number) {
  if (actor.workspaceId !== workspaceId) {
    throw new AuthorizationError(
      "You do not have access to that workspace.",
      "workspace_access_denied",
    );
  }
}

export function assertCanAccessProject(
  actor: AuthenticatedActor,
  input: { workspaceId: number },
) {
  assertCanAccessWorkspace(actor, input.workspaceId);
}

export function assertCanAccessTask(
  actor: AuthenticatedActor,
  input: { workspaceId: number },
) {
  assertCanAccessWorkspace(actor, input.workspaceId);
}
