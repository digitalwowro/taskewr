"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { normalizeLabelNames } from "@/domain/tasks/labels";
import type { RepeatIncompleteBehavior, RepeatScheduleType } from "@/domain/tasks/repeat-schemas";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";
import { TaskCoreFields, type TaskEditorFieldErrors } from "@/components/app/task-core-fields";
import { TaskRepeatSettings } from "@/components/app/task-repeat-settings";
import { ModalHeaderKicker } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const NEW_TASK_ID = "NEW_TASK";

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
  projectOptions: { id: string; name: string; workspaceName?: string }[];
  availableLabels: string[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  onClose: () => void;
  onSave: (input: {
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
  }) => Promise<void>;
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
  availableLabels,
  parentTaskOptionsByProject,
  onClose,
  onSave,
  isSaving,
  error,
}: {
  task: TaskListItem;
  taskDetails: Record<string, TaskDetails>;
  projectOptions: { id: string; name: string; workspaceName?: string }[];
  availableLabels: string[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  onClose: () => void;
  onSave: (input: {
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
  }) => Promise<void>;
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
  const [labels, setLabels] = useState(normalizeLabelNames(details.labels));
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
      labels,
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-5 backdrop-blur-sm">
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
              <ModalHeaderKicker code={isCreating ? "NEW" : task.id} label={isCreating ? "New task" : "Edit task"} />
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
            <TaskCoreFields
              key={task.id}
              availableProjectOptions={availableProjectOptions}
              availableLabels={availableLabels}
              description={description}
              dueDateValue={dueDateValue}
              fieldErrors={fieldErrors}
              isSaving={isSaving}
              labels={labels}
              parentTaskId={parentTaskId}
              parentTaskLabel={details.parentTask ?? ""}
              parentTaskOptions={parentTaskOptions}
              priority={priority}
              projectId={projectId}
              setDescription={setDescription}
              setDueDateValue={setDueDateValue}
              setFieldErrors={setFieldErrors}
              setLabels={setLabels}
              setParentTaskId={setParentTaskId}
              setPriority={setPriority}
              setProjectId={setProjectId}
              setStartDateValue={setStartDateValue}
              setStatus={setStatus}
              setTitle={setTitle}
              startDateValue={startDateValue}
              status={status}
              taskId={task.id}
              title={title}
              titleInputRef={titleInputRef}
            />
            <TaskRepeatSettings
              isSaving={isSaving}
              repeatEnabled={repeatEnabled}
              repeatIncompleteBehavior={repeatIncompleteBehavior}
              repeatInterval={repeatInterval}
              repeatMonthDay={repeatMonthDay}
              repeatScheduleType={repeatScheduleType}
              repeatSpecificDates={repeatSpecificDates}
              repeatWeekdays={repeatWeekdays}
              setRepeatEnabled={setRepeatEnabled}
              setRepeatIncompleteBehavior={setRepeatIncompleteBehavior}
              setRepeatInterval={setRepeatInterval}
              setRepeatMonthDay={setRepeatMonthDay}
              setRepeatScheduleType={setRepeatScheduleType}
              setRepeatSpecificDates={setRepeatSpecificDates}
              toggleRepeatWeekday={toggleRepeatWeekday}
            />
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
