"use client";

import type { MockProject, ProjectGroup } from "@/app/mock-app-data";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";
import {
  CountPill,
  FocusItem,
  HorizontalListRow,
  MetricCard,
  ProjectBoardLane,
  ProjectMockRow,
  ProjectSection,
} from "@/components/mock-app/ui";
import type { ProjectView } from "@/domain/projects/constants";

export function DashboardContent({
  visibleTaskCount,
  filteredOverdueItems,
  filteredTodayItems,
  filteredProjects,
  onEditTask,
  onOpenProjects,
  onOpenProjectByName,
}: {
  visibleTaskCount: number;
  filteredOverdueItems: TaskListItem[];
  filteredTodayItems: TaskListItem[];
  filteredProjects: ProjectGroup[];
  onEditTask: (taskId: string) => void;
  onOpenProjects: () => void;
  onOpenProjectByName: (projectName: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-2 lg:grid-cols-3">
        <MetricCard label="Active tasks" value={String(visibleTaskCount)} tone="green" detail="+3 this week" />
        <MetricCard label="Overdue" value={String(filteredOverdueItems.length)} tone="red" detail="Needs attention" />
        <MetricCard label="Due today" value={String(filteredTodayItems.length)} tone="amber" detail="Current focus" />
      </section>

      <section className="space-y-5 pt-2.5">
        <article className="rounded-2xl border border-[rgba(34,122,89,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,252,250,1)_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <header>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Focus for today
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                Current work window
              </h2>
            </div>
          </header>
          <div className="mt-4 space-y-4">
            <section className="overflow-hidden rounded-xl border border-[rgba(193,62,62,0.14)] bg-white">
              <div className="flex items-center justify-between border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 py-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Overdue
                  </h3>
                  <CountPill tone="red">{filteredOverdueItems.length}</CountPill>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-red)]">
                  Needs action now
                </p>
              </div>
            <div className="grid grid-cols-[78px_minmax(0,1fr)_144px_96px_96px_110px] items-center gap-4 border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                <span>Task</span>
                <span>Title</span>
                <span className="text-center">Project</span>
                <span className="text-center">Status</span>
                <span className="text-center">Priority</span>
                <span className="text-right">Due</span>
              </div>
              {filteredOverdueItems.length > 0 ? (
                filteredOverdueItems.map((item) => (
                  <HorizontalListRow key={item.id} {...item} onEdit={onEditTask} />
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
                  No overdue tasks match the current filters.
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-[rgba(34,122,89,0.12)] bg-white">
              <div className="flex items-center justify-between border-b border-[rgba(34,122,89,0.12)] bg-[rgba(34,122,89,0.04)] px-4 py-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Everything else
                  </h3>
                  <CountPill tone="green">{filteredTodayItems.length}</CountPill>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Active today
                </p>
              </div>
              <div className="grid grid-cols-[84px_minmax(0,1fr)_144px_96px_96px_110px] items-center gap-4 border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                <span>Task</span>
                <span>Title</span>
                <span className="text-center">Project</span>
                <span className="text-center">Status</span>
                <span className="text-center">Priority</span>
                <span className="text-right">Due</span>
              </div>
              {filteredTodayItems.length > 0 ? (
                filteredTodayItems.map((item) => (
                  <FocusItem key={item.id} {...item} onEdit={onEditTask} />
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
                  No active tasks match the current filters.
                </div>
              )}
            </section>
          </div>
        </article>
      </section>

      <section className="space-y-4 pt-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
              By project
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
              Active tasks grouped by project
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenProjects}
            className="text-sm font-medium text-[var(--ink-subtle)] transition hover:text-[var(--ink-strong)]"
          >
            View all projects
          </button>
        </div>

        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectSection
              key={project.name}
              {...project}
              onEdit={onEditTask}
              onOpenProject={onOpenProjectByName}
            />
          ))
        ) : (
          <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
            No project groups match the current filters.
          </section>
        )}
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
  activeProjects: MockProject[];
  archivedProjects: MockProject[];
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
    <div className="space-y-6">
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

      <section className="space-y-4">
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
          <div className="space-y-3">
            {activeProjects.map((project) => (
              <ProjectMockRow
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

      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-4">
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
            <div className="space-y-3">
              {archivedProjects.map((project) => (
                <ProjectMockRow
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
  projectView,
  projectBoardGroups,
  selectedProjectTasks,
  draggingProjectTaskId,
  onDragTaskStart,
  onDragTaskEnd,
  onEditTask,
  onMoveTask,
  onEditProject,
  onBackToProjects,
}: {
  selectedProject: MockProject;
  selectedProjectOverdueTasks: TaskListItem[];
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
  onMoveTask: (taskId: string, nextStatus: TaskStatus) => void;
  onEditProject: () => void;
  onBackToProjects: () => void;
}) {
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
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-[rgba(193,62,62,0.14)] bg-white">
            <div className="flex items-center justify-between border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 py-2">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                  Overdue
                </h3>
                <CountPill tone="red">{selectedProjectOverdueTasks.length}</CountPill>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-red)]">
                Needs action now
              </p>
            </div>
            <div className="grid grid-cols-[78px_minmax(0,1fr)_144px_96px_96px_110px] items-center gap-4 border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              <span>Task</span>
              <span>Title</span>
              <span className="text-center">Project</span>
              <span className="text-center">Status</span>
              <span className="text-center">Priority</span>
              <span className="text-right">Due</span>
            </div>
            {selectedProjectOverdueTasks.length > 0 ? (
              selectedProjectOverdueTasks.map((item) => (
                <HorizontalListRow key={item.id} {...item} onEdit={onEditTask} />
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
                No overdue tasks in this project.
              </div>
            )}
          </section>

          {projectView === "board" ? (
            <div className="grid gap-4 xl:grid-cols-3">
              <ProjectBoardLane
                title="Todo"
                laneStatus="todo"
                items={projectBoardGroups.todo}
                onEdit={onEditTask}
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
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border border-[var(--line-soft)] bg-white">
              <div className="grid grid-cols-[78px_minmax(0,1fr)_144px_96px_96px_110px] items-center gap-4 border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                <span>Task</span>
                <span>Title</span>
                <span className="text-center">Project</span>
                <span className="text-center">Status</span>
                <span className="text-center">Priority</span>
                <span className="text-right">Due</span>
              </div>
              {selectedProjectTasks.length > 0 ? (
                selectedProjectTasks.map((item) => (
                  <HorizontalListRow key={item.id} {...item} onEdit={onEditTask} />
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
                  No tasks match the current view and filters for this project.
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
