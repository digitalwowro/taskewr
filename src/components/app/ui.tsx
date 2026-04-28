import type { ReactNode } from "react";
import type { AppProject } from "@/app/app-data";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";

export function StatusPill({
  tone,
  children,
}: {
  tone:
    | "neutral"
    | "green"
    | "amber"
    | "red"
    | "blue"
    | "black"
    | "priorityGray"
    | "priorityBlue"
    | "priorityOrange"
    | "priorityRed";
  children: ReactNode;
}) {
  const tones = {
    neutral:
      "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
    green:
      "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]",
    amber:
      "border-[rgba(199,138,20,0.18)] bg-[rgba(199,138,20,0.08)] text-[var(--accent-amber)]",
    red: "border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] text-[var(--accent-red)]",
    blue: "border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] text-[rgb(37,99,235)]",
    black:
      "border-[rgba(15,23,42,0.28)] bg-[rgba(15,23,42,0.12)] text-[rgb(15,23,42)]",
    priorityGray:
      "border-[rgba(100,116,139,0.2)] bg-[rgba(100,116,139,0.08)] text-[rgb(71,85,105)]",
    priorityBlue:
      "border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.1)] text-[rgb(30,64,175)]",
    priorityOrange:
      "border-[rgba(234,88,12,0.2)] bg-[rgba(234,88,12,0.09)] text-[rgb(194,65,12)]",
    priorityRed:
      "border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.09)] text-[rgb(185,28,28)]",
  };

  return (
    <span
      className={`inline-flex h-7 items-center justify-center rounded-full border px-2.5 text-center text-[11px] font-medium leading-none whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function getStatusTone(status: string): "neutral" | "green" | "amber" | "red" | "blue" | "black" {
  switch (status) {
    case "Backlog":
      return "neutral";
    case "Todo":
      return "blue";
    case "In Progress":
    case "In progress":
      return "red";
    case "Completed":
      return "green";
    case "Canceled":
      return "black";
    default:
      return "neutral";
  }
}

function getPriorityTone(
  priority: string,
): "priorityGray" | "priorityBlue" | "priorityOrange" | "priorityRed" {
  switch (priority) {
    case "Urgent":
      return "priorityRed";
    case "High":
      return "priorityOrange";
    case "Medium":
      return "priorityBlue";
    case "Low":
    default:
      return "priorityGray";
  }
}

function RepeatBadge({ task }: { task: Pick<TaskListItem, "repeatRuleId" | "repeatCarryCount"> }) {
  if (!task.repeatRuleId) {
    return null;
  }

  return (
    <span className="inline-flex h-6 items-center rounded-full border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
      {(task.repeatCarryCount ?? 0) > 0 ? "Carried" : "Repeats"}
    </span>
  );
}

function getTaskCompletionClass(isCompleting?: boolean) {
  return isCompleting ? "pointer-events-none translate-y-1 opacity-0" : "";
}

const taskTableHeaderClass =
  "border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]";
const taskTableCellClass = "border-b border-[var(--line-soft)] px-4 py-3 align-middle";

export function TaskTableHeader({ showProject = true }: { showProject?: boolean }) {
  return (
    <thead>
      <tr>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-left`}>
          <span className="sr-only">Complete</span>
        </th>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-left`}>
          Task
        </th>
        <th scope="col" className={`${taskTableHeaderClass} text-left`}>
          Title
        </th>
        {showProject ? (
          <th scope="col" className={`${taskTableHeaderClass} w-px text-center`}>
            Project
          </th>
        ) : null}
        <th scope="col" className={`${taskTableHeaderClass} w-px text-center`}>
          Status
        </th>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-center`}>
          Priority
        </th>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-right`}>
          Due
        </th>
      </tr>
    </thead>
  );
}

function TaskCompleteButton({
  task,
  isCompleting,
  onComplete,
}: {
  task: Pick<TaskListItem, "id" | "statusValue">;
  isCompleting?: boolean;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
}) {
  const isDone = task.statusValue === "done";

  return (
    <button
      type="button"
      disabled={isCompleting || !onComplete}
      onClick={(event) => {
        event.stopPropagation();
        onComplete?.(task);
      }}
      aria-label={isDone ? "Mark task incomplete" : "Mark task complete"}
      title={isDone ? "Mark task incomplete" : "Mark task complete"}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
        isDone
          ? "border-[rgba(34,122,89,0.22)] bg-[var(--accent-strong)] text-white hover:bg-[rgb(43,107,79)] focus-visible:bg-[rgb(43,107,79)]"
          : "border-[var(--line-strong)] bg-white text-transparent hover:border-[rgba(34,122,89,0.24)] hover:bg-[rgba(34,122,89,0.08)] hover:text-[var(--accent-strong)] focus-visible:border-[rgba(34,122,89,0.24)] focus-visible:text-[var(--accent-strong)]"
      } ${isCompleting ? "cursor-wait opacity-70" : ""}`}
    >
      {isCompleting ? (
        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[rgba(34,122,89,0.24)] border-t-[var(--accent-strong)]" />
      ) : (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m3.75 8.25 2.75 2.75 5.75-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function CountPill({
  tone,
  children,
}: {
  tone: "green" | "red" | "blue";
  children: ReactNode;
}) {
  const tones = {
    green:
      "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]",
    red: "border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] text-[var(--accent-red)]",
    blue: "border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] text-[rgb(37,99,235)]",
  };

  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-center text-[11px] font-medium leading-none whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function FilterChip({
  active,
  compact = false,
  onClick,
  children,
}: {
  active: boolean;
  compact?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border font-medium transition ${
        compact ? "h-7 px-3 text-[12px]" : "h-6 px-2.5 text-[12px]"
      } ${
        active
          ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
          : "border-[var(--line-strong)] bg-[var(--surface-card)] text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
      }`}
    >
      {children}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "neutral" | "amber";
  detail: string;
}) {
  const toneMap = {
    green: "text-[var(--accent-strong)]",
    red: "text-[var(--accent-red)]",
    amber: "text-[var(--accent-amber)]",
    neutral: "text-[var(--ink-strong)]",
  };

  return (
    <article className="rounded-2xl border border-[var(--line-soft)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`text-3xl font-semibold tracking-[-0.05em] ${toneMap[tone]}`}>
          {value}
        </p>
        <p className="pb-1 text-xs text-[var(--ink-subtle)]">{detail}</p>
      </div>
    </article>
  );
}

export function FocusItem({
  id,
  title,
  project,
  status,
  statusValue,
  due,
  priority,
  onEdit,
  onComplete,
  isCompleting,
  repeatRuleId,
  repeatCarryCount,
  showProject = true,
}: {
  id: string;
  title: string;
  project: string;
  status: string;
  statusValue: TaskListItem["statusValue"];
  due: string;
  priority: string;
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  isCompleting?: boolean;
  repeatRuleId?: string | null;
  repeatCarryCount?: number;
  showProject?: boolean;
}) {
  const statusTone = getStatusTone(status);
  const priorityTone = getPriorityTone(priority);

  return (
    <tr
      className={`text-sm transition-all duration-500 ease-out hover:bg-[var(--surface-subtle)] ${getTaskCompletionClass(isCompleting)}`}
    >
      <td className={`${taskTableCellClass} w-px`}>
        <TaskCompleteButton
          task={{ id, statusValue }}
          isCompleting={isCompleting}
          onComplete={onComplete}
        />
      </td>
      <td
        className={`${taskTableCellClass} w-px whitespace-nowrap font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]`}
      >
        {id}
      </td>
      <td className={`${taskTableCellClass} min-w-0`}>
        <span className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="min-w-0 truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
          >
            {title}
          </button>
          <RepeatBadge task={{ repeatRuleId, repeatCarryCount }} />
        </span>
      </td>
      {showProject ? (
        <td
          className={`${taskTableCellClass} w-px text-center text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
        >
          {project}
        </td>
      ) : null}
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={statusTone}>{status}</StatusPill>
      </td>
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={priorityTone}>{priority}</StatusPill>
      </td>
      <td
        className={`${taskTableCellClass} w-px text-right text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
      >
        {due}
      </td>
    </tr>
  );
}

export function HorizontalListRow({
  id,
  title,
  project,
  due,
  status,
  statusValue = "todo",
  priority,
  onEdit,
  onComplete,
  isCompleting,
  repeatRuleId,
  repeatCarryCount,
  showProject = true,
}: {
  id: string;
  title: string;
  project: string;
  due: string;
  status?: string;
  statusValue?: TaskListItem["statusValue"];
  priority?: string;
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  isCompleting?: boolean;
  repeatRuleId?: string | null;
  repeatCarryCount?: number;
  showProject?: boolean;
}) {
  const statusTone = getStatusTone(status ?? "Todo");
  const priorityTone = getPriorityTone(priority ?? "Low");

  return (
    <tr
      className={`text-sm transition-all duration-500 ease-out hover:bg-[var(--surface-subtle)] ${getTaskCompletionClass(isCompleting)}`}
    >
      <td className={`${taskTableCellClass} w-px`}>
        <TaskCompleteButton
          task={{ id, statusValue }}
          isCompleting={isCompleting}
          onComplete={onComplete}
        />
      </td>
      <td
        className={`${taskTableCellClass} w-px whitespace-nowrap font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]`}
      >
        {id}
      </td>
      <td className={`${taskTableCellClass} min-w-0`}>
        <span className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="min-w-0 truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
          >
            {title}
          </button>
          <RepeatBadge task={{ repeatRuleId, repeatCarryCount }} />
        </span>
      </td>
      {showProject ? (
        <td
          className={`${taskTableCellClass} w-px text-center text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
        >
          {project}
        </td>
      ) : null}
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={statusTone}>{status ?? "Todo"}</StatusPill>
      </td>
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={priorityTone}>{priority ?? "Low"}</StatusPill>
      </td>
      <td
        className={`${taskTableCellClass} w-px text-right text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
      >
        {due}
      </td>
    </tr>
  );
}

export function ProjectSection({
  name,
  items,
  onEdit,
  onComplete,
  completingTaskId,
  onOpenProject,
}: {
  name: string;
  items: {
    project: string;
    id: string;
    title: string;
    status: string;
    priority: string;
    due: string;
    statusValue: TaskListItem["statusValue"];
    repeatRuleId?: string | null;
    repeatCarryCount?: number;
  }[];
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId?: string | null;
  onOpenProject: (projectName: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)] px-5 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {name}
          </h2>
          <span className="text-sm text-[var(--ink-subtle)]">{items.length}</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenProject(name)}
          className="text-sm font-medium text-[var(--ink-subtle)] transition hover:text-[var(--ink-strong)]"
        >
          Open project
        </button>
      </header>
      <div className="overflow-x-auto">
        {items.length > 0 ? (
          <table className="min-w-full table-auto border-collapse">
            <TaskTableHeader showProject={false} />
            <tbody>
              {items.map((item) => {
                const statusTone = getStatusTone(item.status);
                const priorityTone = getPriorityTone(item.priority);

                return (
                  <tr
                    key={item.id}
                    className={`text-sm transition-all duration-500 ease-out hover:bg-[var(--surface-subtle)] ${getTaskCompletionClass(completingTaskId === item.id)}`}
                  >
                    <td className={`${taskTableCellClass} w-px pl-5`}>
                      <TaskCompleteButton
                        task={item}
                        isCompleting={completingTaskId === item.id}
                        onComplete={onComplete}
                      />
                    </td>
                    <td
                      className={`${taskTableCellClass} w-px whitespace-nowrap font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]`}
                    >
                      {item.id}
                    </td>
                    <td className={`${taskTableCellClass} min-w-0`}>
                      <span className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item.id)}
                          className="min-w-0 truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
                        >
                          {item.title}
                        </button>
                        <RepeatBadge task={item} />
                      </span>
                    </td>
                    <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
                      <StatusPill tone={statusTone}>{item.status}</StatusPill>
                    </td>
                    <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
                      <StatusPill tone={priorityTone}>{item.priority}</StatusPill>
                    </td>
                    <td
                      className={`${taskTableCellClass} w-px pr-5 text-right text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
                    >
                      {item.due}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-6 text-sm text-[var(--ink-subtle)]">
            No tasks in this project match the current filters.
          </div>
        )}
      </div>
    </section>
  );
}

export function ProjectStatusBadge({ archived }: { archived?: boolean }) {
  return archived ? (
    <span className="inline-flex h-6 items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-subtle)] px-2.5 text-[11px] font-medium text-[var(--ink-muted)]">
      Archived
    </span>
  ) : (
    <span className="inline-flex h-6 items-center rounded-full border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] px-2.5 text-[11px] font-medium text-[var(--accent-strong)]">
      Active
    </span>
  );
}

export function ProjectRow({
  project,
  onEdit,
  onOpen,
  onMove,
  onUnarchive,
  isReordering,
}: {
  project: AppProject;
  onEdit: (projectId: string) => void;
  onOpen: (projectId: string) => void;
  onMove: (projectId: string, direction: "up" | "down") => void;
  onUnarchive: (projectId: string) => void;
  isReordering: boolean;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(project.id);
        }
      }}
      className={`rounded-2xl border bg-white p-5 transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-card)] ${
        project.isArchived
          ? "border-[var(--line-soft)] opacity-80"
          : "border-[var(--line-soft)]"
      } cursor-pointer`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
              Project
            </p>
            <ProjectStatusBadge archived={project.isArchived} />
            <span className="inline-flex h-6 items-center rounded-full bg-[var(--surface-subtle)] px-2.5 text-[11px] font-medium text-[var(--ink-muted)]">
              {project.taskCount} tasks
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              {project.name}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
              {project.description}
            </p>
          </div>
          <p className="text-xs text-[var(--ink-subtle)]">{project.updatedLabel}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 xl:max-w-[24rem]">
          {!project.isArchived ? (
            <div className="flex h-8 items-center gap-0.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-0.5">
              <button
                type="button"
                disabled={isReordering}
                onClick={(event) => {
                  event.stopPropagation();
                  onMove(project.id, "up");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
                aria-label="Move project up"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                disabled={isReordering}
                onClick={(event) => {
                  event.stopPropagation();
                  onMove(project.id, "down");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
                aria-label="Move project down"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M8 3.5v9M4.5 9 8 12.5 11.5 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : null}
          <button
            type="button"
            disabled={isReordering}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(project.id);
            }}
            className="inline-flex h-8 items-center rounded-lg border border-[var(--line-soft)] bg-white px-2.5 text-[13px] font-medium text-[var(--ink-muted)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
          >
            Edit
          </button>
          {project.isArchived ? (
            <button
              type="button"
              disabled={isReordering}
              onClick={(event) => {
                event.stopPropagation();
                onUnarchive(project.id);
              }}
              className="inline-flex h-8 items-center rounded-lg border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-2.5 text-[13px] font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-wait disabled:opacity-60"
            >
              Unarchive
            </button>
          ) : null}
          <button
            type="button"
            disabled={isReordering}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(project.id);
            }}
            className="inline-flex h-8 items-center rounded-lg border border-[rgba(34,122,89,0.16)] bg-[rgba(34,122,89,0.08)] px-2.5 text-[13px] font-medium text-[var(--accent-strong)] transition hover:bg-[rgba(34,122,89,0.12)] disabled:cursor-wait disabled:opacity-60"
          >
            Open project
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProjectBoardLane({
  title,
  laneStatus,
  items,
  onEdit,
  onComplete,
  completingTaskId,
  onMoveTask,
  draggingTaskId,
  onDragTaskStart,
  onDragTaskEnd,
}: {
  title: string;
  laneStatus: TaskStatus;
  items: TaskListItem[];
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId?: string | null;
  onMoveTask: (taskId: string, nextStatus: TaskStatus) => void;
  draggingTaskId: string | null;
  onDragTaskStart: (taskId: string) => void;
  onDragTaskEnd: () => void;
}) {
  const isDropActive = draggingTaskId !== null;

  return (
    <section
      className={`rounded-2xl border bg-white transition ${
        isDropActive
          ? "border-[rgba(34,122,89,0.18)] shadow-[0_0_0_1px_rgba(34,122,89,0.08)]"
          : "border-[var(--line-soft)]"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();

        if (draggingTaskId) {
          onMoveTask(draggingTaskId, laneStatus);
        }

        onDragTaskEnd();
      }}
    >
      <header className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
            {title}
          </h3>
          <span className="text-xs text-[var(--ink-subtle)]">{items.length}</span>
        </div>
      </header>
      <div className="min-h-[10rem] space-y-3 p-3">
        {items.length > 0 ? items.map((item) => {
          const statusTone = getStatusTone(item.status);
          const priorityTone = getPriorityTone(item.priority);

          return (
            <article
              key={item.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                onDragTaskStart(item.id);
              }}
              onDragEnd={onDragTaskEnd}
              className={`rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-3 transition-all duration-500 ease-out hover:bg-[var(--surface-subtle)] ${
                draggingTaskId === item.id ? "opacity-60" : ""
              } ${getTaskCompletionClass(completingTaskId === item.id)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TaskCompleteButton
                    task={item}
                    isCompleting={completingTaskId === item.id}
                    onComplete={onComplete}
                  />
                  <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]">
                    {item.id}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--ink-subtle)]">{item.due}</span>
              </div>
              <button
                type="button"
                onClick={() => onEdit(item.id)}
                className="mt-2 block text-left text-sm font-medium leading-6 text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
              >
                {item.title}
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={statusTone}>{item.status}</StatusPill>
                <StatusPill tone={priorityTone}>{item.priority}</StatusPill>
                <RepeatBadge task={item} />
              </div>
            </article>
          );
        }) : (
          <div className="flex min-h-[8rem] items-center justify-center rounded-xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-subtle)]/45 px-4 text-center text-sm text-[var(--ink-subtle)]">
            No tasks in this stage.
          </div>
        )}
      </div>
    </section>
  );
}
