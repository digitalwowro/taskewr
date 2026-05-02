"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/domain/tasks/constants";
import { normalizeLabelName } from "@/domain/tasks/labels";
import { TaskPropertiesPanel, TaskPropertyRow } from "@/components/app/task-property-panel";
import {
  SearchableSelect,
  searchableSelectPanelClassName,
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
const PROPERTY_INPUT_CLASS =
  "h-8 w-full rounded-lg border bg-transparent px-2 text-sm text-[var(--ink-strong)] outline-none transition hover:bg-[var(--surface-subtle)] focus:border-[var(--line-strong)] focus:bg-white disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)]";
const PROPERTY_DEFAULT_BORDER_CLASS = "border-transparent";
const PROPERTY_INVALID_BORDER_CLASS = "border-[rgba(193,62,62,0.35)] bg-white";

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
  const selectableParentTaskOptions = useMemo(
    () => parentTaskOptions.filter((option) => option.id !== taskId.replace("TSK-", "")),
    [parentTaskOptions, taskId],
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

  const handleParentTaskSelect = (nextParentTaskId: string) => {
    setParentTaskId(nextParentTaskId);
  };

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
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={14}
            disabled={isSaving}
            className="min-h-[22rem] w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
          />
        </div>
      </div>

      <div className="border-t border-[var(--line-soft)] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <TaskPropertiesPanel>
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

          <TaskPropertyRow icon="parent" label="Parent task">
            <SearchableSelect
              value={parentTaskId}
              options={parentTaskSelectOptions}
              onChange={handleParentTaskSelect}
              disabled={isSaving}
              ariaLabel="Parent task"
              inputClassName={`${PROPERTY_DEFAULT_BORDER_CLASS} placeholder:text-[var(--ink-muted)]`}
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
          </TaskPropertyRow>

          <TaskPropertyRow icon="status" label="Status">
            <SearchableSelect
              value={status}
              options={statusSelectOptions}
              onChange={(nextStatus) => setStatus(nextStatus as TaskStatus)}
              disabled={isSaving}
              ariaLabel="Status"
              inputClassName={PROPERTY_DEFAULT_BORDER_CLASS}
            />
          </TaskPropertyRow>

          <TaskPropertyRow icon="priority" label="Priority">
            <SearchableSelect
              value={priority}
              options={prioritySelectOptions}
              onChange={(nextPriority) => setPriority(nextPriority as TaskPriority)}
              disabled={isSaving}
              ariaLabel="Priority"
              inputClassName={PROPERTY_DEFAULT_BORDER_CLASS}
            />
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
              className={`group relative ${reminderLocked ? "cursor-help" : ""}`}
              tabIndex={reminderLocked ? 0 : undefined}
            >
              <div className={`relative ${reminderLocked ? "opacity-55" : ""}`}>
                <SearchableSelect
                  value={dueReminderTimeValue}
                  options={reminderSelectOptions}
                  onChange={(nextReminderTime) => {
                    setDueReminderTimeValue(nextReminderTime);
                    setFieldErrors((current) => ({ ...current, dueReminderTime: undefined }));
                  }}
                  disabled={isSaving || !dueDateValue || reminderLocked}
                  ariaLabel="Reminder time"
                  ariaDescribedBy={reminderLocked ? `${taskId}-reminder-subscription-help` : undefined}
                  ariaInvalid={Boolean(fieldErrors.dueReminderTime)}
                  inputClassName={`${
                    fieldErrors.dueReminderTime
                      ? PROPERTY_INVALID_BORDER_CLASS
                      : PROPERTY_DEFAULT_BORDER_CLASS
                  }`}
                  placeholder="--:--"
                />
              </div>
              {reminderLocked ? (
                <>
                  <span id={`${taskId}-reminder-subscription-help`} className="sr-only">
                    {REMINDER_SUBSCRIPTION_TOOLTIP}
                  </span>
                  <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus:block">
                    {REMINDER_SUBSCRIPTION_TOOLTIP}
                  </span>
                </>
              ) : null}
              {fieldErrors.dueReminderTime ? (
                <p className="text-xs text-[var(--accent-red)]">{fieldErrors.dueReminderTime}</p>
              ) : null}
            </div>
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
                      <span className="text-xs uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
                        Existing
                      </span>
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
