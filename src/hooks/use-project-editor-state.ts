"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppProject } from "@/app/app-data";
import { isUnauthorizedError, requestJson } from "@/lib/api-client";

export const NEW_PROJECT_ID = "NEW_PROJECT";

export function useProjectEditorState({
  activeProjects,
  archivedProjects,
  redirectToLogin,
  refreshApp,
}: {
  activeProjects: AppProject[];
  archivedProjects: AppProject[];
  redirectToLogin: () => void;
  refreshApp: () => void;
}) {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectMutationPending, setProjectMutationPending] = useState(false);
  const [projectMutationError, setProjectMutationError] = useState<string | null>(null);
  const [projectReorderPendingId, setProjectReorderPendingId] = useState<string | null>(null);

  const allProjects = useMemo(
    () => [...activeProjects, ...archivedProjects],
    [activeProjects, archivedProjects],
  );
  const editingProject = useMemo<AppProject | null>(
    () =>
      editingProjectId === NEW_PROJECT_ID
        ? {
            id: NEW_PROJECT_ID,
            name: "",
            description: "",
            taskCount: 0,
            updatedLabel: "Will appear in active projects",
          }
        : allProjects.find((project) => project.id === editingProjectId) ?? null,
    [allProjects, editingProjectId],
  );

  const openNewProject = () => {
    setProjectMutationError(null);
    setEditingProjectId(NEW_PROJECT_ID);
  };

  const handleProjectSave = async (input: { name: string; description: string }) => {
    if (!editingProject) {
      return;
    }

    setProjectMutationPending(true);
    setProjectMutationError(null);

    try {
      if (editingProject.id === NEW_PROJECT_ID) {
        await requestJson(`/api/v1/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      } else {
        await requestJson(`/api/v1/projects/${editingProject.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      }

      refreshApp();
      setEditingProjectId(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectMutationError(error instanceof Error ? error.message : "Could not save project.");
    } finally {
      setProjectMutationPending(false);
    }
  };

  const handleProjectArchiveToggle = async () => {
    if (!editingProject || editingProject.id === NEW_PROJECT_ID) {
      return;
    }

    setProjectMutationPending(true);
    setProjectMutationError(null);

    try {
      await requestJson(
        `/api/v1/projects/${editingProject.id}/${editingProject.isArchived ? "unarchive" : "archive"}`,
        {
          method: "POST",
        },
      );

      refreshApp();
      setEditingProjectId(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectMutationError(
        error instanceof Error ? error.message : "Could not update project state.",
      );
    } finally {
      setProjectMutationPending(false);
    }
  };

  const handleProjectQuickUnarchive = async (projectId: string) => {
    setProjectMutationPending(true);
    setProjectMutationError(null);

    try {
      await requestJson(`/api/v1/projects/${projectId}/unarchive`, {
        method: "POST",
      });
      refreshApp();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProjectMutationError(
        error instanceof Error ? error.message : "Could not unarchive project.",
      );
    } finally {
      setProjectMutationPending(false);
    }
  };

  const handleProjectMove = async (projectId: string, direction: "up" | "down") => {
    setProjectReorderPendingId(projectId);

    try {
      await requestJson(`/api/v1/projects/${projectId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direction }),
      });

      refreshApp();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
      }
    } finally {
      setProjectReorderPendingId(null);
    }
  };

  useEffect(() => {
    setProjectMutationError(null);
  }, [editingProjectId]);

  return {
    allProjects,
    editingProject,
    openNewProject,
    setEditingProjectId,
    projectMutationPending,
    projectMutationError,
    projectReorderPendingId,
    handleProjectSave,
    handleProjectArchiveToggle,
    handleProjectQuickUnarchive,
    handleProjectMove,
  };
}
