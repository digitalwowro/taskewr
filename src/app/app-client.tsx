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
import { ProjectArchiveModal } from "@/components/app/project-archive-modal";
import { ProjectEditorModal } from "@/components/app/project-editor-modal";
import { ProjectMembersModal } from "@/components/app/project-members-modal";
import { TaskModalSwitcher } from "@/components/app/task-modal-switcher";
import { TaskProjectRequiredModal } from "@/components/app/task-project-required-modal";
import { UserDeactivateModal } from "@/components/app/user-deactivate-modal";
import { UserEditorModal } from "@/components/app/user-editor-modal";
import { UserPasswordModal } from "@/components/app/user-password-modal";
import { UsersContent } from "@/components/app/users-content";
import { WorkspaceDeleteModal } from "@/components/app/workspace-delete-modal";
import { WorkspaceEditorModal } from "@/components/app/workspace-editor-modal";
import { WorkspaceMemberAddModal } from "@/components/app/workspace-member-add-modal";
import { WorkspaceMemberEditorModal } from "@/components/app/workspace-member-editor-modal";
import { WorkspaceMemberRemoveModal } from "@/components/app/workspace-member-remove-modal";
import { WorkspacesContent } from "@/components/app/workspaces-content";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useDashboardTaskGroups } from "@/hooks/use-dashboard-task-groups";
import { usePersistedSidebarState } from "@/hooks/use-persisted-sidebar-state";
import { useProfileState } from "@/hooks/use-profile-state";
import { useProjectDetailState } from "@/hooks/use-project-detail-state";
import { useProjectEditorState } from "@/hooks/use-project-editor-state";
import { useProjectMembersState } from "@/hooks/use-project-members-state";
import { useProjectBoardMove } from "@/hooks/use-project-board-move";
import { useTaskCompletion } from "@/hooks/use-task-completion";
import { NEW_TASK_ID, useTaskEditorState } from "@/hooks/use-task-editor-state";
import { useTaskFilterToolbarState } from "@/hooks/use-task-filter-toolbar-state";
import { useUserAdminState } from "@/hooks/use-user-admin-state";
import { useWorkspaceAdminState } from "@/hooks/use-workspace-admin-state";
import { requestJson } from "@/lib/api-client";
import type { ProjectView } from "@/domain/projects/constants";
import {
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "@/domain/tasks/constants";
import type { TaskFilters, TaskListItem } from "@/domain/tasks/types";
import {
  NAV_ITEMS,
} from "@/app/app-fallback-data";

type AppSection = "dashboard" | "projects" | "project_detail" | "task_detail" | "users" | "workspaces";

function getTaskByNumericId(tasks: TaskListItem[], id: string) {
  return tasks.find((task) => task.id.replace("TSK-", "") === id) ?? null;
}

function getPrimaryActionLabel(section: AppSection) {
  if (section === "users") {
    return "New User";
  }

  if (section === "workspaces") {
    return "New Workspace";
  }

  if (section === "projects") {
    return "New Project";
  }

  return "New Task";
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
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);
  const [taskProjectRequiredOpen, setTaskProjectRequiredOpen] = useState(false);
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
  const workspaces = data.workspaces;
  const todayItems = data.todayItems;
  const overdueItems = data.overdueItems;
  const recurringOverdueItems = data.recurringOverdueItems;
  const recurringTodayItems = data.recurringTodayItems;
  const groupedProjects = data.groupedProjects;
  const activeProjects = data.activeProjects;
  const archivedProjects = data.archivedProjects;
  const projectTasksByProjectId = data.projectTasksByProjectId;
  const taskDetails = data.taskDetails;
  const labels = data.labels;
  const currentTaskFilters = useMemo<TaskFilters>(
    () => ({
      sort,
      direction,
      status: selectedStatuses,
      priority: selectedPriorities,
      startDate,
      endDate,
    }),
    [direction, endDate, selectedPriorities, selectedStatuses, sort, startDate],
  );

  const {
    filteredOverdueItems,
    filteredProjects,
    filteredRecurringOverdueItems,
    filteredRecurringTodayItems,
    filteredTodayItems,
    visibleTaskCount,
  } = useDashboardTaskGroups({
    groupedProjects,
    overdueItems,
    recurringOverdueItems,
    recurringTodayItems,
    taskFilters: currentTaskFilters,
    todayItems,
  });
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
    completeTask,
    completingTaskId,
  } = useTaskCompletion({
    redirectToLogin,
    refreshApp: () => router.refresh(),
  });
  const {
    profileModalOpen,
    currentUserProfile,
    profileMutationPending,
    profileMutationError,
    openProfileModal,
    closeProfileModal,
    handleProfileSave,
  } = useProfileState({ redirectToLogin });
  const canManageUsers =
    data.currentUser.appRole === "admin" || currentUserProfile?.appRole === "admin";
  const {
    users,
    activeUserCount,
    query: userQuery,
    includeInactive: includeInactiveUsers,
    loading: usersLoading,
    loadError: usersLoadError,
    editingUser,
    passwordUser,
    deactivatingUser,
    mutationPending: userMutationPending,
    mutationError: userMutationError,
    setQuery: setUserQuery,
    setIncludeInactive: setIncludeInactiveUsers,
    openNewUser,
    openEditUser,
    closeUserEditor,
    openPasswordReset,
    closePasswordReset,
    openDeactivateUser,
    closeDeactivateUser,
    saveUser,
    resetPassword,
    deactivateUser,
    reactivateUser,
  } = useUserAdminState({
    enabled: canManageUsers && initialSection === "users",
    redirectToLogin,
  });
  const {
    workspaces: managedWorkspaces,
    userCandidates: workspaceUserCandidates,
    workspaceCount,
    query: workspaceQuery,
    loading: workspacesLoading,
    loadError: workspacesLoadError,
    editingWorkspace,
    deletingWorkspace,
    addingMemberWorkspace,
    removingMemberDetails: removingWorkspaceMemberDetails,
    memberDetails: workspaceMemberDetails,
    memberDetailsLoading: workspaceMemberDetailsLoading,
    mutationPending: workspaceMutationPending,
    mutationError: workspaceMutationError,
    setQuery: setWorkspaceQuery,
    openNewWorkspace,
    openEditWorkspace,
    closeWorkspaceEditor,
    openDeleteWorkspace,
    closeDeleteWorkspace,
    openAddMember: openWorkspaceMemberAdd,
    closeAddMember: closeWorkspaceMemberAdd,
    openRemoveMember: openWorkspaceMemberRemove,
    closeRemoveMember: closeWorkspaceMemberRemove,
    openEditMember: openWorkspaceMemberEditor,
    closeMemberEditor: closeWorkspaceMemberEditor,
    saveWorkspace,
    deleteWorkspace,
    addMember: addWorkspaceMember,
    createAndAddMember: createAndAddWorkspaceMember,
    saveEditingMemberRole: saveWorkspaceMemberRole,
    removeMember: removeWorkspaceMember,
  } = useWorkspaceAdminState({
    enabled: initialSection === "workspaces",
    redirectToLogin,
  });
  const navItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.id === "users") {
          return canManageUsers;
        }

        return true;
      }),
    [canManageUsers],
  );
  const primaryActionLabel = getPrimaryActionLabel(initialSection);

  const allTasks = useMemo(() => {
    const dedupedTasks = new Map<string, TaskListItem>();

    for (const task of [
      ...todayItems,
      ...overdueItems,
      ...recurringOverdueItems,
      ...recurringTodayItems,
      ...groupedProjects.flatMap((project) => project.items),
      ...Object.values(projectTasksByProjectId).flat(),
    ]) {
      dedupedTasks.set(task.id, task);
    }

    return [...dedupedTasks.values()];
  }, [
    groupedProjects,
    overdueItems,
    projectTasksByProjectId,
    recurringOverdueItems,
    recurringTodayItems,
    todayItems,
  ]);
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
    archivingProject,
    openNewProject,
    openProjectArchiveConfirm,
    closeProjectArchiveConfirm,
    setEditingProjectId,
    projectMutationPending,
    projectMutationError,
    projectReorderPendingId,
    handleProjectSave,
    handleProjectArchiveToggle,
    handleProjectQuickArchive,
    handleProjectQuickUnarchive,
    handleProjectMove,
  } = useProjectEditorState({
    activeProjects,
    archivedProjects,
    workspaces,
    redirectToLogin,
    refreshApp: () => router.refresh(),
  });
  const {
    details: projectMembersDetails,
    loading: projectMembersLoading,
    mutationPending: projectMembersMutationPending,
    mutationError: projectMembersMutationError,
    openProjectMembers,
    closeProjectMembers,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
  } = useProjectMembersState({
    redirectToLogin,
  });
  const projectOptions = useMemo(
    () =>
      activeProjects.map((project) => ({
        id: project.id,
        name: project.name,
        workspaceName: project.workspaceName,
      })),
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
          ? project.id === selectedTask?.projectId
          : project.id === initialProjectId,
      ) ?? activeProjects[0],
    [activeProjects, allProjects, initialProjectId, initialSection, selectedTask?.projectId],
  );
  const defaultTaskProjectId =
    initialSection === "project_detail" || initialSection === "task_detail"
      ? selectedProject?.id ?? activeProjects[0]?.id ?? ""
      : activeProjects[0]?.id ?? "";
  const effectiveDefaultTaskProjectId = newTaskProjectId ?? defaultTaskProjectId;
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
    defaultTaskProjectId: effectiveDefaultTaskProjectId,
    initialSection,
    initialTaskId,
    redirectToLogin,
    refreshApp: () => router.refresh(),
  });
  const {
    projectBoardGroups,
    selectedProjectActiveTasks,
    selectedProjectCompletedTasks,
    selectedProjectOverdueTasks,
    selectedProjectTasks,
  } = useProjectDetailState({
    projectId: selectedProject?.id ?? null,
    projectTasksByProjectId,
    taskFilters: currentTaskFilters,
  });
  const moveProjectTaskToStatus = useProjectBoardMove({
    projectId: selectedProject?.id ?? null,
    redirectToLogin,
    refreshApp: () => router.refresh(),
    selectedProjectTasks,
  });
  const handleLogout = async () => {
    try {
      await requestJson(`/api/v1/auth/logout`, { method: "POST" });
    } finally {
      router.push("/auth/login");
    }
  };

  const openSection = (sectionId: string) => {
    if (
      sectionId === "dashboard" ||
      sectionId === "projects" ||
      sectionId === "users" ||
      sectionId === "workspaces"
    ) {
      router.push(sectionId === "dashboard" ? "/" : `/${sectionId}`);
    }
  };

  const openNewTask = (projectId?: string) => {
    const targetProjectId = projectId ?? defaultTaskProjectId;

    if (!targetProjectId || activeProjects.length === 0) {
      setTaskProjectRequiredOpen(true);
      return;
    }

    setNewTaskProjectId(targetProjectId);
    setEditingTaskId(NEW_TASK_ID);
  };

  const closeInlineTaskEditor = () => {
    setEditingTaskId(null);
    setNewTaskProjectId(null);
  };

  const openPrimaryCreateAction = () => {
    if (initialSection === "users") {
      openNewUser();
      return;
    }

    if (initialSection === "workspaces") {
      openNewWorkspace();
      return;
    }

    if (initialSection === "projects") {
      openNewProject();
      return;
    }

    openNewTask();
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
    <main className="fixed inset-0 overflow-hidden bg-[var(--surface-base)] text-[var(--ink-strong)]">
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)]">
        <AppSidebar
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded((current) => !current)}
          navItems={navItems}
          initialSection={initialSection}
          activeProjects={activeProjects}
          selectedProjectId={selectedProject?.id}
          onOpenSection={openSection}
          onNewTask={openPrimaryCreateAction}
          primaryActionLabel={primaryActionLabel}
          showPrimaryAction={
            initialSection === "users"
              ? canManageUsers
              : initialSection === "workspaces"
                ? true
                : true
          }
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
            userCount={activeUserCount}
            workspaceCount={workspaceCount}
            selectedProjectName={selectedProject?.name ?? "Project"}
            selectedProjectTaskCount={selectedProjectTasks.length}
            searchHrefBase=""
            showPrimaryAction={
              initialSection === "users"
                ? canManageUsers
                : initialSection === "workspaces"
                  ? true
                  : true
            }
            onOpenTask={openTask}
            onPrimaryAction={openPrimaryCreateAction}
          />

          <div
            className={`min-w-0 min-h-0 flex-1 overflow-y-auto bg-[var(--surface-main)] px-5 ${
              initialSection === "project_detail"
                ? "pb-5 pt-2.5"
                : initialSection === "dashboard"
                  ? "pb-5 pt-2.5"
                  : "py-5"
            }`}
          >
            <div className="mx-auto w-full max-w-[1360px]">
              {initialSection === "dashboard" ? (
                <div className="flex w-full gap-5">
                  <div className="min-w-0 flex-1 space-y-5">
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
                      workspaces={workspaces}
                      filteredRecurringOverdueItems={filteredRecurringOverdueItems}
                      filteredRecurringTodayItems={filteredRecurringTodayItems}
                      filteredOverdueItems={filteredOverdueItems}
                      filteredTodayItems={filteredTodayItems}
                      filteredProjects={filteredProjects}
                      onEditTask={setEditingTaskId}
                      onCompleteTask={completeTask}
                      completingTaskId={completingTaskId}
                      onOpenProjects={() => router.push("/projects")}
                      onNewTask={openNewTask}
                      onOpenProject={(projectId) => router.push(`/projects/${projectId}`)}
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
                  onManageProjectUsers={openProjectMembers}
                  onMoveProject={handleProjectMove}
                  onQuickArchive={openProjectArchiveConfirm}
                  onQuickUnarchive={handleProjectQuickUnarchive}
                  projectReorderPendingId={projectReorderPendingId}
                  onOpenProject={(projectId) => router.push(`/projects/${projectId}`)}
                />
              ) : initialSection === "users" ? (
                <UsersContent
                  users={users}
                  query={userQuery}
                  includeInactive={includeInactiveUsers}
                  loading={usersLoading}
                  loadError={usersLoadError}
                  mutationError={userMutationError}
                  mutationPending={userMutationPending}
                  canManageUsers={canManageUsers}
                  onSearch={setUserQuery}
                  onToggleInactive={setIncludeInactiveUsers}
                  onEditUser={openEditUser}
                  onResetPassword={openPasswordReset}
                  onDeactivateUser={openDeactivateUser}
                  onReactivateUser={reactivateUser}
                />
              ) : initialSection === "workspaces" ? (
                <WorkspacesContent
                  workspaces={managedWorkspaces}
                  query={workspaceQuery}
                  loading={workspacesLoading}
                  loadError={workspacesLoadError}
                  mutationError={workspaceMutationError}
                  mutationPending={workspaceMutationPending}
                  onSearch={setWorkspaceQuery}
                  onEditWorkspace={openEditWorkspace}
                  onDeleteWorkspace={openDeleteWorkspace}
                  onAddMember={openWorkspaceMemberAdd}
                  onRemoveMember={openWorkspaceMemberRemove}
                  onEditMember={openWorkspaceMemberEditor}
                />
              ) : (initialSection === "project_detail" || initialSection === "task_detail") && selectedProject ? (
                <div className="space-y-5">
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
                    selectedProjectActiveTasks={selectedProjectActiveTasks}
                    selectedProjectCompletedTasks={selectedProjectCompletedTasks}
                    projectView={projectView}
                    projectBoardGroups={projectBoardGroups}
                    selectedProjectTasks={selectedProjectTasks}
                    draggingProjectTaskId={draggingProjectTaskId}
                    onDragTaskStart={setDraggingProjectTaskId}
                    onDragTaskEnd={() => setDraggingProjectTaskId(null)}
                    onEditTask={openTask}
                    onCompleteTask={completeTask}
                    completingTaskId={completingTaskId}
                    onMoveTask={moveProjectTaskToStatus}
                    onEditProject={() => setEditingProjectId(selectedProject.id)}
                    onBackToProjects={() => router.push("/projects")}
                  />
                </div>
              ) : (
                <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-10">
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
        workspaces={workspaces}
        onClose={() => setEditingProjectId(null)}
        onSave={handleProjectSave}
        onToggleArchive={handleProjectArchiveToggle}
        isSaving={projectMutationPending}
        error={projectMutationError}
      />
      <ProjectArchiveModal
        key={archivingProject ? `project-archive-${archivingProject.id}` : "project-archive-empty"}
        project={archivingProject}
        onClose={closeProjectArchiveConfirm}
        onConfirm={() => archivingProject ? handleProjectQuickArchive(archivingProject.id) : Promise.resolve()}
        isSaving={projectMutationPending}
        error={projectMutationError}
      />
      <ProjectMembersModal
        key={
          projectMembersDetails
            ? `project-members-${projectMembersDetails.projectId}`
            : "project-members-empty"
        }
        details={projectMembersDetails}
        loading={projectMembersLoading}
        onClose={closeProjectMembers}
        onAddMember={addProjectMember}
        onUpdateRole={updateProjectMemberRole}
        onRemoveMember={removeProjectMember}
        isSaving={projectMembersMutationPending}
        error={projectMembersMutationError}
      />
      <UserEditorModal
        key={editingUser ? `user-editor-${editingUser.id}-${editingUser.email}` : "user-editor-empty"}
        user={editingUser}
        onClose={closeUserEditor}
        onSave={saveUser}
        isSaving={userMutationPending}
        error={userMutationError}
      />
      <UserPasswordModal
        key={passwordUser ? `user-password-${passwordUser.id}` : "user-password-empty"}
        user={passwordUser}
        onClose={closePasswordReset}
        onSave={resetPassword}
        isSaving={userMutationPending}
        error={userMutationError}
      />
      <UserDeactivateModal
        key={deactivatingUser ? `user-deactivate-${deactivatingUser.id}` : "user-deactivate-empty"}
        user={deactivatingUser}
        onClose={closeDeactivateUser}
        onConfirm={deactivateUser}
        isSaving={userMutationPending}
        error={userMutationError}
      />
      <WorkspaceEditorModal
        key={editingWorkspace ? `workspace-editor-${editingWorkspace.id}-${editingWorkspace.name}` : "workspace-editor-empty"}
        workspace={editingWorkspace}
        ownerCandidates={workspaceUserCandidates}
        canChooseOwner={canManageUsers}
        onClose={closeWorkspaceEditor}
        onSave={saveWorkspace}
        onDeleteWorkspace={(workspaceId) => {
          closeWorkspaceEditor();
          openDeleteWorkspace(workspaceId);
        }}
        isSaving={workspaceMutationPending}
        error={workspaceMutationError}
      />
      <WorkspaceDeleteModal
        key={deletingWorkspace ? `workspace-delete-${deletingWorkspace.id}` : "workspace-delete-empty"}
        workspace={deletingWorkspace}
        onClose={closeDeleteWorkspace}
        onConfirm={deleteWorkspace}
        isSaving={workspaceMutationPending}
        error={workspaceMutationError}
      />
      <WorkspaceMemberAddModal
        key={addingMemberWorkspace ? `workspace-member-add-${addingMemberWorkspace.id}` : "workspace-member-add-empty"}
        workspace={addingMemberWorkspace}
        userCandidates={workspaceUserCandidates}
        onClose={closeWorkspaceMemberAdd}
        onAddMember={addWorkspaceMember}
        onCreateAndAddMember={createAndAddWorkspaceMember}
        isSaving={workspaceMutationPending}
        error={workspaceMutationError}
      />
      <WorkspaceMemberEditorModal
        key={
          workspaceMemberDetails
            ? `workspace-member-${workspaceMemberDetails.currentWorkspace.id}-${workspaceMemberDetails.userId}`
            : "workspace-member-empty"
        }
        member={workspaceMemberDetails}
        loading={workspaceMemberDetailsLoading}
        onClose={closeWorkspaceMemberEditor}
        onSaveRole={saveWorkspaceMemberRole}
        isSaving={workspaceMutationPending}
        error={workspaceMutationError}
      />
      <WorkspaceMemberRemoveModal
        key={
          removingWorkspaceMemberDetails
            ? `workspace-member-remove-${removingWorkspaceMemberDetails.workspace.id}-${removingWorkspaceMemberDetails.member.userId}`
            : "workspace-member-remove-empty"
        }
        target={removingWorkspaceMemberDetails}
        onClose={closeWorkspaceMemberRemove}
        onConfirm={removeWorkspaceMember}
        isSaving={workspaceMutationPending}
        error={workspaceMutationError}
      />
      <TaskModalSwitcher
        initialSection={initialSection}
        selectedTask={selectedTask}
        taskEditorTask={taskEditorTask}
        taskDetails={taskDetails}
        projectOptions={projectOptions}
        availableLabels={labels}
        parentTaskOptionsByProject={parentTaskOptionsByProject}
        taskMutationPending={taskMutationPending}
        taskMutationError={taskMutationError}
        onCloseTaskRoute={closeTaskRoute}
        onCloseInlineTaskEditor={closeInlineTaskEditor}
        onSaveTask={handleTaskSave}
      />
      <TaskProjectRequiredModal
        open={taskProjectRequiredOpen}
        onClose={() => setTaskProjectRequiredOpen(false)}
        onOpenProjects={() => {
          setTaskProjectRequiredOpen(false);
          router.push("/projects");
        }}
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
