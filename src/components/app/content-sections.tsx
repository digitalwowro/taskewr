"use client";

import type { AppProject, ProjectGroup } from "@/app/app-data";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";
import { usePersistedCollapsedSections } from "@/hooks/use-persisted-collapsed-sections";
import {
  CountPill,
  FocusItem,
  HorizontalListRow,
  MetricCard,
  ProjectBoardLane,
  ProjectRow,
  ProjectSection,
  TaskTableHeader,
} from "@/components/app/ui";
import type { ProjectView } from "@/domain/projects/constants";

function CollapseButton({
  collapsed,
  label,
  onClick,
}: {
  collapsed: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={!collapsed}
      aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
      title={`${collapsed ? "Expand" : "Collapse"} ${label}`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-white text-[var(--ink-subtle)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
    >
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        {collapsed ? (
          <path d="m4.5 6.25 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="m4.5 9.75 3.5-3.5 3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

export function DashboardContent({
  visibleTaskCount,
  filteredRecurringOverdueItems,
  filteredRecurringTodayItems,
  filteredOverdueItems,
  filteredTodayItems,
  filteredProjects,
  onEditTask,
  onCompleteTask,
  completingTaskId,
  onOpenProjects,
  onOpenProjectByName,
}: {
  visibleTaskCount: number;
  filteredRecurringOverdueItems: TaskListItem[];
  filteredRecurringTodayItems: TaskListItem[];
  filteredOverdueItems: TaskListItem[];
  filteredTodayItems: TaskListItem[];
  filteredProjects: ProjectGroup[];
  onEditTask: (taskId: string) => void;
  onCompleteTask: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId: string | null;
  onOpenProjects: () => void;
  onOpenProjectByName: (projectName: string) => void;
}) {
  const { isSectionCollapsed, toggleSection } = usePersistedCollapsedSections(
    "taskewr.dashboard.collapsedSections",
  );
  const recurringCollapsed = isSectionCollapsed("recurring");
  const recurringOverdueCollapsed = isSectionCollapsed("recurring.overdue");
  const recurringTodayCollapsed = isSectionCollapsed("recurring.today");
  const focusCollapsed = isSectionCollapsed("focus");
  const focusOverdueCollapsed = isSectionCollapsed("focus.overdue");
  const focusTodayCollapsed = isSectionCollapsed("focus.today");
  const projectsCollapsed = isSectionCollapsed("projects");

  return (
    <div className="space-y-5">
      <section className="grid gap-2 lg:grid-cols-3">
        <MetricCard label="Active tasks" value={String(visibleTaskCount)} tone="green" detail="+3 this week" />
        <MetricCard label="Overdue" value={String(filteredOverdueItems.length)} tone="red" detail="Needs attention" />
        <MetricCard label="Due today" value={String(filteredTodayItems.length)} tone="amber" detail="Current focus" />
      </section>

      <section className="space-y-5">
        <article className="rounded-2xl border border-[rgba(37,99,235,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(246,249,255,1)_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(37,99,235)]">
                Recurring tasks
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                Scheduled work window
              </h2>
            </div>
            <CollapseButton
              collapsed={recurringCollapsed}
              label="recurring tasks"
              onClick={() => toggleSection("recurring")}
            />
          </header>
          {!recurringCollapsed ? (
            <div className="mt-4 space-y-4">
              {filteredRecurringOverdueItems.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-[rgba(193,62,62,0.14)] bg-white">
                  <div className="flex items-center justify-between border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 py-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Overdue
                      </h3>
                      <CountPill tone="red">{filteredRecurringOverdueItems.length}</CountPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-red)]">
                        Needs action now
                      </p>
                      <CollapseButton
                        collapsed={recurringOverdueCollapsed}
                        label="overdue"
                        onClick={() => toggleSection("recurring.overdue")}
                      />
                    </div>
                  </div>
                  {!recurringOverdueCollapsed ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <TaskTableHeader />
                        <tbody>
                          {filteredRecurringOverdueItems.map((item) => (
                            <HorizontalListRow
                              key={item.id}
                              {...item}
                              onEdit={onEditTask}
                              onComplete={onCompleteTask}
                              isCompleting={completingTaskId === item.id}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="overflow-hidden rounded-xl border border-[rgba(37,99,235,0.12)] bg-white">
                <div className="flex items-center justify-between border-b border-[rgba(37,99,235,0.12)] bg-[rgba(37,99,235,0.04)] px-4 py-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                      Today and Unscheduled
                    </h3>
                    <CountPill tone="blue">{filteredRecurringTodayItems.length}</CountPill>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(37,99,235)]">
                      Scheduled focus
                    </p>
                    <CollapseButton
                      collapsed={recurringTodayCollapsed}
                      label="today and unscheduled"
                      onClick={() => toggleSection("recurring.today")}
                    />
                  </div>
                </div>
                {!recurringTodayCollapsed ? (
                  <>
                    {filteredRecurringTodayItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                          <TaskTableHeader />
                          <tbody>
                            {filteredRecurringTodayItems.map((item) => (
                              <FocusItem
                                key={item.id}
                                {...item}
                                onEdit={onEditTask}
                                onComplete={onCompleteTask}
                                isCompleting={completingTaskId === item.id}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
                        No recurring tasks due today or unscheduled match the current filters.
                      </div>
                    )}
                  </>
                ) : null}
              </section>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[rgba(34,122,89,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,252,250,1)_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Focus for today
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                Current work window
              </h2>
            </div>
            <CollapseButton
              collapsed={focusCollapsed}
              label="focus"
              onClick={() => toggleSection("focus")}
            />
          </header>
          {!focusCollapsed ? (
            <div className="mt-4 space-y-4">
              {filteredOverdueItems.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-[rgba(193,62,62,0.14)] bg-white">
                  <div className="flex items-center justify-between border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 py-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Overdue
                      </h3>
                      <CountPill tone="red">{filteredOverdueItems.length}</CountPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-red)]">
                        Needs action now
                      </p>
                      <CollapseButton
                        collapsed={focusOverdueCollapsed}
                        label="overdue"
                        onClick={() => toggleSection("focus.overdue")}
                      />
                    </div>
                  </div>
                  {!focusOverdueCollapsed ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <TaskTableHeader />
                        <tbody>
                          {filteredOverdueItems.map((item) => (
                            <HorizontalListRow
                              key={item.id}
                              {...item}
                              onEdit={onEditTask}
                              onComplete={onCompleteTask}
                              isCompleting={completingTaskId === item.id}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="overflow-hidden rounded-xl border border-[rgba(34,122,89,0.12)] bg-white">
                <div className="flex items-center justify-between border-b border-[rgba(34,122,89,0.12)] bg-[rgba(34,122,89,0.04)] px-4 py-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                      Today and Unscheduled
                    </h3>
                    <CountPill tone="green">{filteredTodayItems.length}</CountPill>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                      Active today
                    </p>
                    <CollapseButton
                      collapsed={focusTodayCollapsed}
                      label="today and unscheduled"
                      onClick={() => toggleSection("focus.today")}
                    />
                  </div>
                </div>
                {!focusTodayCollapsed ? (
                  <>
                    {filteredTodayItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                          <TaskTableHeader />
                          <tbody>
                            {filteredTodayItems.map((item) => (
                              <FocusItem
                                key={item.id}
                                {...item}
                                onEdit={onEditTask}
                                onComplete={onCompleteTask}
                                isCompleting={completingTaskId === item.id}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
                        No tasks due today or unscheduled match the current filters.
                      </div>
                    )}
                  </>
                ) : null}
              </section>
            </div>
          ) : null}
        </article>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
              By project
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
              Active tasks grouped by project
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProjects}
              className="text-sm font-medium text-[var(--ink-subtle)] transition hover:text-[var(--ink-strong)]"
            >
              View all projects
            </button>
            <CollapseButton
              collapsed={projectsCollapsed}
              label="project groups"
              onClick={() => toggleSection("projects")}
            />
          </div>
        </div>

        {!projectsCollapsed && filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectSection
              key={project.name}
              {...project}
              onEdit={onEditTask}
              onComplete={onCompleteTask}
              completingTaskId={completingTaskId}
              onOpenProject={onOpenProjectByName}
            />
          ))
        ) : !projectsCollapsed ? (
          <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
            No project groups match the current filters.
          </section>
        ) : null}
      </section>
    </div>
  );
}

export function ProjectsContent({
  activeProjects,
  archivedProjects,
  visibleProjectTaskCount,
  showArchivedProjects,
  onToggleArchived,
  onEditProject,
  onMoveProject,
  onQuickUnarchive,
  projectReorderPendingId,
  onOpenProject,
}: {
  activeProjects: AppProject[];
  archivedProjects: AppProject[];
  visibleProjectTaskCount: number;
  showArchivedProjects: boolean;
  onToggleArchived: () => void;
  onEditProject: (projectId: string) => void;
  onMoveProject: (projectId: string, direction: "up" | "down") => void;
  onQuickUnarchive: (projectId: string) => void;
  projectReorderPendingId: string | null;
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard
          label="Active projects"
          value={String(activeProjects.length)}
          tone="green"
          detail={`${visibleProjectTaskCount} active tasks`}
        />
        <MetricCard
          label="Archived"
          value={String(archivedProjects.length)}
          tone="neutral"
          detail="Hidden from dashboard"
        />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
              Projects
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
              Active projects
            </h2>
          </div>
          <p className="text-sm text-[var(--ink-subtle)]">
            Reorder, edit, or archive projects without leaving the list.
          </p>
        </div>

        {activeProjects.length > 0 ? (
          <div className="space-y-5">
            {activeProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onEdit={onEditProject}
                onMove={onMoveProject}
                onUnarchive={onQuickUnarchive}
                isReordering={projectReorderPendingId === project.id}
                onOpen={onOpenProject}
              />
            ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
            No active projects yet. Create the first one to start organizing work.
          </section>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              Archived projects
            </p>
            <p className="mt-1 text-sm text-[var(--ink-subtle)]">
              Hidden from the dashboard, but still available for reference.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleArchived}
            className="inline-flex h-9 items-center rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
          >
            {showArchivedProjects ? "Hide archived" : "Show archived"}
          </button>
        </div>

        {showArchivedProjects ? (
          archivedProjects.length > 0 ? (
            <div className="space-y-5">
              {archivedProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={onEditProject}
                  onMove={onMoveProject}
                  onUnarchive={onQuickUnarchive}
                  isReordering={projectReorderPendingId === project.id}
                  onOpen={onOpenProject}
                />
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
              No archived projects yet.
            </section>
          )
        ) : null}
      </section>
    </div>
  );
}

export function ProjectDetailContent({
  selectedProject,
  selectedProjectOverdueTasks,
  selectedProjectActiveTasks,
  selectedProjectCompletedTasks,
  projectView,
  projectBoardGroups,
  selectedProjectTasks,
  draggingProjectTaskId,
  onDragTaskStart,
  onDragTaskEnd,
  onEditTask,
  onCompleteTask,
  completingTaskId,
  onMoveTask,
  onEditProject,
  onBackToProjects,
}: {
  selectedProject: AppProject;
  selectedProjectOverdueTasks: TaskListItem[];
  selectedProjectActiveTasks: TaskListItem[];
  selectedProjectCompletedTasks: TaskListItem[];
  projectView: ProjectView;
  projectBoardGroups: {
    todo: TaskListItem[];
    inProgress: TaskListItem[];
    completed: TaskListItem[];
  };
  selectedProjectTasks: TaskListItem[];
  draggingProjectTaskId: string | null;
  onDragTaskStart: (taskId: string) => void;
  onDragTaskEnd: () => void;
  onEditTask: (taskId: string) => void;
  onCompleteTask: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId: string | null;
  onMoveTask: (taskId: string, nextStatus: TaskStatus) => void;
  onEditProject: () => void;
  onBackToProjects: () => void;
}) {
  const { isSectionCollapsed, toggleSection } = usePersistedCollapsedSections(
    `taskewr.project.${selectedProject.id}.collapsedSections`,
  );
  const projectOverdueCollapsed = isSectionCollapsed("overdue");
  const projectActiveCollapsed = isSectionCollapsed("active");
  const projectCompletedCollapsed = isSectionCollapsed("completed");

  return (
    <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            Project
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
            {selectedProject.name}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
            {selectedProject.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditProject}
            className="inline-flex h-8 items-center rounded-lg border border-[var(--line-soft)] bg-white px-2.5 text-[13px] font-medium text-[var(--ink-muted)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
          >
            Edit Project
          </button>
          <button
            type="button"
            onClick={onBackToProjects}
            className="inline-flex h-8 items-center rounded-lg border border-[rgba(34,122,89,0.16)] bg-[rgba(34,122,89,0.08)] px-2.5 text-[13px] font-medium text-[var(--accent-strong)] transition hover:bg-[rgba(34,122,89,0.12)]"
          >
            Back to Projects
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="space-y-5">
          {selectedProjectOverdueTasks.length > 0 ? (
            <section className="overflow-hidden rounded-xl border border-[rgba(193,62,62,0.14)] bg-white">
              <div className="flex items-center justify-between border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 py-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Overdue
                  </h3>
                  <CountPill tone="red">{selectedProjectOverdueTasks.length}</CountPill>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-red)]">
                    Needs action now
                  </p>
                  <CollapseButton
                    collapsed={projectOverdueCollapsed}
                    label="overdue"
                    onClick={() => toggleSection("overdue")}
                  />
                </div>
              </div>
              {!projectOverdueCollapsed ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <TaskTableHeader showProject={false} />
                    <tbody>
                      {selectedProjectOverdueTasks.map((item) => (
                        <HorizontalListRow
                          key={item.id}
                          {...item}
                          onEdit={onEditTask}
                          onComplete={onCompleteTask}
                          isCompleting={completingTaskId === item.id}
                          showProject={false}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ) : null}

          {projectView === "board" ? (
            <div className="grid gap-5 xl:grid-cols-3">
              <ProjectBoardLane
                title="Todo"
                laneStatus="todo"
                items={projectBoardGroups.todo}
                onEdit={onEditTask}
                onComplete={onCompleteTask}
                completingTaskId={completingTaskId}
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
              <ProjectBoardLane
                title="In progress"
                laneStatus="in_progress"
                items={projectBoardGroups.inProgress}
                onEdit={onEditTask}
                onComplete={onCompleteTask}
                completingTaskId={completingTaskId}
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
              <ProjectBoardLane
                title="Completed"
                laneStatus="done"
                items={projectBoardGroups.completed}
                onEdit={onEditTask}
                onComplete={onCompleteTask}
                completingTaskId={completingTaskId}
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
            </div>
          ) : (
            <>
              {selectedProjectActiveTasks.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-[var(--line-soft)] bg-white">
                  <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Active
                      </h3>
                      <CountPill tone="green">{selectedProjectActiveTasks.length}</CountPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                        Current work
                      </p>
                      <CollapseButton
                        collapsed={projectActiveCollapsed}
                        label="active"
                        onClick={() => toggleSection("active")}
                      />
                    </div>
                  </div>
                  {!projectActiveCollapsed ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <TaskTableHeader showProject={false} />
                        <tbody>
                          {selectedProjectActiveTasks.map((item) => (
                            <HorizontalListRow
                              key={item.id}
                              {...item}
                              onEdit={onEditTask}
                              onComplete={onCompleteTask}
                              isCompleting={completingTaskId === item.id}
                              showProject={false}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {selectedProjectCompletedTasks.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-[var(--line-soft)] bg-white">
                  <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Completed
                      </h3>
                      <CountPill tone="green">{selectedProjectCompletedTasks.length}</CountPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Finished work
                      </p>
                      <CollapseButton
                        collapsed={projectCompletedCollapsed}
                        label="completed"
                        onClick={() => toggleSection("completed")}
                      />
                    </div>
                  </div>
                  {!projectCompletedCollapsed ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <TaskTableHeader showProject={false} />
                        <tbody>
                          {selectedProjectCompletedTasks.map((item) => (
                            <HorizontalListRow
                              key={item.id}
                              {...item}
                              onEdit={onEditTask}
                              onComplete={onCompleteTask}
                              isCompleting={completingTaskId === item.id}
                              showProject={false}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {selectedProjectTasks.length === 0 ? (
                <section className="rounded-xl border border-[var(--line-soft)] bg-white px-4 py-6 text-sm text-[var(--ink-subtle)]">
                  No tasks match the current view and filters for this project.
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
