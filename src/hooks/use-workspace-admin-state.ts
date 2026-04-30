"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiRequestError, isUnauthorizedError, requestJson } from "@/lib/api-client";

export const NEW_WORKSPACE_ID = "NEW_WORKSPACE";

export type WorkspaceAdminMemberItem = {
  userId: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
};

export type WorkspaceAdminItem = {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  ownerUserId: number | null;
  ownerName: string | null;
  actorCanManage: boolean;
  actorCanManageOwners: boolean;
  actorCanDelete: boolean;
  canDelete: boolean;
  memberCount: number;
  activeMemberCount: number;
  projectCount: number;
  cycleCount: number;
  labelCount: number;
  repeatRuleCount: number;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceAdminMemberItem[];
};

export type WorkspaceUserCandidate = {
  id: number;
  name: string;
  email: string;
};

export type WorkspaceMemberAccessDetails = {
  userId: number;
  name: string;
  email: string;
  timezone: string | null;
  appRole: string;
  isActive: boolean;
  overviewScope: "all" | "managed";
  currentWorkspace: {
    id: number;
    name: string;
    role: string;
    actorCanManageOwners: boolean;
  };
  workspaces: {
    id: number;
    name: string;
    slug: string;
    role: string;
    isCurrent: boolean;
    joinedAt: string;
  }[];
  projects: {
    id: number;
    name: string;
    workspaceId: number | null;
    workspaceName: string;
    role: string;
    joinedAt: string;
  }[];
};

type WorkspaceEditorInput = {
  name: string;
  description: string;
  ownerUserId?: number;
};

export type WorkspaceNewMemberInput = {
  name: string;
  email: string;
  password: string;
  timezone: string;
  role: string;
};

function toMutationError(error: unknown, fallback: string) {
  return error instanceof ApiRequestError || error instanceof Error ? error.message : fallback;
}

export function useWorkspaceAdminState({
  enabled,
  redirectToLogin,
}: {
  enabled: boolean;
  redirectToLogin: () => void;
}) {
  const [workspaces, setWorkspaces] = useState<WorkspaceAdminItem[]>([]);
  const [userCandidates, setUserCandidates] = useState<WorkspaceUserCandidate[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<number | null>(null);
  const [addingMemberWorkspaceId, setAddingMemberWorkspaceId] = useState<number | null>(null);
  const [removingMember, setRemovingMember] = useState<{
    workspaceId: number;
    userId: number;
  } | null>(null);
  const [editingMember, setEditingMember] = useState<{
    workspaceId: number;
    userId: number;
  } | null>(null);
  const [memberDetails, setMemberDetails] = useState<WorkspaceMemberAccessDetails | null>(null);
  const [memberDetailsLoading, setMemberDetailsLoading] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const editingWorkspace = useMemo<WorkspaceAdminItem | null>(() => {
    if (editingWorkspaceId === NEW_WORKSPACE_ID) {
      return {
        id: 0,
        name: "",
        description: "",
        slug: "",
        ownerUserId: null,
        ownerName: null,
        actorCanManage: true,
        actorCanManageOwners: true,
        actorCanDelete: true,
        canDelete: true,
        memberCount: 0,
        activeMemberCount: 0,
        projectCount: 0,
        cycleCount: 0,
        labelCount: 0,
        repeatRuleCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: [],
      };
    }

    return workspaces.find((workspace) => String(workspace.id) === editingWorkspaceId) ?? null;
  }, [editingWorkspaceId, workspaces]);

  const deletingWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === deletingWorkspaceId) ?? null,
    [deletingWorkspaceId, workspaces],
  );

  const addingMemberWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === addingMemberWorkspaceId) ?? null,
    [addingMemberWorkspaceId, workspaces],
  );
  const removingMemberDetails = useMemo(() => {
    if (!removingMember) {
      return null;
    }

    const workspace = workspaces.find((item) => item.id === removingMember.workspaceId);
    const member = workspace?.members.find((item) => item.userId === removingMember.userId);

    if (!workspace || !member) {
      return null;
    }

    return { workspace, member };
  }, [removingMember, workspaces]);

  const loadWorkspaces = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("query", query.trim());
    }

    try {
      const nextWorkspaces = await requestJson<WorkspaceAdminItem[]>(
        `/api/v1/workspaces${params.size ? `?${params.toString()}` : ""}`,
      );
      setWorkspaces(nextWorkspaces);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setLoadError(toMutationError(error, "Could not load workspaces."));
    } finally {
      setLoading(false);
    }
  }, [enabled, query, redirectToLogin]);

  const loadUserCandidates = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const candidates = await requestJson<WorkspaceUserCandidate[]>("/api/v1/workspaces/users");
      setUserCandidates(candidates);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
      }
    }
  }, [enabled, redirectToLogin]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadWorkspaces();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [enabled, loadWorkspaces]);

  useEffect(() => {
    void loadUserCandidates();
  }, [loadUserCandidates]);

  const openNewWorkspace = () => {
    setMutationError(null);
    setEditingWorkspaceId(NEW_WORKSPACE_ID);
  };

  const openEditWorkspace = (workspaceId: number) => {
    setMutationError(null);
    setEditingWorkspaceId(String(workspaceId));
  };

  const closeWorkspaceEditor = () => {
    setMutationError(null);
    setEditingWorkspaceId(null);
  };

  const openDeleteWorkspace = (workspaceId: number) => {
    setMutationError(null);
    setDeletingWorkspaceId(workspaceId);
  };

  const closeDeleteWorkspace = () => {
    setMutationError(null);
    setDeletingWorkspaceId(null);
  };

  const openAddMember = (workspaceId: number) => {
    setMutationError(null);
    setAddingMemberWorkspaceId(workspaceId);
  };

  const closeAddMember = () => {
    setMutationError(null);
    setAddingMemberWorkspaceId(null);
  };

  const openRemoveMember = (workspaceId: number, userId: number) => {
    setMutationError(null);
    setRemovingMember({ workspaceId, userId });
  };

  const closeRemoveMember = () => {
    setMutationError(null);
    setRemovingMember(null);
  };

  const loadMemberDetails = useCallback(
    async (workspaceId: number, userId: number) => {
      setMemberDetailsLoading(true);

      try {
        const details = await requestJson<WorkspaceMemberAccessDetails>(
          `/api/v1/workspaces/${workspaceId}/members/${userId}`,
        );
        setMemberDetails(details);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          redirectToLogin();
          return;
        }

        setMutationError(toMutationError(error, "Could not load workspace member."));
      } finally {
        setMemberDetailsLoading(false);
      }
    },
    [redirectToLogin],
  );

  const openEditMember = (workspaceId: number, userId: number) => {
    setMutationError(null);
    setMemberDetails(null);
    setEditingMember({ workspaceId, userId });
    void loadMemberDetails(workspaceId, userId);
  };

  const closeMemberEditor = () => {
    setMutationError(null);
    setEditingMember(null);
    setMemberDetails(null);
  };

  const saveWorkspace = async (input: WorkspaceEditorInput) => {
    if (!editingWorkspace) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      if (editingWorkspaceId === NEW_WORKSPACE_ID) {
        await requestJson<WorkspaceAdminItem>("/api/v1/workspaces", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      } else {
        await requestJson<WorkspaceAdminItem>(`/api/v1/workspaces/${editingWorkspace.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      }

      setEditingWorkspaceId(null);
      await Promise.all([loadWorkspaces(), loadUserCandidates()]);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not save workspace."));
    } finally {
      setMutationPending(false);
    }
  };

  const deleteWorkspace = async () => {
    if (!deletingWorkspace) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      await requestJson(`/api/v1/workspaces/${deletingWorkspace.id}`, {
        method: "DELETE",
      });

      setDeletingWorkspaceId(null);
      await loadWorkspaces();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not delete workspace."));
    } finally {
      setMutationPending(false);
    }
  };

  const addMember = async (workspaceId: number, userId: number, role: string) => {
    setMutationPending(true);
    setMutationError(null);

    try {
      await requestJson<WorkspaceAdminItem>(`/api/v1/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      await loadWorkspaces();
      setAddingMemberWorkspaceId(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not add workspace member."));
    } finally {
      setMutationPending(false);
    }
  };

  const createAndAddMember = async (workspaceId: number, input: WorkspaceNewMemberInput) => {
    setMutationPending(true);
    setMutationError(null);

    try {
      await requestJson<WorkspaceAdminItem>(`/api/v1/workspaces/${workspaceId}/members/new-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      await Promise.all([loadWorkspaces(), loadUserCandidates()]);
      setAddingMemberWorkspaceId(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not create workspace member."));
    } finally {
      setMutationPending(false);
    }
  };

  const updateMemberRole = async (workspaceId: number, userId: number, role: string) => {
    setMutationPending(true);
    setMutationError(null);

    try {
      await requestJson<WorkspaceAdminItem>(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      await loadWorkspaces();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not update workspace member."));
    } finally {
      setMutationPending(false);
    }
  };

  const saveEditingMemberRole = async (role: string) => {
    if (!editingMember) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      await requestJson<WorkspaceAdminItem>(
        `/api/v1/workspaces/${editingMember.workspaceId}/members/${editingMember.userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        },
      );

      await loadWorkspaces();
      await loadMemberDetails(editingMember.workspaceId, editingMember.userId);
      setEditingMember(null);
      setMemberDetails(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not update workspace member."));
    } finally {
      setMutationPending(false);
    }
  };

  const removeMember = async () => {
    if (!removingMemberDetails) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);

    try {
      await requestJson<WorkspaceAdminItem>(`/api/v1/workspaces/${removingMemberDetails.workspace.id}/members/${removingMemberDetails.member.userId}`, {
        method: "DELETE",
      });

      setRemovingMember(null);
      await loadWorkspaces();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not remove workspace member."));
    } finally {
      setMutationPending(false);
    }
  };

  return {
    workspaces,
    userCandidates,
    workspaceCount: workspaces.length,
    query,
    loading,
    loadError,
    editingWorkspace,
    deletingWorkspace,
    addingMemberWorkspace,
    removingMemberDetails,
    editingMember,
    memberDetails,
    memberDetailsLoading,
    mutationPending,
    mutationError,
    setQuery,
    openNewWorkspace,
    openEditWorkspace,
    closeWorkspaceEditor,
    openDeleteWorkspace,
    closeDeleteWorkspace,
    openAddMember,
    closeAddMember,
    openRemoveMember,
    closeRemoveMember,
    openEditMember,
    closeMemberEditor,
    saveWorkspace,
    deleteWorkspace,
    addMember,
    createAndAddMember,
    updateMemberRole,
    saveEditingMemberRole,
    removeMember,
  };
}
