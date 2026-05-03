"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";

import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/domain/tasks/constants";
import { normalizeLabelName } from "@/domain/tasks/labels";
import { countDoneSubtasks } from "@/domain/tasks/subtasks";
import type {
  TaskAttachmentSummary,
  TaskLinkSummary,
  TaskSubtaskSummary,
  TaskTimeEntrySummary,
  TaskUserOption,
} from "@/domain/tasks/types";
import { TaskPropertiesPanel, TaskPropertyRow } from "@/components/app/task-property-panel";
import {
  getStatusTone,
  IconTooltip,
  SearchableSelect,
  searchableSelectPanelClassName,
  StatusPill,
  useDropdownPanelMaxHeight,
  type SearchableSelectOption,
} from "@/components/app/ui";

export type TaskEditorFieldErrors = {
  title?: string;
  projectId?: string;
  dueDate?: string;
  dueReminderTime?: string;
};

const REMINDER_TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});
const REMINDER_SUBSCRIPTION_TOOLTIP =
  "To receive reminders for this task, you must subscribe to it.";
const REMINDER_DUE_DATE_TOOLTIP = "Choose a due date before adding a reminder.";
const PROPERTY_INPUT_CLASS =
  "h-8 w-full rounded-lg border bg-transparent px-2 text-sm text-[var(--ink-strong)] outline-none transition hover:bg-[var(--surface-subtle)] focus:border-[var(--line-strong)] focus:bg-white disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)]";
const PROPERTY_DEFAULT_BORDER_CLASS = "border-transparent";
const PROPERTY_INVALID_BORDER_CLASS = "border-[rgba(193,62,62,0.35)] bg-white";
const DESCRIPTION_TEXTAREA_MIN_HEIGHT = 104;
const DESCRIPTION_TEXTAREA_MAX_HEIGHT = 320;
const STATUS_ICON_CLASSES: Record<TaskStatus, string> = {
  backlog: "text-[#8A948F]",
  todo: "text-[#4F7DDC]",
  in_progress: "text-[#B7791F]",
  done: "text-[#227A59]",
  canceled: "text-[#C13E3E]",
};
const PRIORITY_ICON_CLASSES: Record<TaskPriority, string> = {
  low: "text-[#8A948F]",
  medium: "text-[#4F7DDC]",
  high: "text-[#B7791F]",
  urgent: "text-[#C13E3E]",
};

export function TaskCoreFields({
  availableProjectOptions,
  availableLabels,
  canEditReminder = true,
  description,
  dueDateValue,
  dueReminderTimeValue,
  fieldErrors,
  isSaving,
  labels,
  parentTaskId,
  parentTaskOptions,
  priority,
  projectId,
  assigneeId,
  assigneeOptions,
  createdBy,
  currentUserId,
  actorProjectRole,
  subtasks,
  timeEntries,
  links,
  attachments,
  canCreateSubtask,
  hierarchyMessage,
  assetMutationPending,
  onAddAttachment,
  onAddLink,
  onAddSubtask,
  onAddTimeEntry,
  onDeleteAttachment,
  onDeleteLink,
  onDeleteTimeEntry,
  onOpenSubtask,
  setAssigneeId,
  setDescription,
  setDueDateValue,
  setDueReminderTimeValue,
  setFieldErrors,
  setLabels,
  setParentTaskId,
  setPriority,
  setProjectId,
  setStartDateValue,
  setStatus,
  setTitle,
  startDateValue,
  status,
  taskId,
  title,
  titleInputRef,
  rightColumnSlot,
}: {
  availableProjectOptions: { id: string; name: string; workspaceName?: string }[];
  availableLabels: string[];
  canEditReminder?: boolean;
  description: string;
  dueDateValue: string;
  dueReminderTimeValue: string;
  fieldErrors: TaskEditorFieldErrors;
  isSaving: boolean;
  labels: string[];
  parentTaskId: string;
  parentTaskOptions: { id: string; title: string }[];
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  assigneeOptions: TaskUserOption[];
  createdBy?: TaskUserOption;
  currentUserId: string;
  actorProjectRole?: string;
  subtasks: TaskSubtaskSummary[];
  timeEntries: TaskTimeEntrySummary[];
  links: TaskLinkSummary[];
  attachments: TaskAttachmentSummary[];
  canCreateSubtask: boolean;
  hierarchyMessage: string | null;
  assetMutationPending: boolean;
  onAddAttachment: () => void;
  onAddLink: () => void;
  onAddSubtask: () => void;
  onAddTimeEntry: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onDeleteLink: (linkId: string) => void;
  onDeleteTimeEntry: (entryId: string) => void;
  onOpenSubtask: (taskId: string) => void;
  setAssigneeId: (value: string) => void;
  setDescription: (value: string) => void;
  setDueDateValue: (value: string) => void;
  setDueReminderTimeValue: (value: string) => void;
  setFieldErrors: (updater: (current: TaskEditorFieldErrors) => TaskEditorFieldErrors) => void;
  setLabels: (value: string[]) => void;
  setParentTaskId: (value: string) => void;
  setPriority: (value: TaskPriority) => void;
  setProjectId: (value: string) => void;
  setStartDateValue: (value: string) => void;
  setStatus: (value: TaskStatus) => void;
  setTitle: (value: string) => void;
  startDateValue: string;
  status: TaskStatus;
  taskId: string;
  title: string;
  titleInputRef: RefObject<HTMLInputElement | null>;
  rightColumnSlot?: ReactNode;
}) {
  const labelComboboxRef = useRef<HTMLDivElement | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const directSubtaskIds = useMemo(
    () => new Set(subtasks.map((subtask) => subtask.id.replace("TSK-", ""))),
    [subtasks],
  );
  const selectableParentTaskOptions = useMemo(
    () =>
      parentTaskOptions.filter(
        (option) => option.id !== taskId.replace("TSK-", "") && !directSubtaskIds.has(option.id),
      ),
    [directSubtaskIds, parentTaskOptions, taskId],
  );
  const [labelQuery, setLabelQuery] = useState("");
  const [labelSearchOpen, setLabelSearchOpen] = useState(false);
  const labelDropdownMaxHeight = useDropdownPanelMaxHeight(labelSearchOpen, labelComboboxRef);
  const selectedLabelNames = useMemo(
    () => new Set(labels.map((label) => normalizeLabelName(label))),
    [labels],
  );
  const normalizedAvailableLabels = useMemo(
    () => [...new Set(availableLabels.map(normalizeLabelName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [availableLabels],
  );
  const normalizedLabelQuery = normalizeLabelName(labelQuery);
  const filteredLabelOptions = useMemo(() => {
    const options = normalizedAvailableLabels.filter((label) => !selectedLabelNames.has(label));

    if (!normalizedLabelQuery) {
      return options.slice(0, 8);
    }

    return options.filter((label) => label.includes(normalizedLabelQuery)).slice(0, 8);
  }, [normalizedAvailableLabels, normalizedLabelQuery, selectedLabelNames]);
  const labelExists = normalizedAvailableLabels.includes(normalizedLabelQuery);
  const labelAlreadySelected = selectedLabelNames.has(normalizedLabelQuery);
  const canCreateLabel =
    normalizedLabelQuery.length > 0 && !labelExists && !labelAlreadySelected;
  const projectSelectOptions: SearchableSelectOption[] = useMemo(
    () =>
      availableProjectOptions.map((option) => ({
        value: option.id,
        label: option.workspaceName ? `${option.name} (${option.workspaceName})` : option.name,
        searchText: [option.name, option.workspaceName].filter(Boolean).join(" "),
      })),
    [availableProjectOptions],
  );
  const parentTaskSelectOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "", label: "No parent task" },
      ...selectableParentTaskOptions.map((option) => ({
        value: option.id,
        label: option.title,
        meta: `TSK-${option.id}`,
        searchText: `TSK-${option.id} ${option.title}`,
      })),
    ],
    [selectableParentTaskOptions],
  );
  const assigneeSelectOptions: SearchableSelectOption[] = useMemo(() => {
    const options: SearchableSelectOption[] = [
      { value: "", label: "Unassigned" },
      ...assigneeOptions.map((option) => ({
        value: option.id,
        label: option.name,
        meta: option.email,
        avatarUrl: option.avatarUrl,
        searchText: `${option.name} ${option.email}`,
      })),
    ];

    if (assigneeId && !assigneeOptions.some((option) => option.id === assigneeId)) {
      options.splice(1, 0, {
        value: assigneeId,
        label: "Unavailable assignee",
        meta: "Not a member of this project",
        searchText: assigneeId,
      });
    }

    return options;
  }, [assigneeId, assigneeOptions]);
  const selectedAssigneeOption = assigneeSelectOptions.find((option) => option.value === assigneeId);
  const statusSelectOptions: SearchableSelectOption[] = useMemo(
    () => STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );
  const prioritySelectOptions: SearchableSelectOption[] = useMemo(
    () => PRIORITY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );
  const reminderTimeOptions = useMemo(() => {
    if (!dueReminderTimeValue || REMINDER_TIME_OPTIONS.includes(dueReminderTimeValue)) {
      return REMINDER_TIME_OPTIONS;
    }

    return [...REMINDER_TIME_OPTIONS, dueReminderTimeValue].sort();
  }, [dueReminderTimeValue]);
  const reminderSelectOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "", label: "--:--" },
      ...reminderTimeOptions.map((time) => ({ value: time, label: time })),
    ],
    [reminderTimeOptions],
  );
  const reminderLocked = !canEditReminder;
  const reminderDisabledMessage = reminderLocked
    ? REMINDER_SUBSCRIPTION_TOOLTIP
    : !dueDateValue
      ? REMINDER_DUE_DATE_TOOLTIP
      : null;
  const reminderHelpId = `${taskId}-reminder-help`;

  useEffect(() => {
    const textarea = descriptionTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, DESCRIPTION_TEXTAREA_MIN_HEIGHT),
      DESCRIPTION_TEXTAREA_MAX_HEIGHT,
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > DESCRIPTION_TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  }, [description]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        labelComboboxRef.current &&
        !labelComboboxRef.current.contains(event.target as Node)
      ) {
        setLabelSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleLabelSelect = (label: string) => {
    const normalizedLabel = normalizeLabelName(label);

    if (!normalizedLabel || selectedLabelNames.has(normalizedLabel)) {
      setLabelQuery("");
      setLabelSearchOpen(false);
      return;
    }

    setLabels([...labels, normalizedLabel]);
    setLabelQuery("");
    setLabelSearchOpen(false);
  };

  const handleLabelRemove = (label: string) => {
    const normalizedLabel = normalizeLabelName(label);
    setLabels(labels.filter((currentLabel) => normalizeLabelName(currentLabel) !== normalizedLabel));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(22rem,3fr)]">
      <div className="space-y-4">
        <div className="-mt-[5px]">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
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
            className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
              fieldErrors.title
                ? "border-[rgba(193,62,62,0.35)]"
                : "border-[var(--line-strong)]"
            }`}
          />
          {fieldErrors.title ? (
            <p className="text-xs text-[var(--accent-red)]">{fieldErrors.title}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            Description
          </label>
          <textarea
            ref={descriptionTextareaRef}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            disabled={isSaving}
            className="max-h-80 min-h-24 w-full resize-none rounded-lg border border-[var(--line-strong)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
          />
        </div>

        <TaskRelationshipActions
          canCreateSubtask={canCreateSubtask}
          disabled={isSaving || assetMutationPending}
          onAddAttachment={onAddAttachment}
          onAddLink={onAddLink}
          onAddSubtask={onAddSubtask}
          onAddTimeEntry={onAddTimeEntry}
        />

        <TaskHierarchyBlock
          attachments={attachments}
          actorProjectRole={actorProjectRole}
          assetMutationPending={assetMutationPending}
          canCreateSubtask={canCreateSubtask}
          currentUserId={currentUserId}
          hierarchyMessage={hierarchyMessage}
          isSaving={isSaving}
          links={links}
          onAddAttachment={onAddAttachment}
          onAddLink={onAddLink}
          onAddSubtask={onAddSubtask}
          onAddTimeEntry={onAddTimeEntry}
          onDeleteAttachment={onDeleteAttachment}
          onDeleteLink={onDeleteLink}
          onDeleteTimeEntry={onDeleteTimeEntry}
          onOpenSubtask={onOpenSubtask}
          parentTaskId={parentTaskId}
          parentTaskSelectOptions={parentTaskSelectOptions}
          setParentTaskId={setParentTaskId}
          subtasks={subtasks}
          taskId={taskId}
          timeEntries={timeEntries}
        />
      </div>

      <div className="border-t border-[var(--line-soft)] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <TaskPropertiesPanel>
          <TaskPropertyRow icon="status" label="Status">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2">
                <TaskStatusOptionIcon status={status} />
              </span>
              <SearchableSelect
                value={status}
                options={statusSelectOptions}
                onChange={(nextStatus) => setStatus(nextStatus as TaskStatus)}
                disabled={isSaving}
                ariaLabel="Status"
                inputClassName={`${PROPERTY_DEFAULT_BORDER_CLASS} pl-8`}
                renderOption={(option) => (
                  <span className="flex min-w-0 items-center gap-2">
                    <TaskStatusOptionIcon status={option.value as TaskStatus} />
                    <span className="min-w-0 truncate">{option.label}</span>
                  </span>
                )}
              />
            </div>
          </TaskPropertyRow>

          <TaskPropertyRow icon="priority" label="Priority">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2">
                <TaskPriorityOptionIcon priority={priority} />
              </span>
              <SearchableSelect
                value={priority}
                options={prioritySelectOptions}
                onChange={(nextPriority) => setPriority(nextPriority as TaskPriority)}
                disabled={isSaving}
                ariaLabel="Priority"
                inputClassName={`${PROPERTY_DEFAULT_BORDER_CLASS} pl-8`}
                renderOption={(option) => (
                  <span className="flex min-w-0 items-center gap-2">
                    <TaskPriorityOptionIcon priority={option.value as TaskPriority} />
                    <span className="min-w-0 truncate">{option.label}</span>
                  </span>
                )}
              />
            </div>
          </TaskPropertyRow>

          <TaskPropertyRow icon="startDate" label="Start date">
            <input
              type="date"
              value={startDateValue}
              onChange={(event) => setStartDateValue(event.target.value)}
              disabled={isSaving}
              aria-label="Start date"
              className={`${PROPERTY_INPUT_CLASS} ${PROPERTY_DEFAULT_BORDER_CLASS}`}
            />
          </TaskPropertyRow>

          <TaskPropertyRow icon="dueDate" label="Due date">
            <input
              type="date"
              value={dueDateValue}
              onChange={(event) => {
                setDueDateValue(event.target.value);
                if (!event.target.value && canEditReminder) {
                  setDueReminderTimeValue("");
                }
                setFieldErrors((current) => ({ ...current, dueDate: undefined }));
              }}
              disabled={isSaving}
              aria-invalid={Boolean(fieldErrors.dueDate)}
              aria-label="Due date"
              className={`${PROPERTY_INPUT_CLASS} ${
                fieldErrors.dueDate
                  ? PROPERTY_INVALID_BORDER_CLASS
                  : PROPERTY_DEFAULT_BORDER_CLASS
              }`}
            />
            {fieldErrors.dueDate ? (
              <p className="text-xs text-[var(--accent-red)]">{fieldErrors.dueDate}</p>
            ) : null}
          </TaskPropertyRow>

          <TaskPropertyRow icon="reminder" label="Reminder">
            <div
              className={`group relative ${reminderDisabledMessage ? "cursor-help" : ""}`}
              tabIndex={reminderDisabledMessage ? 0 : undefined}
            >
              <div className={`relative ${reminderDisabledMessage ? "opacity-55" : ""}`}>
                <SearchableSelect
                  value={dueReminderTimeValue}
                  options={reminderSelectOptions}
                  onChange={(nextReminderTime) => {
                    setDueReminderTimeValue(nextReminderTime);
                    setFieldErrors((current) => ({ ...current, dueReminderTime: undefined }));
                  }}
                  disabled={isSaving || Boolean(reminderDisabledMessage)}
                  ariaLabel="Reminder time"
                  ariaDescribedBy={reminderDisabledMessage ? reminderHelpId : undefined}
                  ariaInvalid={Boolean(fieldErrors.dueReminderTime)}
                  inputClassName={`${
                    fieldErrors.dueReminderTime
                      ? PROPERTY_INVALID_BORDER_CLASS
                      : PROPERTY_DEFAULT_BORDER_CLASS
                  }`}
                  placeholder="--:--"
                />
              </div>
              {reminderDisabledMessage ? (
                <>
                  <span id={reminderHelpId} className="sr-only">
                    {reminderDisabledMessage}
                  </span>
                  <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus:block">
                    {reminderDisabledMessage}
                  </span>
                </>
              ) : null}
              {fieldErrors.dueReminderTime ? (
                <p className="text-xs text-[var(--accent-red)]">{fieldErrors.dueReminderTime}</p>
              ) : null}
            </div>
          </TaskPropertyRow>

          <TaskPropertyRow icon="assignee" label="Assignee">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2">
                <TaskUserAvatar
                  name={selectedAssigneeOption?.label ?? "Unassigned"}
                  email={selectedAssigneeOption?.meta}
                  avatarUrl={selectedAssigneeOption?.avatarUrl}
                  muted={!assigneeId}
                />
              </span>
              <SearchableSelect
                value={assigneeId}
                options={assigneeSelectOptions}
                onChange={setAssigneeId}
                disabled={isSaving}
                ariaLabel="Assignee"
                inputClassName={`${PROPERTY_DEFAULT_BORDER_CLASS} pl-8`}
                placeholder="Unassigned"
                emptyMessage="No active project members found."
                renderOption={(option) => (
                  <div className="flex min-w-0 items-center gap-2">
                    <TaskUserAvatar
                      name={option.label}
                      email={option.meta}
                      avatarUrl={option.avatarUrl}
                      muted={!option.value}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="min-w-0 truncate">{option.label}</span>
                      {option.meta ? (
                        <span className="min-w-0 truncate text-xs text-[var(--ink-subtle)]">
                          {option.meta}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              />
            </div>
          </TaskPropertyRow>

          <TaskPropertyRow icon="createdBy" label="Created by">
            <span
              title={createdBy?.email}
              className="flex min-w-0 items-center gap-2 px-2 text-sm text-[var(--ink-muted)]"
            >
              <TaskUserAvatar
                name={createdBy?.name ?? "Unknown"}
                email={createdBy?.email}
                avatarUrl={createdBy?.avatarUrl}
                muted={!createdBy}
              />
              <span className="min-w-0 truncate">{createdBy?.name ?? "Unknown"}</span>
            </span>
          </TaskPropertyRow>

          <TaskPropertyRow icon="project" label="Project">
            <div>
              <SearchableSelect
                value={projectId}
                options={projectSelectOptions}
                onChange={(nextProjectId) => {
                  setProjectId(nextProjectId);
                  setParentTaskId("");
                  setFieldErrors((current) => ({ ...current, projectId: undefined }));
                }}
                disabled={isSaving}
                ariaLabel="Project"
                ariaInvalid={Boolean(fieldErrors.projectId)}
                inputClassName={`${
                  fieldErrors.projectId
                    ? PROPERTY_INVALID_BORDER_CLASS
                    : PROPERTY_DEFAULT_BORDER_CLASS
                }`}
                emptyMessage="No projects found."
              />
            </div>
            {fieldErrors.projectId ? (
              <p className="text-xs text-[var(--accent-red)]">{fieldErrors.projectId}</p>
            ) : null}
          </TaskPropertyRow>

          <TaskPropertyRow icon="labels" label="Labels">
            <div ref={labelComboboxRef} className="relative">
              <div className="flex min-h-8 w-full flex-wrap items-center gap-2 rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm text-[var(--ink-strong)] transition hover:bg-[var(--surface-subtle)] focus-within:border-[var(--line-strong)] focus-within:bg-white">
                {labels.map((label) => (
                  <span
                    key={normalizeLabelName(label)}
                    className="inline-flex h-6 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--surface-subtle)] px-2.5 text-xs font-medium text-[var(--ink-muted)]"
                  >
                    {normalizeLabelName(label)}
                    <button
                      type="button"
                      onClick={() => handleLabelRemove(label)}
                      disabled={isSaving}
                      aria-label={`Remove ${label} label`}
                      className="text-[var(--ink-subtle)] transition hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={labelQuery}
                  onFocus={() => setLabelSearchOpen(true)}
                  onChange={(event) => {
                    setLabelQuery(event.target.value);
                    setLabelSearchOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setLabelSearchOpen(false);
                      return;
                    }

                    if (event.key === "Backspace" && !labelQuery && labels.length > 0) {
                      handleLabelRemove(labels[labels.length - 1]);
                      return;
                    }

                    if (event.key === "Enter") {
                      event.preventDefault();

                      const bestMatch =
                        filteredLabelOptions[0] ??
                        (canCreateLabel ? normalizedLabelQuery : "");

                      if (bestMatch) {
                        handleLabelSelect(bestMatch);
                      }
                    }
                  }}
                  disabled={isSaving}
                  placeholder={labels.length > 0 ? "Add another label" : "Add label"}
                  role="combobox"
                  aria-expanded={labelSearchOpen}
                  aria-controls="label-options"
                  aria-label="Labels"
                  className="h-7 min-w-[9rem] flex-1 border-0 bg-transparent px-1 text-sm text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-muted)] disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)]"
                />
              </div>
              {labelSearchOpen && !isSaving ? (
                <div
                  id="label-options"
                  role="listbox"
                  className={searchableSelectPanelClassName}
                  style={{ maxHeight: labelDropdownMaxHeight }}
                >
                  {filteredLabelOptions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleLabelSelect(label)}
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] text-[var(--ink-strong)] transition hover:bg-[var(--surface-subtle)]"
                    >
                      <span>{label}</span>
                    </button>
                  ))}
                  {canCreateLabel ? (
                    <button
                      type="button"
                      onClick={() => handleLabelSelect(normalizedLabelQuery)}
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] text-[var(--accent-strong)] transition hover:bg-[var(--surface-subtle)]"
                    >
                      <span>Create “{normalizedLabelQuery}”</span>
                      <span className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
                        New
                      </span>
                    </button>
                  ) : null}
                  {filteredLabelOptions.length === 0 && !canCreateLabel ? (
                    <p className="px-3 py-2 text-[13px] text-[var(--ink-subtle)]">
                      {labelAlreadySelected ? "Label already added." : "No labels yet."}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </TaskPropertyRow>

          {rightColumnSlot}
        </TaskPropertiesPanel>
      </div>
    </div>
  );
}

function TaskRelationshipActions({
  canCreateSubtask,
  disabled,
  onAddAttachment,
  onAddLink,
  onAddSubtask,
  onAddTimeEntry,
}: {
  canCreateSubtask: boolean;
  disabled: boolean;
  onAddAttachment: () => void;
  onAddLink: () => void;
  onAddSubtask: () => void;
  onAddTimeEntry: () => void;
}) {
  const actions: { label: string; icon: TaskPlaceholderActionIconName }[] = [
    { label: "Add Subtask", icon: "subtask" },
    { label: "Track time", icon: "time" },
    { label: "Add Attachment", icon: "attachment" },
    { label: "Add Link", icon: "link" },
  ];
  const handlers: Record<string, () => void> = {
    "Add Subtask": onAddSubtask,
    "Track time": onAddTimeEntry,
    "Add Attachment": onAddAttachment,
    "Add Link": onAddLink,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={handlers[action.label]}
          disabled={disabled || (action.label === "Add Subtask" && !canCreateSubtask)}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-white px-3 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <TaskPlaceholderActionIcon name={action.icon} />
          {action.label}
        </button>
      ))}
    </div>
  );
}

type TaskPlaceholderActionIconName = "subtask" | "time" | "attachment" | "link";

type CompactSectionPersistenceName = "subtasks" | "time" | "links" | "attachments";

function compactSectionStorageKey(taskId: string, section: CompactSectionPersistenceName) {
  return `taskewr.task-section-open.${taskId}.${section}`;
}

function readPersistedCompactSectionOpen(taskId: string, section: CompactSectionPersistenceName) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(compactSectionStorageKey(taskId, section)) === "true";
}

function usePersistedCompactSectionOpen(
  taskId: string,
  section: CompactSectionPersistenceName,
) {
  const [open, setOpenState] = useState(() =>
    readPersistedCompactSectionOpen(taskId, section),
  );

  useEffect(() => {
    setOpenState(readPersistedCompactSectionOpen(taskId, section));
  }, [section, taskId]);

  const setOpen = (updater: (current: boolean) => boolean) => {
    setOpenState((current) => {
      const next = updater(current);

      try {
        window.localStorage.setItem(compactSectionStorageKey(taskId, section), String(next));
      } catch {
        // localStorage can be unavailable in private browsing or restricted contexts.
      }

      return next;
    });
  };

  return [open, setOpen] as const;
}

function TaskPlaceholderActionIcon({ name }: { name: TaskPlaceholderActionIconName }) {
  const commonProps = {
    "aria-hidden": true,
    className: "h-4 w-4 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: "1.8",
    viewBox: "0 0 20 20",
  };

  if (name === "subtask") {
    return (
      <svg {...commonProps}>
        <path d="M4.5 5.5h4.25a2.25 2.25 0 0 1 2.25 2.25v6.75" />
        <path d="M4.5 14.5h6.5" />
        <path d="M11 11.75v2.75h3" />
        <path d="M3.25 4.25h3v3h-3z" />
      </svg>
    );
  }

  if (name === "attachment") {
    return (
      <svg {...commonProps}>
        <path d="m7.25 10.25 4.4-4.4a2.35 2.35 0 0 1 3.32 3.32l-5.9 5.9a3.35 3.35 0 0 1-4.74-4.74l6.05-6.05" />
        <path d="m8.55 11.55 4.7-4.7" />
      </svg>
    );
  }

  if (name === "time") {
    return (
      <svg {...commonProps}>
        <circle cx="10" cy="10" r="6.25" />
        <path d="M10 6.75v3.5l2.5 1.5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M8.25 6.25 9.4 5.1a3.2 3.2 0 0 1 4.5 4.55l-1.7 1.7a3.2 3.2 0 0 1-4.45.05" />
      <path d="m11.75 13.75-1.15 1.15a3.2 3.2 0 0 1-4.5-4.55l1.7-1.7a3.2 3.2 0 0 1 4.45-.05" />
    </svg>
  );
}

function TaskStatusOptionIcon({ status }: { status: TaskStatus }) {
  const className = `h-4 w-4 shrink-0 ${STATUS_ICON_CLASSES[status]}`;

  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="5.6" />
        <path d="m5.4 8.2 1.65 1.65 3.65-3.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "canceled") {
    return (
      <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="5.6" />
        <path d="m4.4 4.4 7.2 7.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (status === "in_progress") {
    return (
      <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="5.6" strokeDasharray="13 23" strokeLinecap="round" />
        <path d="m8 4.25 1.45 1.45L8 7.15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "todo") {
    return (
      <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="5.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="8" r="5.6" strokeDasharray="2.1 2.1" />
    </svg>
  );
}

function TaskPriorityOptionIcon({ priority }: { priority: TaskPriority }) {
  const className = `h-4 w-4 shrink-0 ${PRIORITY_ICON_CLASSES[priority]}`;

  if (priority === "urgent") {
    return (
      <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
        <path d="M8 4.75v4" strokeLinecap="round" />
        <path d="M8 11.25h.01" strokeLinecap="round" />
      </svg>
    );
  }

  const bars: Record<TaskPriority, Array<{ x: number; top: number }>> = {
    low: [
      { x: 6.75, top: 10.5 },
      { x: 9.25, top: 9.5 },
    ],
    medium: [
      { x: 5.5, top: 10.5 },
      { x: 8, top: 8.5 },
      { x: 10.5, top: 6.5 },
    ],
    high: [
      { x: 4.75, top: 10.5 },
      { x: 7.25, top: 8.5 },
      { x: 9.75, top: 6.5 },
      { x: 12.25, top: 4.5 },
    ],
    urgent: [],
  };

  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
      {bars[priority].map((bar) => (
        <path key={`${bar.x}-${bar.top}`} d={`M${bar.x} ${bar.top}V11.5`} strokeLinecap="round" />
      ))}
    </svg>
  );
}

function TaskUserAvatar({
  name,
  email,
  avatarUrl,
  muted = false,
}: {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  muted?: boolean;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
        unoptimized
        className="h-5 w-5 shrink-0 rounded-full object-cover"
      />
    );
  }

  const initials = getUserInitials(name, email);

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold uppercase leading-none ${
        muted
          ? "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-subtle)]"
          : "border-[rgba(34,122,89,0.2)] bg-[rgba(34,122,89,0.1)] text-[var(--accent-strong)]"
      }`}
    >
      {initials}
    </span>
  );
}

function getUserInitials(name: string, email?: string) {
  const source = name && name !== "Unassigned" && name !== "Unknown" ? name : email ?? name;
  const parts = source
    .replace(/@.*$/, "")
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function TaskHierarchyBlock({
  attachments,
  actorProjectRole,
  assetMutationPending,
  canCreateSubtask,
  currentUserId,
  hierarchyMessage,
  isSaving,
  links,
  onAddAttachment,
  onAddLink,
  onAddSubtask,
  onAddTimeEntry,
  onDeleteAttachment,
  onDeleteLink,
  onDeleteTimeEntry,
  onOpenSubtask,
  parentTaskId,
  parentTaskSelectOptions,
  setParentTaskId,
  subtasks,
  taskId,
  timeEntries,
}: {
  attachments: TaskAttachmentSummary[];
  actorProjectRole?: string;
  assetMutationPending: boolean;
  canCreateSubtask: boolean;
  currentUserId: string;
  hierarchyMessage: string | null;
  isSaving: boolean;
  links: TaskLinkSummary[];
  onAddAttachment: () => void;
  onAddLink: () => void;
  onAddSubtask: () => void;
  onAddTimeEntry: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onDeleteLink: (linkId: string) => void;
  onDeleteTimeEntry: (entryId: string) => void;
  onOpenSubtask: (taskId: string) => void;
  parentTaskId: string;
  parentTaskSelectOptions: SearchableSelectOption[];
  setParentTaskId: (value: string) => void;
  subtasks: TaskSubtaskSummary[];
  taskId: string;
  timeEntries: TaskTimeEntrySummary[];
}) {
  const [subtasksOpen, setSubtasksOpen] = usePersistedCompactSectionOpen(taskId, "subtasks");
  const doneSubtaskCount = countDoneSubtasks(subtasks);

  return (
    <section className="rounded-lg border border-[var(--line-soft)] bg-white">
      <div className="flex h-10 items-center gap-3 px-3">
        <ParentTaskInlineIcon />
        <span className="shrink-0 text-sm font-semibold text-[var(--ink-strong)]">
          Parent task
        </span>
        <SearchableSelect
          value={parentTaskId}
          options={parentTaskSelectOptions}
          onChange={setParentTaskId}
          disabled={isSaving}
          ariaLabel="Parent task"
          className="min-w-0 flex-1"
          inputClassName="h-8 border-transparent bg-transparent px-0 text-[var(--ink-muted)] placeholder:text-[var(--ink-muted)] hover:bg-transparent focus:border-[var(--line-strong)] focus:bg-white focus:px-2"
          placeholder="No parent task"
          emptyMessage="No matching parent tasks."
          renderOption={(option) => (
            <>
              {option.meta ? (
                <span className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                  {option.meta}
                </span>
              ) : null}
              <span className="min-w-0 truncate">{option.label}</span>
            </>
          )}
        />
        {parentTaskId ? (
          <IconTooltip label="Open parent task" tooltipAlign="right">
            <button
              type="button"
              onClick={() => onOpenSubtask(`TSK-${parentTaskId}`)}
              disabled={isSaving}
              aria-label="Open parent task"
              title="Open parent task"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-white text-[var(--ink-subtle)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <OpenTaskIcon />
            </button>
          </IconTooltip>
        ) : null}
      </div>

      <CompactSubtasksSection
        canCreateSubtask={canCreateSubtask}
        doneSubtaskCount={doneSubtaskCount}
        hierarchyMessage={hierarchyMessage}
        isSaving={isSaving}
        onAddSubtask={onAddSubtask}
        onOpenSubtask={onOpenSubtask}
        open={subtasksOpen}
        setOpen={setSubtasksOpen}
        subtasks={subtasks}
      />
      <CompactTimeEntriesSection
        actorProjectRole={actorProjectRole}
        currentUserId={currentUserId}
        disabled={isSaving || assetMutationPending}
        onAddTimeEntry={onAddTimeEntry}
        onDeleteTimeEntry={onDeleteTimeEntry}
        taskId={taskId}
        timeEntries={timeEntries}
      />
      <CompactLinksSection
        disabled={isSaving || assetMutationPending}
        links={links}
        onAddLink={onAddLink}
        onDeleteLink={onDeleteLink}
        taskId={taskId}
      />
      <CompactAttachmentsSection
        attachments={attachments}
        disabled={isSaving || assetMutationPending}
        onAddAttachment={onAddAttachment}
        onDeleteAttachment={onDeleteAttachment}
        taskNumericId={taskId.replace("TSK-", "")}
      />
    </section>
  );
}

function CompactSubtasksSection({
  canCreateSubtask,
  doneSubtaskCount,
  hierarchyMessage,
  isSaving,
  onAddSubtask,
  onOpenSubtask,
  open,
  setOpen,
  subtasks,
}: {
  canCreateSubtask: boolean;
  doneSubtaskCount: number;
  hierarchyMessage: string | null;
  isSaving: boolean;
  onAddSubtask: () => void;
  onOpenSubtask: (taskId: string) => void;
  open: boolean;
  setOpen: (updater: (current: boolean) => boolean) => void;
  subtasks: TaskSubtaskSummary[];
}) {
  return (
    <div className="border-t border-[var(--line-soft)]">
      <CompactSectionHeader
        countLabel={`${doneSubtaskCount}/${subtasks.length} Done`}
        disabled={isSaving || !canCreateSubtask}
        id="task-subtasks-section"
        label="Subtasks"
        onAdd={onAddSubtask}
        open={open}
        setOpen={setOpen}
      />

      {hierarchyMessage ? (
        <p aria-live="polite" className="px-4 pb-3 text-sm text-[var(--accent-red)]">
          {hierarchyMessage}
        </p>
      ) : null}

      {open ? (
        <div id="task-subtasks-section" className="border-t border-[var(--line-soft)]">
          {subtasks.length > 0 ? (
            <div className="divide-y divide-[var(--line-soft)]">
              {subtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  type="button"
                  className="grid h-10 w-full grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-3 px-8 text-left text-sm transition hover:bg-[var(--surface-subtle)]"
                  onClick={() => onOpenSubtask(subtask.id)}
                >
                  <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--ink-subtle)]">
                    {subtask.id}
                  </span>
                  <span className="min-w-0 truncate font-medium text-[var(--ink-strong)]">
                    {subtask.title}
                  </span>
                  <StatusPill tone={getStatusTone(subtask.status)} compact>
                    {subtask.status}
                  </StatusPill>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-8 py-3 text-sm text-[var(--ink-muted)]">
              No subtasks yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompactTimeEntriesSection({
  actorProjectRole,
  currentUserId,
  disabled,
  onAddTimeEntry,
  onDeleteTimeEntry,
  taskId,
  timeEntries,
}: {
  actorProjectRole?: string;
  currentUserId: string;
  disabled: boolean;
  onAddTimeEntry: () => void;
  onDeleteTimeEntry: (entryId: string) => void;
  taskId: string;
  timeEntries: TaskTimeEntrySummary[];
}) {
  const [open, setOpen] = usePersistedCompactSectionOpen(taskId, "time");
  const canManageEntries = actorProjectRole === "owner" || actorProjectRole === "admin";
  const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const groupedEntries = groupTimeEntriesByUser(timeEntries);

  return (
    <div className="border-t border-[var(--line-soft)]">
      <CompactSectionHeader
        countLabel={formatTrackedTime(totalMinutes)}
        disabled={disabled}
        id="task-time-entries-section"
        label="Tracked time"
        onAdd={onAddTimeEntry}
        open={open}
        setOpen={setOpen}
      />
      {open ? (
        <div id="task-time-entries-section" className="border-t border-[var(--line-soft)]">
          {groupedEntries.length > 0 ? (
            <div className="divide-y divide-[var(--line-soft)]">
              {groupedEntries.map((group) => (
                <div key={group.user.id} className="px-8 py-3">
                  <div className="mb-2 flex min-w-0 items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-[var(--ink-strong)]">
                      <TaskUserAvatar
                        name={group.user.name}
                        email={group.user.email}
                        avatarUrl={group.user.avatarUrl}
                      />
                      <span className="min-w-0 truncate">{group.user.name}</span>
                    </span>
                    <span className="shrink-0 font-medium text-[var(--ink-muted)]">
                      {formatTrackedTime(group.totalMinutes)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {group.entries.map((entry) => (
                      <CompactTimeEntryRow
                        key={entry.id}
                        canDelete={canManageEntries || entry.user.id === currentUserId}
                        disabled={disabled}
                        entry={entry}
                        onDeleteTimeEntry={onDeleteTimeEntry}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-8 py-3 text-sm text-[var(--ink-muted)]">
              No tracked time yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompactLinksSection({
  disabled,
  links,
  onAddLink,
  onDeleteLink,
  taskId,
}: {
  disabled: boolean;
  links: TaskLinkSummary[];
  onAddLink: () => void;
  onDeleteLink: (linkId: string) => void;
  taskId: string;
}) {
  const [open, setOpen] = usePersistedCompactSectionOpen(taskId, "links");

  return (
    <div className="border-t border-[var(--line-soft)]">
      <CompactSectionHeader
        countLabel={String(links.length)}
        disabled={disabled}
        id="task-links-section"
        label="Links"
        onAdd={onAddLink}
        open={open}
        setOpen={setOpen}
      />
      {open ? (
        <div id="task-links-section" className="border-t border-[var(--line-soft)]">
          {links.length > 0 ? (
            <div className="divide-y divide-[var(--line-soft)]">
              {links.map((link) => (
                <CompactLinkRow
                  key={link.id}
                  disabled={disabled}
                  link={link}
                  onDeleteLink={onDeleteLink}
                />
              ))}
            </div>
          ) : (
            <p className="px-8 py-3 text-sm text-[var(--ink-muted)]">
              No links yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompactAttachmentsSection({
  attachments,
  disabled,
  onAddAttachment,
  onDeleteAttachment,
  taskNumericId,
}: {
  attachments: TaskAttachmentSummary[];
  disabled: boolean;
  onAddAttachment: () => void;
  onDeleteAttachment: (attachmentId: string) => void;
  taskNumericId: string;
}) {
  const [open, setOpen] = usePersistedCompactSectionOpen(
    `TSK-${taskNumericId}`,
    "attachments",
  );

  return (
    <div className="border-t border-[var(--line-soft)]">
      <CompactSectionHeader
        countLabel={String(attachments.length)}
        disabled={disabled}
        id="task-attachments-section"
        label="Attachments"
        onAdd={onAddAttachment}
        open={open}
        setOpen={setOpen}
      />
      {open ? (
        <div id="task-attachments-section" className="border-t border-[var(--line-soft)]">
          {attachments.length > 0 ? (
            <div className="divide-y divide-[var(--line-soft)]">
              {attachments.map((attachment) => (
                <CompactAttachmentRow
                  key={attachment.id}
                  attachment={attachment}
                  disabled={disabled}
                  downloadUrl={`/api/v1/tasks/${taskNumericId}/attachments/${attachment.id}/download`}
                  onDeleteAttachment={onDeleteAttachment}
                />
              ))}
            </div>
          ) : (
            <p className="px-8 py-3 text-sm text-[var(--ink-muted)]">
              No attachments yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompactSectionHeader({
  countLabel,
  disabled,
  id,
  label,
  onAdd,
  open,
  setOpen,
}: {
  countLabel: string;
  disabled: boolean;
  id: string;
  label: string;
  onAdd: () => void;
  open: boolean;
  setOpen: (updater: (current: boolean) => boolean) => void;
}) {
  const addLabel = label.endsWith("s") ? label.toLowerCase().slice(0, -1) : label.toLowerCase();

  return (
    <div className="flex h-10 items-center justify-between gap-3 px-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
      >
        <CollapsibleChevron open={open} />
        <span className="text-sm font-semibold text-[var(--ink-strong)]">
          {label}
        </span>
        <span className="text-sm font-semibold text-[var(--ink-muted)]">
          {countLabel}
        </span>
      </button>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${addLabel}`}
        disabled={disabled}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        +
      </button>
    </div>
  );
}

function CompactLinkRow({
  disabled,
  link,
  onDeleteLink,
}: {
  disabled: boolean;
  link: TaskLinkSummary;
  onDeleteLink: (linkId: string) => void;
}) {
  return (
    <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-8 py-2 text-sm">
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-3 rounded-lg text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
      >
        <LinkAssetIcon />
        <span className="min-w-0 truncate font-medium">{link.title}</span>
        <span className="hidden min-w-0 truncate text-[var(--ink-subtle)] sm:inline">
          {link.host}
        </span>
      </a>
      <span className="hidden text-[var(--ink-subtle)] md:inline">
        {formatRelativeAssetTime(link.createdAt)}
      </span>
      <TaskAssetOverflowMenu
        disabled={disabled}
        label={`More actions for ${link.title}`}
        onDelete={() => onDeleteLink(link.id)}
      />
    </div>
  );
}

function CompactAttachmentRow({
  attachment,
  disabled,
  downloadUrl,
  onDeleteAttachment,
}: {
  attachment: TaskAttachmentSummary;
  disabled: boolean;
  downloadUrl: string;
  onDeleteAttachment: (attachmentId: string) => void;
}) {
  return (
    <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-8 py-2 text-sm">
      <a
        href={downloadUrl}
        className="flex min-w-0 items-center gap-3 rounded-lg text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
      >
        <FileAssetIcon />
        <span className="min-w-0 truncate font-medium">{attachment.fileName}</span>
        <span className="hidden text-[var(--ink-subtle)] sm:inline">
          {formatFileSize(attachment.sizeBytes)}
        </span>
      </a>
      <span className="hidden text-[var(--ink-subtle)] md:inline">
        {formatRelativeAssetTime(attachment.createdAt)}
      </span>
      <TaskAssetOverflowMenu
        disabled={disabled}
        label={`More actions for ${attachment.fileName}`}
        onDelete={() => onDeleteAttachment(attachment.id)}
      />
    </div>
  );
}

function CompactTimeEntryRow({
  canDelete,
  disabled,
  entry,
  onDeleteTimeEntry,
}: {
  canDelete: boolean;
  disabled: boolean;
  entry: TaskTimeEntrySummary;
  onDeleteTimeEntry: (entryId: string) => void;
}) {
  return (
    <div className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-[var(--ink-muted)]">
        <TimeAssetIcon />
        <span className="font-medium text-[var(--ink-strong)]">
          {formatTrackedTime(entry.minutes)}
        </span>
        {entry.createdBy && entry.createdBy.id !== entry.user.id ? (
          <span className="hidden min-w-0 truncate text-[var(--ink-subtle)] sm:inline">
            logged by {entry.createdBy.name}
          </span>
        ) : null}
      </span>
      <span className="hidden text-[var(--ink-subtle)] md:inline">
        {formatRelativeAssetTime(entry.createdAt)}
      </span>
      {canDelete ? (
        <TaskAssetOverflowMenu
          disabled={disabled}
          label={`More actions for ${entry.user.name} tracked time`}
          onDelete={() => onDeleteTimeEntry(entry.id)}
        />
      ) : (
        <span aria-hidden="true" className="h-7 w-7" />
      )}
    </div>
  );
}

function TaskAssetOverflowMenu({
  disabled,
  label,
  onDelete,
}: {
  disabled: boolean;
  label: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span aria-hidden="true" className="text-lg leading-none">...</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-32 rounded-lg border border-[var(--line-soft)] bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)]"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LinkAssetIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-[var(--ink-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M8.25 6.25 9.4 5.1a3.2 3.2 0 0 1 4.5 4.55l-1.7 1.7a3.2 3.2 0 0 1-4.45.05" />
      <path d="m11.75 13.75-1.15 1.15a3.2 3.2 0 0 1-4.5-4.55l1.7-1.7a3.2 3.2 0 0 1 4.45-.05" />
    </svg>
  );
}

function FileAssetIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-[var(--ink-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M5.5 3.5h5l4 4v9h-9z" />
      <path d="M10.5 3.5v4h4" />
    </svg>
  );
}

function TimeAssetIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-[var(--ink-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <circle cx="10" cy="10" r="6.25" />
      <path d="M10 6.75v3.5l2.5 1.5" />
    </svg>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;

  if (kib < 1024) {
    return `${formatAssetNumber(kib)} KB`;
  }

  return `${formatAssetNumber(kib / 1024)} MB`;
}

function formatTrackedTime(minutes: number) {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

function groupTimeEntriesByUser(entries: TaskTimeEntrySummary[]) {
  const groups = new Map<
    string,
    {
      user: TaskUserOption;
      totalMinutes: number;
      entries: TaskTimeEntrySummary[];
    }
  >();

  for (const entry of entries) {
    const group = groups.get(entry.user.id) ?? {
      user: entry.user,
      totalMinutes: 0,
      entries: [],
    };

    group.totalMinutes += entry.minutes;
    group.entries.push(entry);
    groups.set(entry.user.id, group);
  }

  return Array.from(groups.values());
}

function formatAssetNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatRelativeAssetTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ParentTaskInlineIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 shrink-0 text-[var(--ink-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
    >
      <path d="M5 5.5h4.5a2.5 2.5 0 0 1 2.5 2.5v6.5" />
      <path d="M5 14.5h7" />
      <path d="M12 11.5v3h3" />
      <path d="M3.5 4h3v3h-3z" />
    </svg>
  );
}

function OpenTaskIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M6.25 4.25H4.2a1.45 1.45 0 0 0-1.45 1.45v6.1a1.45 1.45 0 0 0 1.45 1.45h6.1a1.45 1.45 0 0 0 1.45-1.45V9.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 2.75h4.75V7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7.25 8.75 5.8-5.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapsibleChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-subtle)] transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
