"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/domain/tasks/constants";
import { normalizeLabelName } from "@/domain/tasks/labels";

export type TaskEditorFieldErrors = {
  title?: string;
  projectId?: string;
  dueDate?: string;
};

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function TaskCoreFields({
  availableProjectOptions,
  availableLabels,
  description,
  dueDateValue,
  fieldErrors,
  isSaving,
  labels,
  parentTaskId,
  parentTaskLabel,
  parentTaskOptions,
  priority,
  projectId,
  setDescription,
  setDueDateValue,
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
}: {
  availableProjectOptions: { id: string; name: string; workspaceName?: string }[];
  availableLabels: string[];
  description: string;
  dueDateValue: string;
  fieldErrors: TaskEditorFieldErrors;
  isSaving: boolean;
  labels: string[];
  parentTaskId: string;
  parentTaskLabel: string;
  parentTaskOptions: { id: string; title: string }[];
  priority: TaskPriority;
  projectId: string;
  setDescription: (value: string) => void;
  setDueDateValue: (value: string) => void;
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
}) {
  const parentTaskComboboxRef = useRef<HTMLDivElement | null>(null);
  const labelComboboxRef = useRef<HTMLDivElement | null>(null);
  const selectableParentTaskOptions = useMemo(
    () => parentTaskOptions.filter((option) => option.id !== taskId.replace("TSK-", "")),
    [parentTaskOptions, taskId],
  );
  const selectedParentTask = selectableParentTaskOptions.find(
    (option) => option.id === parentTaskId,
  );
  const selectedParentTaskTitle = parentTaskId
    ? selectedParentTask?.title ?? parentTaskLabel ?? ""
    : "";
  const [parentTaskQuery, setParentTaskQuery] = useState(selectedParentTaskTitle);
  const [parentTaskSearchOpen, setParentTaskSearchOpen] = useState(false);
  const [labelQuery, setLabelQuery] = useState("");
  const [labelSearchOpen, setLabelSearchOpen] = useState(false);
  const normalizedParentTaskQuery = parentTaskQuery.trim().toLowerCase();
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
  const filteredParentTaskOptions = useMemo(() => {
    if (!normalizedParentTaskQuery) {
      return selectableParentTaskOptions.slice(0, 8);
    }

    return selectableParentTaskOptions
      .filter((option) =>
        [`TSK-${option.id}`, option.title].some((value) =>
          value.toLowerCase().includes(normalizedParentTaskQuery),
        ),
      )
      .slice(0, 8);
  }, [normalizedParentTaskQuery, selectableParentTaskOptions]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        parentTaskComboboxRef.current &&
        !parentTaskComboboxRef.current.contains(event.target as Node)
      ) {
        setParentTaskSearchOpen(false);
        setParentTaskQuery(selectedParentTaskTitle);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedParentTaskTitle]);

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
    const nextParentTask = selectableParentTaskOptions.find(
      (option) => option.id === nextParentTaskId,
    );

    setParentTaskId(nextParentTaskId);
    setParentTaskQuery(nextParentTask?.title ?? "");
    setParentTaskSearchOpen(false);
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
    <>
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
        <div ref={labelComboboxRef} className="relative">
          <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-[18px] border border-[var(--line-strong)] bg-white px-3 py-2 text-sm text-[var(--ink-strong)]">
            {labels.map((label) => (
              <span
                key={normalizeLabelName(label)}
                className="inline-flex h-7 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface-subtle)] px-3 text-xs font-medium text-[var(--ink-muted)]"
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
              className="h-7 min-w-[12rem] flex-1 border-0 bg-transparent px-1 text-sm text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-muted)] disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)]"
            />
          </div>
          {labelSearchOpen && !isSaving ? (
            <div
              id="label-options"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-[16px] border border-[var(--line-strong)] bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
            >
              {filteredLabelOptions.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleLabelSelect(label)}
                  role="option"
                  aria-selected={false}
                  className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[13px] text-[var(--ink-strong)] transition hover:bg-[var(--surface-subtle)]"
                >
                  <span>{label}</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
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
                  className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[13px] text-[var(--accent-strong)] transition hover:bg-[var(--surface-subtle)]"
                >
                  <span>Create “{normalizedLabelQuery}”</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-subtle)]">
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
                  setParentTaskQuery("");
                  setParentTaskSearchOpen(false);
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
                    {option.workspaceName ? `${option.name} (${option.workspaceName})` : option.name}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
            {fieldErrors.projectId ? (
              <p className="text-xs text-[var(--accent-red)]">{fieldErrors.projectId}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
              Parent task
            </label>
            <div ref={parentTaskComboboxRef} className="relative">
              <input
                type="search"
                value={parentTaskQuery}
                onFocus={() => setParentTaskSearchOpen(true)}
                onChange={(event) => {
                  setParentTaskQuery(event.target.value);
                  setParentTaskSearchOpen(true);

                  if (
                    parentTaskId &&
                    event.target.value !== (selectedParentTask?.title ?? parentTaskLabel)
                  ) {
                    setParentTaskId("");
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setParentTaskSearchOpen(false);
                    setParentTaskQuery(selectedParentTaskTitle);
                  }

                  if (event.key === "Enter" && parentTaskSearchOpen) {
                    event.preventDefault();
                    handleParentTaskSelect(filteredParentTaskOptions[0]?.id ?? "");
                  }
                }}
                placeholder="No parent task"
                disabled={isSaving}
                role="combobox"
                aria-expanded={parentTaskSearchOpen}
                aria-controls="parent-task-options"
                className="h-9 w-full rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-muted)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
              <SelectChevron />
              {parentTaskSearchOpen && !isSaving ? (
                <div
                  id="parent-task-options"
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-[16px] border border-[var(--line-strong)] bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                >
                  <button
                    type="button"
                    onClick={() => handleParentTaskSelect("")}
                    className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[13px] transition hover:bg-[var(--surface-subtle)] ${
                      parentTaskId
                        ? "text-[var(--ink-muted)]"
                        : "bg-[var(--surface-subtle)] text-[var(--accent-strong)]"
                    }`}
                  >
                    <span>No parent task</span>
                  </button>
                  {filteredParentTaskOptions.length > 0 ? (
                    filteredParentTaskOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleParentTaskSelect(option.id)}
                        role="option"
                        aria-selected={parentTaskId === option.id}
                        className={`flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[13px] transition hover:bg-[var(--surface-subtle)] ${
                          parentTaskId === option.id
                            ? "bg-[var(--surface-subtle)] text-[var(--accent-strong)]"
                            : "text-[var(--ink-strong)]"
                        }`}
                      >
                        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                          TSK-{option.id}
                        </span>
                        <span className="min-w-0 truncate">{option.title}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-[13px] text-[var(--ink-subtle)]">
                      No matching parent tasks.
                    </p>
                  )}
                </div>
              ) : null}
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
              <SelectChevron />
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
              <SelectChevron />
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
    </>
  );
}
