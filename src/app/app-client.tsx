"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AppData } from "@/app/app-data";
import {
  buildPathQuery,
  buildAppProjectHref,
  buildTaskHref,
} from "@/app/app-routing";
import {
  AppHeader,
  AppSidebar,
} from "@/components/app/app-shell";
import {
  DashboardTaskToolbar,
  ProjectTaskToolbar,
} from "@/components/app/filter-toolbar";
import {
  DashboardContent,
  ProjectDetailContent,
  ProjectsContent,
} from "@/components/app/content-sections";
import { ProfileModal } from "@/components/app/profile-modal";
import { ProjectEditorModal } from "@/components/app/project-editor-modal";
import { TaskModalSwitcher } from "@/components/app/task-modal-switcher";
import { useClickOutside } from "@/hooks/use-click-outside";
import { usePersistedSidebarState } from "@/hooks/use-persisted-sidebar-state";
import { useTaskFilterToolbarState } from "@/hooks/use-task-filter-toolbar-state";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";
import type { ProjectView } from "@/domain/projects/constants";
import {
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TASK_PRIORITY_RANK,
  TASK_STATUS_RANK,
  type TaskPriority,
  type TaskSortDirection,
  type TaskSortOption,
  type TaskStatus,
} from "@/domain/tasks/constants";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";
import {
  NAV_ITEMS,
} from "@/app/app-fallback-data";

type AppSection = "dashboard" | "projects" | "project_detail" | "task_detail";
const NEW_PROJECT_ID = "NEW_PROJECT";
const NEW_TASK_ID = "NEW_TASK";
type CurrentUserProfile = {
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  workspaceId: number;
  workspaceRole: string;
  timezone: string | null;
};

function getTaskByNumericId(tasks: TaskListItem[], id: string) {
  return tasks.find((task) => task.id.replace("TSK-", "") === id) ?? null;
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.method && init.method !== "GET" && init.method !== "HEAD") {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    throw new ApiRequestError(payload?.error ?? "Request failed.", response.status, payload?.code);
  }

  return response.json() as Promise<T>;
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  return (
    document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

function getDateRank(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(value).getTime();
}

function compareTasks(
  a: TaskListItem,
  b: TaskListItem,
  sort: TaskSortOption,
  direction: TaskSortDirection,
) {
  const modifier = direction === "asc" ? 1 : -1;

  switch (sort) {
    case "status":
      return (TASK_STATUS_RANK[a.statusValue] - TASK_STATUS_RANK[b.statusValue]) * modifier;
    case "created_at":
      return (getDateRank(a.createdAt) - getDateRank(b.createdAt)) * modifier;
    case "updated_at":
      return (getDateRank(a.updatedAt) - getDateRank(b.updatedAt)) * modifier;
    case "start_date":
      return (getDateRank(a.startDate) - getDateRank(b.startDate)) * modifier;
    case "due_date":
      return (getDateRank(a.dueDate) - getDateRank(b.dueDate)) * modifier;
    case "priority":
    default:
      return (TASK_PRIORITY_RANK[a.priorityValue] - TASK_PRIORITY_RANK[b.priorityValue]) * modifier;
  }
}

function sortAndFilterTasks(
  tasks: TaskListItem[],
  sort: TaskSortOption,
  direction: TaskSortDirection,
  selectedStatuses: TaskStatus[],
  selectedPriorities: TaskPriority[],
  startDate: string | null,
  endDate: string | null,
) {
  return [...tasks]
    .filter((task) => {
      const statusMatch =
        selectedStatuses.length === 0 || selectedStatuses.includes(task.statusValue);
      const priorityMatch =
        selectedPriorities.length === 0 || selectedPriorities.includes(task.priorityValue);
      const taskDueDate = task.dueDate ? task.dueDate.slice(0, 10) : null;
      const startDateMatch =
        !startDate || (taskDueDate !== null && taskDueDate >= startDate);
      const endDateMatch =
        !endDate || (taskDueDate !== null && taskDueDate <= endDate);

      return statusMatch && priorityMatch && startDateMatch && endDateMatch;
    })
    .sort((a, b) => compareTasks(a, b, sort, direction));
}

export function TaskewrApp({
  initialSection,
  initialProjectId,
  initialTaskId,
  data,
  initialFilters,
  initialProjectView = "list",
}: {
  initialSection: AppSection;
  initialProjectId?: string;
  initialTaskId?: string;
  data: AppData;
  initialFilters?: TaskFilters;
  initialProjectView?: ProjectView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarExpanded, setSidebarExpanded] = usePersistedSidebarState(
    "taskewr.sidebarExpanded",
  );
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [profileMutationPending, setProfileMutationPending] = useState(false);
  const [profileMutationError, setProfileMutationError] = useState<string | null>(null);
  const [draggingProjectTaskId, setDraggingProjectTaskId] = useState<string | null>(null);
  const {
    projectSortMenuOpen,
    setProjectSortMenuOpen,
    projectStatusMenuOpen,
    setProjectStatusMenuOpen,
    projectPriorityMenuOpen,
    setProjectPriorityMenuOpen,
    projectDateMenuOpen,
    setProjectDateMenuOpen,
    projectSortMenuRef,
    projectStatusMenuRef,
    projectPriorityMenuRef,
    projectDateMenuRef,
    projectView,
    setProjectView,
    sort,
    setSort,
    direction,
    setDirection,
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    toggleStatus,
    togglePriority,
    closeMenus: closeProjectMenus,
    resetProjectFilters,
    projectSortLabel,
    activeStatusLabels,
    activePriorityLabels,
  } = useTaskFilterToolbarState(initialFilters, initialProjectView);
  const [taskMutationPending, setTaskMutationPending] = useState(false);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);
  const [projectMutationPending, setProjectMutationPending] = useState(false);
  const [projectMutationError, setProjectMutationError] = useState<string | null>(null);
  const [projectReorderPendingId, setProjectReorderPendingId] = useState<string | null>(null);
  const todayItems = data.todayItems;
  const overdueItems = data.overdueItems;
  const groupedProjects = data.groupedProjects;
  const activeProjects = data.activeProjects;
  const archivedProjects = data.archivedProjects;
  const projectTasksByProjectId = data.projectTasksByProjectId;
  const taskDetails = data.taskDetails;

  const filteredTodayItems = useMemo(
    () =>
      sortAndFilterTasks(
        todayItems,
        sort,
        direction,
        selectedStatuses,
        selectedPriorities,
        startDate,
        endDate,
      ),
    [direction, endDate, selectedPriorities, selectedStatuses, sort, startDate, todayItems],
  );
  const filteredOverdueItems = useMemo(
    () =>
      sortAndFilterTasks(
        overdueItems,
        sort,
        direction,
        selectedStatuses,
        selectedPriorities,
        startDate,
        endDate,
      ),
    [direction, endDate, overdueItems, selectedPriorities, selectedStatuses, sort, startDate],
  );
  const filteredProjects = useMemo(
    () =>
      groupedProjects
        .map((project) => ({
          ...project,
          items: sortAndFilterTasks(
            project.items,
            sort,
            direction,
            selectedStatuses,
            selectedPriorities,
            startDate,
            endDate,
          ),
        }))
        .filter((project) => project.items.length > 0),
    [direction, endDate, groupedProjects, selectedPriorities, selectedStatuses, sort, startDate],
  );

  const visibleTaskCount = useMemo(
    () =>
      filteredTodayItems.length +
      filteredOverdueItems.length +
      filteredProjects.reduce((sum, project) => sum + project.items.length, 0),
    [filteredOverdueItems.length, filteredProjects, filteredTodayItems.length],
  );
  const visibleProjectTaskCount = useMemo(
    () => activeProjects.reduce((sum, project) => sum + project.taskCount, 0),
    [activeProjects],
  );

  const openTask = (taskId: string) => {
    router.push(
      buildTaskHref(taskId, {
        sort,
        direction,
        selectedStatuses,
        selectedPriorities,
        startDate,
        endDate,
        projectView,
      }),
    );
  };

  const redirectToLogin = useCallback(() => {
    router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [router]);

  const isUnauthorizedError = (error: unknown) =>
    error instanceof ApiRequestError && error.status === 401;

  const allTasks = useMemo(() => {
    const dedupedTasks = new Map<string, TaskListItem>();

    for (const task of [
      ...todayItems,
      ...overdueItems,
      ...groupedProjects.flatMap((project) => project.items),
      ...Object.values(projectTasksByProjectId).flat(),
    ]) {
      dedupedTasks.set(task.id, task);
    }

    return [...dedupedTasks.values()];
  }, [groupedProjects, overdueItems, projectTasksByProjectId, todayItems]);
  const parentTaskOptionsByProject = useMemo(
    () =>
      allTasks.reduce<Record<string, { id: string; title: string }[]>>((accumulator, task) => {
        const key = task.projectId ?? "";

        if (!accumulator[key]) {
          accumulator[key] = [];
        }

        accumulator[key].push({
          id: task.id.replace("TSK-", ""),
          title: task.title,
        });

        return accumulator;
      }, {}),
    [allTasks],
  );
  const editingTask = useMemo(
    () => allTasks.find((task) => task.id === editingTaskId) ?? null,
    [allTasks, editingTaskId],
  );

  const currentTaskRouteState = useMemo(
    () => ({
      sort,
      direction,
      selectedStatuses,
      selectedPriorities,
      startDate,
      endDate,
      projectView,
    }),
    [direction, endDate, projectView, selectedPriorities, selectedStatuses, sort, startDate],
  );

  const closeTaskRoute = () => {
    if (selectedProject?.id) {
      router.push(
        buildAppProjectHref(selectedProject.id, currentTaskRouteState, {
          includeView: true,
        }),
      );
      return;
    }

    router.push("/projects");
  };

  const allProjects = useMemo(
    () => [...activeProjects, ...archivedProjects],
    [activeProjects, archivedProjects],
  );
  const projectOptions = useMemo(
    () => activeProjects.map((project) => ({ id: project.id, name: project.name })),
    [activeProjects],
  );
  const editingProject = useMemo(
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
  const selectedTask = useMemo(
    () => (initialTaskId ? getTaskByNumericId(allTasks, initialTaskId) : null),
    [allTasks, initialTaskId],
  );
  const selectedProject = useMemo(
    () =>
      allProjects.find((project) =>
        initialSection === "task_detail"
          ? project.name === selectedTask?.project
          : project.id === initialProjectId,
      ) ?? activeProjects[0],
    [activeProjects, allProjects, initialProjectId, initialSection, selectedTask?.project],
  );
  const defaultTaskProjectId =
    initialSection === "project_detail" || initialSection === "task_detail"
      ? selectedProject?.id ?? activeProjects[0]?.id ?? ""
      : activeProjects[0]?.id ?? "";
  const createTaskDraft = useMemo<TaskListItem | null>(() => {
    if (editingTaskId !== NEW_TASK_ID || !defaultTaskProjectId) {
      return null;
    }

    const draftProject =
      activeProjects.find((project) => project.id === defaultTaskProjectId) ?? activeProjects[0];

    if (!draftProject) {
      return null;
    }

    return {
      id: NEW_TASK_ID,
      projectId: draftProject.id,
      title: "",
      project: draftProject.name,
      status: "Todo",
      statusValue: "todo",
      due: "",
      dueDate: null,
      priority: "Medium",
      priorityValue: "medium",
      startDate: null,
      createdAt: "",
      updatedAt: "",
    };
  }, [activeProjects, defaultTaskProjectId, editingTaskId]);
  const taskEditorTask = editingTask ?? createTaskDraft;
  const selectedProjectTasks = useMemo(
    () => {
      if (!selectedProject) {
        return [];
      }

      return sortAndFilterTasks(
        projectTasksByProjectId[selectedProject.id] ?? [],
        sort,
        direction,
        selectedStatuses,
        selectedPriorities,
        startDate,
        endDate,
      );
    },
    [
      direction,
      endDate,
      projectTasksByProjectId,
      selectedPriorities,
      selectedProject,
      selectedStatuses,
      sort,
      startDate,
    ],
  );
  const projectBoardGroups = useMemo(
    () => ({
      todo: selectedProjectTasks.filter((task) => task.statusValue === "todo"),
      inProgress: selectedProjectTasks.filter((task) => task.statusValue === "in_progress"),
      completed: selectedProjectTasks.filter((task) => task.statusValue === "done"),
    }),
    [selectedProjectTasks],
  );
  const selectedProjectOverdueTasks = useMemo(
    () =>
      selectedProjectTasks.filter((task) => {
        if (!task.dueDate) {
          return false;
        }

        return new Date(task.dueDate).getTime() < new Date("2026-04-01T00:00:00").getTime();
      }),
    [selectedProjectTasks],
  );
  const moveProjectTaskToStatus = (taskId: string, nextStatus: TaskStatus) => {
    if (!selectedProject) {
      return;
    }

    const task = selectedProjectTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    const targetLaneTaskIds = [
      ...selectedProjectTasks
        .filter((item) => item.statusValue === nextStatus && item.id !== taskId)
        .map((item) => Number(item.id.replace("TSK-", ""))),
      Number(taskId.replace("TSK-", "")),
    ];

    void requestJson(`/api/v1/tasks/board-move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: Number(taskId.replace("TSK-", "")),
        projectId: Number(selectedProject.id),
        nextStatus,
        targetLaneTaskIds,
      }),
    })
      .then(() => {
        router.refresh();
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          redirectToLogin();
        }
      });
  };
  const handleTaskSave = async (
    targetTask: TaskListItem,
    input: {
      projectId: number;
      title: string;
      description: string;
      parentTaskId: number | null;
      status: TaskStatus;
      priority: TaskPriority;
      startDate: string | null;
      dueDate: string | null;
      labels: string[];
    },
  ) => {
    setTaskMutationPending(true);
    setTaskMutationError(null);

    try {
      if (targetTask.id === NEW_TASK_ID) {
        await requestJson(`/api/v1/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      } else {
        await requestJson(`/api/v1/tasks/${targetTask.id.replace("TSK-", "")}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      }

      router.refresh();

      if (initialSection === "dashboard" || targetTask.id === NEW_TASK_ID) {
        setEditingTaskId(null);
      } else {
        closeTaskRoute();
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setTaskMutationError(error instanceof Error ? error.message : "Could not save task.");
    } finally {
      setTaskMutationPending(false);
    }
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

      router.refresh();
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

      router.refresh();
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
      router.refresh();
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

      router.refresh();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
      }
    } finally {
      setProjectReorderPendingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await requestJson(`/api/v1/auth/logout`, { method: "POST" });
    } finally {
      router.push("/auth/login");
    }
  };

  const handleProfileSave = async (input: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    avatarUrl: string | null;
  }) => {
    setProfileMutationPending(true);
    setProfileMutationError(null);

    try {
      const profile = await requestJson<CurrentUserProfile>(`/api/v1/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      setCurrentUserProfile(profile);
      setProfileModalOpen(false);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }

      setProfileMutationError(
        error instanceof ApiRequestError ? error.message : "Failed to update profile.",
      );
    } finally {
      setProfileMutationPending(false);
    }
  };

  const openSection = (sectionId: string) => {
    if (sectionId === "dashboard" || sectionId === "projects") {
      router.push(sectionId === "dashboard" ? "/" : "/projects");
    }
  };

  const openPrimaryCreateAction = () => {
    if (initialSection === "projects") {
      setProjectMutationError(null);
      setEditingProjectId(NEW_PROJECT_ID);
      return;
    }

    setTaskMutationError(null);
    setEditingTaskId(NEW_TASK_ID);
  };

  useEffect(() => {
    if (
      initialSection !== "dashboard" &&
      initialSection !== "project_detail" &&
      initialSection !== "task_detail"
    ) {
      return;
    }

    const nextUrl = buildPathQuery(pathname, currentTaskRouteState, {
      includeView: initialSection === "project_detail" || initialSection === "task_detail",
    });

    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    currentTaskRouteState,
    initialSection,
    pathname,
    router,
    searchParams,
  ]);

  useClickOutside(
    [projectSortMenuRef, projectStatusMenuRef, projectPriorityMenuRef, projectDateMenuRef],
    projectSortMenuOpen || projectStatusMenuOpen || projectPriorityMenuOpen || projectDateMenuOpen,
    closeProjectMenus,
  );

  useEffect(() => {
    setTaskMutationError(null);
  }, [editingTaskId, initialTaskId]);

  useEffect(() => {
    setProjectMutationError(null);
  }, [editingProjectId]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await requestJson<CurrentUserProfile>(`/api/v1/auth/me`);

        if (!cancelled) {
          setCurrentUserProfile(profile);
        }
      } catch (error) {
        if (!cancelled && isUnauthorizedError(error)) {
          redirectToLogin();
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [redirectToLogin]);

  return (
    <main className="h-screen overflow-hidden bg-[var(--surface-base)] text-[var(--ink-strong)]">
      <div className="grid h-screen grid-cols-[auto_minmax(0,1fr)]">
        <AppSidebar
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded((current) => !current)}
          navItems={NAV_ITEMS}
          initialSection={initialSection}
          activeProjects={activeProjects}
          selectedProjectId={selectedProject?.id}
          onOpenSection={openSection}
          onNewTask={openPrimaryCreateAction}
          onOpenProject={(projectId) => router.push(`/projects/${projectId}`)}
          onOpenProfile={() => {
            setProfileMutationError(null);
            setProfileModalOpen(true);
          }}
          onLogout={() => void handleLogout()}
          avatarInitial={(currentUserProfile?.name?.trim().charAt(0) || "R").toUpperCase()}
          avatarUrl={currentUserProfile?.avatarUrl ?? null}
        />

        <section className="flex min-w-0 min-h-0 flex-col overflow-hidden">
          <AppHeader
            initialSection={initialSection}
            visibleTaskCount={visibleTaskCount}
            activeProjectCount={activeProjects.length}
            selectedProjectName={selectedProject?.name ?? "Project"}
            selectedProjectTaskCount={selectedProjectTasks.length}
            searchHrefBase=""
            onOpenTask={openTask}
            onPrimaryAction={openPrimaryCreateAction}
          />

          <div
            className={`min-w-0 min-h-0 flex-1 overflow-y-auto bg-[var(--surface-main)] px-6 ${
              initialSection === "project_detail"
                ? "pb-6 pt-1.5"
                : initialSection === "dashboard"
                  ? "pb-6 pt-2.5"
                  : "py-6"
            }`}
          >
            <div className="mx-auto w-full max-w-[1360px]">
              {initialSection === "dashboard" ? (
                <div className="flex w-full gap-6">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <DashboardTaskToolbar
                      sortMenuRef={projectSortMenuRef}
                      statusMenuRef={projectStatusMenuRef}
                      priorityMenuRef={projectPriorityMenuRef}
                      sortMenuOpen={projectSortMenuOpen}
                      statusMenuOpen={projectStatusMenuOpen}
                      priorityMenuOpen={projectPriorityMenuOpen}
                      sortLabel={projectSortLabel}
                      direction={direction}
                      sortOptions={SORT_OPTIONS}
                      selectedSort={sort}
                      statusSummary={selectedStatuses.length === 0 ? "All statuses" : activeStatusLabels.join(", ")}
                      prioritySummary={selectedPriorities.length === 0 ? "All priorities" : activePriorityLabels.join(", ")}
                      selectedStatuses={selectedStatuses}
                      selectedPriorities={selectedPriorities}
                      statusOptions={STATUS_OPTIONS}
                      priorityOptions={PRIORITY_OPTIONS}
                      onToggleSortMenu={() => {
                        setProjectSortMenuOpen((current) => !current);
                        setProjectStatusMenuOpen(false);
                        setProjectPriorityMenuOpen(false);
                      }}
                      onToggleStatusMenu={() => {
                        setProjectStatusMenuOpen((current) => !current);
                        setProjectSortMenuOpen(false);
                        setProjectPriorityMenuOpen(false);
                      }}
                      onTogglePriorityMenu={() => {
                        setProjectPriorityMenuOpen((current) => !current);
                        setProjectSortMenuOpen(false);
                        setProjectStatusMenuOpen(false);
                        setProjectDateMenuOpen(false);
                      }}
                      onToggleDateMenu={() => {
                        setProjectDateMenuOpen((current) => !current);
                        setProjectSortMenuOpen(false);
                        setProjectStatusMenuOpen(false);
                        setProjectPriorityMenuOpen(false);
                      }}
                      onSelectSort={(value) => {
                        setSort(value);
                        setProjectSortMenuOpen(false);
                      }}
                      onSelectDirection={(value) => {
                        setDirection(value);
                        setProjectSortMenuOpen(false);
                      }}
                      onResetStatuses={() => setSelectedStatuses([])}
                      onToggleStatus={toggleStatus}
                      onResetPriorities={() => setSelectedPriorities([])}
                      onTogglePriority={togglePriority}
                      dateMenuRef={projectDateMenuRef}
                      dateMenuOpen={projectDateMenuOpen}
                      startDate={startDate}
                      endDate={endDate}
                      onSetStartDate={setStartDate}
                      onSetEndDate={setEndDate}
                      onReset={resetProjectFilters}
                    />

                    <DashboardContent
                      visibleTaskCount={visibleTaskCount}
                      filteredOverdueItems={filteredOverdueItems}
                      filteredTodayItems={filteredTodayItems}
                      filteredProjects={filteredProjects}
                      onEditTask={setEditingTaskId}
                      onOpenProjects={() => router.push("/projects")}
                      onOpenProjectByName={(projectName) => {
                        const project = activeProjects.find((item) => item.name === projectName);

                        if (project) {
                          router.push(`/projects/${project.id}`);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : initialSection === "projects" ? (
                <ProjectsContent
                  activeProjects={activeProjects}
                  archivedProjects={archivedProjects}
                  visibleProjectTaskCount={visibleProjectTaskCount}
                  showArchivedProjects={showArchivedProjects}
                  onToggleArchived={() => setShowArchivedProjects((current) => !current)}
                  onEditProject={setEditingProjectId}
                  onMoveProject={handleProjectMove}
                  onQuickUnarchive={handleProjectQuickUnarchive}
                  projectReorderPendingId={projectReorderPendingId}
                  onOpenProject={(projectId) => router.push(`/projects/${projectId}`)}
                />
              ) : (initialSection === "project_detail" || initialSection === "task_detail") && selectedProject ? (
                <div className="space-y-2.5">
                  {initialSection === "project_detail" ? (
                    <ProjectTaskToolbar
                      view={projectView}
                      onChangeView={setProjectView}
                      sortMenuRef={projectSortMenuRef}
                      statusMenuRef={projectStatusMenuRef}
                      priorityMenuRef={projectPriorityMenuRef}
                      sortMenuOpen={projectSortMenuOpen}
                      statusMenuOpen={projectStatusMenuOpen}
                      priorityMenuOpen={projectPriorityMenuOpen}
                      sortLabel={projectSortLabel}
                      direction={direction}
                      sortOptions={SORT_OPTIONS}
                      selectedSort={sort}
                      statusSummary={selectedStatuses.length === 0 ? "All statuses" : activeStatusLabels.join(", ")}
                      prioritySummary={selectedPriorities.length === 0 ? "All priorities" : activePriorityLabels.join(", ")}
                      selectedStatuses={selectedStatuses}
                      selectedPriorities={selectedPriorities}
                      statusOptions={STATUS_OPTIONS}
                      priorityOptions={PRIORITY_OPTIONS}
                      onToggleSortMenu={() => {
                        setProjectSortMenuOpen((current) => !current);
                        setProjectStatusMenuOpen(false);
                        setProjectPriorityMenuOpen(false);
                      }}
                      onToggleStatusMenu={() => {
                        setProjectStatusMenuOpen((current) => !current);
                        setProjectSortMenuOpen(false);
                        setProjectPriorityMenuOpen(false);
                      }}
                      onTogglePriorityMenu={() => {
                        setProjectPriorityMenuOpen((current) => !current);
                        setProjectSortMenuOpen(false);
                        setProjectStatusMenuOpen(false);
                        setProjectDateMenuOpen(false);
                      }}
                      onToggleDateMenu={() => {
                        setProjectDateMenuOpen((current) => !current);
                        setProjectSortMenuOpen(false);
                        setProjectStatusMenuOpen(false);
                        setProjectPriorityMenuOpen(false);
                      }}
                      onSelectSort={(value) => {
                        setSort(value);
                        setProjectSortMenuOpen(false);
                      }}
                      onSelectDirection={(value) => {
                        setDirection(value);
                        setProjectSortMenuOpen(false);
                      }}
                      onResetStatuses={() => setSelectedStatuses([])}
                      onToggleStatus={toggleStatus}
                      onResetPriorities={() => setSelectedPriorities([])}
                      onTogglePriority={togglePriority}
                      dateMenuRef={projectDateMenuRef}
                      dateMenuOpen={projectDateMenuOpen}
                      startDate={startDate}
                      endDate={endDate}
                      onSetStartDate={setStartDate}
                      onSetEndDate={setEndDate}
                      onReset={resetProjectFilters}
                    />
                  ) : null}
                  <ProjectDetailContent
                    selectedProject={selectedProject}
                    selectedProjectOverdueTasks={selectedProjectOverdueTasks}
                    projectView={projectView}
                    projectBoardGroups={projectBoardGroups}
                    selectedProjectTasks={selectedProjectTasks}
                    draggingProjectTaskId={draggingProjectTaskId}
                    onDragTaskStart={setDraggingProjectTaskId}
                    onDragTaskEnd={() => setDraggingProjectTaskId(null)}
                    onEditTask={openTask}
                    onMoveTask={moveProjectTaskToStatus}
                    onEditProject={() => setEditingProjectId(selectedProject.id)}
                    onBackToProjects={() => router.push("/projects")}
                  />
                </div>
              ) : (
                <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-6 py-10">
                  <p className="text-sm text-[var(--ink-subtle)]">Task not found.</p>
                </section>
              )}
            </div>
          </div>
        </section>
      </div>
      <ProjectEditorModal
        key={editingProject?.id ?? "project-editor-empty"}
        project={editingProject}
        onClose={() => setEditingProjectId(null)}
        onSave={handleProjectSave}
        onToggleArchive={handleProjectArchiveToggle}
        isSaving={projectMutationPending}
        error={projectMutationError}
      />
      <TaskModalSwitcher
        initialSection={initialSection}
        selectedTask={selectedTask}
        taskEditorTask={taskEditorTask}
        taskDetails={taskDetails}
        projectOptions={projectOptions}
        parentTaskOptionsByProject={parentTaskOptionsByProject}
        taskMutationPending={taskMutationPending}
        taskMutationError={taskMutationError}
        onCloseTaskRoute={closeTaskRoute}
        onCloseInlineTaskEditor={() => setEditingTaskId(null)}
        onSaveTask={handleTaskSave}
      />
      <ProfileModal
        key={
          currentUserProfile
            ? `${currentUserProfile.userId}-${profileModalOpen ? "open" : "closed"}-${currentUserProfile.name}-${currentUserProfile.email}-${currentUserProfile.avatarUrl ?? ""}`
            : `profile-${profileModalOpen ? "open" : "closed"}`
        }
        open={profileModalOpen}
        onClose={() => {
          setProfileMutationError(null);
          setProfileModalOpen(false);
        }}
        profile={
          currentUserProfile
            ? {
                name: currentUserProfile.name,
                email: currentUserProfile.email,
                avatarUrl: currentUserProfile.avatarUrl,
              }
            : null
        }
        isSaving={profileMutationPending}
        error={profileMutationError}
        onSave={handleProfileSave}
      />
    </main>
  );
}


export default function Home({
  data,
  initialFilters,
}: {
  data: AppData;
  initialFilters?: TaskFilters;
}) {
  return <TaskewrApp initialSection="dashboard" data={data} initialFilters={initialFilters} />;
}
