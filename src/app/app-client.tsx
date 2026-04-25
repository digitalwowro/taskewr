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
import { useProfileState } from "@/hooks/use-profile-state";
import { useProjectEditorState } from "@/hooks/use-project-editor-state";
import { NEW_TASK_ID, useTaskEditorState } from "@/hooks/use-task-editor-state";
import { useTaskFilterToolbarState } from "@/hooks/use-task-filter-toolbar-state";
import { isUnauthorizedError, requestJson } from "@/lib/api-client";
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

function getTaskByNumericId(tasks: TaskListItem[], id: string) {
  return tasks.find((task) => task.id.replace("TSK-", "") === id) ?? null;
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
  const todayItems = data.todayItems;
  const overdueItems = data.overdueItems;
  const recurringOverdueItems = data.recurringOverdueItems;
  const recurringTodayItems = data.recurringTodayItems;
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
  const filteredRecurringOverdueItems = useMemo(
    () =>
      sortAndFilterTasks(
        recurringOverdueItems,
        sort,
        direction,
        selectedStatuses,
        selectedPriorities,
        startDate,
        endDate,
      ),
    [
      direction,
      endDate,
      recurringOverdueItems,
      selectedPriorities,
      selectedStatuses,
      sort,
      startDate,
    ],
  );
  const filteredRecurringTodayItems = useMemo(
    () =>
      sortAndFilterTasks(
        recurringTodayItems,
        sort,
        direction,
        selectedStatuses,
        selectedPriorities,
        startDate,
        endDate,
      ),
    [
      direction,
      endDate,
      recurringTodayItems,
      selectedPriorities,
      selectedStatuses,
      sort,
      startDate,
    ],
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
      new Set([
        ...filteredRecurringOverdueItems.map((task) => task.id),
        ...filteredRecurringTodayItems.map((task) => task.id),
        ...filteredTodayItems.map((task) => task.id),
        ...filteredOverdueItems.map((task) => task.id),
        ...filteredProjects.flatMap((project) => project.items.map((task) => task.id)),
      ]).size,
    [
      filteredOverdueItems,
      filteredProjects,
      filteredRecurringOverdueItems,
      filteredRecurringTodayItems,
      filteredTodayItems,
    ],
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
  const {
    profileModalOpen,
    currentUserProfile,
    profileMutationPending,
    profileMutationError,
    openProfileModal,
    closeProfileModal,
    handleProfileSave,
  } = useProfileState({ redirectToLogin });

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

  const {
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
  } = useProjectEditorState({
    activeProjects,
    archivedProjects,
    redirectToLogin,
    refreshApp: () => router.refresh(),
  });
  const projectOptions = useMemo(
    () => activeProjects.map((project) => ({ id: project.id, name: project.name })),
    [activeProjects],
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
  const {
    setEditingTaskId,
    taskEditorTask,
    taskMutationError,
    taskMutationPending,
    handleTaskSave,
  } = useTaskEditorState({
    activeProjects,
    allTasks,
    closeTaskRoute,
    defaultTaskProjectId,
    initialSection,
    initialTaskId,
    redirectToLogin,
    refreshApp: () => router.refresh(),
  });
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
  const handleLogout = async () => {
    try {
      await requestJson(`/api/v1/auth/logout`, { method: "POST" });
    } finally {
      router.push("/auth/login");
    }
  };

  const openSection = (sectionId: string) => {
    if (sectionId === "dashboard" || sectionId === "projects") {
      router.push(sectionId === "dashboard" ? "/" : "/projects");
    }
  };

  const openPrimaryCreateAction = () => {
    if (initialSection === "projects") {
      openNewProject();
      return;
    }

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
          onOpenProfile={openProfileModal}
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
                      filteredRecurringOverdueItems={filteredRecurringOverdueItems}
                      filteredRecurringTodayItems={filteredRecurringTodayItems}
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
          closeProfileModal();
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
