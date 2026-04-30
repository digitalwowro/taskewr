import type { MouseEvent, ReactNode } from "react";
import type { AppProject } from "@/app/app-data";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";

export function StatusPill({
  tone,
  compact = false,
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
  compact?: boolean;
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
      className={`inline-flex items-center justify-center rounded-full border text-center font-medium leading-none whitespace-nowrap ${compact ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]"} ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ModalHeaderKicker({
  code,
  label,
  tone = "neutral",
  children,
}: {
  code: ReactNode;
  label?: ReactNode;
  tone?: "neutral" | "danger";
  children?: ReactNode;
}) {
  const codeTone =
    tone === "danger"
      ? "bg-[rgba(193,62,62,0.06)] text-[var(--accent-red)]"
      : "bg-[var(--surface-subtle)] text-[var(--ink-subtle)]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`inline-flex h-7 items-center justify-center rounded-full px-3 font-mono text-[11px] uppercase leading-none tracking-[0.14em] ${codeTone}`}
      >
        {code}
      </span>
      {label ? (
        <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-[var(--accent-strong)]">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export type ActionButtonTone = "neutral" | "accent" | "blue" | "danger";

const actionButtonToneClasses: Record<ActionButtonTone, string> = {
  neutral:
    "border-[var(--line-soft)] bg-white text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]",
  accent:
    "border-[rgba(34,122,89,0.16)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)] hover:bg-[rgba(34,122,89,0.12)]",
  blue:
    "border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] text-[rgb(37,99,235)] hover:bg-[rgba(37,99,235,0.12)]",
  danger:
    "border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] text-[var(--accent-red)] hover:bg-[rgba(193,62,62,0.08)]",
};

export function actionButtonClassName(tone: ActionButtonTone = "neutral") {
  return `inline-flex h-8 items-center rounded-lg border px-2.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionButtonToneClasses[tone]}`;
}

function IconActionButton({
  label,
  tooltipAlign = "center",
  tooltipSide = "top",
  tone = "neutral",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tooltipAlign?: "center" | "right";
  tooltipSide?: "top" | "bottom";
  tone?: ActionButtonTone;
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  const verticalClass = tooltipSide === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
  const horizontalClass = tooltipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60 ${actionButtonToneClasses[tone]}`}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute z-20 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${verticalClass} ${horizontalClass}`}
      >
        {label}
      </span>
    </span>
  );
}

export function IconTooltip({
  label,
  tooltipAlign = "center",
  tooltipSide = "top",
  children,
}: {
  label: string;
  tooltipAlign?: "center" | "right";
  tooltipSide?: "top" | "bottom";
  children: ReactNode;
}) {
  const verticalClass = tooltipSide === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
  const horizontalClass = tooltipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-30 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${verticalClass} ${horizontalClass}`}
      >
        {label}
      </span>
    </span>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3.25 11.75 4 8.85l5.9-5.9a1.35 1.35 0 0 1 1.9 0l1.25 1.25a1.35 1.35 0 0 1 0 1.9L7.15 12l-2.9.75h-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.1 3.75 3.15 3.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.25 4.25H4.2a1.45 1.45 0 0 0-1.45 1.45v6.1a1.45 1.45 0 0 0 1.45 1.45h6.1a1.45 1.45 0 0 0 1.45-1.45V9.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 2.75h4.75V7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7.25 8.75 5.8-5.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12.5 5.25A5 5 0 0 0 3.7 4.1L2.5 5.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 2.6v2.65h2.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 10.75a5 5 0 0 0 8.8 1.15l1.2-1.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 13.4v-2.65h-2.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 5.75h10" strokeLinecap="round" />
      <path d="M4.25 5.75v6.1A1.4 1.4 0 0 0 5.65 13.25h4.7a1.4 1.4 0 0 0 1.4-1.4v-6.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 2.75h6l1 3H4l1-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 8.5h2.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.25 7.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      <path d="M2.5 13.25c.35-2.15 1.65-3.5 3.75-3.5s3.4 1.35 3.75 3.5" strokeLinecap="round" />
      <path d="M10.8 7.05a1.8 1.8 0 1 0 0-3.35" strokeLinecap="round" />
      <path d="M11.75 9.85c1.05.35 1.75 1.45 1.95 3.1" strokeLinecap="round" />
    </svg>
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

function InlineTooltip({
  label,
  align = "center",
  children,
}: {
  label: string;
  align?: "center" | "right";
  children: ReactNode;
}) {
  const alignmentClass =
    align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${alignmentClass}`}
      >
        {label}
      </span>
    </span>
  );
}

function RepeatBadge({ task }: { task: Pick<TaskListItem, "repeatRuleId" | "repeatCarryCount"> }) {
  if (!task.repeatRuleId) {
    return null;
  }

  const carryCount = task.repeatCarryCount ?? 0;
  const label =
    carryCount > 0
      ? `Carried forward ${carryCount} time${carryCount === 1 ? "" : "s"} from a previous recurrence.`
      : "Repeats from a recurrence rule.";

  return (
    <InlineTooltip label={label}>
      <span className="inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] px-1.5 text-[10px] font-semibold text-[var(--accent-strong)]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12.5 5.25A5 5 0 0 0 3.7 4.1L2.5 5.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 2.6v2.65h2.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.5 10.75a5 5 0 0 0 8.8 1.15l1.2-1.15" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.5 13.4v-2.65h-2.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {carryCount > 0 ? <span>{carryCount}</span> : null}
      </span>
    </InlineTooltip>
  );
}

function getOverdueDaysFromLabel(due: string) {
  const match = due.match(/^(\d+) days? overdue$/);
  return match ? match[1] : null;
}

function DueDisplay({ due }: { due: string }) {
  const overdueDays = getOverdueDaysFromLabel(due);

  if (due === "No due date") {
    return (
      <InlineTooltip label="No due date" align="right">
        <span className="text-[var(--ink-subtle)]">-</span>
      </InlineTooltip>
    );
  }

  if (!overdueDays) {
    return <>{due}</>;
  }

  return (
    <InlineTooltip label={due} align="right">
      <span className="inline-flex items-center justify-end gap-1 text-[var(--accent-red)]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 4.75V8l2.2 1.45" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{overdueDays}</span>
      </span>
    </InlineTooltip>
  );
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
        <span
          className={`h-2.5 w-2.5 animate-spin rounded-full border-2 ${
            isDone
              ? "border-white/30 border-t-white"
              : "border-[rgba(34,122,89,0.24)] border-t-[var(--accent-strong)]"
          }`}
        />
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
    <tr className="text-sm transition-colors hover:bg-[var(--surface-subtle)]">
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
        <DueDisplay due={due} />
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
    <tr className="text-sm transition-colors hover:bg-[var(--surface-subtle)]">
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
        <DueDisplay due={due} />
      </td>
    </tr>
  );
}

export function DashboardCompactTaskRow({
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
}) {
  const statusLabel = status ?? "Todo";
  const priorityLabel = priority ?? "Low";
  const statusTone = getStatusTone(statusLabel);
  const priorityTone = getPriorityTone(priorityLabel);
  const isRecurring = Boolean(repeatRuleId);

  return (
    <div className="border-b border-[var(--line-soft)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--surface-subtle)]">
      <div className="flex min-w-0 gap-3">
        <div className="pt-0.5">
          <TaskCompleteButton
            task={{ id, statusValue }}
            isCompleting={isCompleting}
            onComplete={onComplete}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="shrink-0 pt-1 font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]">
              {id}
            </span>
            <button
              type="button"
              onClick={() => onEdit(id)}
              className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
            >
              {title}
            </button>
            <span className="shrink-0 pt-1 text-xs whitespace-nowrap text-[var(--ink-subtle)]">
              <DueDisplay due={due} />
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 max-w-full truncate text-[12px] text-[var(--ink-subtle)]">
              {project}
            </span>
            {isRecurring ? <RepeatBadge task={{ repeatRuleId, repeatCarryCount }} /> : null}
            <StatusPill tone={statusTone} compact>{statusLabel}</StatusPill>
            <StatusPill tone={priorityTone} compact>{priorityLabel}</StatusPill>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectSection({
  id,
  name,
  items,
  onEdit,
  onComplete,
  completingTaskId,
  onNewTask,
  onOpenProject,
}: {
  id: string;
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
  onNewTask: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
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
        <div className="flex items-center gap-1.5">
          <IconActionButton
            label="New task"
            tooltipAlign="right"
            tooltipSide="bottom"
            tone="accent"
            onClick={() => onNewTask(id)}
          >
            <PlusIcon />
          </IconActionButton>
          <IconActionButton
            label="Open project"
            tooltipAlign="right"
            tooltipSide="bottom"
            tone="blue"
            onClick={() => onOpenProject(id)}
          >
            <OpenIcon />
          </IconActionButton>
        </div>
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
                  <tr key={item.id} className="text-sm transition-colors hover:bg-[var(--surface-subtle)]">
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
                      <DueDisplay due={item.due} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-5 text-sm text-[var(--ink-subtle)]">
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
  onManageUsers,
  onOpen,
  onMove,
  onArchive,
  onUnarchive,
  isReordering,
}: {
  project: AppProject;
  onEdit: (projectId: string) => void;
  onManageUsers: (projectId: string) => void;
  onOpen: (projectId: string) => void;
  onMove: (projectId: string, direction: "up" | "down") => void;
  onArchive: (projectId: string) => void;
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
      className={`rounded-2xl border bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-card)] ${
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
            <span className="inline-flex h-6 items-center rounded-full border border-[rgba(34,122,89,0.12)] bg-[rgba(34,122,89,0.04)] px-2.5 text-[11px] font-medium text-[var(--accent-strong)]">
              {project.workspaceName}
            </span>
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
              <IconTooltip label="Move project up">
                <button
                  type="button"
                  disabled={isReordering}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(project.id, "up");
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
                  aria-label="Move project up"
                  title="Move project up"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </IconTooltip>
              <IconTooltip label="Move project down">
                <button
                  type="button"
                  disabled={isReordering}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(project.id, "down");
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
                  aria-label="Move project down"
                  title="Move project down"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M8 3.5v9M4.5 9 8 12.5 11.5 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </IconTooltip>
            </div>
          ) : null}
          <IconActionButton
            label="Edit project"
            disabled={isReordering}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(project.id);
            }}
          >
            <EditIcon />
          </IconActionButton>
          <IconActionButton
            label="Manage project users"
            disabled={isReordering}
            onClick={(event) => {
              event.stopPropagation();
              onManageUsers(project.id);
            }}
          >
            <UsersIcon />
          </IconActionButton>
          {project.isArchived ? (
            <IconActionButton
              label="Unarchive project"
              disabled={isReordering}
              tone="accent"
              onClick={(event) => {
                event.stopPropagation();
                onUnarchive(project.id);
              }}
            >
              <RestoreIcon />
            </IconActionButton>
          ) : (
            <IconActionButton
              label="Archive project"
              disabled={isReordering}
              tone="danger"
              onClick={(event) => {
                event.stopPropagation();
                onArchive(project.id);
              }}
          >
            <ArchiveIcon />
          </IconActionButton>
          )}
          <IconActionButton
            label="Open project"
            tooltipAlign="right"
            disabled={isReordering}
            tone="blue"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(project.id);
            }}
          >
            <OpenIcon />
          </IconActionButton>
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
              className={`rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-3 transition-colors hover:bg-[var(--surface-subtle)] ${
                draggingTaskId === item.id ? "opacity-60" : ""
              }`}
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
                <span className="text-[11px] text-[var(--ink-subtle)]">
                  <DueDisplay due={item.due} />
                </span>
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
