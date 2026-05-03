"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { normalizeLabelNames } from "@/domain/tasks/labels";
import type { RepeatIncompleteBehavior, RepeatScheduleType } from "@/domain/tasks/repeat-schemas";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";
import { TaskCoreFields, type TaskEditorFieldErrors } from "@/components/app/task-core-fields";
import { TaskRepeatSettings } from "@/components/app/task-repeat-settings";
import { IconTooltip, ModalHeaderKicker, TaskSubscriptionButton } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { requestFormData, requestJson } from "@/lib/api-client";

const NEW_TASK_ID = "NEW_TASK";
const TASK_ATTACHMENT_MAX_SIZE_LABEL = "25 MB";

type TaskDraftDefaults = {
  projectId?: string;
  parentTaskId?: string;
};

type SubtaskDraftInput = {
  projectId: string;
  parentTaskId: string;
};

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Clipboard copy failed.");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}

function validateTaskEditorInput(input: {
  projectId: string;
  title: string;
  startDateValue: string;
  dueDateValue: string;
  dueReminderTimeValue: string;
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

  if (input.dueReminderTimeValue && !input.dueDateValue) {
    errors.dueReminderTime = "Choose a due date before adding a reminder.";
  }

  return errors;
}

export function TaskEditorModal(props: {
  task: TaskListItem | null;
  taskDetails: Record<string, TaskDetails>;
  projectOptions: { id: string; name: string; workspaceName?: string }[];
  availableLabels: string[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  draftDefaults?: TaskDraftDefaults;
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
  onCreateSubtask: (input: SubtaskDraftInput) => void;
  onRefreshTaskData: () => void;
  onSave: (input: {
    projectId: number;
    title: string;
    description: string;
    parentTaskId: number | null;
    assigneeUserId: number | null;
    status: TaskStatus;
    priority: TaskPriority;
    startDate: string | null;
    dueDate: string | null;
    dueReminderTime: string | null;
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
  onToggleSubscription: (nextSubscribed: boolean) => Promise<void>;
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
  draftDefaults,
  onClose,
  onOpenTask,
  onCreateSubtask,
  onRefreshTaskData,
  onSave,
  onToggleSubscription,
  isSaving,
  error,
}: {
  task: TaskListItem;
  taskDetails: Record<string, TaskDetails>;
  projectOptions: { id: string; name: string; workspaceName?: string }[];
  availableLabels: string[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  draftDefaults?: TaskDraftDefaults;
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
  onCreateSubtask: (input: SubtaskDraftInput) => void;
  onRefreshTaskData: () => void;
  onSave: (input: {
    projectId: number;
    title: string;
    description: string;
    parentTaskId: number | null;
    assigneeUserId: number | null;
    status: TaskStatus;
    priority: TaskPriority;
    startDate: string | null;
    dueDate: string | null;
    dueReminderTime: string | null;
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
  onToggleSubscription: (nextSubscribed: boolean) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [subscriptionPending, setSubscriptionPending] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isSubscribedToNotifications, setIsSubscribedToNotifications] = useState(
    Boolean(task.isSubscribedToNotifications),
  );
  const [hierarchyMessage, setHierarchyMessage] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetMutationPending, setAssetMutationPending] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);

  const isCreating = task.id === NEW_TASK_ID;

  const loadedDetails = taskDetails[task.id];
  const details = useMemo<TaskDetails>(
    () =>
      loadedDetails ?? {
        projectId: draftDefaults?.projectId ?? task.projectId ?? "",
        description: "",
        parentTaskId: draftDefaults?.parentTaskId ?? "",
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
        dueReminderTime: "",
        assigneeId: "",
        assigneeOptions: [],
        assigneeOptionsByProjectId: {},
        projectOptions,
        parentTaskOptions: [],
        subtasks: [],
        links: [],
        attachments: [],
      },
    [
      draftDefaults?.parentTaskId,
      draftDefaults?.projectId,
      loadedDetails,
      projectOptions,
      task.projectId,
    ],
  );
  const repeatDetails = useMemo(
    () =>
      details.repeat ?? {
        enabled: false,
        scheduleType: "interval_days" as const,
        interval: 1,
        weekdays: [],
        monthDay: null,
        specificDates: [],
        incompleteBehavior: "carry_forward" as const,
      },
    [details.repeat],
  );
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
  const [assigneeId, setAssigneeId] = useState(details.assigneeId ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.statusValue);
  const [priority, setPriority] = useState<TaskPriority>(task.priorityValue);
  const [startDateValue, setStartDateValue] = useState(details.startDateValue);
  const [dueDateValue, setDueDateValue] = useState(details.dueDateValue);
  const [dueReminderTimeValue, setDueReminderTimeValue] = useState(details.dueReminderTime ?? "");
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
    setHierarchyMessage(null);
    setAssetError(null);
    setLinkModalOpen(false);
    setAttachmentModalOpen(false);
    setIsSubscribedToNotifications(Boolean(task.isSubscribedToNotifications));
  }, [task.id, task.isSubscribedToNotifications]);

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
  const assigneeOptions =
    details.assigneeOptionsByProjectId?.[projectId] ?? details.assigneeOptions ?? [];
  const subtasks = details.subtasks ?? [];
  const links = details.links ?? [];
  const attachments = details.attachments ?? [];
  const validationErrors = useMemo(
    () =>
      validateTaskEditorInput({
        projectId,
        title,
        startDateValue,
        dueDateValue,
        dueReminderTimeValue,
      }),
    [dueDateValue, dueReminderTimeValue, projectId, startDateValue, title],
  );
  const repeatInput = useMemo(
    () => ({
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
    }),
    [
      repeatEnabled,
      repeatIncompleteBehavior,
      repeatInterval,
      repeatMonthDay,
      repeatScheduleType,
      repeatSpecificDates,
      repeatWeekdays,
    ],
  );
  const initialTaskState = useMemo(
    () =>
      JSON.stringify({
        title: task.title,
        description: details.description,
        projectId: String(
          details.projectId ??
            task.projectId ??
            details.projectOptions?.find((option) => option.name === task.project)?.id ??
            "",
        ),
        parentTaskId: details.parentTaskId ?? "",
        assigneeId: details.assigneeId ?? "",
        status: task.statusValue,
        priority: task.priorityValue,
        startDateValue: details.startDateValue,
        dueDateValue: details.dueDateValue,
        dueReminderTimeValue: details.dueReminderTime ?? "",
        labels: normalizeLabelNames(details.labels),
        repeat: {
          enabled: repeatDetails.enabled,
          scheduleType: repeatDetails.scheduleType,
          interval: repeatDetails.interval,
          weekdays: repeatDetails.weekdays,
          monthDay:
            repeatDetails.scheduleType === "monthly"
              ? Math.max(1, Number(repeatDetails.monthDay) || 1)
              : null,
          specificDates: repeatDetails.specificDates,
          incompleteBehavior: repeatDetails.incompleteBehavior,
        },
      }),
    [details, repeatDetails, task.priorityValue, task.project, task.projectId, task.statusValue, task.title],
  );
  const currentTaskState = useMemo(
    () =>
      JSON.stringify({
        title,
        description,
        projectId,
        parentTaskId,
        assigneeId,
        status,
        priority,
        startDateValue,
        dueDateValue,
        dueReminderTimeValue,
        labels,
        repeat: repeatInput,
      }),
    [
      assigneeId,
      description,
      dueDateValue,
      dueReminderTimeValue,
      labels,
      parentTaskId,
      priority,
      projectId,
      repeatInput,
      startDateValue,
      status,
      title,
    ],
  );
  const hasUnsavedChanges = currentTaskState !== initialTaskState;

  const handleShare = async () => {
    if (isCreating) {
      return;
    }

    const taskUrl = `${window.location.origin}/tasks/${task.id.replace("TSK-", "")}`;

    try {
      await copyTextToClipboard(taskUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleSubscriptionToggle = async (nextSubscribed: boolean) => {
    if (isCreating || subscriptionPending) {
      return;
    }

    setSubscriptionPending(true);
    setSubscriptionError(null);

    try {
      await onToggleSubscription(nextSubscribed);
      setIsSubscribedToNotifications(nextSubscribed);
    } catch (error) {
      setSubscriptionError(error instanceof Error ? error.message : "Could not update notification subscription.");
    } finally {
      setSubscriptionPending(false);
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
      assigneeUserId: assigneeId ? Number(assigneeId) : null,
      status,
      priority,
      startDate: startDateValue || null,
      dueDate: dueDateValue || null,
      dueReminderTime: dueReminderTimeValue || null,
      labels,
      repeat: repeatInput,
    });
  };

  const guardHierarchyNavigation = () => {
    if (!hasUnsavedChanges) {
      setHierarchyMessage(null);
      return true;
    }

    setHierarchyMessage("Save changes before adding or opening another task.");
    return false;
  };

  const handleOpenSubtask = (subtaskId: string) => {
    if (!guardHierarchyNavigation()) {
      return;
    }

    onOpenTask(subtaskId);
  };

  const handleAddSubtask = () => {
    if (isCreating || !projectId || !guardHierarchyNavigation()) {
      return;
    }

    onCreateSubtask({
      projectId,
      parentTaskId: task.id.replace("TSK-", ""),
    });
  };

  const guardSavedTaskAssetMutation = () => {
    if (!isCreating) {
      setAssetError(null);
      return true;
    }

    setAssetError("Save the task before adding links or attachments.");
    return false;
  };

  const handleOpenLinkModal = () => {
    if (guardSavedTaskAssetMutation()) {
      setLinkModalOpen(true);
    }
  };

  const handleOpenAttachmentModal = () => {
    if (guardSavedTaskAssetMutation()) {
      setAttachmentModalOpen(true);
    }
  };

  const handleCreateLink = async (input: { title: string; url: string }) => {
    if (!guardSavedTaskAssetMutation()) {
      return;
    }

    setAssetMutationPending(true);
    setAssetError(null);

    try {
      await requestJson(`/api/v1/tasks/${task.id.replace("TSK-", "")}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      setLinkModalOpen(false);
      onRefreshTaskData();
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : "Could not add link.");
      throw error;
    } finally {
      setAssetMutationPending(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    setAssetMutationPending(true);
    setAssetError(null);

    try {
      await requestJson(`/api/v1/tasks/${task.id.replace("TSK-", "")}/links/${linkId}`, {
        method: "DELETE",
      });
      onRefreshTaskData();
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : "Could not delete link.");
    } finally {
      setAssetMutationPending(false);
    }
  };

  const handleCreateAttachment = async (file: File) => {
    if (!guardSavedTaskAssetMutation()) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setAssetMutationPending(true);
    setAssetError(null);

    try {
      await requestFormData(`/api/v1/tasks/${task.id.replace("TSK-", "")}/attachments`, formData);
      setAttachmentModalOpen(false);
      onRefreshTaskData();
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : "Could not upload attachment.");
      throw error;
    } finally {
      setAssetMutationPending(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setAssetMutationPending(true);
    setAssetError(null);

    try {
      await requestJson(
        `/api/v1/tasks/${task.id.replace("TSK-", "")}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        },
      );
      onRefreshTaskData();
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : "Could not delete attachment.");
    } finally {
      setAssetMutationPending(false);
    }
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
        className="relative z-[121] max-h-[88vh] w-full max-w-[72rem] overflow-y-auto rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="sticky top-0 z-10 border-b border-[var(--line-soft)] bg-white/95 px-5 py-4 backdrop-blur">
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
                  <TaskSubscriptionButton
                    task={{ ...task, isSubscribedToNotifications }}
                    isPending={subscriptionPending}
                    size="action"
                    tooltipAlign="left"
                    tooltipSide="bottom"
                    onToggleSubscription={(_targetTask, nextSubscribed) =>
                      handleSubscriptionToggle(nextSubscribed)
                    }
                  />
                  <IconTooltip label="Get link" tooltipSide="bottom">
                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label="Get link"
                      title="Get link"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                        copied
                          ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                          : "border-[var(--line-strong)] bg-white text-[var(--ink-subtle)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="M7.8 12.2a2.75 2.75 0 0 1 0-3.9l2.15-2.15a2.75 2.75 0 1 1 3.9 3.9l-1.1 1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12.2 7.8a2.75 2.75 0 0 1 0 3.9l-2.15 2.15a2.75 2.75 0 1 1-3.9-3.9l1.1-1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </IconTooltip>
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

        <div className="space-y-4 px-5 py-5">
          <section className="space-y-4">
            <TaskCoreFields
              key={task.id}
              availableProjectOptions={availableProjectOptions}
              availableLabels={availableLabels}
              canEditReminder={isCreating || isSubscribedToNotifications}
              description={description}
              dueDateValue={dueDateValue}
              fieldErrors={fieldErrors}
              isSaving={isSaving}
              labels={labels}
              parentTaskId={parentTaskId}
              parentTaskOptions={parentTaskOptions}
              priority={priority}
              projectId={projectId}
              assigneeId={assigneeId}
              assigneeOptions={assigneeOptions}
              createdBy={details.createdBy}
              subtasks={subtasks}
              links={links}
              attachments={attachments}
              canCreateSubtask={!isCreating}
              hierarchyMessage={hierarchyMessage}
              assetMutationPending={assetMutationPending}
              onAddAttachment={handleOpenAttachmentModal}
              onAddLink={handleOpenLinkModal}
              onAddSubtask={handleAddSubtask}
              onDeleteAttachment={handleDeleteAttachment}
              onDeleteLink={handleDeleteLink}
              onOpenSubtask={handleOpenSubtask}
              setAssigneeId={setAssigneeId}
              setDescription={setDescription}
              setDueDateValue={setDueDateValue}
              setDueReminderTimeValue={setDueReminderTimeValue}
              setFieldErrors={setFieldErrors}
              setLabels={setLabels}
              setParentTaskId={setParentTaskId}
              setPriority={setPriority}
              setProjectId={setProjectId}
              setStartDateValue={setStartDateValue}
              setStatus={setStatus}
              setTitle={setTitle}
              startDateValue={startDateValue}
              dueReminderTimeValue={dueReminderTimeValue}
              status={status}
              taskId={task.id}
              title={title}
              titleInputRef={titleInputRef}
              rightColumnSlot={
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
              }
            />
            {error ? (
              <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
                {error}
              </p>
            ) : null}
            {subscriptionError ? (
              <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
                {subscriptionError}
              </p>
            ) : null}
            {assetError ? (
              <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
                {assetError}
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
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              aria-busy={isSaving}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isCreating ? "Create task" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
      {linkModalOpen ? (
        <TaskLinkEditorModal
          isSaving={assetMutationPending}
          onClose={() => {
            if (!assetMutationPending) {
              setLinkModalOpen(false);
            }
          }}
          onSave={handleCreateLink}
        />
      ) : null}
      {attachmentModalOpen ? (
        <TaskAttachmentEditorModal
          isSaving={assetMutationPending}
          onClose={() => {
            if (!assetMutationPending) {
              setAttachmentModalOpen(false);
            }
          }}
          onUpload={handleCreateAttachment}
        />
      ) : null}
    </div>
  );
}

function TaskLinkEditorModal({
  isSaving,
  onClose,
  onSave,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: { title: string; url: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useFocusTrap(dialogRef, true);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required.");
      return;
    }

    try {
      setError(null);
      await onSave({ title: title.trim(), url: url.trim() });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not add link.");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-5 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close add link dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-link-modal-title"
        className="relative z-[151] w-full max-w-md rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
      >
        <div className="border-b border-[var(--line-soft)] px-5 py-4">
          <ModalHeaderKicker code="LINK" label="Task link" />
          <h3 id="task-link-modal-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
            Add link
          </h3>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Title
            </label>
            <input
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isSaving}
              className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              URL
            </label>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={isSaving}
              placeholder="https://example.com"
              className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
          </div>
          {error ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[var(--line-soft)] px-5 py-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Adding..." : "Add link"}
          </button>
        </div>
      </section>
    </div>
  );
}

function TaskAttachmentEditorModal({
  isSaving,
  onClose,
  onUpload,
}: {
  isSaving: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useFocusTrap(dialogRef, true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    try {
      setError(null);
      await onUpload(file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload attachment.");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[rgba(15,23,42,0.28)] px-4 py-5 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close add attachment dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-attachment-modal-title"
        className="relative z-[151] w-full max-w-md rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
      >
        <div className="border-b border-[var(--line-soft)] px-5 py-4">
          <ModalHeaderKicker code="FILE" label="Task attachment" />
          <h3 id="task-attachment-modal-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
            Add attachment
          </h3>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              File
            </label>
            <input
              ref={inputRef}
              type="file"
              disabled={isSaving}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 py-2 text-sm text-[var(--ink-strong)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-subtle)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--ink-muted)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
            <p className="mt-2 text-sm text-[var(--ink-subtle)]">
              Maximum file size: {TASK_ATTACHMENT_MAX_SIZE_LABEL}.
            </p>
          </div>
          {error ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[var(--line-soft)] px-5 py-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Uploading..." : "Upload file"}
          </button>
        </div>
      </section>
    </div>
  );
}
