"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiRequestError, isUnauthorizedError, requestJson } from "@/lib/api-client";

export const NEW_USER_ID = "NEW_USER";
const INCLUDE_INACTIVE_STORAGE_KEY = "taskewr.users.includeInactive";

export type UserAdminItem = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string | null;
  appRole: string;
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserProjectAccess = {
  user: {
    id: number;
    name: string;
    email: string;
  };
  availableWorkspaces: {
    id: number;
    name: string;
    slug: string;
  }[];
  workspaces: {
    id: number;
    name: string;
    slug: string;
    role: string;
    availableProjects: {
      id: number;
      name: string;
      isArchived: boolean;
    }[];
    projects: {
      id: number;
      name: string;
      role: string;
      isArchived: boolean;
    }[];
  }[];
};

type UserEditorInput = {
  name: string;
  email: string;
  timezone: string;
  appRole: string;
  isActive: boolean;
  password?: string;
};

function toMutationError(error: unknown, fallback: string) {
  return error instanceof ApiRequestError || error instanceof Error ? error.message : fallback;
}

function getStoredIncludeInactive() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(INCLUDE_INACTIVE_STORAGE_KEY) === "true";
}

export function useUserAdminState({
  enabled,
  redirectToLogin,
}: {
  enabled: boolean;
  redirectToLogin: () => void;
}) {
  const [users, setUsers] = useState<UserAdminItem[]>([]);
  const [query, setQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeInactivePreferenceLoaded, setIncludeInactivePreferenceLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [deactivatingUserId, setDeactivatingUserId] = useState<number | null>(null);
  const [projectAccessUserId, setProjectAccessUserId] = useState<number | null>(null);
  const [projectAccessDetails, setProjectAccessDetails] = useState<UserProjectAccess | null>(null);
  const [projectAccessLoading, setProjectAccessLoading] = useState(false);
  const [projectAccessError, setProjectAccessError] = useState<string | null>(null);
  const [projectAccessMutationPending, setProjectAccessMutationPending] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationNotice, setMutationNotice] = useState<string | null>(null);

  const editingUser = useMemo<UserAdminItem | null>(() => {
    if (editingUserId === NEW_USER_ID) {
      return {
        id: 0,
        name: "",
        email: "",
        avatarUrl: null,
        timezone: "Europe/Bucharest",
        appRole: "user",
        isActive: true,
        deactivatedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return users.find((user) => String(user.id) === editingUserId) ?? null;
  }, [editingUserId, users]);

  const passwordUser = useMemo(
    () => users.find((user) => user.id === passwordUserId) ?? null,
    [passwordUserId, users],
  );
  const deactivatingUser = useMemo(
    () => users.find((user) => user.id === deactivatingUserId) ?? null,
    [deactivatingUserId, users],
  );
  const projectAccessUser = useMemo(
    () => users.find((user) => user.id === projectAccessUserId) ?? null,
    [projectAccessUserId, users],
  );

  const loadUsers = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("query", query.trim());
    }

    if (includeInactive) {
      params.set("includeInactive", "true");
    }

    try {
      const nextUsers = await requestJson<UserAdminItem[]>(
        `/api/v1/users${params.size ? `?${params.toString()}` : ""}`,
      );
      setUsers(nextUsers);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setLoadError(toMutationError(error, "Could not load users."));
    } finally {
      setLoading(false);
    }
  }, [enabled, includeInactive, query, redirectToLogin]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setIncludeInactive(getStoredIncludeInactive());
    setIncludeInactivePreferenceLoaded(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !includeInactivePreferenceLoaded) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadUsers();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [enabled, includeInactivePreferenceLoaded, loadUsers]);

  useEffect(() => {
    if (!includeInactivePreferenceLoaded) {
      return;
    }

    window.localStorage.setItem(INCLUDE_INACTIVE_STORAGE_KEY, String(includeInactive));
  }, [includeInactive, includeInactivePreferenceLoaded]);

  const openNewUser = () => {
    setMutationError(null);
    setMutationNotice(null);
    setEditingUserId(NEW_USER_ID);
  };

  const openEditUser = (userId: number) => {
    setMutationError(null);
    setMutationNotice(null);
    setEditingUserId(String(userId));
  };

  const closeUserEditor = () => {
    setMutationError(null);
    setEditingUserId(null);
  };

  const openPasswordReset = (userId: number) => {
    setMutationError(null);
    setMutationNotice(null);
    setPasswordUserId(userId);
  };

  const closePasswordReset = () => {
    setMutationError(null);
    setPasswordUserId(null);
  };

  const openDeactivateUser = (userId: number) => {
    setMutationError(null);
    setMutationNotice(null);
    setDeactivatingUserId(userId);
  };

  const closeDeactivateUser = () => {
    setMutationError(null);
    setDeactivatingUserId(null);
  };

  const openProjectAccess = async (userId: number) => {
    setMutationError(null);
    setMutationNotice(null);
    setProjectAccessUserId(userId);
    setProjectAccessDetails(null);
    setProjectAccessError(null);
    setProjectAccessLoading(true);

    try {
      const details = await requestJson<UserProjectAccess>(
        `/api/v1/users/${userId}/project-access`,
      );
      setProjectAccessDetails(details);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectAccessError(toMutationError(error, "Could not load project access."));
    } finally {
      setProjectAccessLoading(false);
    }
  };

  const closeProjectAccess = () => {
    setProjectAccessUserId(null);
    setProjectAccessDetails(null);
    setProjectAccessError(null);
    setProjectAccessLoading(false);
    setProjectAccessMutationPending(false);
  };

  const removeProjectAccess = async (projectId: number) => {
    if (!projectAccessUserId) {
      return;
    }

    setProjectAccessMutationPending(true);
    setProjectAccessError(null);

    try {
      const details = await requestJson<UserProjectAccess>(
        `/api/v1/users/${projectAccessUserId}/project-access/${projectId}`,
        {
          method: "DELETE",
        },
      );
      setProjectAccessDetails(details);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectAccessError(toMutationError(error, "Could not remove project access."));
    } finally {
      setProjectAccessMutationPending(false);
    }
  };

  const removeWorkspaceAccess = async (workspaceId: number) => {
    if (!projectAccessUserId) {
      return;
    }

    setProjectAccessMutationPending(true);
    setProjectAccessError(null);

    try {
      const details = await requestJson<UserProjectAccess>(
        `/api/v1/users/${projectAccessUserId}/workspace-access/${workspaceId}`,
        {
          method: "DELETE",
        },
      );
      setProjectAccessDetails(details);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectAccessError(toMutationError(error, "Could not remove workspace access."));
    } finally {
      setProjectAccessMutationPending(false);
    }
  };

  const addWorkspaceAccess = async (workspaceId: number, role: string) => {
    if (!projectAccessUserId) {
      return;
    }

    setProjectAccessMutationPending(true);
    setProjectAccessError(null);

    try {
      const details = await requestJson<UserProjectAccess>(
        `/api/v1/users/${projectAccessUserId}/workspace-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workspaceId, role }),
        },
      );
      setProjectAccessDetails(details);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectAccessError(toMutationError(error, "Could not add workspace access."));
    } finally {
      setProjectAccessMutationPending(false);
    }
  };

  const addProjectAccess = async (projectId: number, role: string) => {
    if (!projectAccessUserId) {
      return;
    }

    setProjectAccessMutationPending(true);
    setProjectAccessError(null);

    try {
      const details = await requestJson<UserProjectAccess>(
        `/api/v1/users/${projectAccessUserId}/project-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId, role }),
        },
      );
      setProjectAccessDetails(details);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectAccessError(toMutationError(error, "Could not add project access."));
    } finally {
      setProjectAccessMutationPending(false);
    }
  };

  const saveUser = async (input: UserEditorInput) => {
    if (!editingUser) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      if (editingUserId === NEW_USER_ID) {
        await requestJson<UserAdminItem>("/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: input.name,
            email: input.email,
            timezone: input.timezone,
            appRole: input.appRole,
            password: input.password ?? "",
          }),
        });
      } else {
        await requestJson<UserAdminItem>(`/api/v1/users/${editingUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: input.name,
            email: input.email,
            timezone: input.timezone,
            appRole: input.appRole,
            isActive: input.isActive,
          }),
        });

        if (input.password) {
          await requestJson<UserAdminItem>(`/api/v1/users/${editingUser.id}/password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: input.password }),
          });
        }
      }

      setEditingUserId(null);
      await loadUsers();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not save user."));
    } finally {
      setMutationPending(false);
    }
  };

  const resetPassword = async (password: string) => {
    if (!passwordUser) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await requestJson<UserAdminItem>(`/api/v1/users/${passwordUser.id}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      setPasswordUserId(null);
      await loadUsers();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not reset password."));
    } finally {
      setMutationPending(false);
    }
  };

  const sendPasswordResetEmail = async (userId: number) => {
    setMutationPending(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      const result = await requestJson<{ ok: boolean; message: string }>(
        `/api/v1/users/${userId}/password-reset-email`,
        {
          method: "POST",
        },
      );

      setMutationNotice(result.message || "Password reset email sent.");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not send password reset email."));
    } finally {
      setMutationPending(false);
    }
  };

  const deactivateUser = async () => {
    if (!deactivatingUser) {
      return;
    }

    setMutationPending(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await requestJson<UserAdminItem>(`/api/v1/users/${deactivatingUser.id}`, {
        method: "DELETE",
      });

      setDeactivatingUserId(null);
      await loadUsers();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not deactivate user."));
    } finally {
      setMutationPending(false);
    }
  };

  const reactivateUser = async (userId: number) => {
    setMutationPending(true);
    setMutationError(null);
    setMutationNotice(null);

    try {
      await requestJson<UserAdminItem>(`/api/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: true }),
      });

      await loadUsers();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setMutationError(toMutationError(error, "Could not reactivate user."));
    } finally {
      setMutationPending(false);
    }
  };

  return {
    users,
    activeUserCount: users.filter((user) => user.isActive).length,
    query,
    includeInactive,
    loading,
    loadError,
    editingUser,
    passwordUser,
    deactivatingUser,
    projectAccessUser,
    projectAccessDetails,
    projectAccessLoading,
    projectAccessError,
    projectAccessMutationPending,
    mutationPending,
    mutationError,
    mutationNotice,
    setQuery,
    setIncludeInactive,
    openNewUser,
    openEditUser,
    closeUserEditor,
    openPasswordReset,
    closePasswordReset,
    openDeactivateUser,
    closeDeactivateUser,
    openProjectAccess,
    closeProjectAccess,
    addWorkspaceAccess,
    addProjectAccess,
    removeProjectAccess,
    removeWorkspaceAccess,
    saveUser,
    resetPassword,
    sendPasswordResetEmail,
    deactivateUser,
    reactivateUser,
  };
}
