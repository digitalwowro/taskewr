"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { AppProject } from "@/app/app-data";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";

function InlineDropdown<T extends string>({
  options,
  currentValue,
  onSelect,
  children,
}: {
  options: { value: T; label: string }[];
  currentValue: T;
  onSelect: (value: T) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 });
      }
    }
    function handleMouseDown(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  function handleOpen() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="flex justify-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="cursor-pointer"
      >
        {children}
      </button>
      {open && pos ? createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%)", zIndex: 9999 }}
          className="min-w-[120px] overflow-hidden rounded-xl border border-[var(--line-soft)] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-[13px] transition hover:bg-[var(--surface-subtle)] ${
                option.value === currentValue
                  ? "font-semibold text-[var(--ink-strong)]"
                  : "text-[var(--ink-muted)]"
              }`}
            >
              {option.value === currentValue ? (
                <svg viewBox="0 0 16 16" className="mr-2 h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="mr-2 w-3.5 shrink-0" />
              )}
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      ) : null}
    </div>
  );
}

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({
  value,
  label: TASK_STATUS_LABELS[value],
}));

const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value,
  label: TASK_PRIORITY_LABELS[value],
}));

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
  projectId,
  title,
  project,
  status,
  statusValue,
  priority,
  priorityValue,
  due,
  onEdit,
  onChangeStatus,
  onChangePriority,
}: {
  id: string;
  projectId?: string;
  title: string;
  project: string;
  status: string;
  statusValue: TaskStatus;
  priority: string;
  priorityValue: TaskPriority;
  due: string;
  onEdit: (taskId: string) => void;
  onChangeStatus: (taskId: string, projectId: string, status: TaskStatus) => void;
  onChangePriority: (taskId: string, priority: TaskPriority) => void;
}) {
  const statusTone = getStatusTone(status);
  const priorityTone = getPriorityTone(priority);
  const canComplete = statusValue !== "done" && statusValue !== "canceled";

  return (
    <tr className="group border-b border-[var(--line-soft)] text-sm transition hover:bg-[var(--surface-subtle)] last:border-b-0">
      <td className="px-4 py-3 whitespace-nowrap">
        {canComplete ? (
          <button
            type="button"
            onClick={() => onChangeStatus(id, projectId ?? "", "done")}
            className="relative text-left font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]"
            aria-label="Mark as done"
          >
            <span className="transition-opacity group-hover:opacity-0">{id}</span>
            <svg viewBox="0 0 20 20" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--accent-strong)] opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10" cy="10" r="8" />
              <path d="M6.5 10l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]">{id}</span>
        )}
      </td>
      <td className="w-full px-4 py-3 max-w-0">
        <button
          type="button"
          onClick={() => onEdit(id)}
          className="block w-full truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
        >
          {title}
        </button>
      </td>
      <td className="px-4 py-3 text-center text-xs text-[var(--ink-subtle)] whitespace-nowrap">{project}</td>
      <td className="px-4 py-3">
        <InlineDropdown options={STATUS_OPTIONS} currentValue={statusValue} onSelect={(s) => onChangeStatus(id, projectId ?? "", s)}>
          <StatusPill tone={statusTone}>{status}</StatusPill>
        </InlineDropdown>
      </td>
      <td className="px-4 py-3">
        <InlineDropdown options={PRIORITY_OPTIONS} currentValue={priorityValue} onSelect={(p) => onChangePriority(id, p)}>
          <StatusPill tone={priorityTone}>{priority}</StatusPill>
        </InlineDropdown>
      </td>
      <td className="px-4 py-3 text-right text-xs text-[var(--ink-subtle)] whitespace-nowrap">{due}</td>
    </tr>
  );
}

export function HorizontalListRow({
  id,
  projectId,
  title,
  project,
  due,
  status,
  statusValue,
  priority,
  priorityValue,
  onEdit,
  onChangeStatus,
  onChangePriority,
}: {
  id: string;
  projectId?: string;
  title: string;
  project: string;
  due: string;
  status?: string;
  statusValue: TaskStatus;
  priority?: string;
  priorityValue: TaskPriority;
  onEdit: (taskId: string) => void;
  onChangeStatus: (taskId: string, projectId: string, status: TaskStatus) => void;
  onChangePriority: (taskId: string, priority: TaskPriority) => void;
}) {
  const statusTone = getStatusTone(status ?? "Todo");
  const priorityTone = getPriorityTone(priority ?? "Low");
  const canComplete = statusValue !== "done" && statusValue !== "canceled";

  return (
    <tr className="group border-b border-[var(--line-soft)] text-sm transition hover:bg-[var(--surface-subtle)] last:border-b-0">
      <td className="px-4 py-3 whitespace-nowrap">
        {canComplete ? (
          <button
            type="button"
            onClick={() => onChangeStatus(id, projectId ?? "", "done")}
            className="relative text-left font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]"
            aria-label="Mark as done"
          >
            <span className="transition-opacity group-hover:opacity-0">{id}</span>
            <svg viewBox="0 0 20 20" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--accent-strong)] opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10" cy="10" r="8" />
              <path d="M6.5 10l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]">{id}</span>
        )}
      </td>
      <td className="w-full px-4 py-3 max-w-0">
        <button
          type="button"
          onClick={() => onEdit(id)}
          className="block w-full truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
        >
          {title}
        </button>
      </td>
      <td className="px-4 py-3 text-center text-xs text-[var(--ink-subtle)] whitespace-nowrap">{project}</td>
      <td className="px-4 py-3">
        <InlineDropdown options={STATUS_OPTIONS} currentValue={statusValue} onSelect={(s) => onChangeStatus(id, projectId ?? "", s)}>
          <StatusPill tone={statusTone}>{status ?? "Todo"}</StatusPill>
        </InlineDropdown>
      </td>
      <td className="px-4 py-3">
        <InlineDropdown options={PRIORITY_OPTIONS} currentValue={priorityValue} onSelect={(p) => onChangePriority(id, p)}>
          <StatusPill tone={priorityTone}>{priority ?? "Low"}</StatusPill>
        </InlineDropdown>
      </td>
      <td className="px-4 py-3 text-right text-xs text-[var(--ink-subtle)] whitespace-nowrap">{due}</td>
    </tr>
  );
}

export function ProjectSection({
  name,
  items,
  onEdit,
  onChangeStatus,
  onChangePriority,
  onOpenProject,
}: {
  name: string;
  items: {
    project: string;
    id: string;
    projectId?: string;
    title: string;
    status: string;
    statusValue: TaskStatus;
    priority: string;
    priorityValue: TaskPriority;
    due: string;
    repeatRuleId?: string | null;
    repeatCarryCount?: number;
  }[];
  onEdit: (taskId: string) => void;
  onChangeStatus: (taskId: string, projectId: string, status: TaskStatus) => void;
  onChangePriority: (taskId: string, priority: TaskPriority) => void;
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
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            <th className="px-5 py-2 text-left font-semibold">Task</th>
            <th className="w-full px-5 py-2 text-left font-semibold">Title</th>
            <th className="px-5 py-2 text-center font-semibold">Status</th>
            <th className="px-5 py-2 text-center font-semibold">Priority</th>
            <th className="px-5 py-2 text-right font-semibold">Due</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item) => {
            const statusTone = getStatusTone(item.status);
            const priorityTone = getPriorityTone(item.priority);
            const canComplete = item.statusValue !== "done" && item.statusValue !== "canceled";

            return (
              <tr key={item.id} className="group border-b border-[var(--line-soft)] text-sm transition hover:bg-[var(--surface-subtle)] last:border-b-0">
                <td className="px-5 py-3 whitespace-nowrap">
                  {canComplete ? (
                    <button
                      type="button"
                      onClick={() => onChangeStatus(item.id, item.projectId ?? "", "done")}
                      className="relative text-left font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]"
                      aria-label="Mark as done"
                    >
                      <span className="transition-opacity group-hover:opacity-0">{item.id}</span>
                      <svg viewBox="0 0 20 20" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--accent-strong)] opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="10" cy="10" r="8" />
                        <path d="M6.5 10l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    <span className="font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]">{item.id}</span>
                  )}
                </td>
                <td className="w-full px-5 py-3 max-w-0">
                  <button
                    type="button"
                    onClick={() => onEdit(item.id)}
                    className="block w-full truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
                  >
                    {item.title}
                  </button>
                  <RepeatBadge task={item} />
                </td>
                <td className="px-5 py-3">
                  <InlineDropdown options={STATUS_OPTIONS} currentValue={item.statusValue} onSelect={(s) => onChangeStatus(item.id, item.projectId ?? "", s)}>
                    <StatusPill tone={statusTone}>{item.status}</StatusPill>
                  </InlineDropdown>
                </td>
                <td className="px-5 py-3">
                  <InlineDropdown options={PRIORITY_OPTIONS} currentValue={item.priorityValue} onSelect={(p) => onChangePriority(item.id, p)}>
                    <StatusPill tone={priorityTone}>{item.priority}</StatusPill>
                  </InlineDropdown>
                </td>
                <td className="px-5 py-3 text-right text-xs text-[var(--ink-subtle)] whitespace-nowrap">{item.due}</td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="px-5 py-6 text-sm text-[var(--ink-subtle)]">
                No tasks in this project match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
  onMoveTask,
  draggingTaskId,
  onDragTaskStart,
  onDragTaskEnd,
}: {
  title: string;
  laneStatus: TaskStatus;
  items: TaskListItem[];
  onEdit: (taskId: string) => void;
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
              className={`rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-3 transition hover:bg-[var(--surface-subtle)] ${
                draggingTaskId === item.id ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--ink-subtle)]">
                  {item.id}
                </span>
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
