"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/domain/tasks/constants";
import type { RepeatIncompleteBehavior, RepeatScheduleType } from "@/domain/tasks/repeat-schemas";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const NEW_TASK_ID = "NEW_TASK";

type TaskEditorSaveInput = {
  projectId: number;
  title: string;
  description: string;
  parentTaskId: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  labels: string[];
  repeat: {
    enabled: boolean;
    scheduleType: RepeatScheduleType;
    interval: number;
    weekdays: number[];
    monthDay: number | null;
    specificDates: string[];
    incompleteBehavior: RepeatIncompleteBehavior;
  };
};

type TaskEditorFieldErrors = {
  title?: string;
  projectId?: string;
  dueDate?: string;
};

function validateTaskEditorInput(input: {
  projectId: string;
  title: string;
  startDateValue: string;
  dueDateValue: string;
}) {
  const errors: TaskEditorFieldErrors = {};

  if (!input.projectId.trim()) {
    errors.projectId = "Select a project for this task.";
  }

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (
    input.startDateValue &&
    input.dueDateValue &&
    input.dueDateValue < input.startDateValue
  ) {
    errors.dueDate = "Due date must be on or after start date.";
  }

  return errors;
}

export function TaskEditorModal(props: {
  task: TaskListItem | null;
  taskDetails: Record<string, TaskDetails>;
  projectOptions: { id: string; name: string }[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  onClose: () => void;
  onSave: (input: TaskEditorSaveInput) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  if (!props.task) {
    return null;
  }

  return <TaskEditorModalContent {...props} task={props.task} />;
}

function TaskEditorModalContent({
  task,
  taskDetails,
  projectOptions,
  parentTaskOptionsByProject,
  onClose,
  onSave,
  isSaving,
  error,
}: {
  task: TaskListItem;
  taskDetails: Record<string, TaskDetails>;
  projectOptions: { id: string; name: string }[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  onClose: () => void;
  onSave: (input: TaskEditorSaveInput) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const isCreating = task.id === NEW_TASK_ID;

  const details = taskDetails[task.id] ?? {
    projectId: task.projectId ?? "",
    description: "",
    parentTaskId: "",
    parentTask: "",
    labels: [],
    repeat: {
      enabled: false,
      scheduleType: "interval_days",
      interval: 1,
      weekdays: [],
      monthDay: null,
      specificDates: [],
      incompleteBehavior: "carry_forward",
    },
    startDateValue: "",
    dueDateValue: "",
    projectOptions,
    parentTaskOptions: [],
  };
  const repeatDetails = details.repeat ?? {
    enabled: false,
    scheduleType: "interval_days" as const,
    interval: 1,
    weekdays: [],
    monthDay: null,
    specificDates: [],
    incompleteBehavior: "carry_forward" as const,
  };
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(details.description);
  const [projectId, setProjectId] = useState(
    String(
      details.projectId ??
        task.projectId ??
        details.projectOptions?.find((option) => option.name === task.project)?.id ??
        "",
    ),
  );
  const [parentTaskId, setParentTaskId] = useState(details.parentTaskId ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.statusValue);
  const [priority, setPriority] = useState<TaskPriority>(task.priorityValue);
  const [startDateValue, setStartDateValue] = useState(details.startDateValue);
  const [dueDateValue, setDueDateValue] = useState(details.dueDateValue);
  const [labelsInput, setLabelsInput] = useState(details.labels.join(", "));
  const [repeatEnabled, setRepeatEnabled] = useState(repeatDetails.enabled);
  const [repeatScheduleType, setRepeatScheduleType] = useState<RepeatScheduleType>(
    repeatDetails.scheduleType,
  );
  const [repeatInterval, setRepeatInterval] = useState(String(repeatDetails.interval));
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>(repeatDetails.weekdays);
  const [repeatMonthDay, setRepeatMonthDay] = useState(String(repeatDetails.monthDay ?? 1));
  const [repeatSpecificDates, setRepeatSpecificDates] = useState(
    repeatDetails.specificDates.join(", "),
  );
  const [repeatIncompleteBehavior, setRepeatIncompleteBehavior] =
    useState<RepeatIncompleteBehavior>(repeatDetails.incompleteBehavior);
  const [fieldErrors, setFieldErrors] = useState<TaskEditorFieldErrors>({});
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, [task.id]);

  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const availableProjectOptions = details.projectOptions ?? projectOptions;
  const parentTaskOptions =
    parentTaskOptionsByProject[projectId] ?? details.parentTaskOptions ?? [];
  const validationErrors = useMemo(
    () =>
      validateTaskEditorInput({
        projectId,
        title,
        startDateValue,
        dueDateValue,
      }),
    [dueDateValue, projectId, startDateValue, title],
  );

  const handleShare = async () => {
    if (isCreating) {
      return;
    }

    const taskUrl = `${window.location.origin}/tasks/${task.id.replace("TSK-", "")}`;

    try {
      await navigator.clipboard.writeText(taskUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleSave = async () => {
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSave({
      projectId: Number(projectId),
      title: title.trim(),
      description: description.trim(),
      parentTaskId: parentTaskId ? Number(parentTaskId) : null,
      status,
      priority,
      startDate: startDateValue || null,
      dueDate: dueDateValue || null,
      labels: labelsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      repeat: {
        enabled: repeatEnabled,
        scheduleType: repeatScheduleType,
        interval: Math.max(1, Number(repeatInterval) || 1),
        weekdays: repeatWeekdays,
        monthDay: repeatScheduleType === "monthly" ? Math.max(1, Number(repeatMonthDay) || 1) : null,
        specificDates: repeatSpecificDates
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        incompleteBehavior: repeatIncompleteBehavior,
      },
    });
  };

  const toggleRepeatWeekday = (weekday: number) => {
    setRepeatWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((item) => item !== weekday)
        : [...current, weekday].sort((a, b) => a - b),
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isSaving) {
            onClose();
          }
        }}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-editor-title"
        className="relative z-[121] max-h-[88vh] w-full max-w-[72rem] overflow-y-auto rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="sticky top-0 z-10 border-b border-[var(--line-soft)] bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-[var(--ink-subtle)]">
                  {isCreating ? "NEW" : task.id}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  {isCreating ? "New task" : "Edit task"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h2
                  id="task-editor-title"
                  className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
                >
                  {isCreating ? "Create task" : task.title}
                </h2>
                {!isCreating ? (
                  <>
                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label="Share task"
                      title="Share task"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                        copied
                          ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                          : "border-[var(--line-strong)] bg-white text-[var(--ink-subtle)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4.5 w-4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="M7.5 10.5a2.5 2.5 0 0 1 0-3.5l2-2a2.5 2.5 0 1 1 3.5 3.5l-.75.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12.5 9.5a2.5 2.5 0 0 1 0 3.5l-2 2A2.5 2.5 0 1 1 7 11.5l.75-.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {copied ? (
                      <span
                        aria-live="polite"
                        className="text-xs font-medium text-[var(--accent-strong)]"
                      >
                        Copied
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <section className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Title
              </label>
              <input
                ref={titleInputRef}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setFieldErrors((current) => ({ ...current, title: undefined }));
                }}
                disabled={isSaving}
                aria-invalid={Boolean(fieldErrors.title)}
                className={`h-11 w-full rounded-[18px] border bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
                  fieldErrors.title
                    ? "border-[rgba(193,62,62,0.35)]"
                    : "border-[var(--line-strong)]"
                }`}
              />
              {fieldErrors.title ? (
                <p className="text-xs text-[var(--accent-red)]">{fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                disabled={isSaving}
                className="w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Labels
              </label>
              <input
                value={labelsInput}
                onChange={(event) => setLabelsInput(event.target.value)}
                disabled={isSaving}
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
            </div>

            <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-subtle)]/55 p-3">
              <div className="grid gap-3 xl:grid-cols-[1.1fr_1.1fr_0.95fr_0.95fr_0.8fr_0.8fr]">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={projectId}
                      onChange={(event) => {
                        setProjectId(event.target.value);
                        setParentTaskId("");
                        setFieldErrors((current) => ({ ...current, projectId: undefined }));
                      }}
                      disabled={isSaving}
                      aria-invalid={Boolean(fieldErrors.projectId)}
                      className={`h-9 w-full appearance-none rounded-[14px] border bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
                        fieldErrors.projectId
                          ? "border-[rgba(193,62,62,0.35)]"
                          : "border-[var(--line-strong)]"
                      }`}
                    >
                      {availableProjectOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="m4.5 6.5 3.5 3.5 3.5-3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  {fieldErrors.projectId ? (
                    <p className="text-xs text-[var(--accent-red)]">{fieldErrors.projectId}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                    Parent task
                  </label>
                  <div className="relative">
                    <select
                      value={parentTaskId}
                      onChange={(event) => setParentTaskId(event.target.value)}
                      disabled={isSaving}
                      className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                    >
                      <option value="">No parent task</option>
                      {parentTaskOptions
                        .filter((option) => option.id !== task.id.replace("TSK-", ""))
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="m4.5 6.5 3.5 3.5 3.5-3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as TaskStatus)}
                      disabled={isSaving}
                      className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="m4.5 6.5 3.5 3.5 3.5-3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as TaskPriority)}
                      disabled={isSaving}
                      className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="m4.5 6.5 3.5 3.5 3.5-3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDateValue}
                    onChange={(event) => setStartDateValue(event.target.value)}
                    disabled={isSaving}
                    className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={dueDateValue}
                    onChange={(event) => {
                      setDueDateValue(event.target.value);
                      setFieldErrors((current) => ({ ...current, dueDate: undefined }));
                    }}
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldErrors.dueDate)}
                    className={`h-9 w-full rounded-[14px] border bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
                      fieldErrors.dueDate
                        ? "border-[rgba(193,62,62,0.35)]"
                        : "border-[var(--line-strong)]"
                    }`}
                  />
                  {fieldErrors.dueDate ? (
                    <p className="text-xs text-[var(--accent-red)]">{fieldErrors.dueDate}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                    Repeat
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-strong)]">
                  <input
                    type="checkbox"
                    checked={repeatEnabled}
                    onChange={(event) => setRepeatEnabled(event.target.checked)}
                    disabled={isSaving}
                    className="h-4 w-4 accent-[var(--accent-strong)]"
                  />
                  Repeat this task
                </label>
              </div>

              {repeatEnabled ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_1.2fr]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                        Every
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={repeatInterval}
                        onChange={(event) => setRepeatInterval(event.target.value)}
                        disabled={isSaving}
                        className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                        Schedule
                      </label>
                      <select
                        value={repeatScheduleType}
                        onChange={(event) => setRepeatScheduleType(event.target.value as RepeatScheduleType)}
                        disabled={isSaving}
                        className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
                      >
                        <option value="interval_days">Days</option>
                        <option value="weekly">Weeks</option>
                        <option value="monthly">Months</option>
                        <option value="specific_dates">Specific dates</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                        Incomplete task
                      </label>
                      <select
                        value={repeatIncompleteBehavior}
                        onChange={(event) =>
                          setRepeatIncompleteBehavior(event.target.value as RepeatIncompleteBehavior)
                        }
                        disabled={isSaving}
                        className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
                      >
                        <option value="carry_forward">Reuse the open task</option>
                        <option value="create_separate">Create a separate task</option>
                      </select>
                    </div>
                  </div>

                  {repeatScheduleType === "weekly" ? (
                    <div className="flex flex-wrap gap-2">
                      {[
                        [1, "Mon"],
                        [2, "Tue"],
                        [3, "Wed"],
                        [4, "Thu"],
                        [5, "Fri"],
                        [6, "Sat"],
                        [7, "Sun"],
                      ].map(([weekday, label]) => (
                        <button
                          key={weekday}
                          type="button"
                          onClick={() => toggleRepeatWeekday(Number(weekday))}
                          disabled={isSaving}
                          className={`h-8 rounded-xl border px-3 text-xs font-semibold ${
                            repeatWeekdays.includes(Number(weekday))
                              ? "border-[rgba(34,122,89,0.24)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                              : "border-[var(--line-strong)] bg-white text-[var(--ink-muted)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {repeatScheduleType === "monthly" ? (
                    <div className="max-w-48 space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                        Day of month
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={repeatMonthDay}
                        onChange={(event) => setRepeatMonthDay(event.target.value)}
                        disabled={isSaving}
                        className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
                      />
                    </div>
                  ) : null}

                  {repeatScheduleType === "specific_dates" ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                        Dates
                      </label>
                      <input
                        value={repeatSpecificDates}
                        onChange={(event) => setRepeatSpecificDates(event.target.value)}
                        disabled={isSaving}
                        placeholder="2026-05-01, 2026-05-15"
                        className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-subtle)]"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {error ? (
              <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
                {error}
              </p>
            ) : null}
          </section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end border-t border-[var(--line-soft)] bg-white/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              aria-busy={isSaving}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isCreating ? "Create task" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
