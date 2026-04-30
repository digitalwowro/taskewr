"use client";

import { useCallback, useMemo, useState } from "react";

import { ApiRequestError, isUnauthorizedError, requestJson } from "@/lib/api-client";

export type ProjectMemberItem = {
  userId: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
};

export type ProjectMemberCandidate = {
  id: number;
  name: string;
  email: string;
};

export type ProjectMembersDetails = {
  projectId: number;
  projectName: string;
  workspaceId: number | null;
  workspaceName: string;
  actorUserId: number;
  actorRole: string;
  actorCanManage: boolean;
  actorCanManageOwners: boolean;
  members: ProjectMemberItem[];
  candidates: ProjectMemberCandidate[];
};

function toMutationError(error: unknown, fallback: string) {
  return error instanceof ApiRequestError || error instanceof Error ? error.message : fallback;
}

export function useProjectMembersState({
  redirectToLogin,
}: {
  redirectToLogin: () => void;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [details, setDetails] = useState<ProjectMembersDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const isOpen = projectId !== null;

  const loadProjectMembers = useCallback(
    async (nextProjectId: string) => {
      setLoading(true);
      setMutationError(null);

      try {
        const nextDetails = await requestJson<ProjectMembersDetails>(
          `/api/v1/projects/${nextProjectId}/members`,
        );
        setDetails(nextDetails);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          redirectToLogin();
          return;
        }

        setMutationError(toMutationError(error, "Could not load project users."));
      } finally {
        setLoading(false);
      }
    },
    [redirectToLogin],
  );

  const openProjectMembers = useCallback(
    (nextProjectId: string) => {
      setProjectId(nextProjectId);
      setDetails(null);
      void loadProjectMembers(nextProjectId);
    },
    [loadProjectMembers],
  );

  const closeProjectMembers = useCallback(() => {
    setProjectId(null);
    setDetails(null);
    setMutationError(null);
  }, []);

  const activeProjectId = useMemo(() => details?.projectId ?? Number(projectId), [details, projectId]);

  const addProjectMember = async (userId: number, role: string) => {
    if (!projectId) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      const nextDetails = await requestJson<ProjectMembersDetails>(
        `/api/v1/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, role }),
        },
      );
      setDetails(nextDetails);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not add project user."));
    } finally {
      setMutationPending(false);
    }
  };

  const updateProjectMemberRole = async (userId: number, role: string) => {
    if (!projectId) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      const nextDetails = await requestJson<ProjectMembersDetails>(
        `/api/v1/projects/${projectId}/members/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        },
      );
      setDetails(nextDetails);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not update project user."));
    } finally {
      setMutationPending(false);
    }
  };

  const removeProjectMember = async (userId: number) => {
    if (!projectId) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      const nextDetails = await requestJson<ProjectMembersDetails>(
        `/api/v1/projects/${projectId}/members/${userId}`,
        {
          method: "DELETE",
        },
      );
      setDetails(nextDetails);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not remove project user."));
    } finally {
      setMutationPending(false);
    }
  };

  return {
    isOpen,
    projectId: activeProjectId,
    details,
    loading,
    mutationPending,
    mutationError,
    openProjectMembers,
    closeProjectMembers,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
  };
}
