"use client";

import type { RefObject } from "react";

import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/domain/tasks/constants";

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
  description,
  dueDateValue,
  fieldErrors,
  isSaving,
  labelsInput,
  parentTaskId,
  parentTaskOptions,
  priority,
  projectId,
  setDescription,
  setDueDateValue,
  setFieldErrors,
  setLabelsInput,
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
  description: string;
  dueDateValue: string;
  fieldErrors: TaskEditorFieldErrors;
  isSaving: boolean;
  labelsInput: string;
  parentTaskId: string;
  parentTaskOptions: { id: string; title: string }[];
  priority: TaskPriority;
  projectId: string;
  setDescription: (value: string) => void;
  setDueDateValue: (value: string) => void;
  setFieldErrors: (updater: (current: TaskEditorFieldErrors) => TaskEditorFieldErrors) => void;
  setLabelsInput: (value: string) => void;
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
            <div className="relative">
              <select
                value={parentTaskId}
                onChange={(event) => setParentTaskId(event.target.value)}
                disabled={isSaving}
                className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              >
                <option value="">No parent task</option>
                {parentTaskOptions
                  .filter((option) => option.id !== taskId.replace("TSK-", ""))
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
              </select>
              <SelectChevron />
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
